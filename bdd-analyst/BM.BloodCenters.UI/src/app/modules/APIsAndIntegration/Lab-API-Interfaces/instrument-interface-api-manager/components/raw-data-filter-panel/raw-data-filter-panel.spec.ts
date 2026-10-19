import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RawDataFilterPanel, RawDataFilterValue } from './raw-data-filter-panel';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';

describe('RawDataFilterPanel', () => {
  let component: RawDataFilterPanel;
  let fixture: ComponentFixture<RawDataFilterPanel>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', ['getFileIds']);
    mockService.getFileIds.and.returnValue(of({ data: [] }));

    TestBed.configureTestingModule({
      imports: [
        RawDataFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(RawDataFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize the form with null fileId when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('fileId')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = { fileId: 'FILE-001' };
    fixture.detectChanges();

    expect(component.filterForm.get('fileId')?.value).toBe('FILE-001');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ fileId: 'FILE-002' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({ fileId: 'FILE-002' });
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ fileId: 'FILE-X' });

    component.onClear();

    expect(component.filterForm.get('fileId')?.value).toBeNull();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');

    component.onClose();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should extract file IDs from rawDataList when available', () => {
    component.rawDataList = [
      { fileId: 'A' },
      { fileId: 'B' },
      { fileId: 'A' },
      { fileId: null }
    ];
    fixture.detectChanges();

    expect(component.fileIdOptions).toEqual(['A', 'B']);
    expect(component.loadingFileIds).toBeFalse();
  });

  it('should call service when rawDataList is empty and chapterId/instrumentId are set', () => {
    component.rawDataList = [];
    component.chapterId = 'CH1';
    component.instrumentId = 'INST1';
    mockService.getFileIds.and.returnValue(of({ data: [{ fileId: 'SVC-1' }] }));

    fixture.detectChanges();

    expect(mockService.getFileIds).toHaveBeenCalledWith('CH1', 'INST1', 'both');
  });

  it('should handle service error gracefully', () => {
    component.rawDataList = [];
    component.chapterId = 'CH1';
    component.instrumentId = 'INST1';
    mockService.getFileIds.and.returnValue(throwError(() => new Error('fail')));

    fixture.detectChanges();

    expect(component.loadingFileIds).toBeFalse();
  });

  it('should track hasActiveFilters when fileId is set', () => {
    fixture.detectChanges();

    expect(component.hasActiveFilters).toBeFalse();

    component.filterForm.patchValue({ fileId: 'F1' });
    expect(component.hasActiveFilters).toBeTrue();
  });
});
