import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { ModifySeparationTimesComponent } from './modify-separation-times';
import { ModifySeparationTimesService } from './modify-separation-times.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  SeparationTimesData,
  CentrifugeOption,
  UnitValidationResult,
  CollectionDateOption,
} from './modify-separation-times.model';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub {
  @Input() config: any;
}

@Component({ selector: 'app-unit-id-field', template: '', standalone: true })
class UnitIdFieldStub {
  @Input() validateFfValue: any;
  @Input() required: any;
  @Input() label: any;
  @Input() placeholder: any;
  isValid = false;
  parsedUnitId: string | null = null;
  clear(): void {
    this.isValid = false;
    this.parsedUnitId = null;
  }
}

const MOCK_UNIT_ID = 'W633319030301';

const mockUnitValidation: UnitValidationResponse = {
  parsedUnitId: MOCK_UNIT_ID,
  checkDigit: '-X',
  codeScheme: 'I',
  manualUnitId: 'W633319030301-X',
  codabarUnitScheme: null,
  entryMode: 'S',
  barcodeType: 'CODE128',
  chapterScheme: 'I',
};

const mockValidateUnitResult: UnitValidationResult = {
  isValid: true,
  message: null,
  errorCode: null,
  errorResponse: null,
  maxCollDate: '2026-05-20T00:00:00',
};

const mockCollectionDates: CollectionDateOption[] = [
  { collDate: '2026-05-20T00:00:00' },
  { collDate: '2026-05-15T00:00:00' },
];

const mockSeparationData: SeparationTimesData = {
  unitId: MOCK_UNIT_ID,
  collDate: '2026-05-20T00:00:00',
  chapterId: '001',
  firstSepTime: '2026-05-20T14:30:00',
  firstSepCentrifugeId: 'C01',
  firstSepUserId: 'JSMITH',
  firstSepEntryMode: 'M',
  secondSepTime: '2026-05-20T15:45:00',
  secondSepCentrifugeId: 'C02',
  secondSepUserId: 'JDOE',
  secondSepEntryMode: 'M',
  bleedStartTime: '2026-05-20T10:00:00',
  bleedEndTime: '2026-05-20T10:15:00',
};

const mockCentrifuges: CentrifugeOption[] = [
  { equipId: 'C01', serialNumber: 'SN-12345' },
  { equipId: 'C02', serialNumber: 'SN-67890' },
  { equipId: 'C03', serialNumber: 'SN-11111' },
];

