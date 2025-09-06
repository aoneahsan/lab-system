import React, { useState } from 'react';
import { EditorState, LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TRANSFORMERS } from '@lexical/markdown';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { EnhancedToolbarPlugin } from './editor/EnhancedToolbarPlugin';
import { ImageNode } from './editor/ImageNode';
import { useAuthStore } from '@/stores/auth.store';
import { uiLogger } from '@/services/logger.service';

interface RichTextEditorFieldProps extends BaseFormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  toolbar?: boolean | 'minimal' | 'full';
  rows?: number;
}

export const RichTextEditorField: React.FC<RichTextEditorFieldProps> = ({
  label,
  name,
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '120px',
  maxHeight = '400px',
  autoFocus = false,
  readOnly = false,
  toolbar = 'full',
  rows = 5,
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
  const [isFocused, setIsFocused] = useState(false);
  const { currentUser } = useAuthStore();
  const tenantId = currentUser?.tenantId;

  const theme = {
    ltr: 'text-left',
    rtl: 'text-right',
    paragraph: 'mb-2',
    quote: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300',
    heading: {
      h1: 'text-2xl font-bold mb-3 text-gray-900 dark:text-white',
      h2: 'text-xl font-semibold mb-2 text-gray-900 dark:text-white',
      h3: 'text-lg font-medium mb-2 text-gray-900 dark:text-white',
      h4: 'text-base font-medium mb-1 text-gray-900 dark:text-white',
      h5: 'text-sm font-medium mb-1 text-gray-900 dark:text-white',
    },
    list: {
      nested: {
        listitem: 'list-none',
      },
      ol: 'list-decimal ml-6 mb-2',
      ul: 'list-disc ml-6 mb-2',
      listitem: 'mb-1',
    },
    link: 'text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400',
      subscript: 'align-sub text-xs',
      superscript: 'align-super text-xs',
    },
    code: 'bg-gray-100 dark:bg-gray-900 p-3 rounded-lg font-mono text-sm mb-2 overflow-x-auto',
    table: 'table-auto border-collapse w-full mb-2',
    tableCell: 'border border-gray-300 dark:border-gray-600 px-2 py-1',
    tableCellHeader: 'border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold',
    horizontalRule: 'border-t border-gray-300 dark:border-gray-600 my-4',
  };

  const initialConfig = {
    namespace: `RichTextEditorV2_${name}`,
    theme,
    onError: (error: Error) => {
      uiLogger.error('Lexical Error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      HorizontalRuleNode,
      ImageNode,
    ],
    editorState: value ? (editor: any) => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(value, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    } : undefined,
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      onChange?.(htmlString);
    });
  };

  const editorHeight = rows ? `${rows * 1.5}rem` : minHeight;

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={disabled || readOnly}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <div className={`
        rounded-lg border transition-all duration-200
        ${isFocused 
          ? 'border-primary-500 ring-2 ring-primary-500/20' 
          : error 
            ? 'border-red-500' 
            : 'border-gray-300 dark:border-gray-700'
        }
        ${disabled || readOnly ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}
      `}>
        <LexicalComposer initialConfig={initialConfig}>
          {toolbar && !readOnly && (
            <EnhancedToolbarPlugin 
              disabled={disabled || loading} 
              toolbarType={toolbar}
              tenantId={tenantId}
            />
          )}
          
          <div 
            className="relative"
            style={{ 
              minHeight: editorHeight,
              maxHeight,
            }}
          >
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className={`
                    outline-none px-4 py-3 overflow-y-auto
                    ${disabled || readOnly ? 'cursor-not-allowed' : 'cursor-text'}
                  `}
                  style={{
                    minHeight: editorHeight,
                    maxHeight,
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              }
              placeholder={
                !readOnly && !disabled ? (
                  <div className="absolute top-3 left-4 text-gray-400 pointer-events-none">
                    {placeholder}
                  </div>
                ) : null
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            {autoFocus && <AutoFocusPlugin />}
            <ListPlugin />
            <LinkPlugin />
            <TablePlugin />
            <TabIndentationPlugin />
            <HorizontalRulePlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          </div>
        </LexicalComposer>
      </div>
    </FormFieldWrapper>
  );
};