# Firebase Configuration Guide - Preventing "Missing Permissions" Errors

## Overview

This guide documents all the Firebase Firestore rules and indexes needed to prevent "missing permissions" errors for the LabFlow application.

## Changes Made

### 1. Firestore Indexes (firestore.indexes.json)

Added comprehensive indexes for all new collections and queries:

#### Results Module
- `results` collection:
  - Index for `orderId` + `testName` ordering
  - Index for `patientId` + `createdAt` ordering
- `resultValidations` collection:
  - Index for `testId` + `enabled` filtering

#### Inventory Module
- `inventory_items`: Category + isActive + name filtering
- `stock_transactions`: itemId + performedAt ordering
- `lots`: Multiple indexes for active items and expiration tracking
- `inventory_alerts`: Active alerts with priority ordering
- `purchase_orders`: Status + orderDate ordering

#### Quality Control Module
- `qc_tests`: Status + testName ordering
- `qc_results`: Multiple indexes for test results by date and level

#### Reports Module
- `REPORT_TEMPLATES`: Tenant + isActive + category + name
- `REPORTS`: Multiple indexes for filtering by type, status, creator
- `ANALYTICS_DASHBOARDS`: Default dashboards ordering

#### Sample Collections
- `sampleCollections`: Status and phlebotomist filtering with date ordering

#### Test Management
- `labflow_tests`: Multiple indexes for category, department, and code lookups
- `labflow_test_panels`: Active panels ordering
- `labflow_specimens`: Order-based specimen lookups

### 2. Firestore Security Rules (firestore.rules)

Updated security rules to include permissions for all new collections:

#### Tenant-Prefixed Collections
Added write permissions for:
- `labflow_*_resultValidations` - Lab admins and managers
- `labflow_*_sampleCollections` - Admins and phlebotomists
- `labflow_*_inventory_items` - Admins and managers
- `labflow_*_stock_transactions` - Admins, managers, and technicians
- `labflow_*_lots` - Admins and managers
- `labflow_*_purchase_orders` - Admins and managers
- `labflow_*_inventory_alerts` - Admins and managers
- `labflow_*_qc_tests` - Admins and managers
- `labflow_*_qc_results` - Admins, managers, and technicians
- `labflow_*_REPORT_TEMPLATES` - Super admins and lab admins only
- `labflow_*_REPORTS` - All medical staff can create reports
- `labflow_*_ANALYTICS_DASHBOARDS` - Admins only

#### Non-Tenant Collections
Added rules for shared collections:
- `labflow_tests` - Read for all authenticated, write for super_admin
- `labflow_test_panels` - Read for all authenticated, write for super_admin
- `labflow_test_orders` - Tenant-based access control
- `labflow_specimens` - Read for authenticated, write for super_admin

## Deployment Instructions

### 1. Deploy Firestore Indexes

```bash
# From project root
firebase deploy --only firestore:indexes
```

This will create all the composite indexes needed for efficient queries.

### 2. Deploy Security Rules

```bash
# From project root
firebase deploy --only firestore:rules
```

This will update the security rules to allow proper access to all collections.

### 3. Verify Deployment

After deployment:
1. Check Firebase Console > Firestore > Indexes to confirm all indexes are building
2. Check Firebase Console > Firestore > Rules to confirm rules are updated
3. Test your application - queries should no longer throw permission errors

## Common Permission Error Patterns

### Pattern 1: Missing Index
**Error**: "The query requires an index..."
**Solution**: Add the required composite index to firestore.indexes.json

### Pattern 2: Missing Collection Rule
**Error**: "Missing or insufficient permissions"
**Solution**: Add appropriate rule for the collection in firestore.rules

### Pattern 3: Incorrect Role Check
**Error**: "Missing or insufficient permissions" (even with index)
**Solution**: Verify the role array in hasAnyRoleInTenant() includes all necessary roles

## Collection Naming Conventions

### Tenant-Prefixed Collections
Format: `{tenantId}_{collectionName}`
Example: `labflow_tenant1_results`

These collections use the wildcard rule with role-based access control.

### Shared Collections
Format: `labflow_{collectionName}`
Example: `labflow_tests`

These collections have specific rules and are typically read-only for most users.

## Role-Based Access Summary

| Role | Collections Access |
|------|-------------------|
| super_admin | Full access to all collections |
| lab_admin | Full lab management access |
| lab_manager | Lab operations and reporting |
| lab_technician | Sample processing, results, inventory transactions |
| pathologist | Results and reports |
| radiologist | Results and reports |
| clinician | Orders and reports |
| phlebotomist | Samples and collections |
| front_desk | Patients and orders |
| billing_staff | Invoices and payments |
| patient | Limited read access (future) |

## Testing Checklist

After deploying rules and indexes:

1. ✅ Test result entry and retrieval
2. ✅ Test inventory management operations
3. ✅ Test quality control data entry
4. ✅ Test report generation queries
5. ✅ Test sample collection workflows
6. ✅ Test order management
7. ✅ Verify all user roles can access appropriate data
8. ✅ Confirm no permission errors in browser console

## Troubleshooting

### Index Building Time
- Composite indexes can take 5-10 minutes to build
- Check status in Firebase Console > Firestore > Indexes

### Rule Evaluation
- Use Firebase Console > Firestore > Rules Playground to test specific queries
- Enable debug logging in your app to see exact query parameters

### Common Fixes
1. Ensure `tenantId` is included in all tenant-specific queries
2. Verify user has correct role in `tenant_users` collection
3. Check that collection names match exactly (case-sensitive)
4. Confirm all required fields in queries have corresponding indexes

## Maintenance

When adding new features:
1. Identify all Firestore queries in the new code
2. Add composite indexes for queries with multiple conditions
3. Update security rules for new collections
4. Test with different user roles
5. Deploy indexes first, then rules
6. Document any new patterns in this guide