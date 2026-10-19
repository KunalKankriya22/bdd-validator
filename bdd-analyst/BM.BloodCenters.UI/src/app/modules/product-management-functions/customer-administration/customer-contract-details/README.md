# Customer Contract Details Component

**JIRA Ticket:** MLT-14097
**Mnemonic:** CONTRACT
**Legacy Form:** VSCNTRCT
**Navigation Path:** Product Management Functions => Customer & Internal Administration => Customer Administration => Customer Contract Details

## Overview

This component displays and manages customer contracts in a card-based grid layout. It is designed to be used as a tab within a Customer Details view, receiving the `customerId` as an input parameter.

## Features

### UI Components

1. **Contract Cards Grid**
   - Displays contracts in a responsive grid layout
   - Each card shows:
     - Customer Name
     - Contract Code (e.g., EXO002-001)
     - Location badge
     - Status badge (Active/Inactive)
     - Rotation (Yes/No)
     - PO Number
     - Credit Limit
     - Start Term / End Term
     - Effective Date / Termination Date
   - Edit button on each card

2. **Add/Edit Side Panel**
   - Slide-in panel from right side
   - Add mode: Creates new contract
   - Edit mode: Updates existing contract
   - Fields:
     - Rotation (dropdown: Yes/No)
     - PO Number (text, max 50 chars)
     - Credit Limit (decimal number)
     - Start Term (datepicker)
     - End Term (datepicker)
     - Effective Date (datepicker, required)
     - Termination Date (datepicker, optional)
   - Actions:
     - Clear All
     - Add & Create Another (add mode only)
     - Cancel
     - Save/Add

3. **States**
   - Loading: Spinner with message
   - Error: Error message with retry button
   - Empty: Helpful message when no contracts exist
   - Success: Contract cards displayed in grid

## Architecture

### Component Structure

```
customer-contract-details/
├── models/
│   └── customer-contract.model.ts          # TypeScript interfaces
├── services/
│   ├── customer-contract-api.service.ts    # API service
│   └── customer-contract-api.service.spec.ts
├── customer-contract-card/                 # Card display component
│   ├── customer-contract-card.component.ts
│   ├── customer-contract-card.component.html
│   ├── customer-contract-card.component.scss
│   └── customer-contract-card.component.spec.ts
├── add-edit-contract/                      # Side panel form
│   ├── add-edit-contract.component.ts
│   ├── add-edit-contract.component.html
│   ├── add-edit-contract.component.scss
│   └── add-edit-contract.component.spec.ts
├── customer-contract-details.component.ts  # Main component
├── customer-contract-details.component.html
├── customer-contract-details.component.scss
└── customer-contract-details.component.spec.ts
```

### Data Models

#### CustomerContractDto
```typescript
{
  customerId: string;
  customerName?: string;
  contractId?: string;
  contractCode?: string;
  location?: string;
  status?: 'Active' | 'Inactive';
  rotation?: 'Yes' | 'No';
  poNumber?: string;
  creditLimit?: number;
  startTerm?: string;
  endTerm?: string;
  effectiveDate: string;
  terminationDate?: string | null;
}
```

## Usage

### As a Tab in Customer Details

```typescript
// In parent component template
<mat-tab-group>
  <mat-tab label="General Information">
    <!-- General info content -->
  </mat-tab>

  <mat-tab label="Contracts">
    <app-customer-contract-details [customerId]="selectedCustomerId">
    </app-customer-contract-details>
  </mat-tab>

  <mat-tab label="Contacts">
    <!-- Contacts content -->
  </mat-tab>
</mat-tab-group>
```

### Standalone Usage

```typescript
import { CustomerContractDetailsComponent } from './customer-contract-details.component';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CustomerContractDetailsComponent],
  template: `
    <app-customer-contract-details [customerId]="customerId">
    </app-customer-contract-details>
  `
})
export class CustomerViewComponent {
  customerId = 'CUST001';
}
```

## API Endpoints (Backend TODO)

The following API endpoints need to be implemented by the backend team:

