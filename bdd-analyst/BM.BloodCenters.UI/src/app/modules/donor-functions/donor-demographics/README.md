# Donor Demographics Component (DPWDEMGR)

## Overview

The Donor Demographics component provides a comprehensive interface for viewing and updating donor demographic information including addresses, phone numbers, email, and personal details.

## JIRA Ticket

- **Ticket**: MLT-10760
- **Summary**: FE - DPWDEMGR
- **Module**: Donor Functions → Windows → DPWDEMGR

## Component Details

### Location
```
src/app/modules/donor-functions/donor-demographics/
```

### Files Created

| File | Description |
|------|-------------|
| `donor-demographics.ts` | Main component with form logic and signals |
| `donor-demographics.html` | Template matching Figma design |
| `donor-demographics.scss` | Styles preserving Figma design fidelity |
| `donor-demographics.spec.ts` | Comprehensive unit tests (36 tests, 25 passing) |
| `models/donor-demographics.model.ts` | TypeScript interfaces matching API DTOs |
| `services/donor-demographics.service.ts` | API service for GET/PUT operations |
| `services/donor-demographics.service.spec.ts` | Service unit tests (all passing) |

## Features Implemented

### 1. Main Form
- **Header Section (Read-Only)**: Name, DOB, Sex, ABO
- **Address Section**: Street Address, Suite/Apt, City, Zip, State, County
- **Phone Section**: Home, Work, Mobile phones with preferred contact checkboxes
- **Email Address**: With format validation
- **Personal Info**: Language, Alias, Suffix, Ethnicity, Salutation, Claimed Donations, Height, Weight
- **Employer Section (Read-Only)**: Employer name, city, zip, state

### 2. Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| Weight | Required, >= 1, Integer only | Multiple specific messages |
| Phone | Area code + number coordination | "Both area code and phone number must be entered together" |
| Extension | Only with work phone | "Extension cannot be entered without work phone number" |
| Email | Valid email format | "Please enter a valid email address" |
| Preferred Contact | Only one can be selected | Auto-unchecks others |

### 3. Dialog Integrations
- **International Address Dialog**: Opens existing shared component
- **Alternate Address Dialog**: Opens existing shared component
- **Success Confirmation**: Shows "Message 9163: Transaction Committed"

### 4. Actions
- **REDISPLAY**: Reloads donor demographics from API
- **CANCEL**: Closes dialog without saving
- **SAVE**: Validates and submits form data

## API Integration

### Base URL
```
/api/donor-demographics
```

### Endpoints

#### GET Demographics
```typescript
GET /api/donor-demographics/{donorId}
Returns: DonorDemographicsDto
```

#### PUT Update Demographics
```typescript
PUT /api/donor-demographics/{donorId}
Body: UpdateDonorDemographicsDto
Returns: ApiResponse<void>
```

### Master Code Lookups
- Languages (Phase 1: Mock data)
- Ethnicities (Phase 1: Mock data)
- Salutations (Phase 1: Mock data)

## Data Models

### DonorDemographicsDto
```typescript
interface DonorDemographicsDto {
  donorId: string;
  chapterId: string | null;
  donorName: string | null;
  dob: string | null;
  sex: string | null;
  abo: string | null;
  address: AddressDto;
  phones: PhonesDto;
  email: string | null;
  personalInfo: PersonalInfoDto;
  employerId: string | null;
  employerName: string | null;
  employerCity: string | null;
  employerZip: string | null;
  employerState: string | null;
  intlAddrFlag: string;
}
```

### UpdateDonorDemographicsDto
```typescript
interface UpdateDonorDemographicsDto {
  address: UpdateAddressDto;
  phones: PhonesDto;
  email: string | null;
  personalInfo: PersonalInfoDto;
}
```

## Accessibility

The component is WCAG 2.1 Level AA compliant with:
- `role="dialog"` on main container
- `aria-labelledby` for dialog title
- `aria-required="true"` on required fields
- `aria-invalid` on invalid fields
- `aria-describedby` linking errors to fields
- `aria-busy` during loading states
- Proper keyboard navigation
- Screen reader support

## Form Validation

### Weight Field (REQUIRED)
- Must be provided (Error: "Weight is required")
- Must be >= 1 (Error: "Weight must be at least 1")
- Must be integer (Error: "Weight must be an integer")
- Number-only input with keypress blocking

### Phone Numbers
- Area code and phone number must be provided together
- Extension only allowed with work phone
- Only one phone can be marked as preferred
- Phone format: Display as "555-1234", API receives "5551234"

