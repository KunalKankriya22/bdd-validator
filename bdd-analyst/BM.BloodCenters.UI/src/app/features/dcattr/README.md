# Delete Component Attributes (DCATTR)

## Overview

The Delete Component Attributes feature allows users to manage interdictions on specific blood components to prevent their processing or release until restrictions are resolved. This module provides functionality to validate units, preview attribute deletions, and execute attribute removal with proper verification.

## JIRA Ticket

**Ticket ID**: MLT-13187

## Component Structure

```
src/app/features/dcattr/
├── dcattr.component.ts                                    # Main component
├── dcattr.component.html                                  # Component template
├── dcattr.component.scss                                  # Component styles
├── dcattr.component.spec.ts                               # Component unit tests
├── dcattr.service.ts                                      # API service
├── dcattr.service.spec.ts                                 # Service unit tests
├── dcattr.models.ts                                       # TypeScript interfaces/DTOs
├── product-attribute-history-dialog.component.ts         # History dialog component
├── product-attribute-history-dialog.component.html       # History dialog template
├── product-attribute-history-dialog.component.scss       # History dialog styles
├── product-attribute-history-dialog.component.spec.ts    # History dialog tests
└── README.md                                              # This file
```

## Route Configuration

### Mnemonic
- **Code**: `DCATTR`
- **Menu Label**: Delete Component Attributes

### Route Path
- **Full Path**: `/laboratory-functions/attributes-interdictions/dcattr`
- **Module**: Laboratory Functions
- **Section**: Attributes and Interdictions

### Breadcrumb
Laboratory Functions → Attributes and Interdictions → Delete Component Attributes

## API Endpoints

All endpoints are prefixed with `/api/delete-component-attribute`

### 1. Validate Unit
- **Method**: POST
- **Endpoint**: `/validate-unit`
- **Request**: `{ unitId: string }`
- **Response**: `{ collectionDate: string }`
- **Error Codes**: 0210, 0063, 4314, 0175

### 2. Get Deletable Attributes
- **Method**: GET
- **Endpoint**: `/deletable-attributes`
- **Query Params**: `unitId`, `collDate`, `productCode`
- **Response**: `DeletableAttributeDto[]`

### 3. Preview New Product Code
- **Method**: POST
- **Endpoint**: `/preview-new-product-code`
- **Request**: `PreviewProductCodeRequestDto`
- **Response**: `{ newProductCode: string }`
- **Error Codes**: 9726

### 4. Delete Attribute
- **Method**: POST
- **Endpoint**: `/delete`
- **Request**: `DeleteAttributeRequestDto`
- **Response**: `{ newProductCode: string }`
- **Error Codes**: 0006, 0241, 1205, 1100, 9728, 9739

### 5. Get Attribute History
- **Method**: GET
- **Endpoint**: `/attribute-history`
- **Query Params**: `unitId`, `collDate`
- **Response**: `ProductAttributeLogDto[]`

## Features

### Form Validation
- Unit ID: Required, max 15 characters
- Product Code: Required, max 8 characters (dropdown)
- Attribute Code: Required, max 10 characters (dropdown)
- Verify Product Code: Must match New Product Code, max 8 characters

### Workflow
1. **Unit Validation**: User enters Unit ID and clicks lookup button
2. **Product Selection**: System loads available product codes after successful validation
3. **Attribute Selection**: User selects Product Code, then Attribute Code
4. **Preview**: System automatically previews the new product code
5. **Verification**: User enters new product code in verification field
6. **Deletion**: User clicks DELETE button (enabled only when verification matches)
7. **Confirmation**: System shows confirmation dialog before deletion
8. **Success**: Success message displayed, form resets for next operation

### Product Attribute History Dialog
- Opens via "PRODUCT ATTRIBUTE HISTORY" button
- Displays all attribute changes for the validated unit
- Columns: Attribute Code, Product Code, Change Type, User ID, Change Date
- Change types: ADD (A), DELETE (D), MODIFY (M)
- Includes pagination (10, 25, 50 rows per page)

### Data Table
- Displays all deletable attributes for the selected unit and product code
- Columns: Unit ID, Product Code, Description, Attribute Code, Description, New Product Code, Description, Verify Product
- Pagination: Default 10 rows, options [10, 25, 50]
- Read-only display (selection via dropdowns in form)

## Accessibility Features

### WCAG 2.1 Level AA Compliance
- Unique IDs for all form elements using static counter pattern
- `aria-labelledby` for sections and headings
- `aria-describedby` linking errors to form fields
- `aria-invalid` for invalid fields
- `role="alert"` for error messages
- `role="status"` for loading states
- Keyboard navigation support
- Focus management

### Screen Reader Support
- Descriptive labels for all interactive elements
- Error announcements via `aria-live` regions
- Loading state announcements
- Table accessibility with proper headers