### List Contracts
```
POST /api/v1/customer-contracts/{customerId}/{take}/{skip}
Body: CustomerContractQueryDto
Response: { data: CustomerContractDto[], total: number }
```

### Get Contract by ID
```
GET /api/v1/customer-contracts/{customerId}/{contractId}
Response: { item: CustomerContractDto }
```

### Create Contract
```
POST /api/v1/customer-contracts/{customerId}
Body: CreateCustomerContractRequestDto
Response: { success: boolean, message: string }
```

### Update Contract
```
PUT /api/v1/customer-contracts/{customerId}/{contractId}
Body: UpdateCustomerContractRequestDto
Response: { success: boolean, message: string }
```

### Delete Contract
```
DELETE /api/v1/customer-contracts/{customerId}/{contractId}
Response: { success: boolean, message: string }
```

## Validation Rules

### Form Fields

1. **Effective Date** (Required)
   - Cannot be in the past (in add mode)
   - Must be before Termination Date if both are set

2. **Termination Date** (Optional)
   - Must be on or after Effective Date
   - Can be cleared in edit mode

3. **Start Term / End Term** (Optional)
   - End Term must be on or after Start Term

4. **PO Number**
   - Maximum 50 characters
   - Character counter displayed

5. **Credit Limit**
   - Decimal number (2 decimal places)
   - No negative values

### Date Formatting

- **Display Format:** DD-MMM-YYYY (e.g., 30-JAN-2026)
- **API Format:** YYYY-MM-DD (ISO 8601)
- **Datepicker:** Supports manual entry and calendar selection

## Accessibility Features

### WCAG 2.1 Level AA Compliance

1. **Unique IDs**
   - Every component instance generates unique IDs
   - Prevents conflicts when multiple instances exist

2. **ARIA Attributes**
   - `aria-labelledby` for regions and dialogs
   - `aria-describedby` for form errors
   - `aria-invalid` for invalid form fields
   - `aria-required` for required fields
   - `aria-busy` for loading states
   - `role="alert"` for error messages
   - `role="dialog"` for side panel
   - `role="list"` and `role="listitem"` for contract grid

3. **Keyboard Navigation**
   - Tab order follows visual layout
   - Enter/Space for button activation
   - Escape to close side panel (TODO: implement)

4. **Screen Reader Support**
   - Descriptive labels for all inputs
   - Error announcements with `role="alert"`
   - Loading state announcements
   - Hidden headings for page structure

## State Management

Uses Angular signals for reactive state:

```typescript
readonly contracts = signal<CustomerContractDto[]>([]);
readonly isLoading = signal<boolean>(false);
readonly hasError = signal<boolean>(false);
readonly errorMessage = signal<string>('');
readonly totalRecords = signal<number>(0);
```

## Testing

### Running Tests

```bash
# Run all tests
ng test

# Run specific component tests
ng test --include='**/customer-contract-details/**/*.spec.ts'
```

### Test Coverage

- Component initialization
- Loading states
- Error handling
- Form validation
- User interactions (add, edit, cancel)
- Date validation
- Accessibility features
- Unique ID generation
- API service calls

## Styling

### Theme Compliance

- Uses Angular Material theme colors
- Teal primary color
- Orange accent color
- Red for errors and required markers

### Responsive Breakpoints

- Desktop: Grid with multiple columns (450px min width)
- Tablet: Adjusted grid columns
- Mobile: Single column layout, full-width side panel

## Future Enhancements

1. **Pagination**
   - Currently loads all contracts for a customer
   - Consider pagination if contract count is high

2. **Search/Filter**
   - Add search by contract code, PO number
   - Filter by status, date ranges

3. **Bulk Actions**
   - Select multiple contracts
   - Bulk status changes

4. **Export**
   - Export contracts to CSV/Excel

5. **Print View**
   - Printer-friendly contract list

## Dependencies

- Angular 20+
- Angular Material 20.2.14
- RxJS
- Moment.js (for date handling)

## Contact

For questions or issues, reference JIRA ticket **MLT-14097** or the linked story **MLT-12431**.
