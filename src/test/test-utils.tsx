import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AllTheProviders } from './AllTheProviders';

export const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });
