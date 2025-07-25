# LabFlow API Documentation

## Overview

LabFlow uses Firebase Cloud Functions for backend API operations. All endpoints require authentication unless specified otherwise.

## Authentication

All requests must include a Firebase Auth token in the Authorization header:
```
Authorization: Bearer <firebase-auth-token>
```

## Base URL

Production: `https://us-central1-labflow-production.cloudfunctions.net/api`
Development: `http://localhost:5001/labflow-dev/us-central1/api`

## Core Endpoints

### Patients

#### Create Patient
```http
POST /patients
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "male|female|other",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string"
  }
}
```

#### Get Patient
```http
GET /patients/:patientId
```

#### Update Patient
```http
PUT /patients/:patientId
Content-Type: application/json

{
  // Include only fields to update
}
```

#### Search Patients
```http
GET /patients/search?q=john&limit=20&page=1
```

### Samples

#### Create Sample
```http
POST /samples
Content-Type: application/json

{
  "patientId": "string",
  "testIds": ["string"],
  "sampleType": "blood|urine|other",
  "collectionDate": "ISO-8601",
  "priority": "routine|stat",
  "notes": "string"
}
```

#### Update Sample Status
```http
PUT /samples/:sampleId/status
Content-Type: application/json

{
  "status": "collected|in_transit|received|processing|completed",
  "location": "string",
  "notes": "string"
}
```

#### Get Sample Chain of Custody
```http
GET /samples/:sampleId/custody
```

### Results

#### Submit Result
```http
POST /results
Content-Type: application/json

{
  "sampleId": "string",
  "testId": "string",
  "value": "string|number",
  "unit": "string",
  "referenceRange": {
    "min": "number",
    "max": "number"
  },
  "flags": ["string"],
  "notes": "string"
}
```

#### Approve Results
```http
POST /results/approve
Content-Type: application/json

{
  "resultIds": ["string"],
  "approverNotes": "string"
}
```

#### Get Critical Results
```http
GET /results/critical?status=pending&limit=50
```

### Reports

#### Generate Report
```http
POST /reports/generate
Content-Type: application/json

{
  "type": "patient|daily|tat|financial",
  "format": "pdf|excel|csv",
  "parameters": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "patientId": "string",
    "includeGraphs": "boolean"
  }
}
```

#### Get Report Status
```http
GET /reports/:reportId/status
```

#### Download Report
```http
GET /reports/:reportId/download
```

## Webhook Endpoints

### Result Ready Notification
```http
POST /webhooks/results/ready
Content-Type: application/json
X-Webhook-Secret: <shared-secret>

{
  "resultId": "string",
  "patientId": "string",
  "testName": "string",
  "status": "completed|critical",
  "timestamp": "ISO-8601"
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing auth token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `CONFLICT` - Resource already exists
- `RATE_LIMIT` - Too many requests

## Rate Limiting

- Authenticated requests: 1000/hour per user
- Unauthenticated requests: 100/hour per IP
- Webhook endpoints: 10,000/day per endpoint

## Data Formats

### Dates
All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### IDs
All IDs are Firebase-generated document IDs (20 characters)

### Pagination
```
GET /resource?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

Response includes:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## SDKs and Examples

### JavaScript/TypeScript
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Call a function
const createPatient = httpsCallable(functions, 'createPatient');
const result = await createPatient({ 
  firstName: 'John',
  lastName: 'Doe' 
});
```

### cURL Examples
```bash
# Get patient
curl -H "Authorization: Bearer $TOKEN" \
  https://api.labflow.com/patients/abc123

# Create sample
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"abc123","testIds":["test1"]}' \
  https://api.labflow.com/samples
```

## Testing

Use the development environment for testing:
- Base URL: `http://localhost:5001/labflow-dev/us-central1/api`
- Test accounts available
- Rate limits relaxed
- Additional debug headers

## Support

- API Status: https://status.labflow.com
- Documentation: https://docs.labflow.com/api
- Support: api-support@labflow.com