## State Management

Uses Angular signals for reactive state:
- `loading`: API call in progress
- `validatingUnit`: Unit validation in progress
- `collectionDate`: Stored after unit validation
- `unitValidated`: Tracks if unit has been validated
- `productCodes`: Available product codes list
- `attributes`: Deletable attributes list
- `newProductCode`: Preview result from API
- `submitted`: Form submission attempted

## Error Handling

### API Error Codes
| Code | Message | Cause |
|------|---------|-------|
| 0210 | Unit not found | Unit does not exist |
| 0063 | Collection date is null | Unit has no collection date |
| 4314 | No components for this unit | Unit has no manufactured components |
| 0175 | No deletable attributes | Unit has no attributes that can be deleted |
| 0006 | Product code does not exist | Product code not found for unit |
| 0241 | Warehouse ID mismatch | Component warehouse != user's warehouse |
| 1205 | Component must have a BAG_ID | BAG_ID is null |
| 1100 | Attribute is not deletable | Attribute marked as non-deletable |
| 9728 | Verification failed | verifyProdCode != newProdCode |
| 9726 | Product code generation failed | Stored procedure failed |
| 9739 | Deletion failed | Stored procedure execution failed |

### Error Display
- All errors displayed via SnackbarService (top-right corner)
- Inline mat-error for form field validation errors
- Loading spinners for async operations

## Database Integration

### Required Database Entry

The menu item must be added to `UTIL.FCN_MENU_ITEMS` table:

```sql
-- Add Delete Component Attributes to navigation menu
-- Mnemonic: DCATTR

INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID, FCN_ID, DESCRIP, SEQUENCE, MNEMONIC, REMARKS
)
SELECT
  {parent_menu_id},  -- Replace with actual Attributes and Interdictions menu ID
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Delete Component Attributes',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = {parent_menu_id}),
  'DCATTR',
  'Manage interdictions on specific components'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'DCATTR');

COMMIT;
```

## Testing

### Unit Tests
- Component: `dcattr.component.spec.ts` (26 test cases)
- Service: `dcattr.service.spec.ts` (15 test cases)
- History Dialog: `product-attribute-history-dialog.component.spec.ts` (20 test cases)

### Test Coverage
- ✓ Initialization and form setup
- ✓ Unit validation (success and error cases)
- ✓ Loading deletable attributes
- ✓ Preview new product code
- ✓ Delete attribute workflow
- ✓ Form validation
- ✓ Clear all functionality
- ✓ History dialog
- ✓ Accessibility attributes
- ✓ Unique ID generation
- ✓ Error handling

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
ng test --include='**/dcattr.component.spec.ts'
ng test --include='**/dcattr.service.spec.ts'
ng test --include='**/product-attribute-history-dialog.component.spec.ts'
```

## Build and Deployment

### Build
```bash
# Development build
npm run build -- --configuration=development

# Production build
npm run build -- --configuration=production
```

### File Locations
- **Component**: `src/app/features/dcattr/`
- **Route Registry**: `src/app/core/constants/route-registry.ts`
- **Route Keys**: `src/app/core/constants/route-keys.ts`
- **FCN Route Map**: `src/app/core/constants/fcn-route-map.ts`
- **Module Routes**: `src/app/modules/laboratory-functions/laboratory-functions.routes.ts`

## Dependencies

### Angular Material Components
- MatFormFieldModule
- MatInputModule
- MatButtonModule
- MatSelectModule
- MatIconModule
- MatProgressSpinnerModule
- MatTableModule
- MatPaginatorModule
- MatDialogModule

### Shared Services
- SnackbarService (error/success notifications)
- DcattrService (API integration)

### Shared Components
- ConfirmActionDialogComponent (delete confirmation)

## Future Enhancements

### TODO Items
1. **REPRINT Functionality**: Currently shows error message. Requires integration with print service.
2. **Product Codes LOV**: The `getProductCodes()` method in service needs actual API endpoint implementation.
3. **New Product Code Description**: Currently not populated. Needs API endpoint or LOV lookup.

## Notes

- The component uses standalone architecture (Angular 20+)
- All state management uses signals for reactivity
- Form uses reactive forms approach with FormGroup
- Follows WCAG 2.1 Level AA accessibility guidelines
- Matches existing codebase patterns and conventions
- All dates in ISO 8601 format (UTC)
- User context (UserId, ChapterId, WarehouseId) automatically injected from auth token

## Support

For issues or questions, refer to:
- API Documentation: `BM.BloodCenters.API/thoughts/shared/research/api-docs/delete-component-attributes-api-documentation.md`
- JIRA Ticket: MLT-13187
- Figma Design: `figma_screens/MLT-13187/Delete Component Attributes.png`

---

**Generated**: 2026-05-28
**Version**: 1.0.0
**Author**: Claude Code Assistant
