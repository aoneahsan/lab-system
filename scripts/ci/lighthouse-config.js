export default {
  ci: {
    collect: {
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/login',
        'http://localhost:5173/patients',
        'http://localhost:5173/tests',
        'http://localhost:5173/results'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.9 }],
        
        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'tabindex': 'error',
        
        // Best practices
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'warn',
        'uses-http2': 'warn',
        'uses-passive-event-listeners': 'error',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'warn',
        'http-status-code': 'error',
        'crawlable-anchors': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};