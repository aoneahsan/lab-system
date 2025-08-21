import React, { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import {
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  $createLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {
  $setBlocksType,
  $patchStyleText,
} from '@lexical/selection';
import { $getNearestNodeOfType } from '@lexical/utils';
import { ListNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { $isQuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Minus, RemoveFormatting, Table, Image,
  Palette, Highlighter, Type
} from 'lucide-react';
import {
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSelect,
  ColorPicker,
  AlignmentButtons,
  IndentButtons,
  ScriptButtons,
  fontSizeOptions,
  fontFamilyOptions,
} from './ToolbarComponents';

interface EnhancedToolbarPluginProps {
  disabled?: boolean;
  toolbarType?: boolean | 'minimal' | 'full';
}

export const EnhancedToolbarPlugin: React.FC<EnhancedToolbarPluginProps> = ({
  disabled = false,
  toolbarType = 'full',
}) => {
  const [editor] = useLexicalComposerContext();
  
  // Text formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  
  // Block type states
  const [blockType, setBlockType] = useState('paragraph');
  const [elementFormat, setElementFormat] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  
  // History states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Style states
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('inherit');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsSubscript(selection.hasFormat('subscript'));

      // Update block type
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
  }, [editor]);

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
  }, [editor, updateToolbar]);

  // Format functions
  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    setElementFormat(alignment);
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

  const insertHorizontalRule = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          'font-size': null,
          'font-family': null,
          'color': null,
          'background-color': null,
        });
        // Remove all text formats
        ['bold', 'italic', 'underline', 'strikethrough', 'code', 'superscript', 'subscript'].forEach(format => {
          if (selection.hasFormat(format)) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
          }
        });
      }
    });
  };

  const applyStyleText = (styles: Record<string, string>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    applyStyleText({ 'font-size': size });
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    applyStyleText({ 'font-family': family });
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    applyStyleText({ 'color': color });
  };

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    applyStyleText({ 'background-color': color });
  };

  if (toolbarType === false) {
    return null;
  }

  return (
    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
      {/* History controls */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={disabled || !canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={disabled || !canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarSeparator />
      
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => formatText('bold')}
        isActive={isBold}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('italic')}
        isActive={isItalic}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('underline')}
        isActive={isUnderline}
        disabled={disabled}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      
      {toolbarType === 'full' && (
        <>
          <ToolbarButton
            onClick={() => formatText('strikethrough')}
            isActive={isStrikethrough}
            disabled={disabled}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatText('code')}
            isActive={isCode}
            disabled={disabled}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* Super/Subscript */}
          <ScriptButtons
            isSuperscript={isSuperscript}
            isSubscript={isSubscript}
            onSuperscript={() => formatText('superscript')}
            onSubscript={() => formatText('subscript')}
            disabled={disabled}
          />
          
          <ToolbarSeparator />
          
          {/* Font controls */}
          <ToolbarSelect
            value={fontSize}
            onChange={handleFontSizeChange}
            options={fontSizeOptions}
            disabled={disabled}
            title="Font Size"
            className="w-20"
          />
          
          <ToolbarSelect
            value={fontFamily}
            onChange={handleFontFamilyChange}
            options={fontFamilyOptions}
            disabled={disabled}
            title="Font Family"
            className="w-32"
          />
          
          <ToolbarSeparator />
          
          {/* Color controls */}
          <ColorPicker
            value={textColor}
            onChange={handleTextColorChange}
            disabled={disabled}
            title="Text Color"
            icon={Type}
          />
          
          <ColorPicker
            value={bgColor}
            onChange={handleBgColorChange}
            disabled={disabled}
            title="Background Color"
            icon={Highlighter}
          />
          
          <ToolbarSeparator />
          
          {/* Headings */}
          <ToolbarButton
            onClick={() => formatHeading('h1')}
            isActive={blockType === 'h1'}
            disabled={disabled}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatHeading('h2')}
            isActive={blockType === 'h2'}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatHeading('h3')}
            isActive={blockType === 'h3'}
            disabled={disabled}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
        </>
      )}
      
      {/* Lists */}
      <ToolbarButton
        onClick={formatBulletList}
        isActive={blockType === 'ul'}
        disabled={disabled}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={formatNumberedList}
        isActive={blockType === 'ol'}
        disabled={disabled}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      
      {toolbarType === 'full' && (
        <>
          <ToolbarSeparator />
          
          {/* Alignment */}
          <AlignmentButtons
            alignment={elementFormat}
            onAlign={formatAlign}
            disabled={disabled}
          />
          
          <ToolbarSeparator />
          
          {/* Indentation */}
          <IndentButtons
            onIndent={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
            onOutdent={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
            disabled={disabled}
          />
          
          <ToolbarSeparator />
          
          {/* Additional elements */}
          <ToolbarButton
            onClick={formatQuote}
            isActive={blockType === 'quote'}
            disabled={disabled}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertLink}
            isActive={isLink}
            disabled={disabled}
            title="Insert Link"
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertHorizontalRule}
            disabled={disabled}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarSeparator />
          
          {/* Clear formatting */}
          <ToolbarButton
            onClick={clearFormatting}
            disabled={disabled}
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
    </div>
  );
};