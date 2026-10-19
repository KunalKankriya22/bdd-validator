import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';

import {
  ValidAttributesMatrixFilterValue,
  AttributeCodeDropdown,
  ModifierCodeDropdown
} from '../models/valid-attributes-matrix.model';

@Component({
  selector: 'app-valid-attributes-matrix-filter-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './valid-attributes-matrix-filter-panel.html',
  styleUrls: ['./valid-attributes-matrix-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidAttributesMatrixFilterPanel implements OnInit, OnDestroy, AfterViewInit {

  @Input() currentFilters: ValidAttributesMatrixFilterValue | null = null;
  @Input() attributeCodeOptions: AttributeCodeDropdown[] = [];
  @Input() deletedAttributeCodeOptions: AttributeCodeDropdown[] = [];
  @Input() associatedAttributeCodeOptions: AttributeCodeDropdown[] = [];
  @Input() modifierCodeOptions: ModifierCodeDropdown[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<ValidAttributesMatrixFilterValue>();

  @ViewChild('filterCloseBtn', { read: ElementRef }) filterCloseBtn?: ElementRef<HTMLElement>;

  filterForm!: FormGroup;

  filteredAddedCodes: AttributeCodeDropdown[] = [];
  filteredModifierCodes: ModifierCodeDropdown[] = [];
  filteredDeletedCodes: AttributeCodeDropdown[] = [];
  addedCodeSearchCtrl = new FormControl('');
  modifierSearchCtrl = new FormControl('');
  deletedCodeSearchCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initFilteredLists();
    this.setupSearchListeners();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.filterCloseBtn?.nativeElement?.focus(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.close.emit());
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      associatedAttribCode: [this.currentFilters?.associatedAttribCode ?? null],
      deleteModifierCode: [this.currentFilters?.deleteModifierCode ?? null],
      attribDeletedCode: [this.currentFilters?.attribDeletedCode ?? null]
    });
  }

  private initFilteredLists(): void {
    this.filteredAddedCodes = this.associatedAttributeCodeOptions || [];
    this.filteredModifierCodes = this.modifierCodeOptions || [];
    this.filteredDeletedCodes = this.deletedAttributeCodeOptions || [];
  }

  private setupSearchListeners(): void {
    this.addedCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredAddedCodes = this.filterAttrCodes(this.associatedAttributeCodeOptions, s);
    });
    this.modifierSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredModifierCodes = this.filterModCodes(this.modifierCodeOptions, s);
    });
    this.deletedCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredDeletedCodes = this.filterAttrCodes(this.deletedAttributeCodeOptions, s);
    });
  }

  private filterAttrCodes(list: AttributeCodeDropdown[], search: string | null): AttributeCodeDropdown[] {
    if (!search) return list || [];
    const lower = search.toLowerCase();
    return (list || []).filter(o =>
      (o.attribCode || '').toLowerCase().includes(lower) || (o.attribDesc || '').toLowerCase().includes(lower)
    );
  }

  private filterModCodes(list: ModifierCodeDropdown[], search: string | null): ModifierCodeDropdown[] {
    if (!search) return list || [];
    const lower = search.toLowerCase();
    return (list || []).filter(o =>
      (o.code || '').toLowerCase().includes(lower) || (o.description || '').toLowerCase().includes(lower)
    );
  }

  onDropdownClosed(searchCtrl: FormControl, type: 'added' | 'modifier' | 'deleted' | 'attr'): void {
    searchCtrl.setValue('');
    switch (type) {
      case 'added': this.filteredAddedCodes = this.associatedAttributeCodeOptions || []; break;
      case 'modifier': this.filteredModifierCodes = this.modifierCodeOptions || []; break;
      case 'deleted': this.filteredDeletedCodes = this.deletedAttributeCodeOptions || []; break;
    }
  }

  onApply(): void {
    const v = this.filterForm.getRawValue();
    const filters: ValidAttributesMatrixFilterValue = {
      associatedAttribCode: v.associatedAttribCode ?? undefined,
      deleteModifierCode: v.deleteModifierCode ?? undefined,
      attribDeletedCode: v.attribDeletedCode ?? undefined
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      associatedAttribCode: null,
      deleteModifierCode: null,
      attribDeletedCode: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    if (!this.filterForm) return true;
    const v = this.filterForm.value;
    return !(
      (v.associatedAttribCode !== null && v.associatedAttribCode !== '') ||
      (v.deleteModifierCode !== null && v.deleteModifierCode !== '') ||
      (v.attribDeletedCode !== null && v.attribDeletedCode !== '')
    );
  }
}
