import React, { useEffect, useState } from 'react';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { $getRoot, $createParagraphNode, EditorState } from 'lexical';
import { 
  InitialConfigType,
  LexicalComposer 
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND
} from 'lexical';

// Toolbar Component
const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = () => {
    const selection = window.getSelection();
    if (selection) {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
    }
  };

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updateToolbar();
    });
  }, [editor]);

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatElement = (format: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => formatText('bold')}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${isBold ? 'bg-gray-200 dark:bg-gray-700 font-bold' : ''}`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 italic ${isItalic ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => formatText('underline')}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 underline ${isUnderline ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        title="Underline (Ctrl+U)"
      >
        U
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onClick={() => formatElement('left')}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Align Left"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => formatElement('center')}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Align Center"
      >
        ↔
      </button>
      <button
        type="button"
        onClick={() => formatElement('right')}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Align Right"
      >
        →
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
    </div>
  );
};

interface LexicalEditorFieldProps extends BaseFormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  autoFocus?: boolean;
  showToolbar?: boolean;
}

export const LexicalEditorField: React.FC<LexicalEditorFieldProps> = ({
  label = 'Description',
  name,
  value = '',
  onChange,
  placeholder = 'Enter text...',
  minHeight = '150px',
  maxHeight = '400px',
  autoFocus = false,
  showToolbar = true,
  error,
  required = false,
  disabled = false,
  loading = false,
  helpText,
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  showLabel = true,
}) => {
  const theme = {
    ltr: 'text-left',
    rtl: 'text-right',
    paragraph: 'mb-2',
    quote: 'border-l-4 border-gray-300 pl-4 italic',
    heading: {
      h1: 'text-3xl font-bold mb-4',
      h2: 'text-2xl font-bold mb-3',
      h3: 'text-xl font-bold mb-2',
      h4: 'text-lg font-bold mb-2',
      h5: 'text-base font-bold mb-1',
    },
    list: {
      nested: {
        listitem: 'ml-4',
      },
      ol: 'list-decimal ml-6',
      ul: 'list-disc ml-6',
      listitem: 'mb-1',
    },
    link: 'text-blue-600 hover:underline',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm',
    },
  };

  const initialConfig: InitialConfigType = {
    namespace: name || 'LexicalEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  };

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      onChange?.(textContent);
    });
  };

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={disabled}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <div className={`border rounded-lg overflow-hidden ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <LexicalComposer initialConfig={initialConfig}>
          {showToolbar && <ToolbarPlugin />}
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className={`px-3 py-2 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
                  style={{ minHeight, maxHeight, overflowY: 'auto' }}
                  placeholder={<div className="absolute top-2 left-3 text-gray-400 pointer-events-none">{placeholder}</div>}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin />
            {autoFocus && <AutoFocusPlugin />}
          </div>
        </LexicalComposer>
      </div>
    </FormFieldWrapper>
  );
};