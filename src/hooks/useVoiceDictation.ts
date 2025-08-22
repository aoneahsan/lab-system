import { useState, useCallback, useEffect, useRef } from 'react';
import { voiceDictationService, VoiceDictationOptions } from '@/services/voice-dictation.service';
import { toast } from 'sonner';
import { logger } from '@/services/logger.service';

interface UseVoiceDictationOptions extends Omit<VoiceDictationOptions, 'onResult' | 'onError' | 'onEnd'> {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onFinalTranscript?: (transcript: string) => void;
  autoCorrectMedicalTerms?: boolean;
  parseNumbers?: boolean;
}

interface UseVoiceDictationReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  toggleListening: () => Promise<void>;
  clearTranscript: () => void;
}

export const useVoiceDictation = (options: UseVoiceDictationOptions = {}): UseVoiceDictationReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    setIsSupported(voiceDictationService.isSupported());
  }, []);

  const handleResult = useCallback((rawTranscript: string, isFinal: boolean) => {
    let processedTranscript = rawTranscript;

    // Auto-correct medical terms if enabled
    if (options.autoCorrectMedicalTerms) {
      processedTranscript = voiceDictationService.correctMedicalTerms(processedTranscript);
    }

    // Parse numbers if enabled
    if (options.parseNumbers) {
      const number = voiceDictationService.parseSpokenNumber(processedTranscript);
      if (number !== null) {
        processedTranscript = number.toString();
      }
    }

    if (isFinal) {
      setTranscript(prev => {
        const newTranscript = prev ? `${prev} ${processedTranscript}` : processedTranscript;
        finalTranscriptRef.current = newTranscript;
        return newTranscript;
      });
      setInterimTranscript('');
      
      if (options.onFinalTranscript) {
        options.onFinalTranscript(processedTranscript);
      }
    } else {
      setInterimTranscript(processedTranscript);
    }

    if (options.onTranscript) {
      options.onTranscript(processedTranscript, isFinal);
    }
  }, [options]);

  const handleError = useCallback((error: any) => {
    logger.error('Voice dictation error:', error);
    setIsListening(false);
    
    let errorMessage = 'Voice dictation error';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Handle specific error types
    if (errorMessage.includes('not-allowed')) {
      errorMessage = 'Microphone access denied. Please grant permission in browser settings.';
    } else if (errorMessage.includes('no-speech')) {
      errorMessage = 'No speech detected. Please try again.';
    } else if (errorMessage.includes('audio-capture')) {
      errorMessage = 'No microphone found. Please check your audio input device.';
    } else if (errorMessage.includes('network')) {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    toast.error(errorMessage);
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      toast.error('Voice dictation is not supported on this device');
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setIsListening(true);
      await voiceDictationService.startDictation({
        ...options,
        onResult: handleResult,
        onError: handleError,
        onEnd: handleEnd,
      });
      toast.success('Voice dictation started');
    } catch (error) {
      handleError(error);
    }
  }, [isSupported, isListening, options, handleResult, handleError, handleEnd]);

  const stopListening = useCallback(async () => {
    if (!isListening) {
      return;
    }

    try {
      await voiceDictationService.stopDictation();
      setIsListening(false);
      setInterimTranscript('');
      toast.info('Voice dictation stopped');
    } catch (error) {
      logger.error('Error stopping voice dictation:', error);
    }
  }, [isListening]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        voiceDictationService.stopDictation();
      }
    };
  }, [isListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  };
};

// Hook for voice commands
interface UseVoiceCommandsOptions {
  enabled?: boolean;
  language?: string;
}

export const useVoiceCommands = (commands: Array<{
  command: string;
  action: () => void;
  pattern?: RegExp;
}>, options: UseVoiceCommandsOptions = {}) => {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    // Register commands
    commands.forEach(({ command, action, pattern }) => {
      voiceDictationService.registerVoiceCommand(command, action, pattern);
    });

    // Cleanup
    return () => {
      commands.forEach(({ command }) => {
        voiceDictationService.unregisterVoiceCommand(command);
      });
    };
  }, [commands, enabled]);
};