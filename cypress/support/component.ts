// ***********************************************************
// This file is processed and loaded automatically before component test files.
// ***********************************************************

import './commands';
import { mount } from 'cypress/react18';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Add component testing commands
Cypress.Commands.add('mount', (component, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapped = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return mount(wrapped, options);
});

// TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

export {};