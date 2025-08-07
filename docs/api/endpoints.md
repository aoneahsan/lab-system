# API Endpoints Reference

## Base URL

```
Production: https://api.labflow.com/v1
Staging: https://api-staging.labflow.com/v1
```

## Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

## Patients

### List Patients

```http
GET /patients
```

Query parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by name, MRN, or phone
- `status` (string): Filter by status (active, inactive)

### Get Patient

```http
GET /patients/{id}
```

### Create Patient

```http
POST /patients
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "email": "john.doe@email.com",
  "phone": "(555) 123-4567",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345"
  }
}
```

### Update Patient

```http
PUT /patients/{id}
Content-Type: application/json

{
  "phone": "(555) 987-6543",
  "email": "john.doe.new@email.com"
}
```

## Test Orders

### Create Order

```http
POST /orders
Content-Type: application/json

{
  "patientId": "patient123",
  "tests": ["TEST001", "TEST002"],
  "priority": "routine",
  "clinicalNotes": "Annual checkup",
  "physician": {
    "id": "doc123",
    "name": "Dr. Smith"
  }
}
```

### Get Order

```http
GET /orders/{id}
```

### List Orders

```http
GET /orders?patientId={patientId}&status={status}
```

## Results

### Submit Results

```http
POST /results
Content-Type: application/json

{
  "orderId": "order123",
  "results": [
    {
      "testCode": "TEST001",
      "value": "5.2",
      "unit": "mmol/L",
      "referenceRange": "3.5-5.5",
      "flag": "N"
    }
  ],
  "performedBy": "tech123",
  "performedAt": "2024-01-15T10:30:00Z"
}
```

### Get Results

```http
GET /results?orderId={orderId}
```

## Reports

### Generate Report

```http
POST /reports/generate
Content-Type: application/json

{
  "orderId": "order123",
  "format": "pdf",
  "includeHistory": true
}
```

### Download Report

```http
GET /reports/{reportId}/download
```

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient data",
    "details": {
      "field": "dateOfBirth",
      "reason": "Future date not allowed"
    }
  }
}
```

## Rate Limiting

- 1000 requests per hour per API key
- 100 requests per minute per API key
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Webhooks

### Register Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["order.created", "result.ready"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `order.created`
- `order.updated`
- `result.ready`
- `report.generated`
- `patient.updated`