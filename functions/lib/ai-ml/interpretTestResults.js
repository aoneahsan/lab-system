"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretTestResults = void 0;
const functions = __importStar(require("firebase-functions"));
const vertexai_1 = require("@google-cloud/vertexai");
const config_1 = require("../config");
// Initialize Vertex AI
const vertexAI = new vertexai_1.VertexAI({
    project: config_1.projectId,
    location: 'us-central1',
});
// Get generative model
const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
    },
});
exports.interpretTestResults = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { testResult, testDefinition, patientHistory, patientInfo } = data;
    try {
        // Build context for AI analysis
        const contextPrompt = buildContextPrompt(testResult, testDefinition, patientHistory, patientInfo);
        // Generate interpretation using Vertex AI
        const result = await model.generateContent(contextPrompt);
        const response = result.response;
        const interpretation = response.text();
        // Parse AI response to extract structured data
        const structuredResult = parseAIResponse(interpretation, testResult, testDefinition);
        // Calculate anomaly score
        const anomalyScore = calculateAnomalyScore(testResult, testDefinition, patientHistory);
        // Generate follow-up test recommendations
        const followUpTests = await generateFollowUpRecommendations(testResult, testDefinition, structuredResult.relatedConditions);
        return {
            id: `interp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            testResultId: testResult.id,
            interpretation: structuredResult.interpretation,
            confidence: structuredResult.confidence,
            anomalyScore,
            criticalFindings: structuredResult.criticalFindings,
            recommendations: structuredResult.recommendations,
            relatedConditions: structuredResult.relatedConditions,
            followUpTests,
            generatedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error interpreting test results:', error);
        throw new functions.https.HttpsError('internal', 'Failed to interpret test results');
    }
});
function buildContextPrompt(testResult, testDefinition, patientHistory, patientInfo) {
    let prompt = `You are a clinical laboratory specialist analyzing test results. Provide a detailed interpretation of the following test result.

Test Information:
- Test Name: ${testDefinition.name}
- Test Code: ${testDefinition.code}
- Category: ${testDefinition.category}
- Result Value: ${testResult.value} ${testDefinition.unit}
- Reference Range: ${testDefinition.referenceRange.min} - ${testDefinition.referenceRange.max} ${testDefinition.unit}
- Result Flag: ${testResult.flag || 'normal'}
`;
    if (patientInfo) {
        const age = calculateAge(new Date(patientInfo.dateOfBirth));
        prompt += `
Patient Information:
- Age: ${age} years
- Gender: ${patientInfo.gender}
- Blood Type: ${patientInfo.bloodType || 'Unknown'}
`;
    }
    if (patientHistory && patientHistory.length > 0) {
        prompt += `
Previous Results for this test:
`;
        patientHistory.slice(-5).forEach((prev, index) => {
            prompt += `- ${new Date(prev.resultDate).toLocaleDateString()}: ${prev.value} ${testDefinition.unit}\n`;
        });
    }
    prompt += `
Please provide:
1. A clinical interpretation of this result (2-3 paragraphs)
2. Any critical findings that require immediate attention
3. Clinical recommendations for the healthcare provider
4. Possible related conditions with their probability (0-1)
5. Your confidence level in this interpretation (0-1)

Format your response as JSON with the following structure:
{
  "interpretation": "detailed interpretation text",
  "confidence": 0.85,
  "criticalFindings": ["finding1", "finding2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "relatedConditions": [
    {"condition": "Condition Name", "probability": 0.7, "icd10Code": "A00.0"}
  ]
}`;
    return prompt;
}
function parseAIResponse(aiResponse, testResult, testDefinition) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    }
    catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
    }
    // Fallback: Create structured response from text
    return {
        interpretation: aiResponse,
        confidence: 0.7,
        criticalFindings: extractCriticalFindings(aiResponse, testResult, testDefinition),
        recommendations: extractRecommendations(aiResponse),
        relatedConditions: extractRelatedConditions(aiResponse),
    };
}
function extractCriticalFindings(text, testResult, testDefinition) {
    const findings = [];
    // Check for critical flags
    if (testResult.flag === 'critical_high' || testResult.flag === 'critical_low') {
        findings.push(`Critical ${testResult.flag === 'critical_high' ? 'high' : 'low'} value detected`);
    }
    // Look for critical keywords in the interpretation
    const criticalKeywords = ['urgent', 'immediate', 'critical', 'emergency', 'life-threatening'];
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(sentence => {
        if (criticalKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
            findings.push(sentence.trim());
        }
    });
    return findings.slice(0, 3); // Limit to 3 findings
}
function extractRecommendations(text) {
    const recommendations = [];
    const recKeywords = ['recommend', 'suggest', 'advise', 'should', 'consider', 'monitor'];
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(sentence => {
        if (recKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
            recommendations.push(sentence.trim());
        }
    });
    return recommendations.slice(0, 5); // Limit to 5 recommendations
}
function extractRelatedConditions(text) {
    // This is a simplified extraction - in production, use NLP or structured extraction
    const conditions = [];
    const conditionPatterns = [
        /(?:may indicate|suggests|consistent with|associated with)\s+([A-Za-z\s]+)/gi,
        /(?:risk of|possibility of)\s+([A-Za-z\s]+)/gi,
    ];
    conditionPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1]) {
                conditions.push({
                    condition: match[1].trim(),
                    probability: 0.5 + Math.random() * 0.3, // Placeholder probability
                    icd10Code: undefined, // Would need medical coding API
                });
            }
        }
    });
    return conditions.slice(0, 3); // Limit to 3 conditions
}
function calculateAnomalyScore(testResult, testDefinition, patientHistory) {
    let score = 0;
    // Check if outside reference range
    const { min, max } = testDefinition.referenceRange;
    const value = testResult.value;
    if (value < min || value > max) {
        const deviation = value < min ?
            (min - value) / min :
            (value - max) / max;
        score = Math.min(deviation * 2, 1); // Scale to 0-1
    }
    // Check for significant changes from history
    if (patientHistory && patientHistory.length > 0) {
        const recentValues = patientHistory.slice(-5).map(r => r.value);
        const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const stdDev = Math.sqrt(recentValues.reduce((sq, n) => sq + Math.pow(n - avgValue, 2), 0) / recentValues.length);
        if (stdDev > 0) {
            const zScore = Math.abs((value - avgValue) / stdDev);
            if (zScore > 2) {
                score = Math.max(score, Math.min(zScore / 4, 1));
            }
        }
    }
    return score;
}
async function generateFollowUpRecommendations(testResult, testDefinition, relatedConditions) {
    const recommendations = [];
    // Map test categories to follow-up tests
    const followUpMap = {
        'hematology': [
            { testCode: 'CBC', testName: 'Complete Blood Count', priority: 'routine' },
            { testCode: 'RETIC', testName: 'Reticulocyte Count', priority: 'optional' },
        ],
        'chemistry': [
            { testCode: 'CMP', testName: 'Comprehensive Metabolic Panel', priority: 'routine' },
            { testCode: 'LIPID', testName: 'Lipid Panel', priority: 'optional' },
        ],
        'immunology': [
            { testCode: 'IG', testName: 'Immunoglobulin Panel', priority: 'routine' },
            { testCode: 'C3C4', testName: 'Complement C3/C4', priority: 'optional' },
        ],
        'endocrinology': [
            { testCode: 'TSH', testName: 'Thyroid Stimulating Hormone', priority: 'routine' },
            { testCode: 'FT4', testName: 'Free T4', priority: 'optional' },
        ],
    };
    // Get category-specific recommendations
    const categoryTests = followUpMap[testDefinition.category] || [];
    // Add tests based on result flags
    if (testResult.flag === 'critical_high' || testResult.flag === 'critical_low') {
        categoryTests.forEach(test => {
            recommendations.push({
                ...test,
                priority: 'urgent',
                reason: `Follow-up for critical ${testDefinition.name} result`,
            });
        });
    }
    else if (testResult.flag === 'high' || testResult.flag === 'low') {
        categoryTests.forEach(test => {
            recommendations.push({
                ...test,
                reason: `Monitor trend for abnormal ${testDefinition.name} result`,
            });
        });
    }
    return recommendations.slice(0, 3); // Limit to 3 recommendations
}
function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
//# sourceMappingURL=interpretTestResults.js.map