# LOINC Integration Guide

## Overview

LabFlow integrates with LOINC (Logical Observation Identifiers Names and Codes) to provide standardized test identification. The system supports both mock data for development and real LOINC FHIR API integration for production use.

## Configuration

### Environment Variables

Set the following in your `.env` file:

```env
# Enable/disable real LOINC API
VITE_USE_LOINC_API=true  # Set to 'false' to use mock data
```

### Mock Data vs Real API

- **Development**: Uses mock LOINC data by default for faster development and offline work
- **Production**: Can connect to the real LOINC FHIR API for up-to-date codes

## Features

### 1. LOINC Code Search
- Search by code, display name, or long common name
- Real-time search with debouncing
- Results cached for 1 hour to reduce API calls

### 2. LOINC Browser Component
- Full-featured LOINC code browser with categories
- Browse common tests or filter by category
- Visual selection interface with detailed code information

### 3. Category Browsing
- Chemistry (CHEM)
- Hematology (HEM/BC)
- Microbiology (MICRO)
- Serology/Immunology (SERO)
- Urinalysis (UA)
- Coagulation (COAG)
- Drug/Toxicology (DRUG/TOX)
- Pathology (PATH)

### 4. Test Form Integration
- Integrated LOINC browser in test creation/editing
- Auto-populate test name from LOINC display name
- Store complete LOINC metadata with tests

## API Services

### loincService
Main service that handles switching between mock and real API:

```typescript
import { loincService } from '@/services/loinc.service';

// Search for LOINC codes
const results = await loincService.searchLOINCCodes('glucose');

// Get specific LOINC code
const loinc = await loincService.getLOINCByCode('2345-7');

// Get common tests
const commonTests = await loincService.getCommonTests();

// Search by category
const chemTests = await loincService.searchByCategory('CHEM');

// Validate LOINC code
const isValid = await loincService.validateLOINCCode('2345-7');
```

### loincApiService
Direct API service for advanced use cases:

```typescript
import { loincApiService } from '@/services/loinc-api.service';

// Direct API calls with more options
const results = await loincApiService.searchLOINCCodes('glucose', 50);

// Clear cache if needed
loincApiService.clearCache();
```

## Components

### LOINCBrowser
Full-featured LOINC browser modal:

```tsx
import LOINCBrowser from '@/components/tests/LOINCBrowser';

<LOINCBrowser
  onSelect={(loinc) => handleSelect(loinc)}
  onClose={() => setShowBrowser(false)}
  selectedCode={currentCode}
/>
```

### Test Form Integration
The test form includes built-in LOINC selection:

```tsx
import TestForm from '@/components/tests/TestForm';

<TestForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={testData}
/>
```

## Data Structure

### LOINCCode Type
```typescript
interface LOINCCode {
  code: string;              // LOINC code (e.g., "2345-7")
  displayName: string;       // Display name (e.g., "Glucose")
  longCommonName?: string;   // Full descriptive name
  shortName?: string;        // Abbreviated name
  class?: string;            // Test class (e.g., "CHEM")
  component?: string;        // What is measured
  property?: string;         // Type of property (e.g., "MCnc")
  timeAspect?: string;       // Time aspect (e.g., "Pt")
  system?: string;           // System/specimen (e.g., "Ser/Plas")
  scale?: string;            // Scale type (e.g., "Qn")
  method?: string;           // Method type
  status?: string;           // Active/deprecated status
}
```

## Error Handling

The LOINC integration includes automatic fallback to mock data if:
- The LOINC API is unavailable
- Network errors occur
- API rate limits are exceeded

## Performance Optimization

1. **Caching**: Results are cached for 1 hour
2. **Debouncing**: Search queries are debounced to reduce API calls
3. **Lazy Loading**: LOINC browser loads on demand
4. **Mock Data**: Available for offline development

## Compliance

- LOINC codes are freely available for use
- No license required for LOINC code usage
- Attribution to Regenstrief Institute recommended
- See https://loinc.org for more information

## Future Enhancements

1. **Offline Support**: Download and cache full LOINC database
2. **Custom Mappings**: Map internal codes to LOINC codes
3. **Version Management**: Track LOINC version updates
4. **Bulk Import**: Import tests with LOINC codes from CSV/Excel