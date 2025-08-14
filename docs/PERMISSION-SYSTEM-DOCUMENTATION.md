# LabFlow Permission System Documentation

## Overview

The LabFlow application implements a comprehensive Role-Based Access Control (RBAC) system with fine-grained permissions. This system provides secure, flexible, and maintainable access control across all modules.

## Architecture

### Core Components

1. **Permission Constants** (`src/constants/permissions.constants.ts`)
   - 140+ granular permissions defined
   - Organized by module (Patients, Tests, Results, Billing, etc.)
   - Naming convention: `MODULE_ACTION_RESOURCE`

2. **Role-Permission Mapping** (`src/constants/role-permissions.constants.ts`)
   - 11 system roles with predefined permission sets
   - Helper functions for permission queries
   - Dynamic permission assignment support

3. **Permission Hooks** (`src/hooks/usePermissions.ts`)
   - React hooks for permission checking
   - Support for impersonation
   - Resource ownership validation

4. **PermissionGate Component** (`src/components/auth/PermissionGate.tsx`)
   - Declarative permission-based rendering
   - Multiple permission check modes
   - Customizable unauthorized fallbacks

5. **Utility Functions** (`src/utils/permission.utils.ts`)
   - Non-React permission checking
   - Permission filtering and validation
   - Permission formatting utilities

## System Roles

### 1. Super Admin (`super_admin`)
- Full system access
- All permissions granted automatically
- Cannot be modified through UI

### 2. Lab Admin (`lab_admin`)
- Laboratory management
- User and permission management
- All operational permissions

### 3. Lab Manager (`lab_manager`)
- Operational management
- Staff coordination
- Limited administrative access

### 4. Lab Technician (`lab_technician`)
- Test processing
- Result entry and validation
- Sample management

### 5. Phlebotomist (`phlebotomist`)
- Sample collection
- Patient registration
- Home collection services

### 6. Pathologist (`pathologist`)
- Result review and approval
- Medical interpretation
- Quality control oversight

### 7. Radiologist (`radiologist`)
- Imaging result interpretation
- Report generation
- Critical result management

### 8. Billing Staff (`billing_staff`)
- Invoice management
- Payment processing
- Insurance claims

### 9. Front Desk (`front_desk`)
- Patient reception
- Appointment scheduling
- Basic data entry

### 10. Clinician (`clinician`)
- Test ordering
- Result viewing
- Patient management

### 11. Patient (`patient`)
- View own records
- Book appointments
- Access results

## Permission Categories

### Patient Management
- `PATIENTS_VIEW_ALL` - View all patients
- `PATIENTS_VIEW_OWN` - View own records
- `PATIENTS_CREATE` - Create patient records
- `PATIENTS_UPDATE_ALL` - Update any patient
- `PATIENTS_DELETE` - Delete patient records
- `PATIENTS_EXPORT` - Export patient data
- `PATIENTS_VIEW_MEDICAL_HISTORY` - Access medical history

### Test Management
- `TESTS_VIEW_ALL` - View all tests
- `TESTS_CREATE_ORDER` - Create test orders
- `TESTS_APPROVE_ORDER` - Approve test orders
- `TESTS_MANAGE_CATALOG` - Manage test catalog
- `TESTS_UPDATE_PRICING` - Update test prices

### Results Management
- `RESULTS_VIEW_ALL` - View all results
- `RESULTS_ENTER` - Enter test results
- `RESULTS_VALIDATE` - Validate results
- `RESULTS_APPROVE` - Approve results
- `RESULTS_PRINT` - Print results

### Billing & Insurance
- `BILLING_VIEW_ALL` - View all billing
- `BILLING_CREATE_INVOICE` - Create invoices
- `BILLING_PROCESS_PAYMENT` - Process payments
- `BILLING_MANAGE_INSURANCE` - Manage insurance
- `BILLING_SUBMIT_CLAIM` - Submit claims

### User Management
- `USERS_VIEW_ALL` - View all users
- `USERS_CREATE` - Create users
- `USERS_ASSIGN_ROLE` - Assign roles
- `USERS_MANAGE_PERMISSIONS` - Manage permissions
- `USERS_IMPERSONATE` - Impersonate users

## Usage Examples

### Using PermissionGate Component

```tsx
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions.constants';

// Single permission check
<PermissionGate permission={PERMISSIONS.PATIENTS_CREATE}>
  <Button>Create Patient</Button>
</PermissionGate>

// Multiple permissions (requires all)
<PermissionGate 
  allPermissions={[
    PERMISSIONS.RESULTS_ENTER,
    PERMISSIONS.RESULTS_APPROVE
  ]}
>
  <ResultsForm />
</PermissionGate>

// Any permission check
<PermissionGate 
  anyPermission={[
    PERMISSIONS.PATIENTS_VIEW_ALL,
    PERMISSIONS.PATIENTS_VIEW_OWN
  ]}
>
  <PatientList />
</PermissionGate>

// Role-based check
<PermissionGate requireAdmin>
  <AdminPanel />
</PermissionGate>

// Hide if unauthorized
<PermissionGate 
  permission={PERMISSIONS.BILLING_PROCESS_REFUND}
  hideIfUnauthorized
>
  <RefundButton />
</PermissionGate>
```

### Using Permission Hooks

