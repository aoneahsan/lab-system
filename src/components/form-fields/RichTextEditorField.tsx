import React, { useEffect, useState } from 'react';
import { $getRoot, $getSelection, EditorState } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
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
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { TRANSFORMERS } from '@lexical/markdown';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link, 
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, FileText, Hash, Link2
} from 'lucide-react';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { 
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  $isListNode,
  $createListNode,
  $createListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  $createLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {
  $setBlocksType,
  $isAtNodeEnd,
  $wrapNodes,
  $patchStyleText,
} from '@lexical/selection';
import { $createCodeNode } from '@lexical/code';
import { mergeRegister } from '@lexical/utils';

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

// Toolbar Component
const ToolbarPlugin: React.FC<{ 
  disabled?: boolean;
  toolbarType?: boolean | 'minimal' | 'full';
}> = ({ disabled = false, toolbarType = 'full' }) => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();
      
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type === 'ol' ? 'ol' : 'ul');
        } else if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
        } else if ($isCodeNode(element)) {
          setBlockType('code');
        } else if ($isQuoteNode(element)) {
          setBlockType('quote');
        } else {
          setBlockType('paragraph');
        }
      }
    }
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  const formatCode = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
  };

  const insertLink = () => {
    if (!isLink) {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  };

  const formatHeading = (headingTag: 'h1' | 'h2' | 'h3') => {
    if (blockType !== headingTag) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingTag));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  if (toolbarType === false) {
    return null;
  }

  const buttonClass = (isActive: boolean) => `
    p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
    ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const separatorClass = 'w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1';

  return (
    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
      {/* History controls */}
      <button
        type="button"
        onClick={undo}
        disabled={disabled || !canUndo}
        className={buttonClass(false)}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={disabled || !canRedo}
        className={buttonClass(false)}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </button>
      
      <div className={separatorClass} />
      
      {/* Text formatting */}
      <button
        type="button"
        onClick={formatBold}
        disabled={disabled}
        className={buttonClass(isBold)}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={formatItalic}
        disabled={disabled}
        className={buttonClass(isItalic)}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={formatUnderline}
        disabled={disabled}
        className={buttonClass(isUnderline)}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </button>
      
      {toolbarType === 'full' && (
        <>
          <button
            type="button"
            onClick={formatStrikethrough}
            disabled={disabled}
            className={buttonClass(isStrikethrough)}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={formatCode}
            disabled={disabled}
            className={buttonClass(isCode)}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
          
          <div className={separatorClass} />
          
          {/* Headings and blocks */}
          <button
            type="button"
            onClick={() => formatHeading('h1')}
            disabled={disabled}
            className={buttonClass(blockType === 'h1')}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatHeading('h2')}
            disabled={disabled}
            className={buttonClass(blockType === 'h2')}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatHeading('h3')}
            disabled={disabled}
            className={buttonClass(blockType === 'h3')}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          
          <div className={separatorClass} />
        </>
      )}
      
      {/* Lists */}
      <button
        type="button"
        onClick={formatBulletList}
        disabled={disabled}
        className={buttonClass(blockType === 'ul')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={formatNumberedList}
        disabled={disabled}
        className={buttonClass(blockType === 'ol')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      
      {toolbarType === 'full' && (
        <>
          <div className={separatorClass} />
          
          <button
            type="button"
            onClick={formatQuote}
            disabled={disabled}
            className={buttonClass(blockType === 'quote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={insertLink}
            disabled={disabled}
            className={buttonClass(isLink)}
            title="Insert Link"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

// Import necessary commands
import {
  $isRangeSelection,
  $isNodeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
} from 'lexical';
import { $getNearestNodeOfType, $findMatchingParent } from '@lexical/utils';
import { $isQuoteNode } from '@lexical/rich-text';
import { $isCodeNode } from '@lexical/code';

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
  const [editorState, setEditorState] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

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
    },
    code: 'bg-gray-100 dark:bg-gray-900 p-3 rounded-lg font-mono text-sm mb-2 overflow-x-auto',
  };

  const initialConfig = {
    namespace: `RichTextEditor_${name}`,
    theme,
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
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

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(null);
      setEditorState(htmlString);
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
            <ToolbarPlugin disabled={disabled || loading} toolbarType={toolbar} />
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
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          </div>
        </LexicalComposer>
      </div>
    </FormFieldWrapper>
  );
};