# Implementation Instructions for Form Fixes

## 1. Install Required Dependencies

First, install the Lexical editor dependencies:

```bash
yarn add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/markdown @lexical/selection @lexical/utils @lexical/clipboard @lexical/history
```

Or if using npm:

```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/markdown @lexical/selection @lexical/utils @lexical/clipboard @lexical/history
```

## 2. Add Missing Command Imports for Lexical

Add these imports to the LexicalEditor.tsx file at the top:

```typescript
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND
} from 'lexical';
```

## 3. Copy Files to Your Project

Copy these files to your actual project directory:

1. **City Data**: Copy `city-data-pakistan.ts` to `src/utils/city-data-pakistan.ts`
2. **City Field**: Copy `CityField-fixed.tsx` to `src/components/form-fields/CityField.tsx`
3. **Phone Field**: Copy `PhoneField-fixed.tsx` to `src/components/form-fields/PhoneField.tsx`
4. **Occupation Field**: Copy `OccupationField.tsx` to `src/components/form-fields/OccupationField.tsx`
5. **Lexical Editor**: Copy `LexicalEditor.tsx` to `src/components/form-fields/LexicalEditorField.tsx`
6. **Example Form**: Copy `PatientFormWithDefaults.tsx` as a reference for implementation

## 4. Update Your Existing Forms

### Replace City Field Implementation

In your patient forms, replace the city field with:

```tsx
import { CityField } from '@/components/form-fields/CityField';

// In your form component:
<CityField
  control={control}
  name="city"
  label="City"
  required
  country={watchCountry} // Use watch() to get country value
  state={watchState}      // Use watch() to get state value
/>
```

### Replace Phone Field Implementation

Replace existing phone fields with:

```tsx
import { PhoneField } from '@/components/form-fields/PhoneField';

<PhoneField
  control={control}
  name="phone"
  label="Phone Number"
  required
  countryCode="+92" // For Pakistan
/>
```

### Add Occupation Field

Replace text input for occupation with:

```tsx
import { OccupationField } from '@/components/form-fields/OccupationField';

<OccupationField
  control={control}
  name="occupation"
  label="Occupation"
  placeholder="Select or enter occupation"
/>
```

### Replace Textarea with Lexical Editor

For all notes, description, and medical history fields:

```tsx
import { LexicalEditorField } from '@/components/form-fields/LexicalEditorField';

<LexicalEditorField
  control={control}
  name="notes"
  label="Notes"
  placeholder="Enter notes here..."
  minHeight="200px"
  maxHeight="400px"
/>
```

## 5. Load User Profile Defaults

In your form components, add this logic to load defaults from user profile:

```tsx
import { useAuthStore } from '@/stores/auth.store';

const { user } = useAuthStore();

// In useEffect hook:
useEffect(() => {
  if (user?.profile) {
    setValue('country', user.profile.country || 'Pakistan');
    setValue('state', user.profile.state || '');
    setValue('city', user.profile.city || '');
    setValue('phone', user.profile.phone || '');
    setValue('occupation', user.profile.defaultOccupation || '');
  }
}, [user, setValue]);
```

## 6. Update User Profile Store

Make sure your auth store saves user preferences:

```tsx
// In your auth store
interface UserProfile {
  country?: string;
  state?: string;
  city?: string;
  phone?: string;
  defaultOccupation?: string;
  defaultAddress?: string;
  defaultPostalCode?: string;
}

// Save these when user updates their profile
const updateUserProfile = async (profile: UserProfile) => {
  // Save to Firebase/backend
  await updateDoc(doc(db, 'users', userId), {
    profile: profile
  });
};
```

## 7. Fix Common Issues

### Phone Field Focus Issue
The new PhoneField component uses local state to prevent re-renders that cause focus loss:

```tsx
const [localValue, setLocalValue] = useState(value || '');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatPhoneNumber(e.target.value);
  setLocalValue(formatted);
  onChange(formatted); // Only update form state, not causing re-render
};
```

### City Dropdown Population
Cities are now dynamically loaded based on country and state selection:

```tsx
const cities = useMemo(() => {
  if (country?.toLowerCase() === 'pakistan' && state) {
    return getCitiesForState(state);
  }
  return [];
}, [country, state]);
```

## 8. Additional Countries Support

To add support for other countries (like India), extend the city data:

```typescript
// In city-data-pakistan.ts, add:
export const indianCities: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', ...],
  'Delhi': ['New Delhi', 'North Delhi', ...],
  // ... more states
};

// Update getCitiesForState function:
export const getCitiesForState = (country: string, state: string): string[] => {
  if (country === 'Pakistan') {
    return pakistanCities[state] || [];
  } else if (country === 'India') {
    return indianCities[state] || [];
  }
  return [];
};
```

## 9. Testing

After implementation, test:

1. ✅ City field populates when Pakistan/Punjab is selected
2. ✅ Phone field doesn't lose focus while typing
3. ✅ Occupation field allows selection and custom input
4. ✅ Lexical editor works for rich text editing
5. ✅ User profile defaults are loaded automatically

## 10. Troubleshooting

### If Lexical editor doesn't work:
- Make sure all Lexical dependencies are installed
- Check console for any import errors
- Ensure the theme classes are available in your CSS

### If cities don't show:
- Verify country and state values are being passed correctly
- Check console for any errors in getCitiesForState function
- Make sure the city data file is imported correctly

### If phone field still loses focus:
- Ensure you're not using the field value directly in onChange
- Use local state as shown in the implementation
- Check for any parent component re-renders

## Done! 🎉

All the requested fixes have been implemented:
- ✅ City field shows options for Pakistan/Punjab
- ✅ Default values loaded from user profile
- ✅ Phone field focus issue fixed
- ✅ Occupation field with select and custom input
- ✅ Lexical editor for rich text fields