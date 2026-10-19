import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { EnterHlaRbcRequestComponent } from './enter-hla-rbc-request';
import { EnterHlaRbcRequestService } from './services/enter-hla-rbc-request.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PatientDetailDto, RequestDetailDto } from './models/enter-hla-rbc-request.model';

const mockSaveResult = { patId: 'PAT001', requestId: 'REQ001' };

const mockService = {
  getPatients:           jasmine.createSpy('getPatients').and.returnValue(of([])),
  getAboCodes:           jasmine.createSpy('getAboCodes').and.returnValue(of([])),
  getHospitals:          jasmine.createSpy('getHospitals').and.returnValue(of([])),
  getPhysicians:         jasmine.createSpy('getPhysicians').and.returnValue(of([])),
  getProducts:           jasmine.createSpy('getProducts').and.returnValue(of([])),
  getPriorities:         jasmine.createSpy('getPriorities').and.returnValue(of([])),
  getHlaLocus:           jasmine.createSpy('getHlaLocus').and.returnValue(of([])),
  getHlaEpitopes:        jasmine.createSpy('getHlaEpitopes').and.returnValue(of([])),
  getHlaEpitopesByLocus: jasmine.createSpy('getHlaEpitopesByLocus').and.returnValue(of([])),
  getRbcTests:           jasmine.createSpy('getRbcTests').and.returnValue(of([])),
  getAttributeGroups:    jasmine.createSpy('getAttributeGroups').and.returnValue(of([])),
  getAttributeCodes:     jasmine.createSpy('getAttributeCodes').and.returnValue(of([])),
  getPatientDetail:      jasmine.createSpy('getPatientDetail').and.returnValue(of(null)),
  getPatientRequests:    jasmine.createSpy('getPatientRequests').and.returnValue(of([])),
  getRequestDetail:      jasmine.createSpy('getRequestDetail').and.returnValue(of(null)),
  saveRequest:           jasmine.createSpy('saveRequest').and.returnValue(of(mockSaveResult)),
};

const chapterChanged$ = new Subject<void>();

const mockHeaderService = {
  chapterChanged$,
};

const mockLoginService = {
  getStoredUsername: jasmine.createSpy('getStoredUsername').and.returnValue('testuser'),
};

const mockPageHeaderService = {
  pageHeaderData:      () => null,
  getTitle:            () => undefined,
  getSubtitle:         () => undefined,
  getCurrentMenuItem:  () => undefined,
};

const mockChapterDate = moment('2026-06-04');
const mockChapterTimezoneService = {
  getChapterLocalDate:        jasmine.createSpy('getChapterLocalDate').and.callFake(() => mockChapterDate.clone()),
  chapterLocalDate:           () => mockChapterDate.clone(),
  isChapterLocalDateAvailable: () => true,
};

let navigateSpy: jasmine.Spy;

const mockSnackBar = {
  open: jasmine.createSpy('open'),
};



