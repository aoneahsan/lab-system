# LabFlow API Documentation

## Overview

LabFlow uses Firebase Functions for serverless API endpoints. All APIs follow RESTful conventions.

## Base URL

- Production: `https://us-central1-[PROJECT-ID].cloudfunctions.net/api`
- Development: `http://localhost:5001/[PROJECT-ID]/us-central1/api`

## Authentication

All API requests require Firebase Authentication. Include the ID token in the Authorization header:

```
Authorization: Bearer [ID_TOKEN]
```

## Core Endpoints

### Patients

- `GET /patients` - List patients
- `GET /patients/:id` - Get patient details
- `POST /patients` - Create patient
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Tests

- `GET /tests` - List available tests
- `GET /tests/:id` - Get test details
- `POST /test-orders` - Create test order
- `PUT /test-orders/:id` - Update test order

### Results

- `GET /results` - List results
- `GET /results/:id` - Get result details
- `POST /results` - Submit result
- `PUT /results/:id` - Update result
- `POST /results/:id/validate` - Validate result

### Reports

- `GET /reports/generate` - Generate report
- `GET /reports/templates` - List templates
- `POST /reports/schedule` - Schedule report

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error