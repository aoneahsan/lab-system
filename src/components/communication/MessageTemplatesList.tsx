import { useState } from 'react';
import { MessageTemplate } from '@/types/communication.types';
import { useDeleteTemplate } from '@/hooks/useCommunication';
import MessageTemplateModal from './MessageTemplateModal';

interface MessageTemplatesListProps {
  templates: MessageTemplate[];
  isLoading: boolean;
}

export function MessageTemplatesList({ templates, isLoading }: MessageTemplatesListProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteTemplate = useDeleteTemplate();

  const categoryIcons = {
    appointment: '📅',
    result: '🧪',
    billing: '💳',
    marketing: '📢',
    general: '📨'
  };

  const channelIcons = {
    sms: '💬',
    whatsapp: '📱',
    email: '✉️',
    push: '🔔'
  };

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Message Templates</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No templates found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Create your first message template to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryIcons[template.category]} {template.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        template.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Edit template"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Delete template"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {template.channels.map((channel) => (
                  <span
                    key={channel}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                  >
                    {channelIcons[channel]} {channel}
                  </span>
                ))}
              </div>

              {template.triggers && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Trigger: {template.triggers.event?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <MessageTemplateModal
          template={selectedTemplate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}