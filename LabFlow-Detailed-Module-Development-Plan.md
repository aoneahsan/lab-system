# LabFlow - Detailed Module Development Plan

## 1. Authentication & User Management Module

### Features to Include
- Multi-factor authentication (SMS, TOTP, Biometric)
- Role-based access control (RBAC)
- Session management with auto-logout
- Password policies and recovery
- User profile management
- Activity logging and audit trails
- Device management and trusted devices
- SSO integration (Google, Microsoft, SAML)

### NPM Packages
```json
{
  "firebase": "^10.x",
  "react-hook-form": "^7.x",
  "yup": "^1.x",
  "react-otp-input": "^3.x",
  "@capacitor/biometric-auth": "^5.x",
  "react-phone-input-2": "^2.x",
  "date-fns": "^2.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x"
}
```

### Database Collections

#### `tenants/{tenantId}/users`
```javascript
{
  uid: string,
  email: string,
  phoneNumber: string,
  displayName: string,
  photoURL: string,
  role: enum['super_admin', 'lab_admin', 'lab_manager', 'technician', 'phlebotomist', 'doctor', 'patient'],
  permissions: string[],
  isActive: boolean,
  isMFAEnabled: boolean,
  mfaSecret: string, // encrypted
  lastLogin: timestamp,
  loginAttempts: number,
  lockedUntil: timestamp,
  passwordChangedAt: timestamp,
  trustedDevices: [{
    deviceId: string,
    deviceName: string,
    lastUsed: timestamp
  }],
  preferences: {
    language: string,
    timezone: string,
    notifications: object
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
  tenantId: string
}
```

