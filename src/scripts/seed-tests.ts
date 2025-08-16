import { db } from '@/config/firebase.config';
import { collection, addDoc } from 'firebase/firestore';
import { SHARED_COLLECTIONS } from '@/config/firebase-collections-helper';

// Sample test definitions for seeding
const sampleTests = [
  // Basic Metabolic Panel tests
  { name: 'Glucose', code: 'GLUCOSE', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 25 },
  { name: 'Blood Urea Nitrogen', code: 'BUN', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Creatinine', code: 'CREAT', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Sodium', code: 'NA', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 15 },
  { name: 'Potassium', code: 'K', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 15 },
  { name: 'Chloride', code: 'CL', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 15 },
  { name: 'Carbon Dioxide', code: 'CO2', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 15 },
  { name: 'Calcium', code: 'CA', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },

  // Complete Blood Count tests
  { name: 'Complete Blood Count', code: 'CBC', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 3, volumeUnit: 'ml', container: 'EDTA' }, turnaroundTime: { routine: 1 }, cost: 35 },
  { name: 'Hemoglobin', code: 'HGB', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 2, volumeUnit: 'ml', container: 'EDTA' }, turnaroundTime: { routine: 1 }, cost: 15 },
  { name: 'Hematocrit', code: 'HCT', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 2, volumeUnit: 'ml', container: 'EDTA' }, turnaroundTime: { routine: 1 }, cost: 15 },
  { name: 'White Blood Cell Count', code: 'WBC', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 2, volumeUnit: 'ml', container: 'EDTA' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Platelet Count', code: 'PLT', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 2, volumeUnit: 'ml', container: 'EDTA' }, turnaroundTime: { routine: 1 }, cost: 20 },

  // Liver Function Tests
  { name: 'Alanine Aminotransferase', code: 'ALT', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 25 },
  { name: 'Aspartate Aminotransferase', code: 'AST', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 25 },
  { name: 'Alkaline Phosphatase', code: 'ALP', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 25 },
  { name: 'Total Bilirubin', code: 'TBILI', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Direct Bilirubin', code: 'DBILI', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Albumin', code: 'ALB', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Total Protein', code: 'TP', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },

  // Lipid Panel
  { name: 'Cholesterol', code: 'CHOL', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 25 },
  { name: 'Triglycerides', code: 'TRIG', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 25 },
  { name: 'HDL Cholesterol', code: 'HDL', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 30 },
  { name: 'LDL Cholesterol', code: 'LDL', category: 'chemistry', department: 'Chemistry', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 30 },

  // Thyroid Panel
  { name: 'Thyroid Stimulating Hormone', code: 'TSH', category: 'immunology', department: 'Immunology', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 45 },
  { name: 'Free T4', code: 'FT4', category: 'immunology', department: 'Immunology', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 40 },
  { name: 'Free T3', code: 'FT3', category: 'immunology', department: 'Immunology', specimen: { type: 'blood', volume: 1, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 40 },

  // Other common tests
  { name: 'Urinalysis', code: 'UA', category: 'chemistry', department: 'Chemistry', specimen: { type: 'urine', volume: 10, volumeUnit: 'ml' }, turnaroundTime: { routine: 1 }, cost: 20 },
  { name: 'Prothrombin Time', code: 'PT', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 2, volumeUnit: 'ml', container: 'Citrate' }, turnaroundTime: { routine: 1 }, cost: 30 },
  { name: 'Partial Thromboplastin Time', code: 'PTT', category: 'hematology', department: 'Hematology', specimen: { type: 'blood', volume: 2, volumeUnit: 'ml', container: 'Citrate' }, turnaroundTime: { routine: 1 }, cost: 30 },
];

export async function seedTests(tenantId: string) {
  const testsCollection = collection(db, SHARED_COLLECTIONS.LABFLOW_TESTS);
  
  console.log(`Seeding ${sampleTests.length} test definitions for tenant ${tenantId}...`);
  
  for (const test of sampleTests) {
    try {
      await addDoc(testsCollection, {
        ...test,
        tenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        methodology: 'Standard laboratory methodology',
        referenceRanges: [],
        criticalValues: {},
        resultType: 'numeric',
        units: test.code === 'GLUCOSE' ? 'mg/dL' : '',
      });
      console.log(`✓ Added test: ${test.name} (${test.code})`);
    } catch (error) {
      console.error(`✗ Failed to add test ${test.name}:`, error);
    }
  }
  
  console.log('Test seeding complete!');
}

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tenantId = process.argv[2] || 'default-tenant';
  seedTests(tenantId).then(() => process.exit(0)).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}