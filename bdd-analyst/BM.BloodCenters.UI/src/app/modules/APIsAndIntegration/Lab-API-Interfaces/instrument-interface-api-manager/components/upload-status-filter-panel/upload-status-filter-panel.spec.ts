import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UploadStatusFilterPanel, UploadStatusFilterValue } from './upload-status-filter-panel';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';

describe('UploadStatusFilterPanel', () => {
  let component: UploadStatusFilterPanel;
  let fixture: ComponentFixture<UploadStatusFilterPanel>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', [
      'getFileIds',
      'getTestBatchIds'
    ]);
    mockService.getFileIds.and.returnValue(of({ data: [] }));
    mockService.getTestBatchIds.and.returnValue(of({ data: [] }));

    TestBed.configureTestingModule({
      imports: [
        UploadStatusFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(UploadStatusFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('fileId')?.value).toBeNull();
    expect(component.filterForm.get('testBatchId')?.value).toBeNull();
    expect(component.filterForm.get('status')?.value).toBeNull();
    expect(component.filterForm.get('period')?.value).toBeNull();
    expect(component.filterForm.get('processDate')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      fileId: 'F1',
      testBatchId: 'TB1',
      status: 'SUCCESS',
      period: 'after',
      processDate: new Date(2025, 0, 1)
    };
    fixture.detectChanges();

    expect(component.filterForm.get('fileId')?.value).toBe('F1');
    expect(component.filterForm.get('testBatchId')?.value).toBe('TB1');
    expect(component.filterForm.get('status')?.value).toBe('SUCCESS');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      fileId: 'F1',
      testBatchId: null,
      status: 'ERROR',
      period: 'before',
      processDate: new Date(2025, 5, 1)
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      fileId: 'F1',
      status: 'ERROR',
      period: 'before'
    }));
  });

  it('should not emit apply when form is invalid', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ processDate: new Date(), period: null });
    component.onApply();

    expect(component.apply.emit).not.toHaveBeenCalled();
  });

  it('should reset all form values on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ fileId: 'F1', status: 'OK' });

    component.onClear();

    expect(component.filterForm.get('fileId')?.value).toBeNull();
    expect(component.filterForm.get('status')?.value).toBeNull();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should extract file IDs from uploadStatusList when available', () => {
    component.uploadStatusList = [
      { fileId: 'A' },
      { fileId: 'B' },
      { fileId: 'A' }
    ];
    fixture.detectChanges();

    expect(component.fileIdOptions).toEqual(['A', 'B']);
  });

  it('should extract test batch IDs from uploadStatusList when available', () => {
    component.uploadStatusList = [
      { ltTbId: 'TB1' },
      { ltTbId: 'TB2' },
      { ltTbId: 'TB1' }
    ];
    fixture.detectChanges();

    expect(component.testBatchIdOptions).toEqual(['TB1', 'TB2']);
  });

  it('should filter status options based on search', () => {
    component.statusOptions = [
      { value: 'S', label: 'Success' },
      { value: 'E', label: 'Error' },
      { value: 'P', label: 'Pending' }
    ];
    fixture.detectChanges();

    component.statusSearchControl.setValue('err');

    const filtered = component.filteredStatusOptions();
    expect(filtered.length).toBe(1);
    expect(filtered[0].value).toBe('E');
  });
});
