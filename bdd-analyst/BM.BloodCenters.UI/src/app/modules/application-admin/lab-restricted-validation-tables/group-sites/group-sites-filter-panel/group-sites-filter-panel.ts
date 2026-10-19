import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil } from 'rxjs';

import { GroupSitesFilterValue, ChapterLookup } from '../models/group-sites.model';
import { GroupSitesService } from '../services/group-sites.service';

@Component({
  selector: 'app-group-sites-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  templateUrl: './group-sites-filter-panel.html',
  styleUrls: ['./group-sites-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupSitesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: GroupSitesFilterValue | null = null;
  @Output() apply = new EventEmitter<GroupSitesFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search control for chapter ID dropdown
  readonly chapterIdSearchControl = new FormControl('');

  // All chapter options loaded from API
  private allChapterIds = signal<ChapterLookup[]>([]);

  // Search term signal
  private chapterIdSearch = signal('');

  // Filtered options based on search
  readonly filteredChapterIds = computed(() => {
    const search = this.chapterIdSearch().toLowerCase();
    const options = this.allChapterIds();
    if (!search) return options;
    return options.filter(chapter =>
      chapter.chapterId.toLowerCase().includes(search) ||
      chapter.chapterName.toLowerCase().includes(search)
    );
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private groupSitesService: GroupSitesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      chapterId: [this.currentFilters?.chapterId || null]
    });

    // Subscribe to search control changes
    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.chapterIdSearch.set(value || '');
      });

    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFilterOptions(): void {
    this.groupSitesService.getChapterIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapters: ChapterLookup[]) => {
          this.allChapterIds.set(chapters || []);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading chapter IDs:', error);
          this.allChapterIds.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.value;
    const filters: GroupSitesFilterValue = {
      chapterId: formValue.chapterId || null
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.chapterIdSearchControl.setValue('');
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;
    // Disable if no chapter ID is selected
    return formValue.chapterId === null || formValue.chapterId === undefined;
  }
}
