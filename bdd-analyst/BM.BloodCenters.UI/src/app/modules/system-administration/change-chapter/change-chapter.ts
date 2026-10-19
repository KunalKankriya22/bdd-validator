import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { switchMap, map, Subject, takeUntil } from 'rxjs';

import {
  ChangeChapterWarehouseService,
  ChangeChapterWarehouseRequest,
  ChapterResponse,
  WarehouseResponse,
} from './services/change-chapter-warehouse.service';
import { HeaderService } from '../../../shared/services/header.service';

/* DIALOG DATA*/
export interface ChangeChapterDialogData {
  chapterId: string;
  chapterName: string;
  warehouseId: string;
  warehouseName: string;
}

@Component({
  selector: 'app-change-chapter',
  standalone: true,
  templateUrl: './change-chapter.html',
  styleUrls: ['./change-chapter.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatSelectSearchModule,
  ],
})
export class ChangeChapterComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  previousChapter!: string;
  previousWarehouse!: string;

  filteredChapters: ChapterResponse[] = [];
  filteredWarehouses: WarehouseResponse[] = [];

  previousChapterName = '';
  previousWarehouseName = '';

  chapters: ChapterResponse[] = [];
  warehouses: WarehouseResponse[] = [];

  chapterSearchControl = new FormControl('');
  warehouseSearchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ChangeChapterComponent>,
    private service: ChangeChapterWarehouseService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    @Inject(MAT_DIALOG_DATA) public data: ChangeChapterDialogData,
  ) {}

  /* INIT*/
  ngOnInit(): void {
    this.form = this.fb.group({
      chapterId: [null, Validators.required],
      warehouseId: [null, Validators.required],
    });

    // Set current values from dialog data
    this.previousChapter = this.data.chapterId;
    this.previousWarehouse = this.data.warehouseId;
    this.previousChapterName = this.data.chapterName;
    this.previousWarehouseName = this.data.warehouseName;

    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterChapters());

    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterWarehouses());

    // Load chapters
    this.service.getAllChapters().subscribe({
      next: (chapters) => {
        this.chapters = chapters ?? [];
        this.filteredChapters = this.chapters.slice();
        this.form.patchValue({ chapterId: this.data.chapterId });
        this.loadWarehouses(this.data.chapterId, this.data.warehouseId);
      },
      error: () => this.showError('Failed to load chapters'),
    });

    // chapter change
    this.form.get('chapterId')!.valueChanges.subscribe((chapterId) => {
      if (!chapterId) return;

      this.form.get('warehouseId')!.reset();
      this.previousWarehouseName = '';

      const chapter = this.chapters.find((c) => c.chapterId === chapterId);
      this.previousChapterName = chapter?.chapterName ?? '';

      this.loadWarehouses(chapterId);
    });

    // warehouse change
    this.form.get('warehouseId')!.valueChanges.subscribe((warehouseId) => {
      const wh = this.warehouses.find((w) => w.warehouseId === warehouseId);
      this.previousWarehouseName = wh?.warehouseName ?? '';
    });
  }

  private loadWarehouses(chapterId: string, preselectWarehouse?: string): void {
    this.warehouseSearchControl.setValue('');
    this.service.getWarehousesByChapter(chapterId).subscribe({
      next: (res) => {
        this.warehouses = res ?? [];
        this.filteredWarehouses = this.warehouses.slice();

        if (preselectWarehouse) {
          this.form.patchValue({ warehouseId: preselectWarehouse });

          const wh = this.warehouses.find((w) => w.warehouseId === preselectWarehouse);
          this.previousWarehouseName = wh?.warehouseName ?? '';
        }
      },
      error: () => this.showError('Failed to load warehouses'),
    });
  }

  private filterChapters(): void {
    const search = (this.chapterSearchControl.value ?? '').toLowerCase();
    this.filteredChapters = !search
      ? this.chapters.slice()
      : this.chapters.filter((c) => c.chapterId.toLowerCase().includes(search));
  }

  private filterWarehouses(): void {
    const search = (this.warehouseSearchControl.value ?? '').toLowerCase();
    this.filteredWarehouses = !search
      ? this.warehouses.slice()
      : this.warehouses.filter((w) => w.warehouseId.toLowerCase().includes(search));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* CLOSE*/
  close(): void {
    this.dialogRef.close(false);
  }

  /*SUBMIT*/
  submit(): void {
    if (this.form.invalid) {
      this.showError('Please select Chapter and Warehouse');
      return;
    }

    const raw = this.form.value;

    const chapter = this.chapters.find((c) => c.chapterId === raw.chapterId);
    const warehouse = this.warehouses.find((w) => w.warehouseId === raw.warehouseId);

    if (!chapter || !warehouse) {
      this.showError('Invalid selection');
      return;
    }

    // Get userId from header
    const userId = this.headerService.headerConfig()?.user?.id;

    if (!userId) {
      this.showError('User ID not found. Please try logging in again.');
      return;
    }

    const payload: ChangeChapterWarehouseRequest = {
      userId: userId,
      oldChapterId: this.previousChapter,
      oldWarehouseId: this.previousWarehouse,
      newChapterId: chapter.chapterId,
      newChapterName: chapter.chapterName,
      newWarehouseId: warehouse.warehouseId,
      newWarehouseName: warehouse.warehouseName,
    };

    this.service.updateChapterAndWarehouse(payload).pipe(
      switchMap((updateResponse) => {
        return this.service.getChapterDetails(updateResponse.newChapterId).pipe(
          map((chapterDetails) => ({ updateResponse, chapterDetails }))
        );
      })
    ).subscribe({
      next: ({ updateResponse, chapterDetails }) => {
        // Update header signals and cookies directly
        this.headerService.updateChapterAndWarehouse(
          chapterDetails.chapterId,
          chapterDetails.chapterName,
          updateResponse.newWarehouseId,
          payload.newWarehouseName,
          chapterDetails.chapterTimezone
        );

        sessionStorage.removeItem('driveContext');
        sessionStorage.removeItem('labelPrinterContext');
        this.snackBar.open(
          `Your chapter is now "${chapterDetails.chapterId}" and your warehouse is now "${updateResponse.newWarehouseId}"`,
          'DISMISS',
          { duration: 5000, horizontalPosition: 'right', verticalPosition: 'top' }
        );
        this.dialogRef.close(true);
      },
      error: (err) => this.showError(err?.error?.message ?? 'Update failed'),
    });
  }

  /*SNACKBAR*/
  private showError(msg: string): void {
    this.snackBar.open(msg, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
