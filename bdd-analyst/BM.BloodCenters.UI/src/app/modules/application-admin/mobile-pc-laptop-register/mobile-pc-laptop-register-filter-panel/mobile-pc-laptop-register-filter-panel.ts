import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { MobilePcLaptopRegisterFilterValue, ChapterLookup } from '../models/mobile-pc-laptop-register.model';
import { MobilePcLaptopRegisterService } from '../services/mobile-pc-laptop-register.service';

@Component({
  selector: 'app-mobile-pc-laptop-register-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './mobile-pc-laptop-register-filter-panel.html',
  styleUrls: ['./mobile-pc-laptop-register-filter-panel.scss']
})
export class MobilePcLaptopRegisterFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: MobilePcLaptopRegisterFilterValue | null = null;

  @Output() apply = new EventEmitter<MobilePcLaptopRegisterFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  chapters: ChapterLookup[] = [];
  filteredChapters: ChapterLookup[] = [];
  chapterSearchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private mobilePcLaptopRegisterService: MobilePcLaptopRegisterService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterData();
    this.populateExistingFilters();
    this.setupValueChangeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      chapter: ['']
    });
  }

  private loadFilterData(): void {
    this.mobilePcLaptopRegisterService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapters) => {
          this.chapters = chapters;
          this.filteredChapters = [...chapters];
        },
        error: (_error: unknown) => {
          // Error snackbar handled globally in service
        }
      });
  }

  private populateExistingFilters(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue({
        chapter: this.currentFilters.chapter || ''
      });
    }
  }

  private setupValueChangeListeners(): void {
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredChapters = this.chapters.filter(ch =>
          ch.chapterId.toLowerCase().includes(term) ||
          ch.chapterName.toLowerCase().includes(term)
        );
      });
  }

  get isApplyDisabled(): boolean {
    return !this.hasChanges();
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: MobilePcLaptopRegisterFilterValue = {};

    if (formValue.chapter) {
      filters.chapter = formValue.chapter;
    }

    this.apply.emit(filters);
  }

  onCancel(): void {
    this.close.emit();
  }

  onReset(): void {
    this.filterForm.reset({
      chapter: ''
    });
  }

  hasChanges(): boolean {
    const formValue = this.filterForm.value;
    return !!formValue.chapter;
  }
}
