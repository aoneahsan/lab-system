// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Export custom render from test-utils
export { customRender as render } from './test-utils';

// Export test data factories
export * from './test-data';