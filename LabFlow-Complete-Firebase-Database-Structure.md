# LabFlow - Complete Firebase Database Structure

## Root Level Collections

### 1. System Configuration
```javascript
// Collection: system_config
{
  documentId: "config",
  features: {
    sms_enabled: boolean,
    whatsapp_enabled: boolean,
    email_enabled: boolean,
    payment_gateway: string,
    supported_languages: string[],
    default_currency: string,
    default_timezone: string
  },
  maintenance: {
    enabled: boolean,
    message: string,
    scheduled_at: timestamp
  },
  version: string,
  updated_at: timestamp
}

// Collection: feature_flags
{
  flagId: string,
  name: string,
  description: string,
  enabled: boolean,
  rollout_percentage: number,
  tenant_overrides: {
    [tenantId]: boolean
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

### 2. Subscription Plans
```javascript
// Collection: subscription_plans
{
  planId: string,
  name: string, // "starter", "professional", "enterprise"
  display_name: string,
  price: {
    monthly: number,
    yearly: number,
    currency: string
  },
  features: {
    max_users: number,
    max_patients: number,
    max_tests_per_month: number,
    api_access: boolean,
    custom_branding: boolean,
    advanced_analytics: boolean,
    priority_support: boolean,
    data_retention_days: number
  },
  modules: {
    patient_portal: boolean,
    inventory_management: boolean,
    equipment_integration: boolean,
    mobile_apps: boolean,
    api_access: boolean
  },
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Tenant-Specific Collections

### 3. Tenant Management
```javascript
// Collection: tenants
{
  tenantId: string,
  organization: {
    name: string,
    type: enum['hospital', 'clinic', 'diagnostic_center', 'collection_center'],
    registration_number: string,
    tax_id: string,
    logo_url: string
  },
  contact: {
    address: {
      line1: string,
      line2: string,
      city: string,
      state: string,
      country: string,
      postal_code: string
    },
    phone: string,
    email: string,
    website: string
  },
  subscription: {
    plan_id: string,
    status: enum['trial', 'active', 'suspended', 'cancelled'],
    started_at: timestamp,
    expires_at: timestamp,
    trial_ends_at: timestamp,
    payment_method: string,
    billing_cycle: enum['monthly', 'yearly']
  },
  settings: {
    locale: string,
    timezone: string,
    currency: string,
    date_format: string,
    time_format: string,
    working_hours: object,
    report_settings: object
  },
  usage: {
    users_count: number,
    patients_count: number,
    tests_this_month: number,
    storage_used_mb: number,
    api_calls_this_month: number
  },
  compliance: {
    hipaa_compliant: boolean,
    baa_signed: boolean,
    data_processing_agreement: boolean,
    last_audit_date: timestamp
  },
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### 4. User Management
```javascript
// Collection: tenants/{tenantId}/users
{
  userId: string,
  auth_uid: string, // Firebase Auth UID
  employee_id: string,
  personal_info: {
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    photo_url: string,
    date_of_birth: timestamp,
    gender: enum['male', 'female', 'other']
  },
  role: enum['super_admin', 'lab_admin', 'lab_manager', 'lab_technician', 'phlebotomist', 'receptionist', 'billing_staff', 'doctor'],
  permissions: {
    modules: {
      patients: ['view', 'create', 'edit', 'delete'],
      orders: ['view', 'create', 'edit', 'cancel'],
      results: ['view', 'entry', 'verify', 'amend'],
      reports: ['view', 'authorize', 'print', 'email'],
      billing: ['view', 'create', 'edit', 'refund'],
      inventory: ['view', 'manage', 'order'],
      settings: ['view', 'edit']
    },
    special_permissions: string[]
  },
  departments: string[],
  qualifications: [{
    degree: string,
    institution: string,
    year: number
  }],
  licenses: [{
    type: string,
    number: string,
    issuing_authority: string,
    expiry_date: timestamp
  }],
  working_hours: {
    [day: string]: {
      start: string,
      end: string,
      is_working: boolean
    }
  },
  security: {
    mfa_enabled: boolean,
    mfa_method: enum['sms', 'totp', 'email'],
    password_changed_at: timestamp,
    must_change_password: boolean,
    failed_login_attempts: number,
    locked_until: timestamp
  },
  preferences: {
    language: string,
    theme: enum['light', 'dark', 'system'],
    notifications: {
      email: boolean,
      sms: boolean,
      push: boolean,
      desktop: boolean
    },
    dashboard_widgets: string[]
  },
  is_active: boolean,
  last_login: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string
}
```

### 5. Patient Management
```javascript
// Collection: tenants/{tenantId}/patients
{
  patientId: string,
  mrn: string, // Medical Record Number
  external_id: string, // For integration
  demographics: {
    first_name: string,
    middle_name: string,
    last_name: string,
    date_of_birth: timestamp,
    age: {
      years: number,
      months: number,
      days: number
    },
    gender: enum['male', 'female', 'other'],
    marital_status: enum['single', 'married', 'divorced', 'widowed'],
    nationality: string,
    ethnicity: string,
    preferred_language: string
  },
  identification: {
    national_id: string,
    passport_number: string,
    driver_license: string,
    ssn: string // encrypted
  },
  contact: {
    phones: [{
      type: enum['mobile', 'home', 'work'],
      country_code: string,
      number: string,
      is_primary: boolean,
      is_whatsapp: boolean
    }],
    emails: [{
      type: enum['personal', 'work'],
      email: string,
      is_primary: boolean
    }],
    addresses: [{
      type: enum['home', 'work', 'temporary'],
      line1: string,
      line2: string,
      city: string,
      state: string,
      country: string,
      postal_code: string,
      latitude: number,
      longitude: number,
      is_primary: boolean
    }]
  },
  emergency_contact: {
    name: string,
    relationship: string,
    phone: string,
    email: string,
    address: string
  },
  medical_info: {
    blood_group: enum['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    allergies: [{
      type: enum['drug', 'food', 'environmental'],
      allergen: string,
      severity: enum['mild', 'moderate', 'severe'],
      reaction: string
    }],
    chronic_conditions: string[],
    current_medications: [{
      name: string,
      dosage: string,
      frequency: string,
      started_date: timestamp
    }],
    surgical_history: [{
      procedure: string,
      date: timestamp,
      hospital: string
    }],
    family_history: [{
      relation: string,
      condition: string
    }],
    immunizations: [{
      vaccine: string,
      date: timestamp,
      next_due: timestamp
    }]
  },
  insurance: [{
    provider: string,
    policy_number: string,
    group_number: string,
    policy_holder: {
      name: string,
      relationship: string,
      dob: timestamp
    },
    valid_from: timestamp,
    valid_to: timestamp,
    coverage_percentage: number,
    is_primary: boolean
  }],
  employer: {
    company: string,
    employee_id: string,
    department: string,
    designation: string
  },
  preferences: {
    communication_channel: enum['sms', 'email', 'whatsapp', 'phone'],
    appointment_reminders: boolean,
    result_notifications: boolean,
    marketing_consent: boolean,
    data_sharing_consent: boolean
  },
  portal_access: {
    is_enabled: boolean,
    username: string,
    last_login: timestamp,
    password_reset_required: boolean
  },
  family_links: [{
    patient_id: string,
    relationship: enum['spouse', 'child', 'parent', 'sibling', 'other'],
    is_primary_contact: boolean,
    has_access_permission: boolean
  }],
  tags: string[],
  custom_fields: object,
  vip_status: {
    is_vip: boolean,
    level: enum['gold', 'platinum', 'diamond'],
    notes: string
  },
  statistics: {
    first_visit: timestamp,
    last_visit: timestamp,
    total_visits: number,
    total_tests: number,
    total_spent: number,
    outstanding_balance: number
  },
  is_active: boolean,
  is_deleted: boolean,
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string
}
```

### 6. Test Catalog
```javascript
// Collection: tenants/{tenantId}/tests
{
  testId: string,
  test_code: string,
  test_name: string,
  short_name: string,
  alternate_names: string[],
  category: enum['hematology', 'biochemistry', 'immunology', 'microbiology', 'molecular', 'cytology', 'histopathology', 'radiology'],
  sub_category: string,
  department: string,
  loinc_code: string,
  cpt_codes: string[],
  specimen_requirements: [{
    specimen_type: enum['blood', 'serum', 'plasma', 'urine', 'stool', 'sputum', 'csf', 'tissue', 'swab'],
    container: {
      type: string,
      color: string,
      volume: number,
      unit: string
    },
    minimum_volume: number,
    collection_instructions: string,
    storage_temperature: enum['room', 'refrigerated', 'frozen'],
    stability: {
      room_temp_hours: number,
      refrigerated_days: number,
      frozen_days: number
    }
  }],
  methodology: {
    name: string,
    principle: string,
    instrument: string
  },
  turnaround_time: {
    routine_hours: number,
    urgent_hours: number,
    stat_minutes: number
  },
  reference_ranges: [{
    gender: enum['all', 'male', 'female'],
    age_from: number,
    age_to: number,
    age_unit: enum['days', 'months', 'years'],
    normal_range: {
      low: number,
      high: number,
      text: string
    },
    critical_values: {
      low: number,
      high: number
    },
    unit: string,
    interpretation_guide: string
  }],
  components: [{ // For panel tests
    test_id: string,
    is_reportable: boolean,
    sequence: number
  }],
  clinical_significance: string,
  patient_preparation: string,
  interfering_factors: string[],
  related_tests: string[],
  icd10_codes: string[],
  billing: {
    base_price: number,
    urgent_surcharge_percent: number,
    stat_surcharge_percent: number,
    insurance_codes: object
  },
  quality_control: {
    requires_qc: boolean,
    qc_frequency: string,
    acceptable_cv_percent: number
  },
  regulatory: {
    fda_approved: boolean,
    cap_approved: boolean,
    clia_complexity: enum['waived', 'moderate', 'high']
  },
  is_orderable: boolean,
  requires_approval: boolean,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string
}
```

### 7. Orders and Samples
```javascript
// Collection: tenants/{tenantId}/orders
{
  orderId: string,
  order_number: string, // Human readable
  patient_id: string,
  visit_id: string,
  order_type: enum['routine', 'urgent', 'stat'],
  status: enum['pending', 'collected', 'in_process', 'partial', 'completed', 'cancelled'],
  ordering_physician: {
    user_id: string,
    name: string,
    npi: string,
    contact: string
  },
  clinical_info: {
    diagnosis: string[],
    icd10_codes: string[],
    clinical_history: string,
    medications: string[],
    fasting_status: enum['fasting', 'non_fasting', 'unknown'],
    pregnancy_status: enum['not_pregnant', 'pregnant', 'unknown'],
    additional_notes: string
  },
  tests: [{
    test_id: string,
    profile_id: string,
    priority: enum['routine', 'urgent', 'stat'],
    status: enum['pending', 'collected', 'in_process', 'resulted', 'cancelled'],
    specimen: {
      type: string,
      barcode: string,
      collected: boolean
    },
    special_instructions: string
  }],
  specimens: [{
    specimen_id: string,
    barcode: string,
    type: string,
    status: enum['pending', 'collected', 'received', 'processing', 'stored'],
    tests: string[] // test IDs
  }],
  collection: {
    type: enum['walk_in', 'home_collection', 'clinic'],
    scheduled_date: timestamp,
    scheduled_time_slot: string,
    location: {
      type: enum['lab', 'home', 'clinic'],
      address: string,
      latitude: number,
      longitude: number
    },
    phlebotomist_id: string,
    collected_at: timestamp,
    collection_notes: string
  },
  billing: {
    total_amount: number,
    paid_amount: number,
    payment_status: enum['pending', 'partial', 'paid', 'refunded'],
    invoice_number: string,
    discount_amount: number,
    discount_reason: string
  },
  results_delivery: {
    method: enum['portal', 'email', 'sms', 'print', 'courier'],
    email: string,
    phone: string,
    address: string,
    delivery_status: enum['pending', 'sent', 'delivered']
  },
  timeline: {
    ordered_at: timestamp,
    collected_at: timestamp,
    received_at: timestamp,
    processing_started_at: timestamp,
    resulted_at: timestamp,
    reported_at: timestamp,
    delivered_at: timestamp
  },
  tat_monitoring: {
    expected_tat_hours: number,
    actual_tat_hours: number,
    is_delayed: boolean,
    delay_reason: string
  },
  is_cancelled: boolean,
  cancellation: {
    reason: string,
    cancelled_by: string,
    cancelled_at: timestamp
  },
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string
}

