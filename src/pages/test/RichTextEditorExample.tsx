import { useState } from 'react';
import { RichTextEditorField } from '@/components/form-fields/RichTextEditorField';
import { FileText, Save, Sparkles } from 'lucide-react';
import { uiLogger } from '@/services/logger.service';

const RichTextEditorExample = () => {
  const [content, setContent] = useState('');
  const [minimalContent, setMinimalContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [savedContent, setSavedContent] = useState<string | null>(null);

  const handleSave = () => {
    setSavedContent(fullContent);
    uiLogger.log('Saved content:', fullContent);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-8 w-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rich Text Editor Examples
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Powered by Facebook's Lexical Editor
              </p>
            </div>
          </div>
        </div>

        {/* No Toolbar Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Editor (No Toolbar)
          </h2>
          <RichTextEditorField
            label="Basic Notes"
            name="basicNotes"
            value={content}
            onChange={setContent}
            placeholder="Start typing your notes here..."
            rows={4}
            toolbar={false}
            helpText="Simple text editor without formatting toolbar"
          />
        </div>

        {/* Minimal Toolbar Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Minimal Toolbar Editor
          </h2>
          <RichTextEditorField
            label="Document Summary"
            name="documentSummary"
            value={minimalContent}
            onChange={setMinimalContent}
            placeholder="Write a summary with basic formatting..."
            rows={5}
            toolbar="minimal"
            helpText="Editor with essential formatting options only"
          />
        </div>

        {/* Enhanced Full Toolbar Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Enhanced Editor with Advanced Features
          </h2>
          <RichTextEditorField
            label="Complete Documentation"
            name="documentation"
            value={fullContent}
            onChange={setFullContent}
            placeholder="Create rich documentation with all formatting options..."
            rows={8}
            toolbar="full"
            helpText="Enhanced editor with font controls, text/background colors, alignment, super/subscript, indentation, and more!"
            required
          />
          
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Content
            </button>
            
            {savedContent && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Content saved successfully!
              </span>
            )}
          </div>
        </div>

        {/* Preview of Saved Content */}
        {savedContent && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Saved Content Preview
            </h2>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: savedContent }}
            />
          </div>
        )}

        {/* Features Info */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-3">
            Editor Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-800 dark:text-primary-200">
            <div>
              <h4 className="font-medium mb-1">Text Formatting</h4>
              <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-300">
                <li>Bold, Italic, Underline, Strikethrough</li>
                <li>Inline code formatting</li>
                <li>Multiple heading levels (H1, H2, H3)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Block Elements</h4>
              <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-300">
                <li>Bullet and numbered lists</li>
                <li>Block quotes</li>
                <li>Links with URL prompts</li>
                <li>Horizontal rules</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Keyboard Shortcuts</h4>
              <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-300">
                <li>Ctrl/Cmd + B for Bold</li>
                <li>Ctrl/Cmd + I for Italic</li>
                <li>Ctrl/Cmd + U for Underline</li>
                <li>Ctrl/Cmd + Z/Y for Undo/Redo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Markdown Support</h4>
              <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-300">
                <li>Type # for headings</li>
                <li>Type * or - for lists</li>
                <li>Type {'>'} for quotes</li>
                <li>Automatic markdown conversion</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1 text-yellow-600 dark:text-yellow-400">✨ Enhanced Features</h4>
              <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-300">
                <li>Font size and family selection</li>
                <li>Text and background colors</li>
                <li>Text alignment (left, center, right, justify)</li>
                <li>Superscript and subscript</li>
                <li>Indentation controls</li>
                <li>Clear formatting button</li>
                <li>Tables support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditorExample;