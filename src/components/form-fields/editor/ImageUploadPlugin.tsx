import React, { useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { $createImageNode, ImagePayload } from './ImageNode';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { ToolbarButton } from './ToolbarComponents';

interface ImageUploadPluginProps {
  disabled?: boolean;
  tenantId?: string;
}

export const ImageUploadPlugin: React.FC<ImageUploadPluginProps> = ({ 
  disabled = false,
  tenantId 
}) => {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [altText, setAltText] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [showCaption, setShowCaption] = React.useState(false);

  const {
    uploading,
    progress,
    uploadSingleFile,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useFileUpload({
    folder: 'editor-images',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
    imageOptions: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.9,
    },
    saveToFirestore: true,
    firestoreCollection: 'editor_images',
    tenantId,
    showToast: true,
  });

  const insertImage = useCallback((payload: ImagePayload) => {
    editor.update(() => {
      const imageNode = $createImageNode(payload);
      $insertNodes([imageNode]);
    });
  }, [editor]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadSingleFile(file);
      setImageUrl(result.url);
      setAltText(file.name);
      setShowUploadModal(true);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl) {
      insertImage({
        src: imageUrl,
        altText: altText || 'Image',
        caption,
        showCaption,
        maxWidth: 800,
      });
      
      // Reset form
      setShowUploadModal(false);
      setImageUrl('');
      setAltText('');
      setCaption('');
      setShowCaption(false);
    }
  };

  const handleDropWrapper = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      uploadSingleFile(imageFile).then(result => {
        insertImage({
          src: result.url,
          altText: imageFile.name,
          maxWidth: 800,
        });
      }).catch(error => {
        console.error('Failed to upload dropped image:', error);
      });
    }
    
    handleDrop(e);
  }, [uploadSingleFile, insertImage, handleDrop]);

  React.useEffect(() => {
    // Register drag and drop on the editor
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleEditorDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      const imageFile = files.find(file => file.type.startsWith('image/'));
      
      if (imageFile) {
        uploadSingleFile(imageFile).then(result => {
          insertImage({
            src: result.url,
            altText: imageFile.name,
            maxWidth: 800,
          });
        });
      }
    };

    const handleEditorDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    editorElement.addEventListener('drop', handleEditorDrop);
    editorElement.addEventListener('dragover', handleEditorDragOver);

    return () => {
      editorElement.removeEventListener('drop', handleEditorDrop);
      editorElement.removeEventListener('dragover', handleEditorDragOver);
    };
  }, [editor, uploadSingleFile, insertImage]);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toolbar button */}
      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        title="Insert Image"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Image className="h-4 w-4" />
        )}
      </ToolbarButton>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Insert Image
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image preview */}
              {imageUrl && (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* URL input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Alt text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCaption}
                    onChange={(e) => setShowCaption(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Caption
                  </span>
                </label>
                {showCaption && (
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Enter image caption"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                )}
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUrlSubmit}
                disabled={!imageUrl || uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};