#### `tenants/{tenantId}/audit_logs`
```javascript
{
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  ipAddress: string,
  userAgent: string,
  metadata: object,
  timestamp: timestamp
}
```

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can only access their tenant's data
    match /tenants/{tenantId}/users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         hasRole(['super_admin', 'lab_admin']));
      allow write: if request.auth != null && 
        hasRole(['super_admin', 'lab_admin']);
    }
    
    // Audit logs are read-only except for system
    match /tenants/{tenantId}/audit_logs/{logId} {
      allow read: if request.auth != null && 
        hasRole(['super_admin', 'lab_admin']);
      allow write: if false; // Only through Cloud Functions
    }
  }
}
```

### Admin Panel Features
- User listing with search, filter, and pagination
- User creation and bulk import
- Role and permission management
- Activity monitoring dashboard
- Failed login attempts tracking
- User lockout management
- MFA reset capabilities
- Session management (force logout)

### Completion Requirements
- [ ] All authentication flows implemented (login, logout, password reset)
- [ ] MFA working with SMS and TOTP
- [ ] Biometric authentication on mobile
- [ ] Role-based access control fully functional
- [ ] Audit logging for all critical actions
- [ ] Admin panel with full user management
- [ ] Security testing passed (penetration testing)
- [ ] Performance: Login < 2 seconds
- [ ] 100% test coverage for auth functions

---

## 2. Patient Management Module

### Features to Include
- Patient registration (walk-in and pre-registration)
- Demographic information management
- Medical history tracking
- Insurance information
- Document management (ID, insurance cards)
- Family linking
- Patient portal access
- Appointment scheduling
- Visit history
- Communication preferences
- Consent management

### NPM Packages
```json
{
  "react-table": "^7.x",
  "react-datepicker": "^4.x",
  "react-select": "^5.x",
  "formik": "^2.x",
  "react-dropzone": "^14.x",
  "@capacitor/camera": "^5.x",
  "@capacitor/filesystem": "^5.x",
  "libphonenumber-js": "^1.x",
  "react-avatar-editor": "^13.x",
  "xlsx": "^0.18.x",
  "papaparse": "^5.x"
}
```

### Database Collections

#### `tenants/{tenantId}/patients`
```javascript
{
  patientId: string, // auto-generated
  mrn: string, // Medical Record Number
  demographics: {
    firstName: string,
    lastName: string,
    middleName: string,
    dateOfBirth: timestamp,
    gender: enum['male', 'female', 'other'],
    maritalStatus: string,
    nationality: string,
    nationalId: string,
    passportNumber: string
  },
  contact: {
    phones: [{
      type: enum['mobile', 'home', 'work'],
      number: string,
      isPrimary: boolean
    }],
    emails: [{
      type: enum['personal', 'work'],
      email: string,
      isPrimary: boolean
    }],
    addresses: [{
      type: enum['home', 'work', 'temporary'],
      line1: string,
      line2: string,
      city: string,
      state: string,
      country: string,
      postalCode: string,
      isPrimary: boolean
    }]
  },
  emergency: {
    contactName: string,
    relationship: string,
    phone: string,
    email: string
  },
  insurance: [{
    provider: string,
    policyNumber: string,
    groupNumber: string,
    validFrom: timestamp,
    validTo: timestamp,
    isPrimary: boolean,
    coverageDetails: object
  }],
  medicalInfo: {
    bloodGroup: enum['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    allergies: string[],
    chronicConditions: string[],
    medications: string[],
    previousSurgeries: string[],
    familyHistory: object
  },
  preferences: {
    language: string,
    communicationChannel: enum['sms', 'email', 'whatsapp', 'call'],
    appointmentReminders: boolean,
    marketingConsent: boolean
  },
  familyLinks: [{
    patientId: string,
    relationship: string
  }],
  tags: string[],
  notes: string,
  isActive: boolean,
  isVIP: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
  lastVisit: timestamp,
  totalVisits: number
}
```

#### `tenants/{tenantId}/patient_documents`
```javascript
{
  documentId: string,
  patientId: string,
  type: enum['id_card', 'insurance_card', 'prescription', 'consent', 'other'],
  title: string,
  description: string,
  fileUrl: string,
  fileSize: number,
  mimeType: string,
  thumbnailUrl: string,
  uploadedBy: string,
  uploadedAt: timestamp,
  expiryDate: timestamp,
  isVerified: boolean,
  verifiedBy: string,
  verifiedAt: timestamp,
  tags: string[]
}
```

### Admin Panel Features
- Patient search with advanced filters
- Bulk patient import/export
- Patient merge functionality
- Duplicate detection
- Document verification queue
- Patient communication logs
- Visit analytics
- Demographics analytics dashboard

### Completion Requirements
- [ ] Complete patient registration flow
- [ ] Document upload and management
- [ ] Patient search with filters
- [ ] Family linking functionality
- [ ] Insurance management
- [ ] Patient portal with secure access
- [ ] Mobile app integration for photo capture
- [ ] Bulk import/export functionality
- [ ] HIPAA-compliant data handling
- [ ] Performance: Search results < 1 second

---

## 3. Test Management Module

### Features to Include
- Test catalog management
- Test profiles and panels
- LOINC code integration
- Reference ranges (age/gender specific)
- Sample requirements
- TAT (Turnaround Time) management
- Critical values definition
- Delta check rules
- Test methodology information
- Quality control integration
- Result interpretation rules

### NPM Packages
```json
{
  "ag-grid-react": "^30.x",
  "react-virtualized": "^9.x",
  "fuse.js": "^6.x",
  "lodash": "^4.x",
  "react-json-view": "^1.x",
  "react-hotkeys-hook": "^4.x",
  "react-beautiful-dnd": "^13.x",
  "js-quantities": "^1.x"
}
```

### Database Collections

#### `tenants/{tenantId}/tests`
```javascript
{
  testId: string,
  testCode: string,
  testName: string,
  shortName: string,
  category: enum['hematology', 'biochemistry', 'immunology', 'microbiology', 'molecular', 'pathology'],
  subCategory: string,
  loincCode: string,
  cptCode: string,
  specimen: {
    type: string[], // ['serum', 'plasma', 'whole_blood', 'urine']
    volume: number,
    unit: string,
    container: string,
    storageTemp: string,
    stability: object
  },
  methodology: string,
  tat: {
    routine: number, // hours
    urgent: number,
    stat: number
  },
  referenceRanges: [{
    gender: enum['all', 'male', 'female'],
    ageMin: number,
    ageMax: number,
    ageUnit: enum['days', 'months', 'years'],
    normalMin: number,
    normalMax: number,
    criticalMin: number,
    criticalMax: number,
    unit: string,
    interpretation: string
  }],
  deltaCheck: {
    enabled: boolean,
    percentChange: number,
    absoluteChange: number,
    timeframe: number // hours
  },
  pricing: {
    basePrice: number,
    urgentMultiplier: number,
    statMultiplier: number
  },
  isActive: boolean,
  isOrderable: boolean,
  requiresApproval: boolean,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `tenants/{tenantId}/test_profiles`
```javascript
{
  profileId: string,
  profileCode: string,
  profileName: string,
  category: string,
  description: string,
  tests: [{
    testId: string,
    isRequired: boolean,
    sequence: number
  }],
  specimen: {
    combinedVolume: number,
    instructions: string
  },
  pricing: {
    bundlePrice: number,
    savings: number
  },
  popularityScore: number,
  isActive: boolean,
  tags: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Admin Panel Features
- Test catalog management interface
- Bulk test import from Excel/CSV
- LOINC code mapping tool
- Reference range configuration
- Test profile builder
- Pricing management
- Test utilization analytics
- Quality control charts
- Method validation tracking

### Completion Requirements
- [ ] Complete test catalog with search
- [ ] LOINC integration functional
- [ ] Reference range configuration
- [ ] Test profile management
- [ ] Critical value alerts configured
- [ ] Delta check implementation
- [ ] Pricing rules engine
- [ ] Test methodology documentation
- [ ] Import/export functionality
- [ ] Performance: Catalog search < 500ms

---

## 4. Order Management Module

### Features to Include
- Test ordering interface
- Order sets and favorites
- STAT/Urgent order handling
- Standing orders
- Order approval workflow
- Sample collection scheduling
- Barcode generation
- Order tracking
- Order modification/cancellation
- Reflex testing rules

### NPM Packages
```json
{
  "react-barcode": "^1.x",
  "qrcode.react": "^3.x",
  "jsbarcode": "^3.x",
  "@react-pdf/renderer": "^3.x",
  "react-to-print": "^2.x",
  "socket.io-client": "^4.x",
  "react-use-websocket": "^4.x",
  "rrule": "^2.x"
}
```

### Database Collections

#### `tenants/{tenantId}/orders`
```javascript
{
  orderId: string,
  orderNumber: string, // human-readable
  patientId: string,
  visitId: string,
  orderingProvider: {
    userId: string,
    name: string,
    npi: string,
    department: string
  },
  priority: enum['routine', 'urgent', 'stat'],
  status: enum['pending', 'collected', 'in_process', 'resulted', 'cancelled'],
  tests: [{
    testId: string,
    profileId: string,
    status: string,
    specimen: {
      barcode: string,
      collectedAt: timestamp,
      collectedBy: string
    },
    notes: string
  }],
  diagnosis: string[],
  clinicalHistory: string,
  fastingStatus: boolean,
  collectionInfo: {
    scheduledAt: timestamp,
    location: string,
    instructions: string,
    phlebotomistId: string
  },
  samples: [{
    sampleId: string,
    barcode: string,
    status: string
  }],
  billing: {
    status: enum['pending', 'authorized', 'billed', 'paid'],
    authorizationCode: string,
    amount: number
  },
  timestamps: {
    ordered: timestamp,
    collected: timestamp,
    received: timestamp,
    resulted: timestamp
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string
}
```

#### `tenants/{tenantId}/order_sets`
```javascript
{
  setId: string,
  name: string,
  category: string,
  description: string,
  tests: [string], // test IDs
  profiles: [string], // profile IDs
  diagnosis: string[],
  instructions: string,
  department: string,
  isPublic: boolean,
  createdBy: string,
  usageCount: number,
  lastUsed: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Admin Panel Features
- Order dashboard with real-time status
- Pending orders queue
- TAT monitoring
- Order volume analytics
- Provider ordering patterns
- Cancellation reasons analysis
- Sample rejection tracking
- Order set management

### Completion Requirements
- [ ] Complete order entry workflow
- [ ] Barcode generation and printing
- [ ] Real-time order tracking
- [ ] STAT order notifications
- [ ] Order modification workflow
- [ ] Standing orders functionality
- [ ] Order sets management
- [ ] Mobile order entry
- [ ] Integration with sample tracking
- [ ] Performance: Order submission < 1 second

---

## 5. Sample Management Module

### Features to Include
- Sample collection workflow
- Barcode scanning and generation
- Chain of custody tracking
- Sample storage management
- Aliquoting and splitting
- Sample rejection handling
- Temperature monitoring
- Sample disposal tracking
- Batch processing
- Sample query and retrieval

### NPM Packages
```json
{
  "@capacitor/barcode-scanner": "^4.x",
  "react-qr-scanner": "^1.x",
  "html5-qrcode": "^2.x",
  "react-thermal-printer": "^0.x",
  "moment-timezone": "^0.5.x",
  "react-countdown": "^2.x",
  "react-timeline-range-slider": "^1.x"
}
```

### Database Collections

#### `tenants/{tenantId}/samples`
```javascript
{
  sampleId: string,
  barcode: string,
  orderId: string,
  patientId: string,
  type: string,
  volume: number,
  unit: string,
  container: string,
  status: enum['pending', 'collected', 'in_transit', 'received', 'processing', 'stored', 'disposed'],
  priority: enum['routine', 'urgent', 'stat'],
  collectionInfo: {
    collectedAt: timestamp,
    collectedBy: string,
    location: string,
    temperature: number,
    notes: string
  },
  chainOfCustody: [{
    action: string,
    performedBy: string,
    timestamp: timestamp,
    location: string,
    temperature: number,
    notes: string
  }],
  storage: {
    location: string,
    rack: string,
    position: string,
    temperature: number,
    enteredAt: timestamp
  },
  aliquots: [{
    aliquotId: string,
    barcode: string,
    volume: number,
    purpose: string,
    location: string
  }],
  rejection: {
    isRejected: boolean,
    reason: string,
    rejectedBy: string,
    rejectedAt: timestamp
  },
  disposal: {
    isDisposed: boolean,
    method: string,
    disposedBy: string,
    disposedAt: timestamp
  },
  expiryDate: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `tenants/{tenantId}/storage_locations`
```javascript
{
  locationId: string,
  name: string,
  type: enum['freezer', 'refrigerator', 'room_temp', 'incubator'],
  temperature: {
    target: number,
    min: number,
    max: number,
    current: number,
    unit: string
  },
  capacity: {
    total: number,
    used: number,
    unit: string
  },
  layout: {
    racks: number,
    shelves: number,
    positions: number
  },
  mapping: object, // 3D position mapping
  alerts: [{
    type: string,
    threshold: number,
    recipients: [string]
  }],
  maintenanceSchedule: object,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Admin Panel Features
- Sample tracking dashboard
- Real-time location monitoring
- Temperature monitoring alerts
- Sample rejection analytics
- Storage utilization reports
- Chain of custody reports
- Expiry management
- Disposal records

### Completion Requirements
- [ ] Barcode scanning on mobile/web
- [ ] Complete chain of custody
- [ ] Storage location management
- [ ] Temperature monitoring integration
- [ ] Sample rejection workflow
- [ ] Aliquoting functionality
- [ ] Batch operations support
- [ ] Sample query interface
- [ ] Mobile collection app
- [ ] Performance: Barcode scan < 500ms

---

## 6. Result Entry & Validation Module

### Features to Include
- Manual result entry
- Instrument interface integration
- Auto-verification rules
- Delta check validation
- Critical value alerts
- Reference range flagging
- Result review workflow
- Amendment handling
- History tracking
- Batch result entry

### NPM Packages
```json
{
  "react-spreadsheet": "^0.x",
  "handsontable": "^12.x",
  "react-datasheet": "^1.x",
  "joi": "^17.x",
  "decimal.js": "^10.x",
  "mathjs": "^11.x",
  "react-hotkeys": "^2.x",
  "diff": "^5.x"
}
```

### Database Collections

#### `tenants/{tenantId}/results`
```javascript
{
  resultId: string,
  orderId: string,
  testId: string,
  patientId: string,
  sampleId: string,
  value: {
    numeric: number,
    text: string,
    structured: object,
    unit: string
  },
  referenceRange: {
    low: number,
    high: number,
    criticalLow: number,
    criticalHigh: number
  },
  flags: enum['normal', 'high', 'low', 'critical_high', 'critical_low', 'abnormal'],
  status: enum['pending', 'preliminary', 'final', 'corrected', 'cancelled'],
  verificationStatus: enum['unverified', 'auto_verified', 'manually_verified', 'rejected'],
  verifiedBy: string,
  verifiedAt: timestamp,
  instrument: {
    id: string,
    name: string,
    runId: string
  },
  qcStatus: {
    passed: boolean,
    details: object
  },
  deltaCheck: {
    performed: boolean,
    previousValue: number,
    percentChange: number,
    flagged: boolean
  },
  criticalAlert: {
    sent: boolean,
    sentTo: string,
    sentAt: timestamp,
    acknowledged: boolean,
    acknowledgedBy: string
  },
  amendments: [{
    reason: string,
    previousValue: any,
    amendedBy: string,
    amendedAt: timestamp
  }],
  comments: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  resultedAt: timestamp,
  tat: number // minutes
}
```

#### `tenants/{tenantId}/verification_rules`
```javascript
{
  ruleId: string,
  name: string,
  testId: string,
  conditions: [{
    field: string,
    operator: enum['equals', 'greater', 'less', 'between', 'in'],
    value: any
  }],
  actions: [{
    type: enum['auto_verify', 'flag_review', 'critical_alert', 'hold'],
    parameters: object
  }],
  priority: number,
  isActive: boolean,
  appliedCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Admin Panel Features
- Result verification queue
- Auto-verification rule builder
- Critical value monitoring
- TAT analysis by test
- Amendment tracking
- Delta check configuration
- Result statistics dashboard
- Instrument interface monitoring

### Completion Requirements
- [ ] Manual result entry interface
- [ ] Auto-verification engine
- [ ] Delta check implementation
- [ ] Critical value notifications
- [ ] Result amendment workflow
- [ ] Batch result entry
- [ ] History comparison view
- [ ] Instrument integration
- [ ] QC integration
- [ ] Performance: Result save < 500ms

---

## 7. Reporting Module

### Features to Include
- Report template designer
- Multi-format support (PDF, HL7, Excel)
- Digital signatures
- Report delivery management
- Cumulative reports
- Graphical reports
- Trend analysis
- Report authorization workflow
- Addendum handling
- Batch printing

### NPM Packages
```json
{
  "@react-pdf/renderer": "^3.x",
  "pdfmake": "^0.2.x",
  "jspdf": "^2.x",
  "react-signature-canvas": "^1.x",
  "chart.js": "^4.x",
  "react-chartjs-2": "^5.x",
  "html2canvas": "^1.x",
  "docx": "^8.x",
  "file-saver": "^2.x",
  "jszip": "^3.x"
}
```

### Database Collections

#### `tenants/{tenantId}/reports`
```javascript
{
  reportId: string,
  reportNumber: string,
  orderId: string,
  patientId: string,
  templateId: string,
  status: enum['draft', 'preliminary', 'final', 'amended', 'cancelled'],
  format: enum['pdf', 'hl7', 'excel', 'json'],
  content: {
    header: object,
    results: [object],
    footer: object,
    comments: string
  },
  authorization: {
    isAuthorized: boolean,
    authorizedBy: string,
    authorizedAt: timestamp,
    digitalSignature: string
  },
  delivery: {
    method: enum['portal', 'email', 'sms', 'print', 'fax'],
    status: enum['pending', 'sent', 'delivered', 'failed'],
    sentAt: timestamp,
    deliveredAt: timestamp,
    recipient: string
  },
  addendums: [{
    content: string,
    reason: string,
    addedBy: string,
    addedAt: timestamp
  }],
  audit: [{
    action: string,
    performedBy: string,
    timestamp: timestamp
  }],
  createdAt: timestamp,
  updatedAt: timestamp,
  finalizedAt: timestamp
}
```

#### `tenants/{tenantId}/report_templates`
```javascript
{
  templateId: string,
  name: string,
  category: string,
  format: string,
  layout: {
    pageSize: string,
    orientation: string,
    margins: object,
    header: object,
    body: object,
    footer: object
  },
  styles: object,
  variables: [string],
  isDefault: boolean,
  usageCount: number,
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Admin Panel Features
- Report template designer
- Report queue management
- Delivery status monitoring
- Failed delivery handling
- Report analytics
- Template usage statistics
- Signature management
- Audit trail viewer

### Completion Requirements
- [ ] Report template designer
- [ ] PDF generation with logos
- [ ] Digital signature integration
- [ ] Multi-channel delivery
- [ ] HL7 message generation
- [ ] Cumulative reports
- [ ] Graphical elements support
- [ ] Batch report generation
- [ ] Report authorization workflow
- [ ] Performance: PDF generation < 2 seconds

---

## 8. Billing & Finance Module

### Features to Include
- Test pricing management
- Insurance processing
- Payment collection
- Invoice generation
- Payment plans
- Discount management
- Corporate billing
- Financial reporting
- Outstanding balance tracking
- Refund processing

### NPM Packages
```json
{
  "stripe": "^14.x",
  "react-stripe-js": "^2.x",
  "@stripe/stripe-js": "^2.x",
  "react-credit-cards-2": "^1.x",
  "currency.js": "^2.x",
  "accounting": "^0.x",
  "invoice-generator": "^1.x",
  "react-financial-charts": "^1.x"
}
```

### Database Collections

#### `tenants/{tenantId}/billing`
```javascript
{
  billId: string,
  billNumber: string,
  patientId: string,
  orderId: string,
  type: enum['patient', 'insurance', 'corporate'],
  status: enum['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled'],
  items: [{
    testId: string,
    description: string,
    quantity: number,
    unitPrice: number,
    discount: number,
    tax: number,
    total: number
  }],
  totals: {
    subtotal: number,
    discount: number,
    tax: number,
    total: number,
    paid: number,
    balance: number
  },
  insurance: {
    provider: string,
    policyNumber: string,
    authorizationCode: string,
    coverageAmount: number,
    copay: number,
    deductible: number
  },
  payments: [{
    paymentId: string,
    amount: number,
    method: enum['cash', 'card', 'check', 'online', 'insurance'],
    reference: string,
    receivedAt: timestamp,
    receivedBy: string
  }],
  dueDate: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `tenants/{tenantId}/payment_transactions`
```javascript
{
  transactionId: string,
  billId: string,
  patientId: string,
  amount: number,
  method: enum['cash', 'card', 'check', 'online', 'insurance'],
  status: enum['pending', 'completed', 'failed', 'refunded'],
  gateway: {
    provider: string,
    transactionId: string,
    authCode: string,
    response: object
  },
  refund: {
    amount: number,
    reason: string,
    refundedAt: timestamp,
    refundedBy: string
  },
  metadata: object,
  createdAt: timestamp,
  processedAt: timestamp
}
```

### Admin Panel Features
- Billing dashboard
- Payment processing
- Insurance claim management
- Outstanding balance reports
- Revenue analytics
- Discount approval workflow
- Refund management
- Financial reports
- Payment reconciliation

### Completion Requirements
- [ ] Complete billing workflow
- [ ] Stripe payment integration
- [ ] Insurance claim processing
- [ ] Invoice generation
- [ ] Payment receipt printing
- [ ] Outstanding balance tracking
- [ ] Corporate billing accounts
- [ ] Financial reporting suite
- [ ] Refund processing
- [ ] Performance: Payment processing < 3 seconds

---

## 9. Inventory Management Module

### Features to Include
- Item master management
- Stock tracking
- Purchase orders
- Vendor management
- Expiry tracking
- Reorder alerts
- Stock movement tracking
- Lot number tracking
- Stock valuation
- Consumption analytics

### NPM Packages
```json
{
  "react-select": "^5.x",
  "react-datepicker": "^4.x",
  "recharts": "^2.x",
  "react-big-calendar": "^1.x",
  "react-notifications-component": "^4.x",
  "uuid": "^9.x",
  "numeral": "^2.x"
}
```

### Database Collections

#### `tenants/{tenantId}/inventory_items`
```javascript
{
  itemId: string,
  itemCode: string,
  name: string,
  category: string,
  type: enum['reagent', 'consumable', 'equipment', 'other'],
  unit: string,
  manufacturer: string,
  supplier: string,
  reorderLevel: number,
  reorderQuantity: number,
  leadTime: number, // days
  storage: {
    temperature: string,
    location: string,
    conditions: string
  },
  currentStock: number,
  reservedStock: number,
  availableStock: number,
  avgMonthlyUsage: number,
  lastPurchasePrice: number,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `tenants/{tenantId}/stock_transactions`
```javascript
{
  transactionId: string,
  type: enum['receipt', 'issue', 'adjustment', 'transfer', 'disposal'],
  itemId: string,
  quantity: number,
  lotNumber: string,
  expiryDate: timestamp,
  unitCost: number,
  totalCost: number,
  reason: string,
  reference: {
    type: enum['po', 'test', 'adjustment', 'transfer'],
    id: string
  },
  performedBy: string,
  approvedBy: string,
  location: string,
  balanceBefore: number,
  balanceAfter: number,
  createdAt: timestamp
}
```

### Admin Panel Features
- Inventory dashboard
- Stock level monitoring
- Expiry alerts calendar
- Purchase order management
- Vendor performance tracking
- Consumption trends
- Stock valuation reports
- Reorder suggestions
- Lot tracking interface

### Completion Requirements
- [ ] Item master management
- [ ] Stock transaction recording
- [ ] Expiry date tracking
- [ ] Reorder alert system
- [ ] Purchase order workflow
- [ ] Barcode scanning for stock
- [ ] Lot number tracking
- [ ] Stock reports
- [ ] Mobile stock taking
- [ ] Performance: Stock update < 1 second

---

## 10. Equipment Integration Module

### Features to Include
- Instrument interface setup
- Bidirectional communication
- Result mapping
- QC data integration
- Instrument status monitoring
- Maintenance scheduling
- Error log tracking
- Protocol management
- Middleware configuration
- LIS interface testing

### NPM Packages
```json
{
  "serialport": "^12.x",
  "node-hl7-client": "^2.x",
  "socket.io-client": "^4.x",
  "mqtt": "^5.x",
  "node-opcua": "^2.x",
  "modbus-serial": "^8.x",
  "xml2js": "^0.6.x",
  "hl7-standard": "^3.x"
}
```

### Database Collections

#### `tenants/{tenantId}/instruments`
```javascript
{
  instrumentId: string,
  name: string,
  model: string,
  manufacturer: string,
  serialNumber: string,
  type: string,
  location: string,
  interface: {
    protocol: enum['hl7', 'astm', 'custom', 'api'],
    connectionType: enum['serial', 'tcp', 'file', 'api'],
    settings: {
      host: string,
      port: number,
      baudRate: number,
      filePath: string,
      polling: boolean,
      interval: number
    }
  },
  mapping: [{
    instrumentCode: string,
    testId: string,
    unit: string,
    conversion: object
  }],
  status: {
    isOnline: boolean,
    lastCommunication: timestamp,
    lastError: string,
    uptime: number
  },
  maintenance: {
    lastService: timestamp,
    nextService: timestamp,
    schedule: object
  },
  qc: {
    enabled: boolean,
    frequency: string,
    lastRun: timestamp
  },
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `tenants/{tenantId}/interface_logs`
```javascript
{
  logId: string,
  instrumentId: string,
  direction: enum['inbound', 'outbound'],
  messageType: string,
  rawMessage: string,
  parsedMessage: object,
  status: enum['success', 'error', 'warning'],
  error: string,
  processedAt: timestamp,
  processingTime: number
}
```

### Admin Panel Features
- Instrument dashboard
- Interface configuration
- Message log viewer
- Error analysis
- Mapping configuration
- QC data monitoring
- Maintenance calendar
- Performance metrics
- Protocol testing tools

### Completion Requirements
- [ ] HL7 interface implementation
- [ ] ASTM protocol support
- [ ] Bidirectional communication
- [ ] Result auto-import
- [ ] QC data integration
- [ ] Error handling and retry
- [ ] Message logging
- [ ] Instrument status monitoring
- [ ] Maintenance tracking
- [ ] Performance: Message processing < 200ms

---

## 11. Quality Control Module

### Features to Include
- QC sample management
- Levey-Jennings charts
- Westgard rules
- Multi-rule QC
- QC review and approval
- Corrective action tracking
- QC report generation
- Peer group comparison
- QC schedule management
- Lot-to-lot comparison

### NPM Packages
```json
{
  "react-plotly.js": "^2.x",
  "plotly.js": "^2.x",
  "simple-statistics": "^7.x",
  "d3": "^7.x",
  "react-d3-components": "^0.x",
  "statistical-js": "^1.x",
  "jstat": "^1.x"
}
```

### Database Collections

#### `tenants/{tenantId}/qc_lots`
```javascript
{
  lotId: string,
  lotNumber: string,
  manufacturer: string,
  level: enum['low', 'normal', 'high'],
  testId: string,
  targetMean: number,
  targetSD: number,
  acceptableRange: {
    low: number,
    high: number
  },
  expiryDate: timestamp,
  openedDate: timestamp,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `tenants/{tenantId}/qc_results`
```javascript
{
  qcId: string,
  lotId: string,
  testId: string,
  instrumentId: string,
  runNumber: number,
  value: number,
  mean: number,
  sd: number,
  cv: number,
  zScore: number,
  status: enum['accept', 'warning', 'reject'],
  westgardRules: [{
    rule: string,
    violated: boolean
  }],
  action: {
    required: boolean,
    taken: string,
    takenBy: string,
    takenAt: timestamp
  },
  review: {
    reviewedBy: string,
    reviewedAt: timestamp,
    comments: string
  },
  runAt: timestamp,
  createdAt: timestamp
}
```

### Admin Panel Features
- QC dashboard
- Real-time QC monitoring
- Levey-Jennings charts
- Westgard rule configuration
- QC failure alerts
- Corrective action tracking
- Monthly QC reports
- Peer group analytics
- QC performance metrics

### Completion Requirements
- [ ] QC lot management
- [ ] QC result entry
- [ ] Levey-Jennings charts
- [ ] Westgard rules engine
- [ ] QC review workflow
- [ ] Corrective action tracking
- [ ] QC schedule alerts
- [ ] Statistical calculations
- [ ] QC report generation
- [ ] Performance: Chart rendering < 1 second

---

## 12. Mobile Applications (Capacitor)

### Patient Mobile App Features
```javascript
// Key Capacitor Plugins
{
  "@capacitor/app": "^5.x",
  "@capacitor/camera": "^5.x",
  "@capacitor/filesystem": "^5.x",
  "@capacitor/geolocation": "^5.x",
  "@capacitor/push-notifications": "^5.x",
  "@capacitor/biometric-auth": "^5.x",
  "@capacitor/barcode-scanner": "^4.x"
}

// Features
- Appointment booking with calendar
- Test results with PDF viewer
- Report download and sharing
- Payment integration
- Family member management
- Lab location finder with maps
- Push notifications
- Biometric login
- Document upload
- Health records timeline
```

### Phlebotomist Mobile App Features
```javascript
// Additional Capacitor Plugins
{
  "@capacitor/network": "^7.x",
  "@capacitor/preference": "^7.x",
  "@capacitor-community/sqlite": "^5.x",
  "@capacitor/local-notifications": "^7.x"
}

// Features
- Route optimization with maps
- Offline sample collection
- Barcode scanning
- Patient verification
- Digital consent capture
- GPS tracking
- Sample temperature logging
- Collection checklist
- Photo capture for documents
- Sync when online
```

### Lab Staff Mobile App Features
```javascript
// Features
- Sample receiving
- Result entry
- Instrument readings
- QC data entry
- Inventory counting
- Equipment maintenance logs
- Critical value alerts
- Shift handover notes
- Document scanning
- Voice-to-text notes
```

### Completion Requirements
- [ ] All apps working on iOS/Android
- [ ] Offline functionality tested
- [ ] Push notifications working
- [ ] Biometric authentication
- [ ] Camera and file access
- [ ] GPS tracking accurate
- [ ] Barcode scanning reliable
- [ ] Data sync tested
- [ ] App performance optimized
- [ ] Store submission ready

---

## Admin Panel Universal Features

### Dashboard Components
```javascript
// NPM Packages for Admin
{
  "react-admin": "^4.x",
  "material-ui": "^5.x",
  "notistack": "^3.x",
  "react-helmet": "^6.x",
  "react-ga4": "^2.x"
}

// Universal Admin Features
- Real-time statistics
- User activity monitoring
- System health checks
- Audit trail viewer
- Report builder
- Export functionality
- Notification center
- Settings management
- Help documentation
- Multi-language support
```

### Security Features
- IP whitelisting
- 2FA enforcement
- Session monitoring
- Permission management
- API key management
- Security logs
- Compliance reports
- Data encryption status
- Backup monitoring

---

## Global NPM Packages

### Core Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "typescript": "^5.x",
  "firebase": "^10.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "react-query": "^3.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "react-hook-form": "^7.x",
  "yup": "^1.x",
  "@hookform/resolvers": "^3.x",
  "tailwindcss": "^3.x",
  "@headlessui/react": "^1.x",
  "react-hot-toast": "^2.x",
  "swr": "^2.x"
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-react": "^4.x",
  "vite": "^5.x",
  "eslint": "^8.x",
  "prettier": "^3.x",
  "@testing-library/react": "^14.x",
  "vitest": "^1.x",
  "@cypress/react": "^8.x",
  "husky": "^8.x",
  "lint-staged": "^15.x"
}
```

---

## Performance Requirements

### Web Application
- Page load time < 3 seconds
- Time to interactive < 5 seconds
- API response time < 1 second
- Search results < 500ms
- Report generation < 5 seconds

### Mobile Applications
- App launch < 2 seconds
- Screen transitions < 300ms
- Offline mode seamless
- Background sync efficient
- Battery usage optimized

### Database Performance
- Query response < 100ms
- Write operations < 500ms
- Real-time updates < 1 second
- Batch operations optimized
- Indexes properly configured