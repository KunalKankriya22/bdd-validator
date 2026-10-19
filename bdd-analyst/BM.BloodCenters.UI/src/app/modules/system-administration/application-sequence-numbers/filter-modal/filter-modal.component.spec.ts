import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { FilterModalComponent } from './filter-modal.component';
import { ApplicationSequenceNumber, ApplicationSequenceNumberFilterParams, ApplicationSequenceNumberFilterDropdownDto } from '../interfaces/application-sequence-number.interface';
import { ApplicationSequenceNumbersApiService } from '../services/application-sequence-numbers-api.service';

describe('FilterModalComponent', () => {
  let component: FilterModalComponent;
  let fixture: ComponentFixture<FilterModalComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FilterModalComponent>>;
  let mockApiService: jasmine.SpyObj<ApplicationSequenceNumbersApiService>;

  const mockData: ApplicationSequenceNumber[] = [
    {
      chapterId: 'IBC',
      chapterName: 'Versiti - IN DTL',
      numberType: 'GELTUBE_BOX',
      maxNumber: 2000,
      startingNumber: 310,
      resetCycle: 'D',
      lastResetDate: new Date('2026-01-15')
    },
    {
      chapterId: 'CH01',
      chapterName: 'Chapter 01',
      numberType: 'BATCH_SEQ',
      maxNumber: 7140,
      startingNumber: 7140,
      resetCycle: 'Y',
      lastResetDate: null
    },
    {
      chapterId: 'CH02',
      chapterName: 'Chapter 02',
      numberType: 'TB_SEQ',
      maxNumber: 714,
      startingNumber: null,
      resetCycle: null,
      lastResetDate: null
    }
  ];

  const mockFilterDropdownData: ApplicationSequenceNumberFilterDropdownDto = {
    chapterIds: ['IBC', 'CH01', 'CH02'],
    chapterNames: ['Versiti - IN DTL', 'Chapter 01', 'Chapter 02'],
    numberTypes: ['GELTUBE_BOX', 'BATCH_SEQ', 'TB_SEQ'],
    cycles: ['D', 'Y']
  };

  const mockCurrentFilters: ApplicationSequenceNumberFilterParams = {
    chapterId: null,
    chapterName: null,
    numberType: null,
    cycle: null
  };

  beforeEach(() => {

    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockApiService = jasmine.createSpyObj('ApplicationSequenceNumbersApiService', ['getFilterDropdownValues']);
    mockApiService.getFilterDropdownValues.and.returnValue(of(mockFilterDropdownData));



      TestBed.configureTestingModule({
      imports: [
        FilterModalComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { currentFilters: mockCurrentFilters } },
        { provide: ApplicationSequenceNumbersApiService, useValue: mockApiService }
      ]
    });


    


      dialogRef.close.calls.reset();


      mockApiService.getFilterDropdownValues.calls.reset();


      mockApiService.getFilterDropdownValues.and.returnValue(of(mockFilterDropdownData));


    fixture = TestBed.createComponent(FilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize with null filter values', () => {
    expect(component.filterForm.value).toEqual({
      chapterId: null,
      chapterName: null,
      numberType: null,
      cycle: null
    });
  });

  it('should extract unique chapter IDs from data', () => {
    const chapters = component.chapterIdOptions();
    expect(chapters.length).toBe(3);
    expect(chapters).toContain('CH01');
    expect(chapters).toContain('CH02');
    expect(chapters).toContain('IBC');
  });

  it('should extract unique chapter names from data', () => {
    const names = component.chapterNameOptions();
    expect(names.length).toBe(3);
    expect(names).toContain('Chapter 01');
    expect(names).toContain('Chapter 02');
    expect(names).toContain('Versiti - IN DTL');
  });

  it('should extract unique number types from data', () => {
    const types = component.numberTypeOptions();
    expect(types.length).toBe(3);
    expect(types).toContain('BATCH_SEQ');
    expect(types).toContain('GELTUBE_BOX');
    expect(types).toContain('TB_SEQ');
  });

  it('should have cycle options from enum', () => {
    const cycles = component.cycleOptions();
    expect(cycles.length).toBe(2);
    expect(cycles[0].code).toBe('D');
    expect(cycles[1].code).toBe('Y');
  });

  it('should filter chapter IDs based on search', () => {
    // Initially, all chapter IDs should be visible
    expect(component.filteredChapterIds().length).toBe(3);

    // Search for "IB"
    component.chapterIdSearchControl.setValue('IB');
    expect(component.filteredChapterIds().length).toBe(1);
    expect(component.filteredChapterIds()).toContain('IBC');

    // Search for "CH"
    component.chapterIdSearchControl.setValue('CH');
    expect(component.filteredChapterIds().length).toBe(2);
    expect(component.filteredChapterIds()).toContain('CH01');
    expect(component.filteredChapterIds()).toContain('CH02');

    // Clear search
    component.chapterIdSearchControl.setValue('');
    expect(component.filteredChapterIds().length).toBe(3);
  });

  it('should filter chapter names based on search', () => {
    // Initially, all chapter names should be visible
    expect(component.filteredChapterNames().length).toBe(3);

    // Search for "Versiti"
    component.chapterNameSearchControl.setValue('Versiti');
    expect(component.filteredChapterNames().length).toBe(1);
    expect(component.filteredChapterNames()).toContain('Versiti - IN DTL');

    // Search for "Chapter" (case-insensitive)
    component.chapterNameSearchControl.setValue('chapter');
    expect(component.filteredChapterNames().length).toBe(2);
    expect(component.filteredChapterNames()).toContain('Chapter 01');
    expect(component.filteredChapterNames()).toContain('Chapter 02');

    // Clear search
    component.chapterNameSearchControl.setValue('');
    expect(component.filteredChapterNames().length).toBe(3);
  });

  it('should filter number types based on search', () => {
    // Initially, all number types should be visible
    expect(component.filteredNumberTypes().length).toBe(3);

    // Search for "BATCH"
    component.numberTypeSearchControl.setValue('BATCH');
    expect(component.filteredNumberTypes().length).toBe(1);
    expect(component.filteredNumberTypes()).toContain('BATCH_SEQ');

    // Search for "SEQ"
    component.numberTypeSearchControl.setValue('SEQ');
    expect(component.filteredNumberTypes().length).toBe(2);
    expect(component.filteredNumberTypes()).toContain('BATCH_SEQ');
    expect(component.filteredNumberTypes()).toContain('TB_SEQ');

    // Clear search
    component.numberTypeSearchControl.setValue('');
    expect(component.filteredNumberTypes().length).toBe(3);
  });

  it('should return empty array when search has no matches', () => {
    component.chapterIdSearchControl.setValue('NONEXISTENT');
    expect(component.filteredChapterIds().length).toBe(0);

    component.chapterNameSearchControl.setValue('NONEXISTENT');
    expect(component.filteredChapterNames().length).toBe(0);

    component.numberTypeSearchControl.setValue('NONEXISTENT');
    expect(component.filteredNumberTypes().length).toBe(0);
  });

  it('should apply filters and close dialog', () => {
    component.filterForm.patchValue({
      chapterId: 'IBC',
      chapterName: 'Versiti - IN DTL',
      numberType: 'GELTUBE_BOX',
      cycle: 'D'
    });

    component.onApply();

    expect(dialogRef.close).toHaveBeenCalledWith({
      chapterId: 'IBC',
      chapterName: 'Versiti - IN DTL',
      numberType: 'GELTUBE_BOX',
      cycle: 'D'
    });
  });





  it('should handle null values as "All"', () => {
    component.filterForm.patchValue({
      chapterId: null,
      chapterName: null,
      numberType: null,
      cycle: null
    });

    component.onApply();

    expect(dialogRef.close).toHaveBeenCalledWith({
      chapterId: null,
      chapterName: null,
      numberType: null,
      cycle: null
    });
  });
});
