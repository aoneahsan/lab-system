---
sidebar_position: 1
---

# API Reference Overview

LabFlow provides a comprehensive RESTful API for integrating with external systems.

## 🔑 Authentication

All API requests require authentication using Firebase Auth tokens.

### Obtaining an API Token

```javascript
// Using Firebase Auth
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const token = await auth.currentUser.getIdToken();

// Include in requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### API Key Authentication (Server-to-Server)

For server applications, use service account credentials:

```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

## 🌐 Base URLs

```
Production: https://api.labflow.app/v1
Staging:    https://api-staging.labflow.app/v1
Development: http://localhost:5001/your-project/us-central1/api/v1
```

## 📡 API Endpoints

### Patient Management

#### List Patients
```http
GET /patients
```

Query Parameters:
- `search` - Search by name, email, or MRN
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `sort` - Sort field (default: lastName)

Response:
```json
{
  "data": [
    {
      "id": "patient_123",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1980-01-15",
      "gender": "male",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "mrn": "MRN001234"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Patient
```http
GET /patients/{patientId}
```

#### Create Patient
```http
POST /patients
```

Request Body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-15",
  "gender": "male",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

#### Update Patient
```http
PUT /patients/{patientId}
```

#### Delete Patient
```http
DELETE /patients/{patientId}
```

### Test Orders

#### Create Order
```http
POST /orders
```

Request Body:
```json
{
  "patientId": "patient_123",
  "tests": ["TEST001", "TEST002"],
  "priority": "routine",
  "clinicalNotes": "Annual checkup",
  "orderingProviderId": "provider_456",
  "diagnosis": ["Z00.00"],
  "fastingRequired": true
}
```

#### Get Order
```http
GET /orders/{orderId}
```

#### Update Order Status
```http
PATCH /orders/{orderId}/status
```

Request Body:
```json
{
  "status": "in_progress",
  "notes": "Sample collected"
}
```

### Test Results

#### Submit Results
```http
POST /results
```

Request Body:
```json
{
  "orderId": "order_789",
  "sampleId": "sample_456",
  "results": [
    {
      "testCode": "TEST001",
      "value": "5.5",
      "unit": "mmol/L",
      "referenceRange": "3.5-5.5",
      "flag": "normal",
      "notes": ""
    }
  ],
  "performedBy": "tech_123",
  "performedAt": "2025-01-15T10:30:00Z"
}
```

#### Get Results
```http
GET /results?orderId={orderId}
```

#### Verify Results
```http
POST /results/{resultId}/verify
```

Request Body:
```json
{
  "verifiedBy": "supervisor_456",
  "comments": "Results verified and released"
}
```

### Sample Management

#### Register Sample
```http
POST /samples
```

Request Body:
```json
{
  "orderId": "order_789",
  "barcode": "BC123456789",
  "sampleType": "blood",
  "collectionSite": "antecubital_vein",
  "collectedBy": "phlebotomist_123",
  "collectionNotes": "Patient fasted for 12 hours"
}
```

#### Track Sample
```http
GET /samples/{sampleId}/tracking
```

Response:
```json
{
  "sampleId": "sample_456",
  "currentStatus": "in_lab",
  "location": "Chemistry Analyzer 1",
  "history": [
    {
      "status": "collected",
      "timestamp": "2025-01-15T08:00:00Z",
      "location": "Collection Room 1",
      "user": "phlebotomist_123"
    },
    {
      "status": "received",
      "timestamp": "2025-01-15T08:30:00Z",
      "location": "Lab Reception",
      "user": "tech_456"
    }
  ]
}
```

### Billing

#### Create Invoice
```http
POST /invoices
```

Request Body:
```json
{
  "patientId": "patient_123",
  "orderId": "order_789",
  "items": [
    {
      "code": "TEST001",
      "description": "Complete Blood Count",
      "quantity": 1,
      "unitPrice": 45.00
    }
  ],
  "insuranceClaimId": "claim_123"
}
```

#### Process Payment
```http
POST /payments
```

Request Body:
```json
{
  "invoiceId": "invoice_456",
  "amount": 45.00,
  "method": "credit_card",
  "transactionId": "txn_789",
  "processedBy": "receptionist_123"
}
```

## 🔄 Webhooks

Configure webhooks to receive real-time updates:

### Available Events

- `patient.created`
- `patient.updated`
- `order.created`
- `order.status_changed`
- `result.available`
- `result.verified`
- `sample.status_changed`
- `invoice.created`
- `payment.received`

### Webhook Configuration

```http
POST /webhooks
```

Request Body:
```json
{
  "url": "https://your-app.com/webhooks/labflow",
  "events": ["result.verified", "order.status_changed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "result.verified",
  "timestamp": "2025-01-15T10:45:00Z",
  "data": {
    "resultId": "result_123",
    "orderId": "order_789",
    "patientId": "patient_456",
    "verifiedBy": "supervisor_123"
  }
}
```

## 🔍 Search API

### Global Search
```http
GET /search?q={query}&type={type}
```

Parameters:
- `q` - Search query
- `type` - Entity type (patient, order, result)
- `limit` - Max results (default: 10)

### Advanced Search
```http
POST /search/advanced
```

Request Body:
```json
{
  "filters": {
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "status": ["completed", "verified"],
    "testCodes": ["TEST001", "TEST002"]
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

## 📊 Analytics API

### Dashboard Metrics
```http
GET /analytics/dashboard
```

Response:
```json
{
  "period": "today",
  "metrics": {
    "totalOrders": 145,
    "completedTests": 432,
    "pendingResults": 28,
    "revenue": 12450.00
  },
  "trends": {
    "orders": "+12%",
    "revenue": "+8%"
  }
}
```

### Custom Reports
```http
POST /analytics/reports
```

Request Body:
```json
{
  "reportType": "test_volume",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "groupBy": "test_code",
  "filters": {
    "department": "chemistry"
  }
}
```

## 🚨 Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient data",
    "details": {
      "field": "dateOfBirth",
      "issue": "Invalid date format"
    }
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_abc123"
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Rate Limited
- `500` - Internal Server Error

## 🔒 Rate Limiting

- **Default**: 1000 requests per hour
- **Authenticated**: 5000 requests per hour
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642255200
```

## 🧪 Testing

### Sandbox Environment

Use the sandbox environment for testing:
```
https://api-sandbox.labflow.app/v1
```

Test credentials:
```json
{
  "apiKey": "test_key_123",
  "secretKey": "test_secret_456"
}
```

### Postman Collection

Download our Postman collection:
[LabFlow API Collection](https://www.postman.com/labflow/workspace/labflow-api)

## 📦 SDKs

### JavaScript/TypeScript

```bash
npm install @labflow/sdk
```

```javascript
import { LabFlowClient } from '@labflow/sdk';

const client = new LabFlowClient({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Create patient
const patient = await client.patients.create({
  firstName: 'John',
  lastName: 'Doe',
  // ...
});
```

### Python

```bash
pip install labflow-sdk
```

```python
from labflow import LabFlowClient

client = LabFlowClient(
    api_key='your_api_key',
    environment='production'
)

# Create patient
patient = client.patients.create(
    first_name='John',
    last_name='Doe',
    # ...
)
```

## 📝 API Changelog

### v1.2.0 (Latest)
- Added bulk operations endpoints
- Improved search capabilities
- Added webhook retry mechanism

### v1.1.0
- Added analytics endpoints
- Enhanced error responses
- Added rate limiting

### v1.0.0
- Initial API release
- Core CRUD operations
- Basic authentication

## 🆘 Support

- **API Status**: [status.labflow.app](https://status.labflow.app)
- **Developer Forum**: [developers.labflow.app](https://developers.labflow.app)
- **API Support**: api-support@labflow.app