// Collection: tenants/{tenantId}/samples
{
  sampleId: string,
  barcode: string,
  order_id: string,
  patient_id: string,
  specimen_type: string,
  container_type: string,
  status: enum['registered', 'collected', 'in_transit', 'received', 'accepted', 'rejected', 'processing', 'completed', 'stored', 'disposed'],
  priority: enum['routine', 'urgent', 'stat'],
  tests: string[], // Test IDs
  volumes: {
    collected_ml: number,
    remaining_ml: number,
    minimum_required_ml: number
  },
  collection: {
    collected_by: string,
    collected_at: timestamp,
    location: string,
    temperature_celsius: number,
    collection_notes: string
  },
  transport: {
    courier_id: string,
    pickup_time: timestamp,
    temperature_maintained: boolean,
    transport_duration_minutes: number
  },
  reception: {
    received_by: string,
    received_at: timestamp,
    condition: enum['good', 'compromised', 'rejected'],
    temperature_on_receipt: number
  },
  rejection: {
    is_rejected: boolean,
    reason: enum['insufficient_volume', 'hemolyzed', 'clotted', 'wrong_container', 'unlabeled', 'expired', 'temperature_deviation'],
    rejected_by: string,
    rejected_at: timestamp,
    comments: string
  },
  aliquots: [{
    aliquot_id: string,
    barcode: string,
    volume_ml: number,
    created_at: timestamp,
    created_by: string,
    purpose: string,
    location: string
  }],
  storage: {
    location: string,
    rack: string,
    box: string,
    position: string,
    stored_at: timestamp,
    stored_by: string,
    temperature: number
  },
  chain_of_custody: [{
    action: enum['collected', 'transported', 'received', 'processed', 'stored', 'retrieved', 'disposed'],
    performed_by: string,
    timestamp: timestamp,
    location: string,
    notes: string
  }],
  processing: [{
    test_id: string,
    processed_by: string,
    processed_at: timestamp,
    instrument_id: string,
    batch_id: string
  }],
  stability: {
    expiry_date: timestamp,
    stability_hours_remaining: number,
    is_expired: boolean
  },
  disposal: {
    disposed: boolean,
    disposed_by: string,
    disposed_at: timestamp,
    method: string,
    waste_manifest_number: string
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

### 8. Results and Reports
```javascript
// Collection: tenants/{tenantId}/results
{
  resultId: string,
  order_id: string,
  patient_id: string,
  test_id: string,
  sample_id: string,
  result_type: enum['numeric', 'text', 'structured', 'binary'],
  value: {
    numeric: number,
    text: string,
    structured: object,
    binary: enum['positive', 'negative', 'reactive', 'non_reactive']
  },
  unit: string,
  reference_range: {
    low: number,
    high: number,
    text: string
  },
  interpretation: enum['normal', 'abnormal', 'critical'],
  flags: enum['N', 'L', 'H', 'LL', 'HH', 'A'], // Normal, Low, High, Critical Low, Critical High, Abnormal
  critical_value: {
    is_critical: boolean,
    notified_to: string,
    notified_by: string,
    notified_at: timestamp,
    acknowledged: boolean,
    action_taken: string
  },
  delta_check: {
    previous_value: any,
    previous_date: timestamp,
    percent_change: number,
    absolute_change: number,
    is_significant: boolean,
    reviewed: boolean
  },
  status: enum['pending', 'preliminary', 'final', 'amended', 'corrected', 'cancelled'],
  verification: {
    auto_verified: boolean,
    verified_by: string,
    verified_at: timestamp,
    verification_notes: string
  },
  amendments: [{
    previous_value: any,
    new_value: any,
    reason: string,
    amended_by: string,
    amended_at: timestamp
  }],
  method: {
    instrument_id: string,
    method_name: string,
    lot_number: string,
    calibration_status: string
  },
  qc_status: {
    qc_passed: boolean,
    qc_lot_numbers: string[],
    qc_values: object
  },
  comments: {
    technical_notes: string,
    clinical_notes: string,
    footnotes: string[]
  },
  images: [{
    url: string,
    caption: string,
    uploaded_by: string,
    uploaded_at: timestamp
  }],
  microbiology: { // For culture results
    organism: string,
    colony_count: string,
    sensitivities: [{
      antibiotic: string,
      mic: string,
      interpretation: enum['sensitive', 'intermediate', 'resistant']
    }]
  },
  resulted_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}

// Collection: tenants/{tenantId}/reports
{
  reportId: string,
  report_number: string,
  order_id: string,
  patient_id: string,
  report_type: enum['final', 'preliminary', 'amended', 'cumulative'],
  status: enum['draft', 'pending_review', 'pending_authorization', 'authorized', 'delivered', 'amended'],
  template_id: string,
  content: {
    header: {
      lab_name: string,
      lab_logo: string,
      lab_address: string,
      accreditation_logos: string[],
      report_date: timestamp
    },
    patient_info: {
      name: string,
      age: string,
      gender: string,
      mrn: string,
      contact: string
    },
    physician_info: {
      name: string,
      contact: string
    },
    results: [{
      test_name: string,
      result: string,
      unit: string,
      reference_range: string,
      flag: string,
      method: string
    }],
    comments: string,
    interpretation: string,
    recommendations: string,
    footer: {
      reported_by: string,
      verified_by: string,
      authorized_by: string,
      disclaimer: string
    }
  },
  authorization: {
    required: boolean,
    authorized_by: string,
    authorized_at: timestamp,
    digital_signature: string,
    authorization_code: string
  },
  delivery: {
    channels: [{
      method: enum['portal', 'email', 'sms', 'print', 'fax', 'api'],
      status: enum['pending', 'sent', 'delivered', 'failed'],
      recipient: string,
      sent_at: timestamp,
      delivered_at: timestamp,
      read_at: timestamp,
      error: string
    }]
  },
  amendments: [{
    reason: string,
    description: string,
    amended_by: string,
    amended_at: timestamp,
    previous_version_id: string
  }],
  cumulative_info: { // For cumulative reports
    date_range: {
      from: timestamp,
      to: timestamp
    },
    included_tests: string[],
    trend_analysis: object
  },
  audit_trail: [{
    action: string,
    performed_by: string,
    timestamp: timestamp,
    ip_address: string
  }],
  pdf_url: string,
  html_content: string,
  is_printed: boolean,
  print_count: number,
  created_at: timestamp,
  updated_at: timestamp,
  reported_at: timestamp
}
```

### 9. Billing and Payments
```javascript
// Collection: tenants/{tenantId}/invoices
{
  invoiceId: string,
  invoice_number: string,
  patient_id: string,
  order_ids: string[],
  invoice_type: enum['patient', 'insurance', 'corporate'],
  status: enum['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
  billing_entity: {
    type: enum['patient', 'insurance', 'corporate'],
    entity_id: string,
    name: string,
    address: string,
    tax_id: string
  },
  line_items: [{
    type: enum['test', 'profile', 'service', 'discount', 'tax'],
    test_id: string,
    description: string,
    quantity: number,
    unit_price: number,
    discount_percent: number,
    discount_amount: number,
    tax_rate: number,
    tax_amount: number,
    total: number
  }],
  totals: {
    subtotal: number,
    discount_total: number,
    tax_total: number,
    grand_total: number,
    paid_amount: number,
    balance_due: number
  },
  insurance_claim: {
    claim_number: string,
    prior_authorization: string,
    coverage_percent: number,
    approved_amount: number,
    patient_responsibility: number,
    status: enum['pending', 'submitted', 'approved', 'partial', 'denied'],
    denial_reason: string
  },
  payment_terms: {
    due_date: timestamp,
    payment_method_required: string[],
    late_fee_percent: number
  },
  payments: [{
    payment_id: string,
    amount: number,
    method: enum['cash', 'card', 'check', 'online', 'insurance'],
    reference_number: string,
    received_date: timestamp,
    received_by: string
  }],
  refunds: [{
    refund_id: string,
    amount: number,
    reason: string,
    method: string,
    processed_date: timestamp,
    processed_by: string
  }],
  notes: {
    internal_notes: string,
    customer_notes: string
  },
  reminders_sent: [{
    type: enum['email', 'sms', 'letter'],
    sent_date: timestamp,
    template_used: string
  }],
  created_at: timestamp,
  updated_at: timestamp,
  due_date: timestamp,
  paid_date: timestamp
}

// Collection: tenants/{tenantId}/payment_transactions
{
  transactionId: string,
  invoice_id: string,
  patient_id: string,
  transaction_type: enum['payment', 'refund', 'adjustment'],
  amount: number,
  currency: string,
  method: enum['cash', 'card', 'check', 'bank_transfer', 'online', 'insurance'],
  status: enum['pending', 'processing', 'completed', 'failed', 'cancelled'],
  gateway: {
    provider: enum['stripe', 'paypal', 'razorpay', 'square'],
    transaction_id: string,
    authorization_code: string,
    response_code: string,
    response_message: string,
    raw_response: object
  },
  card_details: { // Encrypted/Tokenized
    last_four: string,
    brand: string,
    exp_month: number,
    exp_year: number,
    cardholder_name: string
  },
  check_details: {
    check_number: string,
    bank_name: string,
    account_number_last_four: string
  },
  metadata: {
    ip_address: string,
    user_agent: string,
    source: enum['web', 'mobile', 'pos', 'recurring'],
    notes: string
  },
  reconciliation: {
    is_reconciled: boolean,
    reconciled_date: timestamp,
    reconciled_by: string,
    bank_reference: string
  },
  created_at: timestamp,
  processed_at: timestamp,
  created_by: string
}
```

### 10. Inventory Management
```javascript
// Collection: tenants/{tenantId}/inventory_items
{
  itemId: string,
  item_code: string,
  barcode: string,
  name: string,
  category: enum['reagent', 'consumable', 'control', 'calibrator', 'kit', 'equipment'],
  sub_category: string,
  manufacturer: {
    name: string,
    catalog_number: string
  },
  description: string,
  unit_of_measure: {
    base_unit: string,
    purchase_unit: string,
    issue_unit: string,
    conversion_factor: number
  },
  specifications: {
    storage_temperature: string,
    humidity_requirements: string,
    light_sensitivity: boolean,
    hazard_class: string
  },
  stock_levels: {
    current_quantity: number,
    reserved_quantity: number,
    available_quantity: number,
    reorder_level: number,
    reorder_quantity: number,
    maximum_level: number
  },
  locations: [{
    location_id: string,
    location_name: string,
    quantity: number,
    lot_number: string,
    expiry_date: timestamp
  }],
  suppliers: [{
    supplier_id: string,
    supplier_name: string,
    supplier_item_code: string,
    lead_time_days: number,
    minimum_order_quantity: number,
    is_preferred: boolean
  }],
  pricing: {
    average_cost: number,
    last_purchase_price: number,
    selling_price: number,
    currency: string
  },
  usage_info: {
    average_monthly_usage: number,
    last_used_date: timestamp,
    associated_tests: string[]
  },
  is_active: boolean,
  is_critical: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

// Collection: tenants/{tenantId}/inventory_transactions
{
  transactionId: string,
  transaction_type: enum['receipt', 'issue', 'transfer', 'adjustment', 'return', 'disposal'],
  item_id: string,
  lot_number: string,
  expiry_date: timestamp,
  quantity: number,
  unit_cost: number,
  total_cost: number,
  source: {
    type: enum['purchase_order', 'transfer', 'return', 'production'],
    reference_id: string,
    location_id: string
  },
  destination: {
    type: enum['test', 'department', 'location', 'disposal'],
    reference_id: string,
    location_id: string
  },
  reason: string,
  performed_by: string,
  approved_by: string,
  balance_before: number,
  balance_after: number,
  notes: string,
  created_at: timestamp
}

// Collection: tenants/{tenantId}/purchase_orders
{
  purchaseOrderId: string,
  po_number: string,
  supplier_id: string,
  status: enum['draft', 'submitted', 'approved', 'partial', 'received', 'cancelled'],
  items: [{
    item_id: string,
    quantity_ordered: number,
    quantity_received: number,
    unit_price: number,
    discount_percent: number,
    tax_rate: number,
    total_price: number
  }],
  totals: {
    subtotal: number,
    discount: number,
    tax: number,
    shipping: number,
    total: number
  },
  delivery: {
    expected_date: timestamp,
    delivery_address: string,
    tracking_number: string,
    received_date: timestamp,
    received_by: string
  },
  payment_terms: string,
  approval: {
    required: boolean,
    approved_by: string,
    approved_date: timestamp
  },
  grn_numbers: string[], // Goods Receipt Note numbers
  invoice_reference: string,
  notes: string,
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string
}
```

### 11. Equipment and QC
```javascript
// Collection: tenants/{tenantId}/equipment
{
  equipmentId: string,
  asset_tag: string,
  name: string,
  model: string,
  manufacturer: string,
  serial_number: string,
  category: enum['analyzer', 'centrifuge', 'microscope', 'refrigerator', 'incubator', 'other'],
  location: {
    department: string,
    room: string,
    position: string
  },
  specifications: {
    capacity: string,
    throughput: string,
    power_requirements: string,
    dimensions: string,
    weight: string
  },
  purchase_info: {
    purchase_date: timestamp,
    purchase_price: number,
    warranty_expiry: timestamp,
    vendor: string,
    invoice_number: string
  },
  status: {
    operational_status: enum['operational', 'maintenance', 'repair', 'decommissioned'],
    last_status_change: timestamp,
    current_user: string
  },
  maintenance: {
    preventive_schedule: enum['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
    last_preventive: timestamp,
    next_preventive: timestamp,
    maintenance_contract: {
      vendor: string,
      contract_number: string,
      expiry: timestamp
    }
  },
  calibration: {
    required: boolean,
    frequency: string,
    last_calibration: timestamp,
    next_calibration: timestamp,
    calibration_certificate: string
  },
  interface: {
    is_interfaced: boolean,
    protocol: string,
    connection_type: string,
    ip_address: string,
    port: number
  },
  usage_log: {
    total_tests: number,
    total_runtime_hours: number,
    last_used: timestamp
  },
  documents: [{
    type: enum['manual', 'sop', 'certificate', 'report'],
    title: string,
    url: string,
    uploaded_date: timestamp
  }],
  is_critical: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

// Collection: tenants/{tenantId}/qc_materials
{
  qcMaterialId: string,
  name: string,
  manufacturer: string,
  lot_number: string,
  level: enum['low', 'normal', 'high', 'abnormal'],
  material_type: enum['control', 'calibrator'],
  tests: [{
    test_id: string,
    target_value: number,
    acceptable_range: {
      low: number,
      high: number
    },
    standard_deviation: number,
    cv_percent: number,
    unit: string
  }],
  received_date: timestamp,
  expiry_date: timestamp,
  opened_date: timestamp,
  opened_expiry_date: timestamp,
  storage_location: string,
  storage_temperature: string,
  quantity_received: number,
  quantity_remaining: number,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

// Collection: tenants/{tenantId}/qc_results
{
  qcResultId: string,
  material_id: string,
  test_id: string,
  instrument_id: string,
  run_date: timestamp,
  run_number: number,
  shift: enum['morning', 'evening', 'night'],
  value: number,
  z_score: number,
  sdi: number, // Standard Deviation Index
  status: enum['accept', 'reject', 'warning'],
  westgard_rules: {
    '1_3s': boolean,
    '2_2s': boolean,
    'R_4s': boolean,
    '4_1s': boolean,
    '10_x': boolean
  },
  cumulative_stats: {
    mean: number,
    sd: number,
    cv: number,
    n: number
  },
  action_taken: {
    required: boolean,
    description: string,
    performed_by: string,
    performed_at: timestamp
  },
  review: {
    reviewed_by: string,
    reviewed_at: timestamp,
    approved: boolean,
    comments: string
  },
  created_at: timestamp,
  created_by: string
}
```

### 12. Audit and Compliance
```javascript
// Collection: tenants/{tenantId}/audit_logs
{
  logId: string,
  user_id: string,
  user_name: string,
  action: enum['login', 'logout', 'view', 'create', 'update', 'delete', 'print', 'export', 'authorize'],
  resource_type: enum['patient', 'order', 'result', 'report', 'billing', 'inventory', 'settings'],
  resource_id: string,
  resource_name: string,
  changes: {
    before: object,
    after: object,
    fields_changed: string[]
  },
  metadata: {
    ip_address: string,
    user_agent: string,
    session_id: string,
    api_key_used: string
  },
  compliance: {
    phi_accessed: boolean,
    financial_data_accessed: boolean,
    exported_data: boolean
  },
  timestamp: timestamp
}

// Collection: tenants/{tenantId}/document_templates
{
  templateId: string,
  name: string,
  type: enum['report', 'invoice', 'receipt', 'consent', 'requisition', 'label'],
  category: string,
  format: enum['html', 'pdf', 'docx'],
  content: {
    html: string,
    css: string,
    variables: [{
      name: string,
      type: string,
      default_value: any
    }],
    sections: [{
      name: string,
      content: string,
      conditions: object
    }]
  },
  page_setup: {
    size: enum['a4', 'letter', 'legal'],
    orientation: enum['portrait', 'landscape'],
    margins: {
      top: number,
      bottom: number,
      left: number,
      right: number
    }
  },
  header_footer: {
    header: string,
    footer: string,
    page_numbers: boolean
  },
  branding: {
    logo_position: string,
    color_scheme: object,
    fonts: object
  },
  is_default: boolean,
  is_active: boolean,
  usage_count: number,
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string
}
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getTenant() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId;
    }
    
    function hasRole(roles) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/tenants/$(getTenant())/users/$(request.auth.uid)).data.role in roles;
    }
    
    function hasPermission(module, action) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/tenants/$(getTenant())/users/$(request.auth.uid)).data.permissions.modules[module].hasAny([action]);
    }
    
    function isOwnTenant(tenantId) {
      return isAuthenticated() && getTenant() == tenantId;
    }
    
    // System level collections
    match /system_config/{document} {
      allow read: if isAuthenticated();
      allow write: if false; // Only through admin SDK
    }
    
    match /subscription_plans/{document} {
      allow read: if isAuthenticated();
      allow write: if false; // Only through admin SDK
    }
    
    match /tenants/{tenantId} {
      allow read: if isOwnTenant(tenantId);
      allow write: if isOwnTenant(tenantId) && hasRole(['super_admin']);
    }
    
    // Tenant level collections
    match /tenants/{tenantId}/users/{userId} {
      allow read: if isOwnTenant(tenantId) && 
        (request.auth.uid == userId || hasPermission('settings', 'view'));
      allow create: if isOwnTenant(tenantId) && hasRole(['super_admin', 'lab_admin']);
      allow update: if isOwnTenant(tenantId) && 
        (request.auth.uid == userId || hasRole(['super_admin', 'lab_admin']));
      allow delete: if isOwnTenant(tenantId) && hasRole(['super_admin']);
    }
    
    match /tenants/{tenantId}/patients/{patientId} {
      allow read: if isOwnTenant(tenantId) && hasPermission('patients', 'view');
      allow create: if isOwnTenant(tenantId) && hasPermission('patients', 'create');
      allow update: if isOwnTenant(tenantId) && hasPermission('patients', 'edit');
      allow delete: if isOwnTenant(tenantId) && hasPermission('patients', 'delete');
    }
    
    match /tenants/{tenantId}/tests/{testId} {
      allow read: if isOwnTenant(tenantId);
      allow write: if isOwnTenant(tenantId) && hasRole(['super_admin', 'lab_admin', 'lab_manager']);
    }
    
    match /tenants/{tenantId}/orders/{orderId} {
      allow read: if isOwnTenant(tenantId) && hasPermission('orders', 'view');
      allow create: if isOwnTenant(tenantId) && hasPermission('orders', 'create');
      allow update: if isOwnTenant(tenantId) && hasPermission('orders', 'edit') && 
        (!resource.data.status == 'cancelled' || hasPermission('orders', 'cancel'));
      allow delete: if false; // Orders should never be deleted, only cancelled
    }
    
    match /tenants/{tenantId}/results/{resultId} {
      allow read: if isOwnTenant(tenantId) && hasPermission('results', 'view');
      allow create: if isOwnTenant(tenantId) && hasPermission('results', 'entry');
      allow update: if isOwnTenant(tenantId) && 
        (hasPermission('results', 'entry') || 
         (hasPermission('results', 'verify') && resource.data.status == 'pending') ||
         (hasPermission('results', 'amend') && resource.data.status == 'final'));
      allow delete: if false; // Results should never be deleted
    }
    
    match /tenants/{tenantId}/reports/{reportId} {
      allow read: if isOwnTenant(tenantId) && hasPermission('reports', 'view');
      allow create: if isOwnTenant(tenantId) && hasPermission('reports', 'create');
      allow update: if isOwnTenant(tenantId) && 
        (hasPermission('reports', 'edit') || 
         (hasPermission('reports', 'authorize') && resource.data.status == 'pending_authorization'));
      allow delete: if false; // Reports should never be deleted
    }
    
    match /tenants/{tenantId}/invoices/{invoiceId} {
      allow read: if isOwnTenant(tenantId) && hasPermission('billing', 'view');
      allow create: if isOwnTenant(tenantId) && hasPermission('billing', 'create');
      allow update: if isOwnTenant(tenantId) && hasPermission('billing', 'edit');
      allow delete: if false; // Invoices should never be deleted
    }
    
    match /tenants/{tenantId}/inventory_items/{itemId} {
      allow read: if isOwnTenant(tenantId) && hasPermission('inventory', 'view');
      allow write: if isOwnTenant(tenantId) && hasPermission('inventory', 'manage');
    }
    
    match /tenants/{tenantId}/audit_logs/{logId} {
      allow read: if isOwnTenant(tenantId) && hasRole(['super_admin', 'lab_admin']);
      allow write: if false; // Only through Cloud Functions
    }
    
    // Patient portal access
    match /tenants/{tenantId}/patients/{patientId} {
      allow read: if isAuthenticated() && 
        get(/databases/$(database)/documents/tenants/$(tenantId)/patients/$(patientId)).data.portal_access.username == request.auth.uid;
    }
    
    match /tenants/{tenantId}/orders/{orderId} {
      allow read: if isAuthenticated() && 
        get(/databases/$(database)/documents/tenants/$(tenantId)/orders/$(orderId)).data.patient_id == 
        get(/databases/$(database)/documents/tenants/$(tenantId)/patients/{document}).data.patientId &&
        get(/databases/$(database)/documents/tenants/$(tenantId)/patients/{document}).data.portal_access.username == request.auth.uid;
    }
  }
}
```

## Firestore Indexes

```javascript
// Composite Indexes needed for common queries

// Patient search
{
  collectionGroup: "patients",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "demographics.last_name", order: "ASCENDING" },
    { fieldPath: "demographics.first_name", order: "ASCENDING" },
    { fieldPath: "created_at", order: "DESCENDING" }
  ]
}

// Order search by date and status
{
  collectionGroup: "orders",
  queryScope: "COLLECTION", 
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "created_at", order: "DESCENDING" }
  ]
}

// Results by patient and test
{
  collectionGroup: "results",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "patient_id", order: "ASCENDING" },
    { fieldPath: "test_id", order: "ASCENDING" },
    { fieldPath: "resulted_at", order: "DESCENDING" }
  ]
}

// Pending reports for authorization
{
  collectionGroup: "reports",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "created_at", order: "ASCENDING" }
  ]
}

// Outstanding invoices
{
  collectionGroup: "invoices",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "due_date", order: "ASCENDING" }
  ]
}

// Inventory reorder alerts
{
  collectionGroup: "inventory_items",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "stock_levels.current_quantity", order: "ASCENDING" },
    { fieldPath: "stock_levels.reorder_level", order: "ASCENDING" }
  ]
}

// QC results by date
{
  collectionGroup: "qc_results",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "test_id", order: "ASCENDING" },
    { fieldPath: "run_date", order: "DESCENDING" }
  ]
}

// Audit logs by user and date
{
  collectionGroup: "audit_logs",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "user_id", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}
```

## Storage Structure

```
labflow-storage/
├── tenants/
│   └── {tenantId}/
│       ├── logos/
│       │   └── logo.png
│       ├── documents/
│       │   ├── patients/
│       │   │   └── {patientId}/
│       │   │       ├── id_cards/
│       │   │       ├── insurance_cards/
│       │   │       └── consent_forms/
│       │   ├── reports/
│       │   │   └── {year}/
│       │   │       └── {month}/
│       │   │           └── {reportId}.pdf
│       │   └── invoices/
│       │       └── {year}/
│       │           └── {month}/
│       │               └── {invoiceId}.pdf
│       ├── templates/
│       │   ├── reports/
│       │   └── documents/
│       └── backups/
│           └── {date}/
```

## Cloud Functions Triggers

```javascript
// Auto-generate MRN on patient creation
exports.generateMRN = functions.firestore
  .document('tenants/{tenantId}/patients/{patientId}')
  .onCreate(async (snap, context) => {
    // Generate unique MRN based on tenant settings
  });

// Send critical value alerts
exports.criticalValueAlert = functions.firestore
  .document('tenants/{tenantId}/results/{resultId}')
  .onWrite(async (change, context) => {
    // Check for critical values and send notifications
  });

// Update order status when all results are complete
exports.updateOrderStatus = functions.firestore
  .document('tenants/{tenantId}/results/{resultId}')
  .onWrite(async (change, context) => {
    // Check if all tests in order are resulted
  });

// Generate invoice on order completion
exports.generateInvoice = functions.firestore
  .document('tenants/{tenantId}/orders/{orderId}')
  .onUpdate(async (change, context) => {
    // Generate invoice when order status changes to completed
  });

// Audit logging
exports.auditLog = functions.firestore
  .document('tenants/{tenantId}/{collection}/{docId}')
  .onWrite(async (change, context) => {
    // Log all changes to audit collection
  });

// Inventory reorder alerts
exports.inventoryAlert = functions.firestore
  .document('tenants/{tenantId}/inventory_items/{itemId}')
  .onUpdate(async (change, context) => {
    // Check reorder levels and send alerts
  });

// QC rule violations
exports.qcViolationAlert = functions.firestore
  .document('tenants/{tenantId}/qc_results/{qcId}')
  .onCreate(async (snap, context) => {
    // Check Westgard rules and alert on violations
  });

// Report delivery
exports.deliverReport = functions.firestore
  .document('tenants/{tenantId}/reports/{reportId}')
  .onUpdate(async (change, context) => {
    // Send report via configured channels when authorized
  });
```

## Data Migration Scripts

```javascript
// Sample migration script structure
const migrateData = async () => {
  const batch = db.batch();
  
  // Add new fields to existing documents
  const snapshot = await db.collection('tenants').get();
  
  snapshot.forEach(doc => {
    batch.update(doc.ref, {
      'settings.report_settings': {
        default_template: 'standard',
        auto_authorize: false,
        delivery_delay_minutes: 30
      }
    });
  });
  
  await batch.commit();
};
```

This comprehensive Firebase database structure provides:
1. Complete schema for all collections
2. Detailed field definitions with enums
3. Security rules with role-based access
4. Composite indexes for common queries
5. Storage structure for files
6. Cloud Functions for automation
7. Data migration patterns

The structure supports multi-tenancy, HIPAA compliance, and scalability while maintaining data integrity and security.