describe('ModifySeparationTimesComponent', () => {
  let component: ModifySeparationTimesComponent;
  let fixture: ComponentFixture<ModifySeparationTimesComponent>;
  let serviceSpy: jasmine.SpyObj<ModifySeparationTimesService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChanged$: Subject<void>;
  let headerServiceStub: { chapterChanged$: Subject<void>; chapterTimeZone: ReturnType<typeof signal<string>> };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();
    headerServiceStub = { chapterChanged$, chapterTimeZone: signal('') };

    serviceSpy = jasmine.createSpyObj('ModifySeparationTimesService', [
      'validateUnit',
      'getCollectionDates',
      'getSeparationTimes',
      'updateSeparationTimes',
      'getCentrifuges',
    ]);
    serviceSpy.validateUnit.and.returnValue(of(mockValidateUnitResult));
    serviceSpy.getCollectionDates.and.returnValue(of(mockCollectionDates));
    serviceSpy.getSeparationTimes.and.returnValue(of(mockSeparationData));
    serviceSpy.updateSeparationTimes.and.returnValue(of(mockSeparationData));
    serviceSpy.getCentrifuges.and.returnValue(of(mockCentrifuges));

    snackbarSpy = createMockSnackbarService();

    const pageHeaderServiceMock = {
      pageHeaderData: signal({
        title: 'Modify Separation Times',
        subtitle: 'Update incorrect separation times that have already been entered.',
      }),
    };



      TestBed.configureTestingModule({
      imports: [
        ModifySeparationTimesComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        CommonModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ModifySeparationTimesService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
      ],
    })
      .overrideComponent(ModifySeparationTimesComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb, UnitIdFieldComponent] },
        add: { imports: [PageHeaderStub, UnitIdFieldStub] },
      });


    


      serviceSpy.validateUnit.calls.reset();


      serviceSpy.getCollectionDates.calls.reset();


      serviceSpy.getSeparationTimes.calls.reset();


      serviceSpy.updateSeparationTimes.calls.reset();


      serviceSpy.getCentrifuges.calls.reset();


      serviceSpy.validateUnit.and.returnValue(of(mockValidateUnitResult));


      serviceSpy.getCollectionDates.and.returnValue(of(mockCollectionDates));


      serviceSpy.getSeparationTimes.and.returnValue(of(mockSeparationData));


      serviceSpy.updateSeparationTimes.and.returnValue(of(mockSeparationData));


      serviceSpy.getCentrifuges.and.returnValue(of(mockCentrifuges));


    fixture = TestBed.createComponent(ModifySeparationTimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).unitIdField = new UnitIdFieldStub();


    });

  function ensureUnitFieldStub(): UnitIdFieldStub {
    if (!(component as any).unitIdField) {
      (component as any).unitIdField = new UnitIdFieldStub();
    }
    return (component as any).unitIdField as UnitIdFieldStub;
  }

  function setUnitFieldValid(unitId: string = MOCK_UNIT_ID): void {
    const stub = ensureUnitFieldStub();
    stub.isValid = true;
    stub.parsedUnitId = unitId;
  }

  // ── Initialisation ────────────────────────────────────────────────────────


  it('should initialise with empty state (no results)', () => {
    expect(component.hasResults()).toBeFalse();
    expect(component.isLoading()).toBeFalse();
    expect(component.isSaving()).toBeFalse();
  });

  it('should initialise detail form with separation fields', () => {
    const form = component.detailForm;
    expect(form).toBeDefined();
    expect(form.get('firstSepDate')).toBeTruthy();
    expect(form.get('firstSepTime')).toBeTruthy();
    expect(form.get('firstSepCentrifugeId')).toBeTruthy();
    expect(form.get('secondSepDate')).toBeTruthy();
    expect(form.get('secondSepTime')).toBeTruthy();
    expect(form.get('secondSepCentrifugeId')).toBeTruthy();
  });

  it('should load centrifuge options on init', () => {
    expect(serviceSpy.getCentrifuges).toHaveBeenCalled();
    expect(component.centrifuges().length).toBe(3);
  });

  it('should display empty selected collection date initially', () => {
    expect(component.selectedCollDate()).toBe('');
  });

  // ── Unique ID generation ──────────────────────────────────────────────────

  it('should generate unique component IDs across instances', () => {
    const fixture2 = TestBed.createComponent(ModifySeparationTimesComponent);
    const component2 = fixture2.componentInstance;
    expect(component['componentId']).not.toEqual(component2['componentId']);
  });

  it('should generate element IDs using componentId prefix', () => {
    const id = component['elementId']('firstSepDate');
    expect(id).toContain('firstSepDate');
    expect(id).toContain(component['componentId']);
  });

  // ── Page header config ────────────────────────────────────────────────────





  // ── postValidate ──────────────────────────────────────────────────────────

  it('should call validateUnit in onPostValidate and confirm when valid', fakeAsync(() => {
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    const event = { data: mockUnitValidation, confirm: confirmSpy, reject: rejectSpy } as any;

    component.onPostValidate(event);
    tick();

    expect(serviceSpy.validateUnit).toHaveBeenCalledWith(MOCK_UNIT_ID);
    expect(confirmSpy).toHaveBeenCalled();
    expect(rejectSpy).not.toHaveBeenCalled();
  }));

  it('should reject in onPostValidate when unit is invalid', fakeAsync(() => {
    serviceSpy.validateUnit.and.returnValue(of({
      isValid: false,
      message: 'Unit not found or has been QC labeled.',
      errorCode: '0210',
      errorResponse: { errorCode: '0210', error: 'Unit not found or has been QC labeled.' },
      maxCollDate: null,
    }));
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    const event = { data: mockUnitValidation, confirm: confirmSpy, reject: rejectSpy } as any;

    component.onPostValidate(event);
    tick();

    expect(rejectSpy).toHaveBeenCalledWith('Unit not found or has been QC labeled.');
    expect(confirmSpy).not.toHaveBeenCalled();
  }));

  it('should reject in onPostValidate when API errors', fakeAsync(() => {
    serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('fail')));
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    const event = { data: mockUnitValidation, confirm: confirmSpy, reject: rejectSpy } as any;

    component.onPostValidate(event);
    tick();

    expect(rejectSpy).toHaveBeenCalledWith('Error validating unit');
  }));

  // ── Unit validation + data load ───────────────────────────────────────────

  it('should set validatedUnitId from validated response', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.validatedUnitId()).toBe(MOCK_UNIT_ID);
  }));

  it('should load collection dates when unit is validated', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(serviceSpy.getCollectionDates).toHaveBeenCalledWith(MOCK_UNIT_ID);
    expect(component.collectionDates().length).toBe(2);
  }));



  it('should show results after successful unit validation', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.hasResults()).toBeTrue();
    expect(component.isLoading()).toBeFalse();
  }));

  it('should populate form with data from API response', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.detailForm.get('firstSepTime')?.value).toBe('14:30');
    expect(component.detailForm.get('firstSepCentrifugeId')?.value).toBe('C01');
    expect(component.detailForm.get('secondSepTime')?.value).toBe('15:45');
    expect(component.detailForm.get('secondSepCentrifugeId')?.value).toBe('C02');
  }));

  it('should handle API error when loading collection dates', fakeAsync(() => {
    serviceSpy.getCollectionDates.and.returnValue(throwError(() => new Error('API error')));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.isLoading()).toBeFalse();
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load collection dates.');
  }));

  it('should handle API error when loading separation times', fakeAsync(() => {
    serviceSpy.getSeparationTimes.and.returnValue(throwError(() => new Error('API error')));
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.isLoading()).toBeFalse();
    expect(component.hasResults()).toBeFalse();
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load separation times. Please try again.');
  }));

  // ── Collection date change ────────────────────────────────────────────────

  it('should reload separation times when collection date changes', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    serviceSpy.getSeparationTimes.calls.reset();

    component.onCollectionDateChange('2026-05-15T00:00:00');
    tick();

    expect(component.selectedCollDate()).toBe('2026-05-15T00:00:00');
    expect(serviceSpy.getSeparationTimes).toHaveBeenCalledWith(MOCK_UNIT_ID, '2026-05-15T00:00:00');
  }));

  // ── Unit cleared ──────────────────────────────────────────────────────────

  it('should reset all state when unit is cleared', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.hasResults()).toBeTrue();

    component.onUnitCleared();
    expect(component.validatedUnitId()).toBe('');
    expect(component.selectedCollDate()).toBe('');
    expect(component.collectionDates().length).toBe(0);
    expect(component.hasResults()).toBeFalse();
    expect(component.unitData()).toBeNull();
  }));

  // ── Save ──────────────────────────────────────────────────────────────────





  it('should reset state after successful save', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    setUnitFieldValid();
    component.detailForm.get('firstSepTime')?.setValue('11:00');
    component.onSave();
    tick();
    expect(component.hasResults()).toBeFalse();
    expect(component.isSaving()).toBeFalse();
  }));





  it('should show BE error message on save failure', fakeAsync(() => {
    const httpError = {
      error: {
        success: false,
        message: 'PLT needs both first and second separations to be present',
        errorCode: '0138',
        errorResponse: {
          errorCode: '0138',
          error: 'PLT needs both first and second separations to be present',
        },
      },
    };
    serviceSpy.updateSeparationTimes.and.returnValue(throwError(() => httpError));
    component.onUnitValidated(mockUnitValidation);
    tick();
    setUnitFieldValid();
    component.detailForm.get('firstSepTime')?.setValue('11:00');
    component.onSave();
    tick();
    expect(component.isSaving()).toBeFalse();
    expect(component.hasResults()).toBeTrue();
    expect(snackbarSpy.showError).toHaveBeenCalledWith(
      'PLT needs both first and second separations to be present'
    );
  }));

  it('should fall back to body.message when errorResponse is missing', fakeAsync(() => {
    const httpError = {
      error: {
        success: false,
        message: 'Unsuccessful commit... transaction not saved',
      },
    };
    serviceSpy.updateSeparationTimes.and.returnValue(throwError(() => httpError));
    component.onUnitValidated(mockUnitValidation);
    tick();
    setUnitFieldValid();
    component.detailForm.get('firstSepTime')?.setValue('11:00');
    component.onSave();
    tick();
    expect(snackbarSpy.showError).toHaveBeenCalledWith(
      'Unsuccessful commit... transaction not saved'
    );
  }));



  // ── Client-side validation ────────────────────────────────────────────────











  it('should allow saving earlier time even when original entry mode is A', fakeAsync(() => {
    const autoEntryData: SeparationTimesData = {
      ...mockSeparationData,
      firstSepEntryMode: 'A',
      firstSepTime: '2026-05-20T14:30:00',
    };
    serviceSpy.getSeparationTimes.and.returnValue(of(autoEntryData));
    component.onUnitValidated(mockUnitValidation);
    tick();
    setUnitFieldValid();
    component.detailForm.patchValue({
      firstSepDate: new Date('2026-05-20'),
      firstSepTime: '13:00',
      firstSepCentrifugeId: 'C01',
    });
    component.onSave();
    tick();
    expect(snackbarSpy.showError).not.toHaveBeenCalledWith(
      'Separation time cannot be less than the original system time'
    );
  }));

  it('should set entry mode to null when separation time is cleared', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    setUnitFieldValid();
    component.detailForm.patchValue({
      firstSepDate: null,
      firstSepTime: '',
      firstSepCentrifugeId: '',
      secondSepDate: null,
      secondSepTime: '',
      secondSepCentrifugeId: '',
    });
    component.onSave();
    tick();
    const call = serviceSpy.updateSeparationTimes.calls.mostRecent();
    const payload = call.args[2];
    expect(payload.firstSepEntryMode).toBeNull();
    expect(payload.secondSepEntryMode).toBeNull();
  }));

  // ── Cancel ────────────────────────────────────────────────────────────────

  it('should clear everything and reset to initial state on cancel (KEY-CLRFRM)', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.hasResults()).toBeTrue();

    const stub = ensureUnitFieldStub();
    spyOn(stub, 'clear');

    component.onCancel();

    expect(component.validatedUnitId()).toBe('');
    expect(component.hasResults()).toBeFalse();
    expect(component.selectedCollDate()).toBe('');
    expect(component.collectionDates().length).toBe(0);
    expect(stub.clear).toHaveBeenCalled();
  }));

  // ── Clear All ─────────────────────────────────────────────────────────────

  it('should reset all form fields on clear all', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onClearAll();
    expect(component.detailForm.get('firstSepTime')?.value).toBeFalsy();
    expect(component.detailForm.get('firstSepCentrifugeId')?.value).toBeFalsy();
    expect(component.detailForm.get('secondSepTime')?.value).toBeFalsy();
    expect(component.detailForm.get('secondSepCentrifugeId')?.value).toBeFalsy();
  }));

  // ── Per-section clear ────────────────────────────────────────────────────

  it('should clear only first separation fields on onClearFirstSep', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onClearFirstSep();
    expect(component.detailForm.get('firstSepTime')?.value).toBeFalsy();
    expect(component.detailForm.get('firstSepCentrifugeId')?.value).toBeFalsy();
    expect(component.detailForm.get('secondSepTime')?.value).toBe('15:45');
    expect(component.detailForm.get('secondSepCentrifugeId')?.value).toBe('C02');
  }));

  it('should clear only second separation fields on onClearSecondSep', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    component.onClearSecondSep();
    expect(component.detailForm.get('firstSepTime')?.value).toBe('14:30');
    expect(component.detailForm.get('firstSepCentrifugeId')?.value).toBe('C01');
    expect(component.detailForm.get('secondSepTime')?.value).toBeFalsy();
    expect(component.detailForm.get('secondSepCentrifugeId')?.value).toBeFalsy();
  }));

  // ── Clear filter ──────────────────────────────────────────────────────────

  it('should reset everything including unit ID on clear filter', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    const stub = ensureUnitFieldStub();
    spyOn(stub, 'clear');
    component.onClearFilter();
    expect(component.validatedUnitId()).toBe('');
    expect(component.hasResults()).toBeFalse();
    expect(component.selectedCollDate()).toBe('');
    expect(component.collectionDates().length).toBe(0);
    expect(stub.clear).toHaveBeenCalled();
  }));

  // ── Chapter change ────────────────────────────────────────────────────────

  it('should reset state and reload centrifuges when chapter changes', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    expect(component.hasResults()).toBeTrue();

    serviceSpy.getCentrifuges.calls.reset();
    chapterChanged$.next();
    tick();

    expect(component.hasResults()).toBeFalse();
    expect(serviceSpy.getCentrifuges).toHaveBeenCalled();
  }));

  // ── Centrifuge options ────────────────────────────────────────────────────



  it('should handle centrifuge load error and show snackbar', fakeAsync(() => {
    serviceSpy.getCentrifuges.and.returnValue(throwError(() => new Error('network')));
    const fixture2 = TestBed.createComponent(ModifySeparationTimesComponent);
    fixture2.componentInstance.ngOnInit();
    tick();
    expect(fixture2.componentInstance.centrifuges().length).toBe(0);
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load centrifuge list.');
  }));

  // ── Format helpers ────────────────────────────────────────────────────────

  it('should format entry mode correctly', () => {
    expect(component.formatEntryMode('M')).toBe('Manual');
    expect(component.formatEntryMode('A')).toBe('Automatic');
    expect(component.formatEntryMode(null)).toBe('—');
  });

  it('should format datetime correctly', () => {
    expect(component.formatDateTime('2026-05-20T14:30:00')).toContain('20');
    expect(component.formatDateTime(null)).toBe('—');
    expect(component.formatDateTime('')).toBe('—');
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('should render filter panel with role="search"', () => {
    const el = fixture.nativeElement.querySelector('[role="search"]');
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-label')).toContain('Separation times');
  });



  it('should show detail card sections after data loads', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    fixture.detectChanges();

    const sections = fixture.nativeElement.querySelectorAll('.section');
    expect(sections.length).toBe(2);
  }));

  it('should show First Separation Details and Second Separation Details headings', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    fixture.detectChanges();

    const titles = fixture.nativeElement.querySelectorAll('.section__title');
    expect(titles.length).toBe(2);
    expect(titles[0].textContent).toContain('First Separation Details');
    expect(titles[1].textContent).toContain('Second Separation Details');
  }));

  // ── Empty state display ───────────────────────────────────────────────────







  // ── Footer buttons ────────────────────────────────────────────────────────

  it('should show footer buttons when results are displayed', fakeAsync(() => {
    component.onUnitValidated(mockUnitValidation);
    tick();
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('.footer-bar');
    expect(footer).toBeTruthy();

    const buttons = footer.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  }));

});
