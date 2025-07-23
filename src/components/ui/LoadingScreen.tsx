export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="loading-spinner w-12 h-12 mx-auto mb-4 border-4 border-primary-600 border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading LabFlow...</p>
      </div>
    </div>
  );
};