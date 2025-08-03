import { useState } from 'react';
import { useTasks, useUpdateTask } from '@/hooks/useWorkflowAutomation';
import { useAuthStore } from '@/stores/auth.store';
import type { WorkflowTask } from '@/types/workflow-automation.types';

export const TasksList: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'my' | 'pending' | 'overdue'>('all');
  const { currentUser } = useAuthStore();
  const { data: tasks, isLoading } = useTasks(
    filter === 'my' ? { assignedTo: currentUser?.uid } :
    filter === 'pending' ? { status: 'pending' } :
    undefined
  );
  const updateTask = useUpdateTask();

  const handleStatusChange = async (taskId: string, status: WorkflowTask['status']) => {
    await updateTask.mutateAsync({
      id: taskId,
      data: {
        status,
        ...(status === 'in_progress' ? { startedAt: new Date() } : {}),
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      }
    });
  };

  const overdueTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    task.status !== 'cancelled' && 
    new Date(task.dueAt) < new Date()
  ) || [];

  const filteredTasks = filter === 'overdue' ? overdueTasks : tasks || [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="all">All Tasks</option>
            <option value="my">My Tasks</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue ({overdueTasks.length})</option>
          </select>
        </div>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTasks.map(task => {
              const isOverdue = task.status !== 'completed' && 
                task.status !== 'cancelled' && 
                new Date(task.dueAt) < new Date();

              return (
                <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          task.status === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' :
                          isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {isOverdue && task.status === 'pending' ? 'Overdue' : task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {task.assignedToName && (
                          <span>Assigned to: {task.assignedToName}</span>
                        )}
                        <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>
                        {task.relatedEntity && (
                          <span>
                            {task.relatedEntity.type}: {task.relatedEntity.displayName}
                          </span>
                        )}
                      </div>
                      {task.checklist && task.checklist.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Checklist:</span>
                            <span>
                              {task.checklist.filter(item => item.completed).length} / {task.checklist.length} completed
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className="btn btn-sm btn-secondary"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className="btn btn-sm btn-primary"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No tasks found.
          </p>
        </div>
      )}
    </div>
  );
};