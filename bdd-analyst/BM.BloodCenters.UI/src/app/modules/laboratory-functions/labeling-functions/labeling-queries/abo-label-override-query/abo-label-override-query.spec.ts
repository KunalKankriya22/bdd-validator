import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { AboLabelOverrideQueryComponent } from './abo-label-override-query';
import { AboLabelOverrideQueryService } from './abo-label-override-query.service';
import {
  AboLabelOverrideRecord,
  ValidateUnitResponseDto,
  ApiResponse,
} from './abo-label-override-query.model';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('AboLabelOverrideQueryComponent', () => {
  let component: AboLabelOverrideQueryComponent;
  let fixture: ComponentFixture<AboLabelOverrideQueryComponent>;
  let mockService: jasmine.SpyObj<AboLabelOverrideQueryService>;
  let snackBarOpenSpy: jasmine.Spy;
  let mockPageHeaderService: { pageHeaderData: ReturnType<typeof signal<any>> };

  const mockUnit: ValidateUnitResponseDto = {
    unitId: 'U12345',
    collDate: '2025-09-25',
    chapterId: 'CH01',
    isValid: true,
  };

  const mockRecord: AboLabelOverrideRecord = {
    unitId: 'U12345',
    productCode: 'E0001',
    componentPrefix: 'RBC',
    productDescription: 'Red Blood Cells',
    overrideDats: '2025-09-25T22:30:00',
    overrideDatsLocal: '2025-09-25T22:30:00',
    oldLabelDecision: 'A',
    oldLabelDescription: 'Type A',
    newLabelDecision: 'O',
    newLabelDescription: 'Type O',
    overrideCode: 'OVR01',
    overrideCodeDescription: 'Override Reason 1',
    overrideUserId: 'USER1',
    collDate: '2025-09-25',
    chapterId: 'CH01',
    commentNoteId: 101,
    noteText: 'Test comment',
  };

  const successValidateResponse: ApiResponse<ValidateUnitResponseDto[]> = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: [mockUnit],
    total: 1,
  };

  const successOverrideResponse: ApiResponse<AboLabelOverrideRecord[]> = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: [mockRecord],
    total: 1,
  };

  function createMockEvent(unitId = 'U12345') {
    return {
      data: { parsedUnitId: unitId },
      reject: jasmine.createSpy('reject'),
      confirm: jasmine.createSpy('confirm'),
    } as any;
  }

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AboLabelOverrideQueryService', [
      'validateUnit',
      'getOverrideRecords',
    ]);
    mockPageHeaderService = {
      pageHeaderData: signal({ title: 'ABO Label Override Query', subtitle: 'Query subtitle' }),
    };

    mockService.validateUnit.and.returnValue(of(successValidateResponse));
    mockService.getOverrideRecords.and.returnValue(of(successOverrideResponse));



      TestBed.configureTestingModule({
      imports: [AboLabelOverrideQueryComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: AboLabelOverrideQueryService, useValue: mockService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });


    


      mockService.validateUnit.calls.reset();


      mockService.getOverrideRecords.calls.reset();


      mockService.validateUnit.and.returnValue(of(successValidateResponse));


      mockService.getOverrideRecords.and.returnValue(of(successOverrideResponse));


    fixture = TestBed.createComponent(AboLabelOverrideQueryComponent);
    component = fixture.componentInstance;
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');


    });

  // ─── Component Creation ───────────────────────────────────────────────────


  // ─── Initialization ───────────────────────────────────────────────────────

  it('should initialize with empty header config title before detectChanges', () => {
    expect(component.headerConfig.title).toBe('');
  });

  it('should update header config from PageHeaderService on detectChanges', () => {
    fixture.detectChanges();

    expect(component.headerConfig.title).toBe('ABO Label Override Query');
    expect(component.headerConfig.breadcrumbs.length).toBe(2);
    expect(component.headerConfig.breadcrumbs[1].label).toBe('ABO Label Override Query');
    expect(component.headerConfig.breadcrumbs[1].link).toBeNull();
  });

  it('should preserve subtitle from pageHeaderData when subtitle is provided', () => {
    fixture.detectChanges();
    expect(component.headerConfig.subtitle).toBe('Query subtitle');
  });



  it('should initialize all signals with default values', () => {
    expect(component.isLoadingRecords()).toBeFalse();
    expect(component.collectionDate()).toBe('');
    expect(component.records()).toEqual([]);
    expect(component.hasSearched()).toBeFalse();
    expect(component.selectedIndex()).toBe(0);
  });

  it('should return null from selectedRecord computed when records is empty', () => {
    expect(component.selectedRecord()).toBeNull();
  });

  // ─── onUnitPostValidate — validation ─────────────────────────────────────



  it('should reject event when validateUnit returns success=false', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, success: false, message: 'Unit not found' }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Unit not found');
    expect(event.confirm).not.toHaveBeenCalled();
  });

  it('should reject with fallback message when success=false and message is null', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, success: false, message: null as any }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Unit ID not found.');
  });

  it('should reject event when validateUnit returns empty data array', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, data: [] }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalled();
    expect(event.confirm).not.toHaveBeenCalled();
  });

  it('should reject event when unit.isValid is false', () => {
    mockService.validateUnit.and.returnValue(
      of({
        ...successValidateResponse,
        data: [{ ...mockUnit, isValid: false }],
        message: 'Unit not valid for this chapter',
      }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Unit not valid for this chapter');
    expect(event.confirm).not.toHaveBeenCalled();
  });

  it('should confirm event when unit is valid', () => {
    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.confirm).toHaveBeenCalled();
    expect(event.reject).not.toHaveBeenCalled();
  });

  it('should reject event on validateUnit network error', () => {
    mockService.validateUnit.and.returnValue(throwError(() => new Error('Network error')));

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Failed to validate unit. Please try again.');
    expect(event.confirm).not.toHaveBeenCalled();
  });





  // ─── onUnitPostValidate — collectionDate ─────────────────────────────────

  it('should set collectionDate from unit.collDate on valid unit', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, data: [{ ...mockUnit, collDate: '2025-09-25' }] }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(component.collectionDate()).toBe('25-SEP-2025');
  });

  it('should set collectionDate to original value when date is invalid', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, data: [{ ...mockUnit, collDate: 'invalid-date' }] }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(component.collectionDate()).toBe('invalid-date');
  });

  it('should not set collectionDate when collDate is missing', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, data: [{ ...mockUnit, collDate: '' }] }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(component.collectionDate()).toBe('');
  });

  it('should reject event and not load records when collDate is empty', () => {
    mockService.validateUnit.and.returnValue(
      of({ ...successValidateResponse, data: [{ ...mockUnit, collDate: '' }] }),
    );

    const event = createMockEvent();
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Collection date not found for this unit.');
    expect(mockService.getOverrideRecords).not.toHaveBeenCalled();
  });

  // ─── loadOverrideRecords ──────────────────────────────────────────────────



  it('should set isLoadingRecords to true during getOverrideRecords call', () => {
    const subject = new Subject<ApiResponse<AboLabelOverrideRecord[]>>();
    mockService.getOverrideRecords.and.returnValue(subject.asObservable());

    component.onUnitPostValidate(createMockEvent());

    expect(component.isLoadingRecords()).toBeTrue();
    expect(component.hasSearched()).toBeFalse();

    subject.next(successOverrideResponse);
    subject.complete();

    expect(component.isLoadingRecords()).toBeFalse();
    expect(component.hasSearched()).toBeTrue();
  });

  it('should set hasSearched to true after records are loaded', () => {
    component.onUnitPostValidate(createMockEvent());
    expect(component.hasSearched()).toBeTrue();
  });

  it('should populate records from successful API response', () => {
    component.onUnitPostValidate(createMockEvent());

    expect(component.records().length).toBe(1);
    expect(component.records()[0].productCode).toBe('E0001');
    expect(component.records()[0].unitId).toBe('U12345');
  });

  it('should load multiple records and keep all', () => {
    const record2 = { ...mockRecord, productCode: 'E0002', commentNoteId: 102 };
    mockService.getOverrideRecords.and.returnValue(
      of({ ...successOverrideResponse, data: [mockRecord, record2], total: 2 }),
    );

    component.onUnitPostValidate(createMockEvent());

    expect(component.records().length).toBe(2);
  });

  it('should reset selectedIndex to 0 after loading records', () => {
    component.selectedIndex.set(3);
    component.onUnitPostValidate(createMockEvent());
    expect(component.selectedIndex()).toBe(0);
  });

  it('should set records to empty array when response data is null', () => {
    mockService.getOverrideRecords.and.returnValue(
      of({ ...successOverrideResponse, data: null as any }),
    );

    component.onUnitPostValidate(createMockEvent());

    expect(component.records()).toEqual([]);
  });













  it('should clear previous records before loading new ones', () => {
    component.records.set([mockRecord]);
    const subject = new Subject<ApiResponse<AboLabelOverrideRecord[]>>();
    mockService.getOverrideRecords.and.returnValue(subject.asObservable());

    component.onUnitPostValidate(createMockEvent());

    expect(component.records()).toEqual([]);
  });

  // ─── onUnitCleared ────────────────────────────────────────────────────────

  it('should reset all signals to initial state on onUnitCleared', () => {
    component.records.set([mockRecord]);
    component.collectionDate.set('25-SEP-2025');
    component.hasSearched.set(true);
    component.isLoadingRecords.set(true);
    component.selectedIndex.set(2);

    component.onUnitCleared();

    expect(component.records()).toEqual([]);
    expect(component.collectionDate()).toBe('');
    expect(component.hasSearched()).toBeFalse();
    expect(component.isLoadingRecords()).toBeFalse();
    expect(component.selectedIndex()).toBe(0);
  });

  // ─── onUnitValidated ─────────────────────────────────────────────────────

  it('should not throw when onUnitValidated is called', () => {
    expect(() => component.onUnitValidated({} as any)).not.toThrow();
  });

  // ─── onIndexChange ────────────────────────────────────────────────────────

  it('should update selectedIndex signal on onIndexChange', () => {
    component.records.set([mockRecord, { ...mockRecord, productCode: 'E0002', commentNoteId: 102 }]);
    component.onIndexChange(1);
    expect(component.selectedIndex()).toBe(1);
  });

  it('should reset selectedIndex to 0 on onIndexChange with 0', () => {
    component.selectedIndex.set(2);
    component.onIndexChange(0);
    expect(component.selectedIndex()).toBe(0);
  });

  // ─── selectedRecord computed ──────────────────────────────────────────────

  it('should return the record at selectedIndex', () => {
    const record2 = { ...mockRecord, productCode: 'E0002', commentNoteId: 102 };
    component.records.set([mockRecord, record2]);
    component.selectedIndex.set(1);

    expect(component.selectedRecord()?.productCode).toBe('E0002');
  });

  it('should return the first record when selectedIndex is 0', () => {
    component.records.set([mockRecord]);
    component.selectedIndex.set(0);

    expect(component.selectedRecord()?.productCode).toBe('E0001');
  });

  it('should return null when records array is empty', () => {
    component.records.set([]);
    expect(component.selectedRecord()).toBeNull();
  });



  // ─── optionLabel ──────────────────────────────────────────────────────────

  it('should return productCode from the record', () => {
    expect(component.optionLabel(mockRecord)).toBe('E0001');
  });

  it('should return correct productCode for different records', () => {
    const record2 = { ...mockRecord, productCode: 'E0002' };
    expect(component.optionLabel(record2)).toBe('E0002');
  });

  // ─── formatLocalDateTime ──────────────────────────────────────────────────

  it('should return dash for null value', () => {
    expect(component.formatLocalDateTime(null)).toBe('-');
  });

  it('should return dash for undefined value', () => {
    expect(component.formatLocalDateTime(undefined)).toBe('-');
  });



  it('should format a valid ISO datetime to DD-MMM-YYYY HH:mm uppercase', () => {
    const result = component.formatLocalDateTime('2025-09-25T22:30:00');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
  });

  it('should return the original value when date string is invalid', () => {
    expect(component.formatLocalDateTime('not-a-date')).toBe('not-a-date');
  });

  it('should return result in uppercase', () => {
    const result = component.formatLocalDateTime('2025-09-25T10:15:00');
    expect(result).toBe(result.toUpperCase());
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────

  it('should call next and complete on destroy$ when ngOnDestroy is called', () => {
    fixture.detectChanges();
    const nextSpy = spyOn((component as any).destroy$, 'next').and.callThrough();
    const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should not emit to in-flight getOverrideRecords after destroy', () => {
    const validateSubject = new Subject<ApiResponse<ValidateUnitResponseDto[]>>();
    const overrideSubject = new Subject<ApiResponse<AboLabelOverrideRecord[]>>();
    mockService.validateUnit.and.returnValue(validateSubject.asObservable());
    mockService.getOverrideRecords.and.returnValue(overrideSubject.asObservable());

    component.onUnitPostValidate(createMockEvent());
    validateSubject.next(successValidateResponse);

    component.ngOnDestroy();

    expect(() => {
      overrideSubject.next(successOverrideResponse);
      overrideSubject.complete();
    }).not.toThrow();

    expect(component.hasSearched()).toBeFalse();
  });
});
