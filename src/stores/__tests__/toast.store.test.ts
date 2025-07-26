import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, toast } from '../toast.store';

describe('Toast Store', () => {
  beforeEach(() => {
    // Reset store state completely
    useToastStore.setState({
      toasts: [],
    });
    // Clear any timers
    vi.clearAllTimers();
  });

  it('adds a toast message', () => {
    const { addToast } = useToastStore.getState();
    
    addToast({
      title: 'Success',
      message: 'Operation completed successfully',
      type: 'success',
    });

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toMatchObject({
      title: 'Success',
      message: 'Operation completed successfully',
      type: 'success',
    });
    expect(state.toasts[0].id).toBeDefined();
  });

  it('adds multiple toasts', () => {
    const { addToast } = useToastStore.getState();
    
    addToast({ title: 'Toast 1', type: 'info' });
    addToast({ title: 'Toast 2', type: 'warning' });
    addToast({ title: 'Toast 3', type: 'error' });

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(3);
    expect(state.toasts[0].title).toBe('Toast 1');
    expect(state.toasts[1].title).toBe('Toast 2');
    expect(state.toasts[2].title).toBe('Toast 3');
  });

  it('removes a toast by id', async () => {
    // Get initial store actions
    const { addToast, removeToast } = useToastStore.getState();
    
    // Add toasts with small delay to ensure unique IDs
    addToast({ title: 'Toast 1', type: 'info' });
    await new Promise(resolve => setTimeout(resolve, 1));
    addToast({ title: 'Toast 2', type: 'warning' });

    // Verify toasts were added
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(2);
    
    // Verify the toasts have different IDs
    expect(state.toasts[0].id).not.toBe(state.toasts[1].id);
    
    // Get the ID of the first toast
    const toastId = state.toasts[0].id;
    
    // Remove the first toast
    removeToast(toastId);

    // Check the updated state
    const updatedState = useToastStore.getState();
    expect(updatedState.toasts).toHaveLength(1);
    expect(updatedState.toasts[0].title).toBe('Toast 2');
  });

  it('generates unique IDs for toasts', async () => {
    const { addToast } = useToastStore.getState();
    
    // Add toasts with minimal delay to ensure unique timestamps
    addToast({ title: 'Toast 1', type: 'info' });
    await new Promise(resolve => setTimeout(resolve, 1));
    addToast({ title: 'Toast 2', type: 'info' });
    await new Promise(resolve => setTimeout(resolve, 1));
    addToast({ title: 'Toast 3', type: 'info' });

    const state = useToastStore.getState();
    const ids = state.toasts.map(t => t.id);
    const uniqueIds = new Set(ids);
    
    // IDs should be unique
    expect(state.toasts).toHaveLength(3);
    expect(uniqueIds.size).toBe(3);
  });

  it('handles all toast types', () => {
    const { addToast } = useToastStore.getState();
    const types: Array<'info' | 'success' | 'warning' | 'error'> = ['info', 'success', 'warning', 'error'];
    
    types.forEach(type => {
      addToast({ title: `${type} toast`, type });
    });

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(4);
    expect(state.toasts[0].type).toBe('info');
    expect(state.toasts[1].type).toBe('success');
    expect(state.toasts[2].type).toBe('warning');
    expect(state.toasts[3].type).toBe('error');
  });

  it('uses toast helper functions', () => {
    toast.success('Success!', 'Operation completed');
    toast.error('Error!', 'Something went wrong');
    toast.warning('Warning!', 'Be careful');
    toast.info('Info!', 'Just so you know');

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(4);
    
    expect(state.toasts[0].type).toBe('success');
    expect(state.toasts[0].title).toBe('Success!');
    expect(state.toasts[0].message).toBe('Operation completed');
    
    expect(state.toasts[1].type).toBe('error');
    expect(state.toasts[1].title).toBe('Error!');
    
    expect(state.toasts[2].type).toBe('warning');
    expect(state.toasts[2].title).toBe('Warning!');
    
    expect(state.toasts[3].type).toBe('info');
    expect(state.toasts[3].title).toBe('Info!');
  });

  it('toast messages can be removed', () => {
    toast.success('Test');
    
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    
    const toastId = state.toasts[0].id;
    state.removeToast(toastId);
    
    const updatedState = useToastStore.getState();
    expect(updatedState.toasts).toHaveLength(0);
  });
});