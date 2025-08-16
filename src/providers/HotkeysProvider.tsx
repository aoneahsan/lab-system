import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hotkeysService } from '@/services/hotkeys.service';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';

interface HotkeysProviderProps {
  children: React.ReactNode;
}

export const HotkeysProvider: React.FC<HotkeysProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    // Register action listeners
    const handleNavigate = (path: string) => (event: KeyboardEvent) => {
      navigate(path);
    };

    const handleSearch = (event: KeyboardEvent) => {
      // Open global search modal
      const searchButton = document.querySelector('[data-search-trigger]') as HTMLElement;
      searchButton?.click();
    };

    const handleNewAction = (event: KeyboardEvent) => {
      // Context-aware new action
      const currentPath = location.pathname;
      
      if (currentPath.includes('/patients')) {
        navigate('/patients/new');
      } else if (currentPath.includes('/tests')) {
        navigate('/tests/new');
      } else if (currentPath.includes('/samples')) {
        // Open sample creation modal
        const newButton = document.querySelector('[data-new-sample]') as HTMLElement;
        newButton?.click();
      } else if (currentPath.includes('/appointments')) {
        navigate('/appointments/new');
      } else {
        toast.info('Create New', 'Navigate to a specific module to create new items');
      }
    };

    const handleEdit = (event: KeyboardEvent) => {
      // Find and click edit button if available
      const editButton = document.querySelector('[data-edit-button]') as HTMLElement;
      if (editButton) {
        editButton.click();
      } else {
        toast.info('Edit', 'No editable item selected');
      }
    };

    const handleSave = (event: KeyboardEvent) => {
      // Find and click save button if available
      const saveButton = document.querySelector('[data-save-button]') as HTMLElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLElement;
      
      if (saveButton) {
        saveButton.click();
      } else if (submitButton) {
        submitButton.click();
      }
    };

    const handleDelete = (event: KeyboardEvent) => {
      // Find and click delete button if available
      const deleteButton = document.querySelector('[data-delete-button]') as HTMLElement;
      if (deleteButton) {
        deleteButton.click();
      } else {
        toast.info('Delete', 'No item selected for deletion');
      }
    };

    const handleRefresh = (event: KeyboardEvent) => {
      // Trigger data refresh
      const refreshButton = document.querySelector('[data-refresh-button]') as HTMLElement;
      if (refreshButton) {
        refreshButton.click();
      } else {
        window.location.reload();
      }
    };

    const handlePrint = (event: KeyboardEvent) => {
      window.print();
    };

    const handleToggleSidebar = (event: KeyboardEvent) => {
      const sidebar = document.querySelector('[data-sidebar]') as HTMLElement;
      if (sidebar) {
        sidebar.classList.toggle('hidden');
      }
    };

    const handleToggleTheme = (event: KeyboardEvent) => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toast.success('Theme Changed', `Switched to ${isDark ? 'dark' : 'light'} mode`);
    };

    const handleShowHelp = (event: KeyboardEvent) => {
      // Open info modal
      const infoButton = document.querySelector('[data-info-trigger]') as HTMLElement;
      if (infoButton) {
        infoButton.click();
      }
    };

    const handleShowShortcuts = (event: KeyboardEvent) => {
      // Navigate to shortcuts page or open modal
      navigate('/settings/hotkeys');
    };

    const handleBack = (event: KeyboardEvent) => {
      // Check if there's a modal open first
      const modal = document.querySelector('[data-modal-close]') as HTMLElement;
      if (modal) {
        modal.click();
      } else {
        // Use the back button if available
        const backButton = document.querySelector('[data-back-button]') as HTMLElement;
        if (backButton) {
          backButton.click();
        } else {
          navigate(-1);
        }
      }
    };

    // Register all listeners
    hotkeysService.registerActionListener('navigate.dashboard', handleNavigate('/dashboard'));
    hotkeysService.registerActionListener('navigate.patients', handleNavigate('/patients'));
    hotkeysService.registerActionListener('navigate.tests', handleNavigate('/tests'));
    hotkeysService.registerActionListener('navigate.samples', handleNavigate('/samples'));
    hotkeysService.registerActionListener('navigate.results', handleNavigate('/results'));
    hotkeysService.registerActionListener('navigate.billing', handleNavigate('/billing'));
    hotkeysService.registerActionListener('navigate.back', handleBack);
    
    hotkeysService.registerActionListener('action.new', handleNewAction);
    hotkeysService.registerActionListener('action.save', handleSave);
    hotkeysService.registerActionListener('action.edit', handleEdit);
    hotkeysService.registerActionListener('action.delete', handleDelete);
    hotkeysService.registerActionListener('action.refresh', handleRefresh);
    hotkeysService.registerActionListener('action.print', handlePrint);
    
    hotkeysService.registerActionListener('search.global', handleSearch);
    hotkeysService.registerActionListener('toggle.sidebar', handleToggleSidebar);
    hotkeysService.registerActionListener('toggle.theme', handleToggleTheme);
    hotkeysService.registerActionListener('show.help', handleShowHelp);
    hotkeysService.registerActionListener('show.shortcuts', handleShowShortcuts);

    // Cleanup
    return () => {
      // Unregister listeners if needed
    };
  }, [navigate, location]);

  return <>{children}</>;
};

export default HotkeysProvider;