# Modal URL Persistence

## Overview

All modals in the LabFlow application now persist their state in the URL, ensuring that modal states are preserved across page refreshes and can be shared via URLs.

## Implementation

### 1. useModalState Hook

The `useModalState` hook manages modal state through URL query parameters:

```typescript
import { useModalState } from '@/hooks/useModalState';

// In your component
const myModal = useModalState('modal-key');

// Open modal with optional data
myModal.openModal({ id: '123', action: 'edit' });

// Check if modal is open
if (myModal.isOpen) {
  // Modal is open
}

// Access modal data
const { id, action } = myModal.modalData;

// Close modal
myModal.closeModal();
```

### 2. useMultiModalState Hook

For pages with multiple modals, use `useMultiModalState`:

```typescript
import { useMultiModalState } from '@/hooks/useModalState';

const modals = useMultiModalState();

// Open specific modal
modals.openModal('edit-modal', { itemId: '123' });

// Check which modal is open
if (modals.isModalOpen('edit-modal')) {
  // Edit modal is open
}

// Close any open modal
modals.closeModal();
```

## URL Structure

When a modal is open, the URL will contain query parameters:

- `?modal=modal-key` - Identifies which modal is open
- `?modalId=123` - Stores the ID of the item being edited
- `?modalIndex=0` - Stores the index for array-based operations
- `?action=edit` - Stores the action type (add, edit, delete, etc.)
- `?modal_*=value` - Custom modal data prefixed with `modal_`

Example URLs:
- `/patients/123?tab=medical-history&modal=allergy&action=add`
- `/results?modal=amendment&modalId=result-456`
- `/appointments?modal=booking&modal_date=2025-01-15`

## Benefits

1. **Persistence**: Modals remain open after page refresh
2. **Shareable**: URLs can be shared with modal state intact
3. **Browser Navigation**: Back/forward buttons work correctly with modals
4. **Bookmarkable**: Specific modal states can be bookmarked
5. **Deep Linking**: Direct links to specific modal states

## Migration Guide

### Before (Local State)
```typescript
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState(null);

// Open modal
setEditingItem(item);
setShowModal(true);

// Close modal
setShowModal(false);
setEditingItem(null);

// Render modal
{showModal && <MyModal item={editingItem} onClose={() => setShowModal(false)} />}
```

### After (URL State)
```typescript
const modal = useModalState('my-modal');
const [editingItem, setEditingItem] = useState(null);

// Restore item from URL on modal open
useEffect(() => {
  if (modal.isOpen && modal.modalData.itemId) {
    const item = items.find(i => i.id === modal.modalData.itemId);
    if (item) setEditingItem(item);
  }
}, [modal.isOpen, modal.modalData, items]);

// Open modal
setEditingItem(item);
modal.openModal({ itemId: item.id });

// Close modal
modal.closeModal();
setEditingItem(null);

// Render modal
{modal.isOpen && <MyModal item={editingItem} onClose={() => modal.closeModal()} />}
```

## Components Updated

The following components have been updated to use URL-based modal state:

- **Patient Management**
  - AddAllergyModal
  - AddMedicationModal
  - AddMedicalHistoryModal
  - DeleteConfirmModal

- **Appointments**
  - AppointmentBookingForm modal

- **Results**
  - ResultAmendmentModal
  - ResultCorrectionModal
  - BatchResultApproval

- **Billing**
  - CreateClaimModal
  - AppealClaimModal
  - PaymentModal

- **Workflow**
  - WorkflowRuleModal
  - TATRuleModal

- **Communication**
  - MessageTemplateModal
  - CampaignModal

- **Navigation**
  - FeatureInfoModal
  - LOINCBrowser

## Testing

To test modal persistence:

1. Open any modal in the application
2. Copy the URL (it should contain modal query parameters)
3. Refresh the page - the modal should remain open
4. Navigate to a different page and use browser back button - modal state should be restored
5. Share the URL with modal parameters - the recipient should see the same modal open

## Best Practices

1. **Always clean up modal state** when closing modals
2. **Use consistent modal keys** across the application
3. **Store minimal data in URL** - only IDs and essential state
4. **Fetch full data on mount** using the IDs from URL
5. **Handle missing data gracefully** when items are deleted or unavailable