import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InternationalAddressFormComponent } from '../international-address-form/international-address-form.component';
import { InternationalAddressModel, InternationalAddressDialogData } from '../../models/international-address.model';

/**
 * International Address Dialog Component
 *
 * A reusable dialog wrapper around `InternationalAddressFormComponent`.
 * Supports two modes based on whether `targetTable` is provided:
 *
 * - **DB mode** (`targetTable` set): Form saves to backend via `InternationalAddressService.saveAddress()`,
 *   links the address to the target table record, and returns `{ addressId }` on close.
 * - **Non-DB mode** (`targetTable` omitted/null): Form returns the `InternationalAddressModel` data
 *   on close without any server call — caller handles persistence.
 *
 * ──────────────────────────────────────────────────────────────
 *
 * @example
 * // ─── Example 1: DB Mode — Save to Backend ───
 * // The dialog saves the address to the server and links it to a target table record.
 * // Use when the record already exists in the database and you want the address persisted immediately.
 *
 * // Step 1: Add imports to your component
 * import { MatDialog } from '@angular/material/dialog';
 * import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
 * import { InternationalAddressDialogData } from '@shared/models/international-address.model';
 *
 * // Step 2: Inject MatDialog
 * private readonly dialog = inject(MatDialog);
 *
 * // Step 3: Open dialog with targetTable and record keys
 * openAddressDialog(): void {
 *   const dialogData: InternationalAddressDialogData = {
 *     existingAddress: null,                              // null = new address, or pass InternationalAddressModel to edit
 *     targetTable: 'SPONSOR_CONTACT',                     // backend table constant (triggers DB save)
 *     recordKeyValues: ['SPON036567', 'SPCON92189'],      // PK values matching backend PrimaryKeyColumns order
 *     chapterId: this.headerService.getCurrentChapterId(),
 *     existingAddressId: null                             // null = create new, or pass ADDRESS_ID to update existing
 *   };
 *
 *   this.dialog.open(InternationalAddressDialogComponent, {
 *     width: '600px',
 *     panelClass: 'right-side-drawer',                     // shared side-panel positioning
 *     position: { right: '0', top: '64px' },              // optional: right-aligned panel
 *     height: 'calc(100vh - 64px)',                        // optional: full height
 *     data: dialogData
 *   }).afterClosed().subscribe(result => {
 *     if (result?.addressId) {
 *       console.log('Saved ADDRESS_ID:', result.addressId);
 *       // Refresh your data, close parent panel, etc.
 *     }
 *     // result is undefined if user cancelled
 *   });
 * }
 *
 * @example
 * // ─── Example 2: Non-DB Mode — Local Only (No Server Save) ───
 * // The dialog returns the address form data without making any API call.
 * // Use when the parent record doesn't exist yet (e.g., inside an "Add New" flow),
 * // or when you want to collect the address and save it yourself as part of a larger payload.
 *
 * // Step 1: Add imports to your component
 * import { MatDialog } from '@angular/material/dialog';
 * import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
 * import { InternationalAddressDialogData, InternationalAddressModel } from '@shared/models/international-address.model';
 *
 * // Step 2: Inject MatDialog and create a signal to hold the address data
 * private readonly dialog = inject(MatDialog);
 * readonly intlAddressData = signal<InternationalAddressModel | null>(null);
 *
 * // Step 3: Open dialog WITHOUT targetTable — no DB call will be made
 * openAddressDialog(): void {
 *   const dialogData: InternationalAddressDialogData = {
 *     existingAddress: this.intlAddressData(),             // pass previously captured data for editing, or null
 *     // targetTable: omitted — triggers non-DB mode
 *     // recordKeyValues: not needed
 *     // chapterId: not needed
 *     // existingAddressId: not needed
 *   };
 *
 *   this.dialog.open(InternationalAddressDialogComponent, {
 *     width: '600px',
 *     panelClass: 'right-side-drawer',
 *     position: { right: '0', top: '64px' },
 *     height: 'calc(100vh - 64px)',
 *     data: dialogData
 *   }).afterClosed().subscribe((result: InternationalAddressModel | undefined) => {
 *     if (result) {
 *       this.intlAddressData.set(result);                  // store locally
 *       console.log('Address captured:', result);
 *       // Include result in your parent form's save payload later
 *     }
 *     // result is undefined if user cancelled
 *   });
 * }
 *
 * // Step 4: Include the address when saving the parent record
 * saveParentRecord(): void {
 *   const payload = {
 *     ...this.parentForm.getRawValue(),
 *     internationalAddress: this.intlAddressData()         // attach captured address
 *   };
 *   this.myService.create(payload).subscribe();
 * }
 *
 * @example
 * // ─── Example 3: Inline Form (No Dialog) ───
 * // Use `InternationalAddressFormComponent` directly in your template.
 * // Supports both DB and non-DB modes via the same targetTable input.
 *
 * // In your component's imports array:
 * import { InternationalAddressFormComponent } from '@shared/components/international-address-form/international-address-form.component';
 *
 * // ── DB mode (inline) ──
 * // <app-international-address-form
 * //   [existingAddress]="existingAddress"
 * //   [targetTable]="'SPONSOR_CONTACT'"
 * //   [recordKeyValues]="['SPON036567', 'SPCON92189']"
 * //   [chapterId]="chapterId"
 * //   [existingAddressId]="existingAddrId"
 * //   [showActions]="true"
 * //   [submitLabel]="'SAVE'"
 * //   (saved)="onAddressSaved($event)"
 * //   (cancelled)="onCancelled()">
 * // </app-international-address-form>
 *
 * // ── Non-DB mode (inline) ──
 * // <app-international-address-form
 * //   [existingAddress]="capturedAddress"
 * //   [showActions]="false"
 * //   #intlAddressFormRef>
 * // </app-international-address-form>
 * //
 * // Access form data: intlAddressFormRef.getFormValue()
 * // Check validity: intlAddressFormRef.addressForm.valid
 *
 * // Handler examples:
 * onAddressSaved(addressId: number): void {
 *   console.log('Saved ADDRESS_ID:', addressId);
 * }
 *
 * onAddressApplied(address: InternationalAddressModel): void {
 *   this.capturedAddress = address; // store locally for later use
 * }
 */
@Component({
  selector: 'app-international-address-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    InternationalAddressFormComponent
  ],
  templateUrl: './international-address-dialog.component.html',
  styleUrls: ['./international-address-dialog.component.scss']
})
export class InternationalAddressDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InternationalAddressDialogComponent>);
  readonly data = inject<InternationalAddressDialogData>(MAT_DIALOG_DATA);

  onApplied(addressData: InternationalAddressModel | null): void {
    this.dialogRef.close(addressData);
  }

  onSaved(addressId: number): void {
    this.dialogRef.close({ addressId });
  }

  onCancelled(): void {
    this.dialogRef.close();
  }

  onCleared(): void {
    // Don't close dialog, just clear the form
    // User needs to click APPLY to close and enable domestic fields
  }
}
