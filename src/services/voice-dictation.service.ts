import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface VoiceCommand {
  command: string;
  callback: () => void;
  pattern?: RegExp;
}

interface VoiceDictationOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

class VoiceDictationService {
  private recognition: any = null;
  private isListening = false;
  private voiceCommands: VoiceCommand[] = [];
  private defaultLanguage = 'en-US';

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if (Capacitor.isNativePlatform()) {
      // Initialize Capacitor Speech Recognition
      this.checkPermissions();
    } else {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = this.defaultLanguage;
      }
    }
  }

  private async checkPermissions() {
    if (Capacitor.isNativePlatform()) {
      const status = await SpeechRecognition.checkPermissions();
      if (status.speechRecognition !== 'granted') {
        await SpeechRecognition.requestPermissions();
      }
    }
  }

  async startDictation(options: VoiceDictationOptions = {}) {
    if (this.isListening) {
      console.warn('Voice dictation is already active');
      return;
    }

    const {
      language = this.defaultLanguage,
      continuous = false,
      interimResults = true,
      maxAlternatives = 1,
      onResult,
      onError,
      onEnd,
    } = options;

    this.isListening = true;

    if (Capacitor.isNativePlatform()) {
      // Capacitor Speech Recognition
      try {
        await SpeechRecognition.start({
          language,
          popup: false,
          partialResults: interimResults,
        });

        // Listen for results
        await SpeechRecognition.addListener('partialResults', (data: any) => {
          if (onResult && data.matches && data.matches.length > 0) {
            const transcript = data.matches[0];
            onResult(transcript, false);
            this.checkVoiceCommands(transcript);
          }
        });

        // Final results listener - using partialResults as well since 'results' event doesn't exist
        await SpeechRecognition.addListener('partialResults', (data: any) => {
          if (onResult && data.matches && data.matches.length > 0) {
            const transcript = data.matches[0];
            onResult(transcript, true);
            this.checkVoiceCommands(transcript);
          }
          if (!continuous) {
            this.stopDictation();
          }
        });

      } catch (error) {
        this.isListening = false;
        if (onError) onError(error);
      }
    } else {
      // Web Speech API
      if (!this.recognition) {
        if (onError) onError(new Error('Speech recognition not supported'));
        this.isListening = false;
        return;
      }

      this.recognition.lang = language;
      this.recognition.continuous = continuous;
      this.recognition.interimResults = interimResults;
      this.recognition.maxAlternatives = maxAlternatives;

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;

        if (onResult) {
          onResult(transcript, isFinal);
        }

        if (isFinal) {
          this.checkVoiceCommands(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (onError) onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        if (onError) onError(error);
      }
    }
  }

  async stopDictation() {
    if (!this.isListening) return;

    this.isListening = false;

    if (Capacitor.isNativePlatform()) {
      try {
        await SpeechRecognition.stop();
        await SpeechRecognition.removeAllListeners();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    } else {
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
    }
  }

  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Assume support on native platforms
    } else {
      return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    }
  }

  getAvailableLanguages(): string[] {
    // Common supported languages
    return [
      'en-US', 'en-GB', 'en-AU', 'en-IN',
      'es-ES', 'es-MX', 'es-AR',
      'fr-FR', 'fr-CA',
      'de-DE', 'de-CH',
      'it-IT',
      'pt-BR', 'pt-PT',
      'zh-CN', 'zh-TW',
      'ja-JP',
      'ko-KR',
      'ru-RU',
      'ar-SA',
      'hi-IN',
    ];
  }

  setLanguage(language: string) {
    this.defaultLanguage = language;
    if (this.recognition && !Capacitor.isNativePlatform()) {
      this.recognition.lang = language;
    }
  }

  // Voice Commands
  registerVoiceCommand(command: string, callback: () => void, pattern?: RegExp) {
    this.voiceCommands.push({ command, callback, pattern });
  }

  unregisterVoiceCommand(command: string) {
    this.voiceCommands = this.voiceCommands.filter(vc => vc.command !== command);
  }

  private checkVoiceCommands(transcript: string) {
    const normalizedTranscript = transcript.toLowerCase().trim();

    for (const voiceCommand of this.voiceCommands) {
      if (voiceCommand.pattern) {
        if (voiceCommand.pattern.test(normalizedTranscript)) {
          voiceCommand.callback();
          break;
        }
      } else {
        if (normalizedTranscript.includes(voiceCommand.command.toLowerCase())) {
          voiceCommand.callback();
          break;
        }
      }
    }
  }

  // Utility functions for common medical terms
  getMedicalTermCorrections(): Record<string, string> {
    return {
      'hemoglobin': 'hemoglobin',
      'hematocrit': 'hematocrit',
      'platelets': 'platelets',
      'white blood cells': 'WBC',
      'red blood cells': 'RBC',
      'creatinine': 'creatinine',
      'glucose': 'glucose',
      'cholesterol': 'cholesterol',
      'triglycerides': 'triglycerides',
      'hdl': 'HDL',
      'ldl': 'LDL',
      'blood pressure': 'BP',
      'heart rate': 'HR',
      'respiratory rate': 'RR',
      'temperature': 'temp',
      'oxygen saturation': 'SpO2',
      'body mass index': 'BMI',
      'electrocardiogram': 'ECG',
      'ecg': 'ECG',
      'ekg': 'EKG',
      'mri': 'MRI',
      'ct scan': 'CT',
      'x-ray': 'X-ray',
      'ultrasound': 'US',
      'complete blood count': 'CBC',
      'comprehensive metabolic panel': 'CMP',
      'basic metabolic panel': 'BMP',
      'liver function test': 'LFT',
      'thyroid stimulating hormone': 'TSH',
      'international normalized ratio': 'INR',
      'partial thromboplastin time': 'PTT',
      'prothrombin time': 'PT',
    };
  }

  correctMedicalTerms(transcript: string): string {
    let corrected = transcript;
    const corrections = this.getMedicalTermCorrections();

    for (const [term, correction] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      corrected = corrected.replace(regex, correction);
    }

    return corrected;
  }

  // Number parsing for dictated values
  parseSpokenNumber(text: string): number | null {
    // Handle written numbers
    const writtenNumbers: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
      'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
      'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
      'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
      'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
      'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
    };

    const normalized = text.toLowerCase().trim();

    // Check for simple written numbers
    if (writtenNumbers[normalized] !== undefined) {
      return writtenNumbers[normalized];
    }

    // Handle decimal spoken as "point"
    const decimalPattern = /(\d+)\s*point\s*(\d+)/i;
    const decimalMatch = normalized.match(decimalPattern);
    if (decimalMatch) {
      return parseFloat(`${decimalMatch[1]}.${decimalMatch[2]}`);
    }

    // Try to parse as regular number
    const numericValue = parseFloat(normalized);
    if (!isNaN(numericValue)) {
      return numericValue;
    }

    // Handle compound numbers like "twenty-five"
    const compoundPattern = /^(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]?(one|two|three|four|five|six|seven|eight|nine)?$/i;
    const compoundMatch = normalized.match(compoundPattern);
    if (compoundMatch) {
      const tens = writtenNumbers[compoundMatch[1].toLowerCase()];
      const ones = compoundMatch[2] ? writtenNumbers[compoundMatch[2].toLowerCase()] : 0;
      return tens + ones;
    }

    return null;
  }
}

// Export singleton instance
export const voiceDictationService = new VoiceDictationService();

// Export types
export type { VoiceDictationOptions, VoiceCommand };