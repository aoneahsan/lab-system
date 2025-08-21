import React from 'react';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Palette, Highlighter, Table, Minus,
  RemoveFormatting, Smile, Hash, Image,
  Subscript, Superscript, Indent, Outdent
} from 'lucide-react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
        ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
};

export const ToolbarSeparator: React.FC = () => (
  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
);

interface ToolbarSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  title: string;
  className?: string;
}

export const ToolbarSelect: React.FC<ToolbarSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  title,
  className = '',
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      title={title}
      className={`
        px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary-500/20
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
  title,
  icon: Icon,
}) => {
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
    '#A52A2A', '#808080', '#FFFFFF',
  ];

  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        title={title}
        className={`
          p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
          text-gray-600 dark:text-gray-400
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Icon className="h-4 w-4" />
      </button>
      
      {showPicker && !disabled && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
          <div className="grid grid-cols-5 gap-1">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowPicker(false);
                }}
                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setShowPicker(false);
            }}
            className="mt-2 w-full h-8 rounded cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export const fontSizeOptions = [
  { value: '12px', label: '12px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
  { value: '28px', label: '28px' },
  { value: '32px', label: '32px' },
  { value: '36px', label: '36px' },
];

export const fontFamilyOptions = [
  { value: 'inherit', label: 'Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
];

// Alignment Icons Component
export const AlignmentButtons: React.FC<{
  alignment: string;
  onAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  disabled?: boolean;
}> = ({ alignment, onAlign, disabled }) => {
  return (
    <>
      <ToolbarButton
        onClick={() => onAlign('left')}
        isActive={alignment === 'left'}
        disabled={disabled}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onAlign('center')}
        isActive={alignment === 'center'}
        disabled={disabled}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onAlign('right')}
        isActive={alignment === 'right'}
        disabled={disabled}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onAlign('justify')}
        isActive={alignment === 'justify'}
        disabled={disabled}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

// Indentation Buttons
export const IndentButtons: React.FC<{
  onIndent: () => void;
  onOutdent: () => void;
  disabled?: boolean;
}> = ({ onIndent, onOutdent, disabled }) => {
  return (
    <>
      <ToolbarButton
        onClick={onOutdent}
        disabled={disabled}
        title="Decrease Indent"
      >
        <Outdent className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onIndent}
        disabled={disabled}
        title="Increase Indent"
      >
        <Indent className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

// Super/Subscript Buttons
export const ScriptButtons: React.FC<{
  isSuperscript: boolean;
  isSubscript: boolean;
  onSuperscript: () => void;
  onSubscript: () => void;
  disabled?: boolean;
}> = ({ isSuperscript, isSubscript, onSuperscript, onSubscript, disabled }) => {
  return (
    <>
      <ToolbarButton
        onClick={onSuperscript}
        isActive={isSuperscript}
        disabled={disabled}
        title="Superscript"
      >
        <Superscript className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onSubscript}
        isActive={isSubscript}
        disabled={disabled}
        title="Subscript"
      >
        <Subscript className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};