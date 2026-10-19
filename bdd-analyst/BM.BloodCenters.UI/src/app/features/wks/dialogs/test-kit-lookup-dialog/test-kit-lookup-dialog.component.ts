import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import {
  TestKitLookupDialogData,
  TestKitLookupDialogResult,
  TestKitDto,
} from '../../wks.models';

@Component({
  selector: 'app-test-kit-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './test-kit-lookup-dialog.component.html',
  styleUrl: './test-kit-lookup-dialog.component.scss',
})
export class TestKitLookupDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `test-kit-lookup-dialog-${TestKitLookupDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly dialogRef = inject(MatDialogRef<TestKitLookupDialogComponent>);

  // Search control
  protected readonly searchControl = new FormControl('');
  protected readonly searchTerm = signal<string>('');

  // Table data
  protected readonly testKits = signal<TestKitDto[]>([]);
  protected readonly selectedKit = signal<TestKitDto | null>(null);

  // Computed filtered test kits
  protected readonly filteredTestKits = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const allKits = this.testKits();

    if (!search) return allKits;

    return allKits.filter(
      (kit) =>
        kit.kitId.toLowerCase().includes(search) ||
        (kit.reviewedBy || '').toLowerCase().includes(search) ||
        (kit.labCode || '').toLowerCase().includes(search) ||
        (kit.reagentType || '').toLowerCase().includes(search) ||
        (kit.name || '').toLowerCase().includes(search) ||
        (kit.expiryDate || '').toLowerCase().includes(search)
    );
  });

  protected readonly displayedColumns = [
    'select',
    'kitId',
    'reviewedBy',
    'labCode',
    'reagentType',
    'name',
    'expiryDate',
  ];

  protected readonly isEmpty = computed(() => this.filteredTestKits().length === 0);
  protected readonly hasSelection = computed(() => this.selectedKit() !== null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: TestKitLookupDialogData) {
    // Subscribe to search control changes
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerm.set(value || '');
    });
  }

  ngOnInit(): void {
    this.testKits.set(this.data.availableKits);
  }

  onSelectKit(kit: TestKitDto): void {
    this.selectedKit.set(kit);
  }

  isSelected(kit: TestKitDto): boolean {
    return this.selectedKit()?.kitId === kit.kitId;
  }

  onCancel(): void {
    const result: TestKitLookupDialogResult = {
      selectedKit: null as any,
      action: 'cancel',
    };
    this.dialogRef.close(result);
  }

  onContinue(): void {
    const kit = this.selectedKit();
    if (!kit) return;

    const result: TestKitLookupDialogResult = {
      selectedKit: kit,
      action: 'continue',
    };
    this.dialogRef.close(result);
  }
}