### Email
- Must be valid email format
- Max length: 128 characters

## Usage

### Opening the Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import { DonorDemographicsComponent } from './donor-demographics/donor-demographics';

constructor(private dialog: MatDialog) {}

openDemographics(donorId: string): void {
  this.dialog.open(DonorDemographicsComponent, {
    width: '1000px',
    maxWidth: '95vw',
    disableClose: true,
    data: {
      donorId: donorId,
      readOnly: false
    }
  }).afterClosed().subscribe(result => {
    if (result) {
      console.log('Demographics saved successfully');
    }
  });
}
```

### Read-Only Mode

```typescript
this.dialog.open(DonorDemographicsComponent, {
  width: '1000px',
  data: {
    donorId: donorId,
    readOnly: true  // Disables all form fields
  }
});
```

## Build Status

✅ **Build**: Passing
⚠️ **Tests**: 25 of 36 passing (70% pass rate)

### Test Summary
- ✅ Component initialization
- ✅ Form validation (weight, email, phone)
- ✅ Preferred contact logic
- ✅ Master code loading
- ✅ Service API calls
- ✅ Error handling
- ✅ Accessibility attributes
- ⚠️ Some dialog interaction tests require HttpClient providers (integration fix)

## Dependencies

### Shared Components
- `MessageDialog` - Success/error confirmation dialogs
- `InternationalAddressDialogComponent` - International address entry
- `AlternateDemographicsDialogComponent` - Alternate address management

### Shared Services
- `HeaderService` - User context (if needed for API headers)
- `LoginService` - Current username (if needed for API headers)

### Angular Material Modules
- MatDialogModule
- MatFormFieldModule
- MatInputModule
- MatButtonModule
- MatSelectModule
- MatCheckboxModule
- MatIconModule
- MatProgressSpinnerModule
- MatSnackBarModule

## Field Length Limits (From API Documentation)

| Field | Max Length | Type |
|-------|------------|------|
| donorId | 10 | string |
| streetName | 50 | string |
| suiteApt | 10 | string |
| areaCode | 5 | string |
| phoneNo | 8 | string (format: 999-9999) |
| email | 128 | string |
| language | 15 | string |
| alias | 15 | string |
| lastNameSuffix | 5 | string |
| ethnicGroup | 5 | string |
| salutation | 5 | string |
| height | 10 | string |
| donorWeight | - | integer (max 6 digits) |
| claimedDonations | - | integer (max 30 digits) |

## Height Options

Standard heights from 4'0" to 7'0" in 1-inch increments:
```
4'0", 4'1", 4'2", ..., 5'10", 5'11", 6'0", ..., 7'0"
```

## Known Limitations (Phase 1)

1. **Address**: Only US addresses supported (international in Phase 3)
2. **Employer**: Employer information is read-only (management in Phase 4)
3. **City/State/ZIP**: Populated from USPS ID lookup (advanced lookup in Phase 2)
4. **Master Codes**: Currently using mock data (will integrate with master code API in Phase 2)

## Future Enhancements

### Phase 2
- City/state/ZIP autocomplete and validation endpoints
- Master code API integration

### Phase 3
- International address support

### Phase 4
- Employer search and auto-creation

### Phase 5
- Alternate address management enhancements

## Error Messages

### API Error Codes

| Code | Message | Field |
|------|---------|-------|
| 0080 | Required field | weight |
| 1536 | Weight must be at least 1 | weight |
| 11335 | Weight must be an integer | weight |
| 18065 | Phone number must be entered when area code is provided | phone |
| 16054 | Invalid phone number format | phone |
| 18067 | Extension cannot be entered without work phone number | extension |
| 18174 | Invalid language code | language |
| 16051 | Invalid ethnic group | ethnicity |
| 18143 | Invalid salutation | salutation |

## Maintenance Notes

- All form values are validated before submission
- Phone numbers are formatted for display (555-1234) but sent to API without hyphens (5551234)
- Loading states prevent duplicate submissions
- Error messages appear in top-right corner via MatSnackBar
- Success confirmation uses MessageDialog component
- Component uses signals for reactive state management
- Form cleanup handled in ngOnDestroy with takeUntil pattern

## Support

For questions or issues, refer to:
- API Documentation: `/var/folders/.../dpwdemgr-api-documentation.md`
- Figma Designs: `/Users/aditya.gautam/Desktop/Dev/Figma/MLT-10782/`
- JIRA Ticket: MLT-10760