```tsx
import { usePermissions, useHasPermission } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions.constants';

function MyComponent() {
  const { hasPermission, isAdmin, userRole } = usePermissions();
  
  // Check single permission
  const canCreatePatient = useHasPermission(PERMISSIONS.PATIENTS_CREATE);
  
  // Check multiple permissions
  const canManageResults = hasPermission([
    PERMISSIONS.RESULTS_ENTER,
    PERMISSIONS.RESULTS_APPROVE
  ]);
  
  // Conditional rendering
  if (!hasPermission(PERMISSIONS.BILLING_VIEW_ALL)) {
    return <AccessDenied />;
  }
  
  // Resource-based access
  const canEditPatient = (patientId: string) => {
    return hasPermission(PERMISSIONS.PATIENTS_UPDATE_ALL) ||
           (hasPermission(PERMISSIONS.PATIENTS_UPDATE_OWN) && 
            patientId === currentUser.id);
  };
  
  return (
    <div>
      {isAdmin && <AdminControls />}
      {canCreatePatient && <CreateButton />}
    </div>
  );
}
```

### Utility Functions

```typescript
import { 
  checkPermission, 
  getUserPermissions,
  isUserAdmin 
} from '@/utils/permission.utils';

// Check permission outside React
const hasAccess = checkPermission(user, PERMISSIONS.TESTS_CREATE_ORDER);

// Get all user permissions
const permissions = getUserPermissions(user);

// Filter items by permission
const visibleItems = filterByPermission(
  menuItems,
  user,
  item => item.requiredPermission
);
```

## Permission Management UI

### Accessing Permission Management

1. Navigate to Admin Panel (`/admin`)
2. Click on "Permissions" tab
3. Select a user to manage permissions

### Managing User Permissions

1. **View Current Permissions**
   - Role-based permissions (inherited)
   - Custom permissions (additional)

2. **Assign Custom Permissions**
   - Search for specific permissions
   - Filter by category
   - Toggle individual permissions

3. **Change User Role**
   - Select new role from dropdown
   - Permissions update automatically

4. **Export Configuration**
   - Download permission backup
   - JSON format for recovery

## Firebase Security Rules

### Permission Checking in Firestore

```javascript
// Helper function for permission checking
function hasPermission(permission) {
  return isAuthenticated() && 
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin' ||
     permission in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions);
}

// Usage in rules
match /sensitive_collection/{doc} {
  allow read: if hasPermission('admin.view.logs');
  allow write: if hasPermission('admin.system.configuration');
}
```

### User Document Protection

```javascript
match /users/{userId} {
  // Users can update their profile but not permissions
  allow update: if (isOwner(userId) && 
    !request.resource.data.diff(resource.data)
      .affectedKeys().hasAny(['permissions', 'role'])) || 
    canManagePermissions();
}
```

## Best Practices

### 1. Permission Naming
- Use consistent naming: `MODULE_ACTION_RESOURCE`
- Be specific: `PATIENTS_VIEW_MEDICAL_HISTORY` not `PATIENTS_VIEW_MORE`
- Group related permissions

### 2. Role Design
- Start with minimal permissions
- Add permissions based on actual needs
- Document role purposes

### 3. Component Protection
- Use `PermissionGate` for UI elements
- Apply `hideIfUnauthorized` for clean UI
- Provide meaningful fallbacks

### 4. Resource-Based Access
- Check ownership for "own" permissions
- Validate resource assignment
- Implement field-level security

### 5. Performance
- Use `useMemo` for permission calculations
- Cache permission checks
- Minimize Firestore reads

## Troubleshooting

### Common Issues

1. **Permission Not Working**
   - Check permission constant spelling
   - Verify role assignment
   - Clear browser cache
   - Check Firebase rules

2. **User Can't Access Feature**
   - Verify user role in database
   - Check custom permissions
   - Validate tenant assignment
   - Review component protection

3. **Firebase Rules Rejection**
   - Check rule syntax
   - Verify permission exists in user document
   - Test with Firebase emulator
   - Review security rule logs

## Migration Guide

### Adding New Permissions

1. Add constant to `permissions.constants.ts`
2. Add to role mappings if needed
3. Update Firebase rules if applicable
4. Protect components with new permission
5. Document the permission

### Changing Role Permissions

1. Update `role-permissions.constants.ts`
2. Consider existing users impact
3. Update documentation
4. Test thoroughly
5. Communicate changes

## Security Considerations

1. **Never Trust Client-Side Only**
   - Always validate on server/Firebase
   - Client-side is for UX only

2. **Audit Permission Changes**
   - Log permission modifications
   - Track who made changes
   - Regular permission audits

3. **Principle of Least Privilege**
   - Grant minimum required permissions
   - Regular permission reviews
   - Remove unused permissions

4. **Sensitive Operations**
   - Require multiple permissions
   - Add confirmation dialogs
   - Log critical actions

## API Reference

### Permission Constants
- Location: `src/constants/permissions.constants.ts`
- Total Permissions: 140+
- Categories: 14

### Hooks
- `usePermissions()` - Main permission hook
- `useHasPermission(permission)` - Single permission check
- `useHasAllPermissions(permissions)` - All permissions check
- `useHasAnyPermission(permissions)` - Any permission check
- `useCanAccess(permission, resourceId)` - Resource access check
- `useUserRole()` - Get user role
- `useIsAdmin()` - Check admin status

### Components
- `<PermissionGate>` - Permission-based rendering
- `<PermissionShow>` - Simple show/hide
- `<AdminOnly>` - Admin-only content
- `<AuthOnly>` - Authenticated-only content

### Utilities
- `checkPermission(user, permission)` - Check permission
- `getUserPermissions(user)` - Get all permissions
- `isUserAdmin(user)` - Check admin status
- `filterByPermission(items, user, getter)` - Filter by permission

## Support

For questions or issues with the permission system:
1. Check this documentation
2. Review error logs
3. Test with different roles
4. Contact system administrator