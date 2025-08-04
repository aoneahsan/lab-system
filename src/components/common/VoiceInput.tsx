import React, { useEffect, useRef } from 'react';
import { MicrophoneIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  autoCorrectMedicalTerms?: boolean;
  parseNumbers?: boolean;
  continuous?: boolean;
  inputType?: 'text' | 'number' | 'textarea';
  className?: string;
  required?: boolean;
  maxLength?: number;
  showTranscript?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
  autoCorrectMedicalTerms = true,
  parseNumbers = false,
  continuous = false,
  inputType = 'text',
  className = '',
  required = false,
  maxLength,
  showTranscript = true,
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceDictation({
    continuous,
    autoCorrectMedicalTerms,
    parseNumbers,
    onFinalTranscript: (finalText) => {
      // Append to existing value
      const newValue = value ? `${value} ${finalText}` : finalText;
      onChange(newValue);
    },
  });

  // Update value when transcript changes in continuous mode
  useEffect(() => {
    if (continuous && transcript) {
      onChange(transcript);
    }
  }, [transcript, continuous, onChange]);

  const handleClear = () => {
    onChange('');
    clearTranscript();
  };

  const handleToggleListening = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const renderInput = () => {
    if (inputType === 'textarea') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isListening}
          required={required}
          maxLength={maxLength}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          rows={4}
        />
      );
    }

    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isListening}
        required={required}
        maxLength={maxLength}
        className={className}
      />
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="flex gap-2">
          {renderInput()}
          {isSupported && (
            <Button
              type="button"
              variant={isListening ? 'danger' : 'outline'}
              size="icon"
              onClick={handleToggleListening}
              disabled={disabled}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <StopIcon className="h-4 w-4" />
              ) : (
                <MicrophoneIcon className="h-4 w-4" />
              )}
            </Button>
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled || isListening}
              title="Clear"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Show listening status and interim transcript */}
      {isListening && showTranscript && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Listening...</span>
            </div>
            {continuous && (
              <Badge variant="info" size="sm">
                Continuous mode
              </Badge>
            )}
          </div>
          {interimTranscript && (
            <p className="text-sm text-gray-500 italic">
              "{interimTranscript}"
            </p>
          )}
        </div>
      )}

      {/* Show features */}
      {isSupported && !isListening && (
        <div className="flex gap-2 text-xs text-gray-500">
          {autoCorrectMedicalTerms && (
            <Badge variant="info" size="sm">
              Medical terms
            </Badge>
          )}
          {parseNumbers && (
            <Badge variant="info" size="sm">
              Number parsing
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};