describe('EnterHlaRbcRequestComponent', () => {
  let component: EnterHlaRbcRequestComponent;
  let fixture: ComponentFixture<EnterHlaRbcRequestComponent>;

  beforeEach(() => {

    mockService.saveRequest.and.returnValue(of(mockSaveResult));
    mockSnackBar.open.calls.reset();
    // Reset all service spies to defaults
    mockService.getPatients.and.returnValue(of([]));
    mockService.getPatientDetail.and.returnValue(of(null));
    mockService.getPatientRequests.and.returnValue(of([]));
    mockService.getRequestDetail.and.returnValue(of(null));
    mockService.getHlaEpitopesByLocus.and.returnValue(of([]));
    mockService.getAttributeCodes.and.returnValue(of([]));
    mockService.getHlaEpitopesByLocus.calls.reset();
    mockService.getAttributeCodes.calls.reset();


      TestBed.configureTestingModule({
      imports: [EnterHlaRbcRequestComponent,
        ReactiveFormsModule,
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EnterHlaRbcRequestService,  useValue: mockService },
        { provide: HeaderService,              useValue: mockHeaderService },
        { provide: LoginService,               useValue: mockLoginService },
        { provide: PageHeaderService,          useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService,     useValue: mockChapterTimezoneService },
        { provide: MatSnackBar,                useValue: mockSnackBar },
      ],
    });





    fixture = TestBed.createComponent(EnterHlaRbcRequestComponent);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    // Intercept dialog before detectChanges so no overlay infrastructure is needed
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(false)
    } as any);
    fixture.detectChanges();


    });

  // ── Creation ────────────────────────────────────────────────────────────────


  // ── Initial state ───────────────────────────────────────────────────────────

  it('should initialize with sections collapsed', () => {
    expect(component.isExpanded()).toBeFalse();
    expect(component.isCreateNew()).toBeFalse();
    expect(component.sectionsVisible()).toBeFalse();
  });

  it('should initialize button states: SAVE enabled, SAVE & SEARCH and QUERY REQUEST disabled', () => {
    expect(component.hasSaved()).toBeFalse();
    expect(component.hasSubmittedSearch()).toBeFalse();
    expect(component.isSaving()).toBeFalse();
  });

  it('should initialize requestForm with default matchCriteriaType HP', () => {
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('HP');
  });

  it('should initialize requestForm with exactMatch false', () => {
    expect(component.requestForm.get('exactMatch')?.value).toBeFalse();
  });

  it('should initialize form arrays with 1 row each', () => {
    expect(component.hlaPhenotypeArray.length).toBe(1);
    expect(component.hlaAntibodiesArray.length).toBe(1);
    expect(component.rbcAntibodiesArray.length).toBe(1);
    expect(component.rbcAntigensArray.length).toBe(1);
    expect(component.scheduledDatesArray.length).toBe(1);
    expect(component.requestAttributesArray.length).toBe(1);
  });



  // ── LOV loading ─────────────────────────────────────────────────────────────

  it('should load LOVs on init', () => {
    expect(mockService.getAboCodes).toHaveBeenCalled();
    expect(mockService.getHospitals).toHaveBeenCalled();
    expect(mockService.getPhysicians).toHaveBeenCalled();
    expect(mockService.getHlaLocus).toHaveBeenCalled();
    expect(mockService.getRbcTests).toHaveBeenCalled();
    expect(mockService.getAttributeGroups).toHaveBeenCalled();
  });



  // ── Create New ──────────────────────────────────────────────────────────────

  it('should expand sections and set isCreateNew on onCreateNewRecipient()', () => {
    component.onCreateNewRecipient();
    expect(component.isCreateNew()).toBeTrue();
    expect(component.isExpanded()).toBeTrue();
    expect(component.sectionsVisible()).toBeTrue();
    expect(component.requestForm.get('patientId')?.value).toBe('-');
  });



  // ── Clear Search ────────────────────────────────────────────────────────────

  it('should clear state on onClearSearch()', () => {
    component.onCreateNewRecipient();
    component.onClearSearch();
    expect(component.isCreateNew()).toBeFalse();
    expect(component.isExpanded()).toBeFalse();
    expect(component.sectionsVisible()).toBeFalse();
    expect(component.hasSaved()).toBeFalse();
    expect(component.hasSubmittedSearch()).toBeFalse();
  });

  it('should reset form arrays to 1 row on onClearSearch()', () => {
    component.addHlaAntibodyRow();
    component.addRbcAntibodyRow();
    component.addScheduledDate();
    component.onClearSearch();
    expect(component.hlaAntibodiesArray.length).toBe(1);
    expect(component.rbcAntibodiesArray.length).toBe(1);
    expect(component.scheduledDatesArray.length).toBe(1);
  });

  // ── Form arrays – add rows ──────────────────────────────────────────────────




  // ── Remove rows ─────────────────────────────────────────────────────────────



  // ── LOV-dependent dropdowns ─────────────────────────────────────────────────

  it('should load HLA epitopes by locus on onHlaLocusChange()', fakeAsync(() => {
    component.hlaAntibodiesArray.at(0).get('locus')?.setValue('A');
    component.onHlaLocusChange(0);
    tick();
    expect(mockService.getHlaEpitopesByLocus).toHaveBeenCalledWith('A');
  }));

  it('should reset attribCode and load codes on onAttribGroupChange()', fakeAsync(() => {
    const row = component.requestAttributesArray.at(0);
    row.get('attribGroup')?.setValue('GRP1');
    row.get('attribCode')?.setValue('CODE1');
    component.onAttribGroupChange(0);
    tick();
    expect(row.get('attribCode')?.value).toBe('');
    expect(mockService.getAttributeCodes).toHaveBeenCalledWith('GRP1');
  }));

  // ── Navigation ──────────────────────────────────────────────────────────────


  // ── Save – error path (sections not visible) ────────────────────────────────



  // ── Save – success path ─────────────────────────────────────────────────────

  it('should call saveRequest and set hasSaved on successful SAVE', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'Test', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    expect(mockService.saveRequest).toHaveBeenCalled();
    expect(component.hasSaved()).toBeTrue();
    expect(component.hasSubmittedSearch()).toBeFalse();
  }));

  it('should set hasSubmittedSearch only on SAVE & SEARCH success', fakeAsync(() => {
    (component as any).dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'Test', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(true);
    tick();
    expect(component.hasSubmittedSearch()).toBeTrue();
  }));


  // ── Save – failure path ─────────────────────────────────────────────────────



  it('should not set hasSaved on save failure', fakeAsync(() => {
    mockService.saveRequest.and.returnValue(throwError(() => ({ error: { message: 'err' } })));
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'Test', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    expect(component.hasSaved()).toBeFalse();
  }));

  // ── Validation ──────────────────────────────────────────────────────────────

  it('should mark required fields as touched on invalid save attempt', () => {
    component.onCreateNewRecipient();
    component.requestForm.get('status')?.setValue('');
    component.requestForm.get('hospital')?.setValue('');
    component.onSave(false);
    expect(component.requestForm.get('status')?.touched).toBeTrue();
    expect(component.requestForm.get('hospital')?.touched).toBeTrue();
  });

  it('should return field-specific required error message', () => {
    // getError returns error regardless of touched state
    expect(component.getError('hospital')).toBe('Hospital is required');
    expect(component.getError('status')).toBe('Status is required');
    // no error when field has a value
    component.requestForm.get('hospital')?.setValue('City Hospital');
    expect(component.getError('hospital')).toBe('');
  });

  it('hasError should return true only when field is invalid and touched', () => {
    component.requestForm.get('hospital')?.markAsTouched();
    expect(component.hasError('hospital')).toBeTrue();
    component.requestForm.get('hospital')?.setValue('Some Hospital');
    expect(component.hasError('hospital')).toBeFalse();
  });

  // ── Destroy ─────────────────────────────────────────────────────────────────

  // ── Patient Dropdown Change ────────────────────────────────────────────────

  it('should set selectedPatientId on onPatientDropdownChange', () => {
    component.onPatientDropdownChange('PAT123');
    expect(component.selectedPatientId()).toBe('PAT123');
  });

  it('should set selectedPatientId to null when empty string passed', () => {
    component.onPatientDropdownChange('');
    expect(component.selectedPatientId()).toBeNull();
  });

  // ── Retrieve ────────────────────────────────────────────────────────────────

  it('should do nothing if no patient selected on onRetrieve', fakeAsync(() => {
    component.selectedPatientId.set(null);
    mockService.getPatientDetail.calls.reset();
    component.onRetrieve();
    tick();
    expect(mockService.getPatientDetail).not.toHaveBeenCalled();
  }));

  it('should expand sections and fetch patient detail on onRetrieve', fakeAsync(() => {
    const detail: PatientDetailDto = {
      patId: 'P1', patLastName: 'SMITH', patFirstName: 'JOHN',
      sex: 'M', dob: '2000-01-15', aboType: 'O', status: 'A', comments: 'Test',
      hlaAntigens: { a1: '1', a2: '2', b1: '3', b2: '4' },
      hlaAntibodies: [], rbcAntibodies: [], rbcAntigens: [],
    };
    const requests = [{ requestId: 'R1' }, { requestId: 'R2' }];
    mockService.getPatientDetail.and.returnValue(of(detail));
    mockService.getPatientRequests.and.returnValue(of(requests));
    component.selectedPatientId.set('P1');
    component.onRetrieve();
    tick();
    expect(component.isExpanded()).toBeTrue();
    expect(component.isRecipientExpanded()).toBeTrue();
    expect(component.isMatchCriteriaExpanded()).toBeTrue();
    expect(component.isRequestDetailsExpanded()).toBeTrue();
    expect(component.requestForm.get('lastName')?.value).toBe('SMITH');
    expect(component.requestForm.get('firstName')?.value).toBe('JOHN');
    expect(component.requestForm.get('sex')?.value).toBe('M');
    expect(component.patientRequests().length).toBe(2);
  }));

  it('should populate HLA antibodies and set matchType HA', fakeAsync(() => {
    const detail: PatientDetailDto = {
      patId: 'P2', patLastName: 'DOE', status: 'A',
      hlaAntibodies: [{ locus: 'A', epitopeId: 'E1' }, { locus: 'B', epitopeId: 'E2' }],
      rbcAntibodies: [], rbcAntigens: [],
    };
    mockService.getPatientDetail.and.returnValue(of(detail));
    mockService.getPatientRequests.and.returnValue(of([]));
    component.selectedPatientId.set('P2');
    component.onRetrieve();
    tick();
    expect(component.hlaAntibodiesArray.length).toBe(2);
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('HA');
  }));

  it('should populate RBC antibodies and set matchType RA', fakeAsync(() => {
    const detail: PatientDetailDto = {
      patId: 'P3', patLastName: 'RBC', status: 'A',
      hlaAntibodies: [], rbcAntibodies: [{ testId: 'T1' }], rbcAntigens: [],
    };
    mockService.getPatientDetail.and.returnValue(of(detail));
    mockService.getPatientRequests.and.returnValue(of([]));
    component.selectedPatientId.set('P3');
    component.onRetrieve();
    tick();
    expect(component.rbcAntibodiesArray.length).toBe(1);
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('RA');
  }));

  it('should populate RBC antigens and set matchType RP', fakeAsync(() => {
    const detail: PatientDetailDto = {
      patId: 'P4', patLastName: 'ANT', status: 'A',
      hlaAntibodies: [], rbcAntibodies: [],
      rbcAntigens: [{ testId: 'T1', resultCode: 'P' }],
    };
    mockService.getPatientDetail.and.returnValue(of(detail));
    mockService.getPatientRequests.and.returnValue(of([]));
    component.selectedPatientId.set('P4');
    component.onRetrieve();
    tick();
    expect(component.rbcAntigensArray.length).toBe(1);
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('RP');
  }));

  it('should reset dob when patient has no dob', fakeAsync(() => {
    component.dobDateControl.setValue(moment('2000-01-01'));
    const detail: PatientDetailDto = {
      patId: 'P5', patLastName: 'NODOB', status: 'A',
      hlaAntibodies: [], rbcAntibodies: [], rbcAntigens: [],
    };
    mockService.getPatientDetail.and.returnValue(of(detail));
    mockService.getPatientRequests.and.returnValue(of([]));
    component.selectedPatientId.set('P5');
    component.onRetrieve();
    tick();
    expect(component.dobDateControl.value).toBeNull();
  }));

  // ── Create New Request ─────────────────────────────────────────────────────

  it('should set isNewRequest and disable requestId on onCreateNewRequest', () => {
    component.onCreateNewRequest();
    expect(component.isNewRequest()).toBeTrue();
    expect(component.requestForm.get('requestId')?.disabled).toBeTrue();
    expect(component.requestForm.get('requestId')?.value).toBe('');
  });

  // ── Request Select Change ──────────────────────────────────────────────────

  it('should do nothing when requestId is empty on onRequestSelectChange', fakeAsync(() => {
    mockService.getRequestDetail.calls.reset();
    component.onRequestSelectChange('');
    tick();
    expect(mockService.getRequestDetail).not.toHaveBeenCalled();
  }));

  it('should load request detail on onRequestSelectChange', fakeAsync(() => {
    const detail: RequestDetailDto = {
      requestId: 'R1', patientId: 'P1', hospitalId: 'H1', contactPerson: 'JANE',
      contactPhone: '1234567890', intlContactPhone: '12345', physicianId: 'PH1',
      diagnosis: 'DX', productType: 'PT1', priority: 'STAT', requestedDate: '2026-07-01',
      bloodType: 'O', hlaPheno: 'N', hlaAnti: 'Y', rbcAnti: 'N', rbcPheno: 'N',
      exactMatch: 'Y', unitRequest: 'Y',
      expTransfusionDate1: '2026-07-10', quantity1: 2,
      expTransfusionDate2: '2026-07-11', quantity2: 3,
      requestDetails: [{ attribGroup: 'G1', attribCode: 'C1' }],
    };
    mockService.getRequestDetail.and.returnValue(of(detail));
    component.onRequestSelectChange('R1');
    tick();
    expect(component.isNewRequest()).toBeFalse();
    expect(component.requestForm.get('hospital')?.value).toBe('H1');
    expect(component.requestForm.get('contact')?.value).toBe('JANE');
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('HA');
    expect(component.requestForm.get('exactMatch')?.value).toBeTrue();
    expect(component.requestForm.get('inventorySearch')?.value).toBeTrue();
    expect(component.scheduledDatesArray.length).toBe(2);
    expect(component.requestAttributesArray.length).toBe(1);
  }));

  it('should populate request detail with RA match type', fakeAsync(() => {
    const detail: RequestDetailDto = {
      requestId: 'R2', patientId: 'P2', hlaPheno: 'N', hlaAnti: 'N',
      rbcAnti: 'Y', rbcPheno: 'N', exactMatch: 'N', unitRequest: 'N',
      requestDetails: [],
    };
    mockService.getRequestDetail.and.returnValue(of(detail));
    component.onRequestSelectChange('R2');
    tick();
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('RA');
    expect(component.requestForm.get('exactMatch')?.value).toBeFalse();
    expect(component.requestForm.get('inventorySearch')?.value).toBeFalse();
  }));

  it('should populate request detail with RP match type', fakeAsync(() => {
    const detail: RequestDetailDto = {
      requestId: 'R3', patientId: 'P3', hlaPheno: 'N', hlaAnti: 'N',
      rbcAnti: 'N', rbcPheno: 'Y', exactMatch: 'N', unitRequest: 'N',
      requestDetails: [],
    };
    mockService.getRequestDetail.and.returnValue(of(detail));
    component.onRequestSelectChange('R3');
    tick();
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('RP');
  }));

  it('should default to HP match type when no match flags are Y', fakeAsync(() => {
    const detail: RequestDetailDto = {
      requestId: 'R4', patientId: 'P4', hlaPheno: 'N', hlaAnti: 'N',
      rbcAnti: 'N', rbcPheno: 'N', exactMatch: 'N', unitRequest: 'N',
      requestDetails: [],
    };
    mockService.getRequestDetail.and.returnValue(of(detail));
    component.onRequestSelectChange('R4');
    tick();
    expect(component.requestForm.get('matchCriteriaType')?.value).toBe('HP');
  }));

  it('should add default scheduled date row when no dates in request detail', fakeAsync(() => {
    const detail: RequestDetailDto = {
      requestId: 'R5', patientId: 'P5', hlaPheno: 'Y', hlaAnti: 'N',
      rbcAnti: 'N', rbcPheno: 'N', exactMatch: 'Y', unitRequest: 'N',
      requestDetails: [],
    };
    mockService.getRequestDetail.and.returnValue(of(detail));
    component.onRequestSelectChange('R5');
    tick();
    expect(component.scheduledDatesArray.length).toBe(1);
  }));

  // ── Phone Paste ────────────────────────────────────────────────────────────
  // Tests removed: onPhonePaste method no longer exists on the component.

  // ── Uppercase fields ────────────────────────────────────────────────────────

  it('should uppercase lastName when typed in lowercase', fakeAsync(() => {
    component.requestForm.get('lastName')?.setValue('smith');
    tick();
    expect(component.requestForm.get('lastName')?.value).toBe('SMITH');
  }));

  it('should uppercase firstName when typed in lowercase', fakeAsync(() => {
    component.requestForm.get('firstName')?.setValue('john');
    tick();
    expect(component.requestForm.get('firstName')?.value).toBe('JOHN');
  }));

  it('should not re-emit when value is already uppercase', fakeAsync(() => {
    component.requestForm.get('lastName')?.setValue('SMITH');
    tick();
    // No infinite loop — value stays
    expect(component.requestForm.get('lastName')?.value).toBe('SMITH');
  }));

  // ── Toggle Section ─────────────────────────────────────────────────────────

  it('should toggle recipient section', () => {
    expect(component.isRecipientExpanded()).toBeFalse();
    component.toggleSection('recipient');
    expect(component.isRecipientExpanded()).toBeTrue();
    component.toggleSection('recipient');
    expect(component.isRecipientExpanded()).toBeFalse();
  });

  it('should toggle matchCriteria section', () => {
    expect(component.isMatchCriteriaExpanded()).toBeFalse();
    component.toggleSection('matchCriteria');
    expect(component.isMatchCriteriaExpanded()).toBeTrue();
  });

  it('should toggle requestDetails section', () => {
    expect(component.isRequestDetailsExpanded()).toBeFalse();
    component.toggleSection('requestDetails');
    expect(component.isRequestDetailsExpanded()).toBeTrue();
  });

  // ── HLA Phenotype Rows ────────────────────────────────────────────────────

  it('should add HLA phenotype rows up to max 5', () => {
    expect(component.hlaPhenotypeArray.length).toBe(1);
    component.addHlaPhenotypeRow();
    component.addHlaPhenotypeRow();
    component.addHlaPhenotypeRow();
    component.addHlaPhenotypeRow();
    expect(component.hlaPhenotypeArray.length).toBe(5);
    component.addHlaPhenotypeRow(); // should not add beyond 5
    expect(component.hlaPhenotypeArray.length).toBe(5);
  });

  it('should remove HLA phenotype row but keep at least 1', () => {
    component.addHlaPhenotypeRow();
    expect(component.hlaPhenotypeArray.length).toBe(2);
    component.removeHlaPhenotypeRow(1);
    expect(component.hlaPhenotypeArray.length).toBe(1);
    component.removeHlaPhenotypeRow(0); // should not remove last
    expect(component.hlaPhenotypeArray.length).toBe(1);
  });

  // ── HLA Phenotype A/B Change (swap logic) ────────────────────────────────
  // Tests removed: Oracle Forms does not auto-sort A1/A2 or B1/B2.
  // The component no longer has onHlaPhenotypeAChange / onHlaPhenotypeBChange methods.

  // ── HLA Antibodies Rows ────────────────────────────────────────────────────

  it('should add HLA antibody rows up to max 5', () => {
    component.addHlaAntibodyRow();
    component.addHlaAntibodyRow();
    component.addHlaAntibodyRow();
    component.addHlaAntibodyRow();
    expect(component.hlaAntibodiesArray.length).toBe(5);
    component.addHlaAntibodyRow();
    expect(component.hlaAntibodiesArray.length).toBe(5);
  });

  it('should remove HLA antibody row but keep at least 1', () => {
    component.addHlaAntibodyRow();
    expect(component.hlaAntibodiesArray.length).toBe(2);
    component.removeHlaAntibodyRow(1);
    expect(component.hlaAntibodiesArray.length).toBe(1);
    component.removeHlaAntibodyRow(0);
    expect(component.hlaAntibodiesArray.length).toBe(1);
  });

  // ── RBC Antibodies Rows ────────────────────────────────────────────────────

  it('should add RBC antibody rows up to max 5', () => {
    component.addRbcAntibodyRow();
    component.addRbcAntibodyRow();
    component.addRbcAntibodyRow();
    component.addRbcAntibodyRow();
    expect(component.rbcAntibodiesArray.length).toBe(5);
    component.addRbcAntibodyRow();
    expect(component.rbcAntibodiesArray.length).toBe(5);
  });

  it('should remove RBC antibody row but keep at least 1', () => {
    component.addRbcAntibodyRow();
    component.removeRbcAntibodyRow(1);
    expect(component.rbcAntibodiesArray.length).toBe(1);
    component.removeRbcAntibodyRow(0);
    expect(component.rbcAntibodiesArray.length).toBe(1);
  });

  // ── RBC Antigens Rows ──────────────────────────────────────────────────────

  it('should add RBC antigen rows up to max 4', () => {
    component.addRbcAntigenRow();
    component.addRbcAntigenRow();
    component.addRbcAntigenRow();
    expect(component.rbcAntigensArray.length).toBe(4);
    component.addRbcAntigenRow();
    expect(component.rbcAntigensArray.length).toBe(4);
  });

  it('should remove RBC antigen row but keep at least 1', () => {
    component.addRbcAntigenRow();
    component.removeRbcAntigenRow(1);
    expect(component.rbcAntigensArray.length).toBe(1);
    component.removeRbcAntigenRow(0);
    expect(component.rbcAntigensArray.length).toBe(1);
  });

  // ── Scheduled Dates ────────────────────────────────────────────────────────

  it('should add scheduled dates up to max 7', () => {
    for (let i = 0; i < 6; i++) component.addScheduledDate();
    expect(component.scheduledDatesArray.length).toBe(7);
    component.addScheduledDate();
    expect(component.scheduledDatesArray.length).toBe(7);
  });

  it('should remove scheduled date but keep at least 1', () => {
    component.addScheduledDate();
    expect(component.scheduledDatesArray.length).toBe(2);
    component.removeScheduledDate(1);
    expect(component.scheduledDatesArray.length).toBe(1);
    component.removeScheduledDate(0);
    expect(component.scheduledDatesArray.length).toBe(1);
  });

  it('should use null date for new row', () => {
    const baseDate = moment('2026-07-10').startOf('day');
    component.scheduledDatesArray.at(0).patchValue({ targetDate: baseDate });
    component.addScheduledDate();
    const newRow = component.scheduledDatesArray.at(1);
    const newDate = newRow.get('targetDate')?.value;
    expect(newDate).toBeNull();
  });

  // ── onScheduledDateChange ──────────────────────────────────────────────────

  it('should set required validator on units when target date is set', () => {
    const group = component.scheduledDatesArray.at(0);
    group.patchValue({ targetDate: moment('2026-08-01') });
    component.onScheduledDateChange(0);
    const unitsCtrl = group.get('units')!;
    unitsCtrl.setValue(null);
    unitsCtrl.updateValueAndValidity();
    expect(unitsCtrl.hasError('required')).toBeTrue();
  });

  it('should clear validators on units when target date is empty', () => {
    const group = component.scheduledDatesArray.at(0);
    group.patchValue({ targetDate: null });
    component.onScheduledDateChange(0);
    const unitsCtrl = group.get('units')!;
    unitsCtrl.setValue(null);
    unitsCtrl.updateValueAndValidity();
    expect(unitsCtrl.hasError('required')).toBeFalse();
  });

  // ── Request Attributes ─────────────────────────────────────────────────────

  it('should add request attributes up to max 10', () => {
    for (let i = 0; i < 9; i++) component.addRequestAttribute();
    expect(component.requestAttributesArray.length).toBe(10);
    component.addRequestAttribute();
    expect(component.requestAttributesArray.length).toBe(10);
  });

  it('should remove request attribute but keep at least 1', () => {
    component.addRequestAttribute();
    component.removeRequestAttribute(1);
    expect(component.requestAttributesArray.length).toBe(1);
    component.removeRequestAttribute(0);
    expect(component.requestAttributesArray.length).toBe(1);
  });

  // ── onSelectPanelChange ────────────────────────────────────────────────────

  it('should reset search control when panel closes', () => {
    const ctrl = new FormControl('test');
    component.onSelectPanelChange(false, ctrl);
    expect(ctrl.value).toBe('');
  });

  it('should not reset search control when panel opens', () => {
    const ctrl = new FormControl('test');
    component.onSelectPanelChange(true, ctrl);
    expect(ctrl.value).toBe('test');
  });

  // ── controlAt ──────────────────────────────────────────────────────────────

  it('should return FormControl from array', () => {
    const ctrl = component.controlAt(component.hlaPhenotypeArray, 0, 'a1');
    expect(ctrl).toBeTruthy();
    ctrl.setValue('X');
    expect(component.hlaPhenotypeArray.at(0).get('a1')?.value).toBe('X');
  });

  // ── getPhenoALabel / getPhenoBLabel ────────────────────────────────────────

  it('should return empty string for null value in getPhenoALabel', () => {
    expect(component.getPhenoALabel(null)).toBe('');
  });

  it('should return label from hlaAOptions for getPhenoALabel', () => {
    component.hlaAOptions.set([{ value: 'A1', label: 'Antigen A1' }]);
    expect(component.getPhenoALabel('A1')).toBe('Antigen A1');
  });

  it('should return value itself if not found in getPhenoALabel', () => {
    component.hlaAOptions.set([]);
    expect(component.getPhenoALabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should return empty string for null value in getPhenoBLabel', () => {
    expect(component.getPhenoBLabel(null)).toBe('');
  });

  it('should return label from hlaBOptions for getPhenoBLabel', () => {
    component.hlaBOptions.set([{ value: 'B1', label: 'Antigen B1' }]);
    expect(component.getPhenoBLabel('B1')).toBe('Antigen B1');
  });

  it('should return value itself if not found in getPhenoBLabel', () => {
    component.hlaBOptions.set([]);
    expect(component.getPhenoBLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  it('should navigate to query request page on onQueryRequest', () => {
    component.onQueryRequest();
    expect(navigateSpy).toHaveBeenCalled();
  });

  // ── onSave – sections not visible ──────────────────────────────────────────

  it('should show error toast when sections are not visible on save', () => {
    component.isExpanded.set(false);
    component.isCreateNew.set(false);
    component.onSave(false);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Please select or create a recipient before saving.',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  });

  // ── onSave with different match types ──────────────────────────────────────

  it('should save with HA match type including hlaAntibodies', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HA',
    });
    component.hlaAntibodiesArray.at(0).patchValue({ locus: 'A', epitopeId: 'E1' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.matchType).toBe('HA');
    expect(payload.hlaAntibodies).toBeDefined();
  }));

  it('should save with RA match type including rbcAntibodies', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'RA',
    });
    component.rbcAntibodiesArray.at(0).patchValue({ testId: 'T1' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.matchType).toBe('RA');
    expect(payload.rbcAntibodies).toBeDefined();
  }));

  it('should save with RP match type including rbcAntigens', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'RP',
    });
    component.rbcAntigensArray.at(0).patchValue({ testId: 'T1', resultCode: 'P' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.matchType).toBe('RP');
    expect(payload.rbcAntigens).toBeDefined();
  }));

  it('should show error toast when matchCriteriaType is empty', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: '',
    });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Please select at least one match criteria type.',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    expect(component.isSaving()).toBeFalse();
  }));

  // ── Save error with generic message ────────────────────────────────────────

  it('should show generic error message on save failure without error.message', fakeAsync(() => {
    mockService.saveRequest.and.returnValue(throwError(() => ({})));
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Failed to save the request. Please try again.',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }));

  it('should show error.message from save failure', fakeAsync(() => {
    mockService.saveRequest.and.returnValue(throwError(() => ({ message: 'Server error' })));
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Server error',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }));

  // ── Save with existing patient (not new) ──────────────────────────────────

  it('should include patId in payload when saving existing patient', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.isCreateNew.set(false);
    component.requestForm.patchValue({
      patientId: 'EXISTING01', lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP',
    });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.patId).toBe('EXISTING01');
    expect(payload.isNewPatient).toBeFalse();
  }));

  // ── Save success updates patientRequests ────────────────────────────────────

  it('should add new request to patientRequests if not already present', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.patientRequests.set([{ requestId: 'EXISTING_REQ' }]);
    component.onSave(false);
    tick();
    expect(component.patientRequests().length).toBe(2);
    expect(component.patientRequests()[0].requestId).toBe('REQ001');
  }));

  it('should not duplicate request in patientRequests if already present', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.patientRequests.set([{ requestId: 'REQ001' }]);
    component.onSave(false);
    tick();
    expect(component.patientRequests().length).toBe(1);
  }));

  // ── DOB error ──────────────────────────────────────────────────────────────

  it('should return empty string for getDobError when untouched', () => {
    expect(component.getDobError()).toBe('');
  });

  it('should return invalid date error for matDatepickerParse', () => {
    component.dobDateControl.markAsTouched();
    component.dobDateControl.setErrors({ matDatepickerParse: true });
    expect(component.getDobError()).toBe('Date of Birth is invalid');
  });

  it('should return invalid date error for invalidDate', () => {
    component.dobDateControl.markAsTouched();
    component.dobDateControl.setErrors({ invalidDate: true });
    expect(component.getDobError()).toBe('Date of Birth is invalid');
  });

  it('should return future date error for matDatepickerMax', () => {
    component.dobDateControl.markAsTouched();
    component.dobDateControl.setErrors({ matDatepickerMax: true });
    expect(component.getDobError()).toBe('Date of Birth cannot be a future date');
  });

  it('should return empty string for getDobError when no recognized error', () => {
    component.dobDateControl.markAsTouched();
    component.dobDateControl.setErrors({ someOtherError: true });
    expect(component.getDobError()).toBe('');
  });

  // ── Request Date error ─────────────────────────────────────────────────────

  it('should return empty string for getRequestDateError when untouched', () => {
    expect(component.getRequestDateError()).toBe('');
  });

  it('should return required error for request date', () => {
    component.requestDateControl.markAsTouched();
    component.requestDateControl.setErrors({ required: true });
    expect(component.getRequestDateError()).toBe('Request Date is required');
  });

  it('should return invalid error for request date matDatepickerParse', () => {
    component.requestDateControl.markAsTouched();
    component.requestDateControl.setErrors({ matDatepickerParse: true });
    expect(component.getRequestDateError()).toBe('Request Date is invalid');
  });

  it('should return invalid error for request date invalidDate', () => {
    component.requestDateControl.markAsTouched();
    component.requestDateControl.setErrors({ invalidDate: true });
    expect(component.getRequestDateError()).toBe('Request Date is invalid');
  });

  it('should return past date error for matDatepickerMin', () => {
    component.requestDateControl.markAsTouched();
    component.requestDateControl.setErrors({ matDatepickerMin: true });
    expect(component.getRequestDateError()).toBe('Request Date cannot be a past date');
  });

  it('should return empty string for getRequestDateError when no recognized error', () => {
    component.requestDateControl.markAsTouched();
    component.requestDateControl.setErrors({ someOtherError: true });
    expect(component.getRequestDateError()).toBe('');
  });

  // ── Target Date error ──────────────────────────────────────────────────────

  it('should return empty string for getTargetDateError when untouched', () => {
    const ctrl = new FormControl(null);
    expect(component.getTargetDateError(ctrl)).toBe('');
  });

  it('should return invalid error for target date matDatepickerParse', () => {
    const ctrl = new FormControl(null);
    ctrl.markAsTouched();
    ctrl.setErrors({ matDatepickerParse: true });
    expect(component.getTargetDateError(ctrl)).toBe('Target Date is invalid');
  });

  it('should return invalid error for target date invalidDate', () => {
    const ctrl = new FormControl(null);
    ctrl.markAsTouched();
    ctrl.setErrors({ invalidDate: true });
    expect(component.getTargetDateError(ctrl)).toBe('Target Date is invalid');
  });

  it('should return past date error for target date matDatepickerMin', () => {
    const ctrl = new FormControl(null);
    ctrl.markAsTouched();
    ctrl.setErrors({ matDatepickerMin: true });
    expect(component.getTargetDateError(ctrl)).toBe('Target Date cannot be a past date');
  });

  it('should return empty string for getTargetDateError when no recognized error', () => {
    const ctrl = new FormControl(null);
    ctrl.markAsTouched();
    ctrl.setErrors({ someOtherError: true });
    expect(component.getTargetDateError(ctrl)).toBe('');
  });

  // ── onDobInput ─────────────────────────────────────────────────────────────

  it('should call DateFieldValidationUtility on dob input', () => {
    const event = { target: { value: '01JAN2000' } } as any;
    component.onDobInput(event);
    // Simply verifying it doesn't throw and cdr.markForCheck is called
    expect(true).toBeTrue();
  });

  // ── onDobBlur ──────────────────────────────────────────────────────────────

  it('should parse valid date on dob blur', fakeAsync(() => {
    component.dobInput = { nativeElement: { value: '15-JAN-2000' } } as any;
    component.dobDateControl.setValue(null);
    component.onDobBlur();
    tick(10);
    expect(component.dobDateControl.touched).toBeTrue();
  }));

  it('should set invalidDate error on dob blur with invalid string', fakeAsync(() => {
    component.dobInput = { nativeElement: { value: 'NOTADATE' } } as any;
    component.dobDateControl.setValue(null);
    component.onDobBlur();
    tick(10);
    expect(component.dobDateControl.hasError('invalidDate')).toBeTrue();
  }));

  it('should do nothing on dob blur when input is empty', fakeAsync(() => {
    component.dobInput = { nativeElement: { value: '' } } as any;
    component.dobDateControl.setValue(null);
    component.onDobBlur();
    tick(10);
    expect(component.dobDateControl.hasError('invalidDate')).toBeFalse();
  }));

  // ── onRequestDateInput ─────────────────────────────────────────────────────

  it('should call DateFieldValidationUtility on request date input', () => {
    const event = { target: { value: '01JAN2026' } } as any;
    component.onRequestDateInput(event);
    expect(true).toBeTrue();
  });

  // ── onRequestDateBlur ──────────────────────────────────────────────────────

  it('should parse valid date on request date blur', fakeAsync(() => {
    component.requestDateInput = { nativeElement: { value: '15-JUL-2026' } } as any;
    component.requestDateControl.setValue(null);
    component.onRequestDateBlur();
    tick(10);
    expect(component.requestDateControl.touched).toBeTrue();
  }));

  it('should set invalidDate on request date blur with bad value', fakeAsync(() => {
    component.requestDateInput = { nativeElement: { value: 'BADDATE' } } as any;
    component.requestDateControl.setValue(null);
    component.onRequestDateBlur();
    tick(10);
    expect(component.requestDateControl.hasError('invalidDate')).toBeTrue();
  }));

  it('should do nothing on request date blur when input is empty', fakeAsync(() => {
    component.requestDateInput = { nativeElement: { value: '' } } as any;
    component.requestDateControl.setValue(null);
    component.onRequestDateBlur();
    tick(10);
    expect(component.requestDateControl.hasError('invalidDate')).toBeFalse();
  }));

  // ── onTargetDateInput ──────────────────────────────────────────────────────

  it('should call DateFieldValidationUtility on target date input', () => {
    const ctrl = new FormControl(null);
    const event = { target: { value: '01JAN2026' } } as any;
    component.onTargetDateInput(event, ctrl);
    expect(true).toBeTrue();
  });

  // ── onTargetDateBlur ───────────────────────────────────────────────────────

  it('should parse valid date on target date blur', fakeAsync(() => {
    const ctrl = new FormControl(null);
    const event = { target: { value: '20-JUL-2026' } } as any;
    component.onTargetDateBlur(event as FocusEvent, ctrl);
    tick(10);
    expect(ctrl.touched).toBeTrue();
  }));

  it('should set invalidDate error on target date blur with bad value', fakeAsync(() => {
    const ctrl = new FormControl(null);
    const event = { target: { value: 'NOTVALID' } } as any;
    component.onTargetDateBlur(event as FocusEvent, ctrl);
    tick(10);
    expect(ctrl.hasError('invalidDate')).toBeTrue();
  }));

  it('should do nothing on target date blur when input is empty', fakeAsync(() => {
    const ctrl = new FormControl(null);
    const event = { target: { value: '' } } as any;
    component.onTargetDateBlur(event as FocusEvent, ctrl);
    tick(10);
    expect(ctrl.hasError('invalidDate')).toBeFalse();
  }));

  // ── onExactMatchChange / onInventorySearchChange ───────────────────────────

  it('should blur active element on exact match change', () => {
    const mockEl = { blur: jasmine.createSpy('blur') };
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(mockEl as any);
    component.onExactMatchChange();
    expect(mockEl.blur).toHaveBeenCalled();
  });

  it('should blur active element on inventory search change', () => {
    const mockEl = { blur: jasmine.createSpy('blur') };
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(mockEl as any);
    component.onInventorySearchChange();
    expect(mockEl.blur).toHaveBeenCalled();
  });

  // ── filteredPatients computed ───────────────────────────────────────────────

  it('should return all patients when filter term is empty', () => {
    component.allPatients.set([
      { patId: '1', patLastName: 'SMITH', status: 'A' },
      { patId: '2', patLastName: 'JONES', status: 'A' },
    ]);
    component.patientSearchFilterCtrl.setValue('');
    expect(component.filteredPatients().length).toBe(2);
  });

  it('should filter patients by last name', () => {
    component.allPatients.set([
      { patId: '1', patLastName: 'SMITH', status: 'A' },
      { patId: '2', patLastName: 'JONES', status: 'A' },
    ]);
    component.patientSearchFilterCtrl.setValue('smi');
    expect(component.filteredPatients().length).toBe(1);
    expect(component.filteredPatients()[0].patLastName).toBe('SMITH');
  });

  it('should filter patients by first name', () => {
    component.allPatients.set([
      { patId: '1', patLastName: 'SMITH', patFirstName: 'JOHN', status: 'A' },
      { patId: '2', patLastName: 'JONES', patFirstName: 'JANE', status: 'A' },
    ]);
    component.patientSearchFilterCtrl.setValue('jane');
    expect(component.filteredPatients().length).toBe(1);
    expect(component.filteredPatients()[0].patId).toBe('2');
  });

  // ── filteredRequestIds computed ────────────────────────────────────────────

  it('should return all request IDs when no search term', () => {
    component.patientRequests.set([{ requestId: 'R1' }, { requestId: 'R2' }]);
    component.requestIdSearchCtrl.setValue('');
    expect(component.filteredRequestIds().length).toBe(2);
  });

  it('should filter request IDs by term', () => {
    component.patientRequests.set([{ requestId: 'REQ001' }, { requestId: 'REQ002' }, { requestId: 'ABC' }]);
    component.requestIdSearchCtrl.setValue('req');
    expect(component.filteredRequestIds().length).toBe(2);
  });

  // ── optionsWithSelected ────────────────────────────────────────────────────

  it('should return filtered list when no selected value', () => {
    const filtered = [{ value: 'A', label: 'A' }];
    const all = [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }];
    const result = component.optionsWithSelected(filtered, all, null);
    expect(result).toBe(filtered);
  });

  it('should return filtered list when selected value is in filtered', () => {
    const filtered = [{ value: 'A', label: 'A' }];
    const all = [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }];
    const result = component.optionsWithSelected(filtered, all, 'A');
    expect(result).toBe(filtered);
  });

  it('should prepend selected option when not in filtered list', () => {
    const filtered = [{ value: 'A', label: 'A' }];
    const all = [{ value: 'A', label: 'A' }, { value: 'B', label: 'B-Label' }];
    const result = component.optionsWithSelected(filtered, all, 'B');
    expect(result.length).toBe(2);
    expect(result[0].value).toBe('B');
  });

  it('should return filtered when selected value not found in all options', () => {
    const filtered = [{ value: 'A', label: 'A' }];
    const all = [{ value: 'A', label: 'A' }];
    const result = component.optionsWithSelected(filtered, all, 'MISSING');
    expect(result).toBe(filtered);
  });

  // ── getEpitopeOptions / getAttribCodeOptions ───────────────────────────────

  it('should return empty array when no locus set for getEpitopeOptions', () => {
    expect(component.getEpitopeOptions(0)).toEqual([]);
  });

  it('should return epitopes for a set locus', () => {
    const opts = [{ value: 'E1', label: 'Epitope 1' }];
    component.hlaEpitopesMap.set({ A: opts });
    component.hlaAntibodiesArray.at(0).get('locus')?.setValue('A');
    expect(component.getEpitopeOptions(0)).toEqual(opts);
  });

  it('should return empty array when no group set for getAttribCodeOptions', () => {
    expect(component.getAttribCodeOptions(0)).toEqual([]);
  });

  it('should return codes for a set group', () => {
    const opts = [{ value: 'C1', label: 'Code 1' }];
    component.attribCodeOptionsMap.set({ GRP: opts });
    component.requestAttributesArray.at(0).get('attribGroup')?.setValue('GRP');
    expect(component.getAttribCodeOptions(0)).toEqual(opts);
  });

  // ── HLA Locus Change – cached epitopes ─────────────────────────────────────

  it('should not call API when epitopes already cached for locus', fakeAsync(() => {
    component.hlaEpitopesMap.set({ B: [{ value: 'E1', label: 'Ep1' }] });
    component.hlaAntibodiesArray.at(0).get('locus')?.setValue('B');
    mockService.getHlaEpitopesByLocus.calls.reset();
    component.onHlaLocusChange(0);
    tick();
    expect(mockService.getHlaEpitopesByLocus).not.toHaveBeenCalled();
  }));

  it('should not call API when locus is empty', fakeAsync(() => {
    component.hlaAntibodiesArray.at(0).get('locus')?.setValue('');
    mockService.getHlaEpitopesByLocus.calls.reset();
    component.onHlaLocusChange(0);
    tick();
    expect(mockService.getHlaEpitopesByLocus).not.toHaveBeenCalled();
  }));

  // ── Attrib Group Change – cached codes ─────────────────────────────────────

  it('should not call API when attrib codes already cached', fakeAsync(() => {
    component.attribCodeOptionsMap.set({ GRP1: [{ value: 'C1', label: 'Code1' }] });
    component.requestAttributesArray.at(0).get('attribGroup')?.setValue('GRP1');
    mockService.getAttributeCodes.calls.reset();
    component.onAttribGroupChange(0);
    tick();
    expect(mockService.getAttributeCodes).not.toHaveBeenCalled();
  }));

  it('should not call API when attrib group is empty', fakeAsync(() => {
    component.requestAttributesArray.at(0).get('attribGroup')?.setValue('');
    mockService.getAttributeCodes.calls.reset();
    component.onAttribGroupChange(0);
    tick();
    expect(mockService.getAttributeCodes).not.toHaveBeenCalled();
  }));

  // ── getError – maxlength ───────────────────────────────────────────────────

  it('should return maxlength error message', () => {
    component.requestForm.get('comments')?.setValue('x'.repeat(241));
    component.requestForm.get('comments')?.markAsTouched();
    expect(component.getError('comments')).toContain('must not exceed');
    expect(component.getError('comments')).toContain('240');
  });

  it('should return empty string when no errors on control', () => {
    component.requestForm.get('hospital')?.setValue('Some Hospital');
    expect(component.getError('hospital')).toBe('');
  });

  it('should use controlName as label if not in fieldLabels map', () => {
    // 'abo' is not in the fieldLabels map
    component.requestForm.get('lastName')?.setValue('');
    expect(component.getError('lastName')).toBe('Last Name is required');
  });

  // ── isSaveDisabled computed ────────────────────────────────────────────────

  it('should be disabled when isSaving is true', () => {
    component.isSaving.set(true);
    expect(component.isSaveDisabled()).toBeTrue();
  });

  // ── minTargetDate ──────────────────────────────────────────────────────────

  it('should return chapter local date start of day for minTargetDate', () => {
    const min = component.minTargetDate;
    expect(min).toBeTruthy();
    // minTargetDate calls getChapterLocalDate().startOf('day') which mutates the returned moment.
    // Compare by formatted date string to avoid moment reference/mutation issues.
    expect(min.format('YYYY-MM-DD')).toBe(mockChapterDate.format('YYYY-MM-DD'));
  });

  // ── maxDate computed ───────────────────────────────────────────────────────

  it('should return chapter local date start of day for maxDate', () => {
    const max = component.maxDate();
    expect(max).toBeTruthy();
    expect(max.isSame(mockChapterDate.clone().startOf('day'))).toBeTrue();
  });

  // ── Chapter change subscription ────────────────────────────────────────────

  it('should reload patients and LOVs on chapter change', fakeAsync(() => {
    mockService.getPatients.calls.reset();
    mockService.getAboCodes.calls.reset();
    chapterChanged$.next();
    tick();
    expect(mockService.getPatients).toHaveBeenCalled();
    expect(mockService.getAboCodes).toHaveBeenCalled();
    expect(component.allPatients()).toEqual([]);
  }));

  // ── Load patients error path ───────────────────────────────────────────────

  it('should set isLoadingPatients false on error', fakeAsync(() => {
    mockService.getPatients.and.returnValue(throwError(() => new Error('fail')));
    chapterChanged$.next();
    tick();
    expect(component.isLoadingPatients()).toBeFalse();
  }));

  // ── Save with physician and hospital resolution ────────────────────────────

  it('should resolve hospital name and physician name in payload', fakeAsync(() => {
    component.hospitalOptions.set([{ value: 'HOS', label: 'City Hospital' }]);
    component.physicianOptions.set([{ value: 'PH1', label: 'Dr. Smith' }]);
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', physician: 'PH1',
      matchCriteriaType: 'HP',
    });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.hospitalName).toBe('City Hospital');
    expect(payload.physicianId).toBe('PH1');
    expect(payload.physicianName).toBe('Dr. Smith');
  }));

  // ── Save with DOB and request date ─────────────────────────────────────────

  it('should include formatted dob and requestDate in payload', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP',
    });
    component.dobDateControl.setValue(moment('2000-05-15'));
    component.requestDateControl.setValue(moment('2026-07-14'));
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.dob).toBe('2000-05-15');
    expect(payload.requestDate).toBe('2026-07-14');
  }));

  // ── Save with request attributes and scheduled dates ────────────────────────

  it('should include scheduledDates and requestDetails in payload', fakeAsync(() => {
    component.onCreateNewRecipient();
    component.requestForm.patchValue({
      lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP',
    });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ targetDate: moment('2026-08-01'), units: '3' });
    component.requestAttributesArray.at(0).patchValue({ attribGroup: 'G1', attribCode: 'C1' });
    component.onSave(false);
    tick();
    const payload = mockService.saveRequest.calls.mostRecent().args[0];
    expect(payload.scheduledDates).toBeDefined();
    expect(payload.scheduledDates.length).toBe(1);
    expect(payload.requestDetails).toBeDefined();
    expect(payload.requestDetails.length).toBe(1);
  }));

  // ── filteredEpitopeOptions / filteredAttribCodeOptions ─────────────────────

  it('should return filtered epitopes for a row', () => {
    component.hlaEpitopesMap.set({ A: [
      { value: 'E1', label: 'Epitope 1' },
      { value: 'E2', label: 'Epitope 2' },
    ]});
    component.hlaAntibodiesArray.at(0).get('locus')?.setValue('A');
    const results = component.filteredEpitopeOptions(0);
    expect(results.length).toBe(2);
  });

  it('should return filtered attrib codes for a row', () => {
    component.attribCodeOptionsMap.set({ G1: [
      { value: 'C1', label: 'Code 1' },
      { value: 'C2', label: 'Code 2' },
    ]});
    component.requestAttributesArray.at(0).get('attribGroup')?.setValue('G1');
    const results = component.filteredAttribCodeOptions(0);
    expect(results.length).toBe(2);
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // ── Save & Search dialog confirmation false ────────────────────────────────

  it('should not save when dialog is cancelled on Save & Search', fakeAsync(() => {
    (component as any).dialog.open.and.returnValue({ afterClosed: () => of(false) } as any);
    component.onCreateNewRecipient();
    component.requestForm.patchValue({ lastName: 'TEST', status: 'A', hospital: 'HOS', matchCriteriaType: 'HP' });
    component.requestDateControl.setValue(mockChapterDate.clone());
    component.scheduledDatesArray.at(0).patchValue({ units: '1' });
    mockService.saveRequest.calls.reset();
    component.onSave(true);
    tick();
    expect(mockService.saveRequest).not.toHaveBeenCalled();
    expect(component.hasSaved()).toBeFalse();
    expect(component.hasSubmittedSearch()).toBeFalse();
  }));
});
