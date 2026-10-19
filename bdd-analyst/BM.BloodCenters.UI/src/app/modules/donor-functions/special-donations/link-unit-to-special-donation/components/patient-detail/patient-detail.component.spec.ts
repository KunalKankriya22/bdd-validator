import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientDetailComponent } from './patient-detail.component';
import { LinkUnitService } from '../../services/link-unit.service';
import { ErrorCodeService } from '../../services/error-code.service';
import { HeaderService } from '@shared/services/header.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { LinkedUnitModel } from '../../models/special-donor.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('PatientDetailComponent', () => {
  let component: PatientDetailComponent;
  let fixture: ComponentFixture<PatientDetailComponent>;
  let mockLinkUnitService: jasmine.SpyObj<LinkUnitService>;
  let mockErrorCodeService: jasmine.SpyObj<ErrorCodeService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let dialog: MatDialog;
  let overlayContainer: OverlayContainer;
  let mockActivatedRoute: any;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    mockLinkUnitService = jasmine.createSpyObj('LinkUnitService', [
      'getPatientById',
      'getSpecialDonors',
      'getLinkedUnits',
      'searchDonors',
      'linkUnit',
      'unlinkUnit',
      'validateScanUnit'
    ]);
    mockErrorCodeService = jasmine.createSpyObj('ErrorCodeService', ['getErrorMessage']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId'], {
      chapterChanged$: chapterChangedSubject.asObservable()
    });
    mockHeaderService.getCurrentChapterId.and.returnValue('1');
    mockSnackbarService = createMockSnackbarService();

    mockActivatedRoute = {
      params: of({ patientId: 'PAT001', surgId: 'SURG001' })
    };

    mockRouter.getCurrentNavigation.and.returnValue(null);
    mockLinkUnitService.getPatientById.and.returnValue(
      of({
        patId: 'PAT001',
        patLastName: 'Patient',
        patFirstName: 'Test',
        sex: 'M',
        surgId: 'SURG001',
        surgDate: '2025-10-15',
        surgeryDay: 'Tuesday',
        surgTypeDescription: 'Surgery Type',
        phoneNumber: '123-456-7890'
      })
    );
    mockLinkUnitService.getSpecialDonors.and.returnValue(of([]));
    mockLinkUnitService.getLinkedUnits.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [PatientDetailComponent, NoopAnimationsModule, MatDialogModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: LinkUnitService, useValue: mockLinkUnitService },
        { provide: ErrorCodeService, useValue: mockErrorCodeService },
        { provide: Router, useValue: mockRouter },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });

    fixture = TestBed.createComponent(PatientDetailComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  describe('ngOnInit', () => {
    it('should load patient data on init', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(mockLinkUnitService.getPatientById).toHaveBeenCalledWith('PAT001', 'SURG001', '1');
        expect(mockLinkUnitService.getSpecialDonors).toHaveBeenCalledWith('PAT001', 'SURG001', '1');
        expect(mockLinkUnitService.getLinkedUnits).toHaveBeenCalledWith('PAT001', 'SURG001', '1');
        expect(component.patient()).toBeTruthy();
        done();
      }, 100);
    });

    it('should load donors and linked units independently', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(mockLinkUnitService.getSpecialDonors).toHaveBeenCalled();
        expect(mockLinkUnitService.getLinkedUnits).toHaveBeenCalled();
        expect(component.isDonorsLoading()).toBe(false);
        expect(component.isLinkedUnitsLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should show empty linked units when linked units API fails (error caught in service)', (done) => {
      mockLinkUnitService.getLinkedUnits.and.returnValue(of([]));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.linkedUnits().length).toBe(0);
        expect(component.isLinkedUnitsLoading()).toBe(false);
        expect(component.linkedUnitsError()).toBe('');
        done();
      }, 100);
    });
  });

  describe('onDonorAutoSelected', () => {
    beforeEach(() => {
      mockLinkUnitService.getSpecialDonors.and.returnValue(of([
        {
          donorNumber: 1,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '(214)361-4038',
          internationalPhone: '+44-20-7946-0958',
          status: 'Collected' as const,
          unitId: 'W123',
          collectionDate: '2025-10-10',
          donorId: 'DN123',
          donorName: 'Doe, John',
          dateOfBirth: '1985-01-01',
          sex: 'M'
        }
      ]));
    });

    it('should populate phone fields when donor is selected via autocomplete', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const donor = component.specialDonors()[0];
        component.onDonorAutoSelected({ option: { value: donor } });

        expect(component.selectedDonor).toBeTruthy();
        expect(component.linkForm.get('phone')?.value).toBe('(214)361-4038');
        expect(component.linkForm.get('internationalPhone')?.value).toBe('+44-20-7946-0958');
        done();
      }, 200);
    });

    it('should do nothing when donor option value is null', () => {
      fixture.detectChanges();
      component.selectedDonor = {
        donorNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        donorId: 'DN123',
        donorName: 'Test Donor',
        dateOfBirth: '1985-01-01',
        sex: 'Male',
        collectionDate: '2025-10-10'
      };

      component.onDonorAutoSelected({ option: { value: null } });

      // onDonorAutoSelected returns early for null, so selectedDonor remains unchanged
      expect(component.selectedDonor).toBeTruthy();
    });

    it('should clear unit fields when a new donor is selected', (done) => {
      fixture.detectChanges();
      component.unitRegistrationInfo.set({ isRegistered: true, collectionDate: '2025-01-01' });
      component.donorDemographics.set({ donorId: 'D1', donorName: 'Test', lastName: 'T', firstName: 'T', dateOfBirth: '', gender: 'M' });

      setTimeout(() => {
        const donor = component.specialDonors()[0];
        component.onDonorAutoSelected({ option: { value: donor } });

        expect(component.unitRegistrationInfo()).toBeNull();
        expect(component.donorDemographics()).toBeNull();
        done();
      }, 200);
    });
  });

  describe('onUnlinkUnit', () => {
    const mockUnit: LinkedUnitModel = {
      unitId: 'W123',
      collectionDate: '2025-10-10',
      seqNo: 1
    };

    it('should unlink unit after dialog confirmation', (done) => {
      fixture.detectChanges();

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRef);

      mockLinkUnitService.unlinkUnit.and.returnValue(
        of({ success: true, message: 'Unit unlinked successfully', statusCode: 200, item: true })
      );

      component.onUnlinkUnit(mockUnit);

      setTimeout(() => {
        expect(component['dialog'].open).toHaveBeenCalled();
        expect(mockLinkUnitService.unlinkUnit).toHaveBeenCalled();
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Unit unlinked successfully');
        done();
      }, 100);
    });

    it('should not unlink unit if dialog is cancelled', (done) => {
      fixture.detectChanges();

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(false));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRef);

      component.onUnlinkUnit(mockUnit);

      setTimeout(() => {
        expect(component['dialog'].open).toHaveBeenCalled();
        expect(mockLinkUnitService.unlinkUnit).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('onLinkUnit', () => {
    it('should link unit with overrideWarnings true on success', (done) => {
      fixture.detectChanges();
      component.selectedDonor = {
        donorNumber: 1,
        firstName: 'John',
        lastName: 'Doe',
        donorId: 'DN123',
        donorName: 'Test Donor',
        dateOfBirth: '1985-01-01',
        sex: 'Female',
        collectionDate: '2025-10-10'
      };
      component.linkForm.patchValue({ donorLastName: 'Doe', collectionDate: '2025-10-10' });
      component.unitRegistrationInfo.set({ isRegistered: true, collectionDate: '2025-10-10' });
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123', clear: () => {} };
      component.specialDonors.set([{
        donorNumber: 1, firstName: 'John', lastName: 'Doe'
      }]);

      const successResponse = {
        success: true,
        message: 'Unit linked successfully',
        statusCode: 200,
        item: true
      };
      mockLinkUnitService.linkUnit.and.returnValue(of(successResponse));

      component.onLinkUnit();

      setTimeout(() => {
        const callArgs = mockLinkUnitService.linkUnit.calls.mostRecent().args[0];
        expect(callArgs.overrideWarnings).toBe(true);
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Unit linked successfully');
        expect(component.isLinking()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('onPostValidate', () => {
    let mockEvent: any;

    beforeEach(() => {
      fixture.detectChanges();
      mockEvent = {
        data: { parsedUnitId: 'W123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
    });

    it('should call validateScanUnit with seqNo 0 when no donor is selected', (done) => {
      component.selectedDonor = null;
      const scanResponse = {
        success: true, message: 'OK', error: null, errorCode: null, statusCode: 200,
        item: {
          isRegistered: false, collectionDate: null, collectionDateSource: null,
          donorId: null, donorName: null, dateOfBirth: null, gender: null,
          isValid: true, hasWarnings: false, warnings: [], errorCode: null, errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      component.onPostValidate(mockEvent);

      setTimeout(() => {
        expect(mockLinkUnitService.validateScanUnit).toHaveBeenCalledWith('W123', 'PAT001', 'SURG001', 0);
        expect(mockEvent.confirm).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should call validateScanUnit and confirm on success without warnings', (done) => {
      component.selectedDonor = {
        donorNumber: 1, firstName: 'John', lastName: 'Doe'
      };
      const scanResponse = {
        success: true,
        message: 'Unit validated successfully',
        error: null,
        errorCode: null,
        statusCode: 200,
        item: {
          isRegistered: true,
          collectionDate: '2025-10-10T00:00:00',
          collectionDateSource: 'DONATIONS' as const,
          donorId: 'D555',
          donorName: 'Doe, Jane',
          dateOfBirth: '1985-03-20T00:00:00',
          gender: 'F',
          isValid: true,
          hasWarnings: false,
          warnings: [],
          errorCode: null,
          errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      component.onPostValidate(mockEvent);

      setTimeout(() => {
        expect(mockLinkUnitService.validateScanUnit).toHaveBeenCalledWith('W123', 'PAT001', 'SURG001', 1);
        expect(component.unitRegistrationInfo()).toEqual({
          isRegistered: true,
          collectionDate: '2025-10-10T00:00:00'
        });
        expect(component.donorDemographics()).toEqual({
          donorId: 'D555',
          donorName: 'Doe, Jane',
          lastName: '',
          firstName: '',
          dateOfBirth: '1985-03-20T00:00:00',
          gender: 'F'
        });
        expect(mockEvent.confirm).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set donorDemographics to null when no donor info returned', (done) => {
      component.selectedDonor = {
        donorNumber: 1, firstName: 'John', lastName: 'Doe'
      };
      const scanResponse = {
        success: true,
        message: 'Unit validated',
        error: null,
        errorCode: null,
        statusCode: 200,
        item: {
          isRegistered: false,
          collectionDate: null,
          collectionDateSource: null,
          donorId: null,
          donorName: null,
          dateOfBirth: null,
          gender: null,
          isValid: true,
          hasWarnings: false,
          warnings: [],
          errorCode: null,
          errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      component.onPostValidate(mockEvent);

      setTimeout(() => {
        expect(component.donorDemographics()).toBeNull();
        expect(mockEvent.confirm).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should clear fields and reject on API error', (done) => {
      component.selectedDonor = {
        donorNumber: 1, firstName: 'John', lastName: 'Doe'
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(
        throwError(() => ({ error: { message: 'This Unit is already assigned to a patient' } }))
      );

      component.onPostValidate(mockEvent);

      setTimeout(() => {
        expect(component.unitRegistrationInfo()).toBeNull();
        expect(component.donorDemographics()).toBeNull();
        expect(mockEvent.reject).toHaveBeenCalledWith('');
        done();
      }, 100);
    });

    it('should show sequential warning dialogs when warnings are returned', (done) => {
      component.selectedDonor = {
        donorNumber: 1, firstName: 'John', lastName: 'Doe'
      };
      const scanResponse = {
        success: true,
        message: 'Warnings detected',
        error: null,
        errorCode: null,
        statusCode: 200,
        item: {
          isRegistered: true,
          collectionDate: '2025-10-10T00:00:00',
          collectionDateSource: 'DONATIONS' as const,
          donorId: 'D555',
          donorName: 'Doe, Jane',
          dateOfBirth: '1985-03-20T00:00:00',
          gender: 'F',
          isValid: true,
          hasWarnings: true,
          warnings: [
            { warningCode: 'SAME_PATIENT_UNIT' as const, message: 'Unit is already linked' }
          ],
          errorCode: null,
          errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRef);

      component.onPostValidate(mockEvent);

      setTimeout(() => {
        expect(component['dialog'].open).toHaveBeenCalled();
        expect(mockEvent.confirm).toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should clear fields when user clicks No on warning dialog', (done) => {
      component.selectedDonor = {
        donorNumber: 1, firstName: 'John', lastName: 'Doe'
      };
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123', clear: jasmine.createSpy('clear') };

      const scanResponse = {
        success: true,
        message: 'Warnings detected',
        error: null,
        errorCode: null,
        statusCode: 200,
        item: {
          isRegistered: true,
          collectionDate: '2025-10-10T00:00:00',
          collectionDateSource: 'DONATIONS' as const,
          donorId: 'D555',
          donorName: 'Doe, Jane',
          dateOfBirth: '1985-03-20T00:00:00',
          gender: 'F',
          isValid: true,
          hasWarnings: true,
          warnings: [
            { warningCode: 'DONOR_NOT_ASSOCIATED' as const, message: 'Donor not associated' }
          ],
          errorCode: null,
          errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(false));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRef);

      component.onPostValidate(mockEvent);

      setTimeout(() => {
        expect(component.unitRegistrationInfo()).toBeNull();
        expect(component.donorDemographics()).toBeNull();
        expect((component as any).unitIdField.clear).toHaveBeenCalled();
        expect(mockEvent.reject).toHaveBeenCalledWith('');
        done();
      }, 200);
    });
  });

  describe('formatSex', () => {
    it('should format M as Male', () => {
      expect(component.formatSex('M')).toBe('Male');
    });

    it('should format F as Female', () => {
      expect(component.formatSex('F')).toBe('Female');
    });

    it('should return dash for empty value', () => {
      expect(component.formatSex('')).toBe('-');
    });

    it('should return original value for unknown sex', () => {
      expect(component.formatSex('X')).toBe('X');
    });
  });

  describe('onUnitCleared', () => {
    it('should clear unitRegistrationInfo and donorDemographics', () => {
      component.unitRegistrationInfo.set({ isRegistered: true, collectionDate: '2025-01-01' });
      component.donorDemographics.set({ donorId: 'D1', donorName: 'Test', lastName: 'T', firstName: 'T', dateOfBirth: '', gender: 'M' });

      component.onUnitCleared();

      expect(component.unitRegistrationInfo()).toBeNull();
      expect(component.donorDemographics()).toBeNull();
    });
  });

  describe('Empty linked units state', () => {
    it('should show empty state when no linked units', (done) => {
      mockLinkUnitService.getLinkedUnits.and.returnValue(of([]));
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const rightSection = fixture.nativeElement.querySelector('.table-section-right');
        const emptyState = rightSection?.querySelector('.empty-state');
        expect(emptyState).toBeTruthy();

        const icon = rightSection?.querySelector('.empty-state-icon');
        expect(icon).toBeTruthy();
        expect(icon.textContent.trim()).toBe('link');

        const text = rightSection?.querySelector('.empty-state-text');
        expect(text).toBeTruthy();
        expect(text.textContent.trim()).toBe('No Linked Units to Display');
        done();
      }, 100);
    });

    it('should hide Don# when seqNo is 0', (done) => {
      mockLinkUnitService.getLinkedUnits.and.returnValue(of([
        { unitId: 'W456', collectionDate: '2025-10-10', seqNo: 0 }
      ]));
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const unitDate = fixture.nativeElement.querySelector('.unit-date');
        expect(unitDate).toBeTruthy();
        expect(unitDate.textContent).not.toContain('Don#');
        expect(unitDate.textContent).toContain('Collected on');
        done();
      }, 200);
    });
  });

  describe('Accessibility', () => {
    it('should have required attribute on required fields', () => {
      fixture.detectChanges();

      const requiredInputs = fixture.nativeElement.querySelectorAll('input[required]');
      expect(requiredInputs.length).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    it('should format valid date', () => {
      expect(component.formatDate('2025-10-15')).toMatch(/15-OCT-2025/);
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('formatDayOfWeek', () => {
    it('should return day name for valid date', () => {
      const result = component.formatDayOfWeek('2025-10-15');
      expect(result).toBe('Wednesday');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatDayOfWeek('')).toBe('');
    });
  });

  describe('getPatientFirstName', () => {
    it('should return first name from patient name', () => {
      component.patient.set({
        patientId: 'P1', patientName: 'John Smith', dateOfBirth: '',
        sex: 'M', surgeryDate: '', neededBy: '', shipTo: '',
        status: 'Active', surgId: 'S1'
      });

      expect(component.getPatientFirstName()).toBe('John');
    });

    it('should return empty string when no patient', () => {
      component.patient.set(null);
      expect(component.getPatientFirstName()).toBe('');
    });
  });

  describe('isLinkDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be true when no donor name', () => {
      component.linkForm.get('donorLastName')!.setValue('');
      expect(component.isLinkDisabled).toBe(true);
    });

    it('should be true when isLinking', () => {
      component.linkForm.get('donorLastName')!.setValue('Doe');
      component.isLinking.set(true);
      expect(component.isLinkDisabled).toBe(true);
    });

    it('should be true when no collection date', () => {
      component.linkForm.get('donorLastName')!.setValue('Doe');
      component.linkForm.get('collectionDate')!.setValue(null);
      expect(component.isLinkDisabled).toBe(true);
    });
  });

  describe('displayDonorLastName', () => {
    it('should return empty string for null', () => {
      expect(component.displayDonorLastName(null as any)).toBe('');
    });

    it('should return string as-is for string input', () => {
      expect(component.displayDonorLastName('Smith')).toBe('Smith');
    });

    it('should return lastName for donor object', () => {
      const donor = { donorNumber: 1, firstName: 'John', lastName: 'Doe' } as any;
      expect(component.displayDonorLastName(donor)).toBe('Doe');
    });
  });

  describe('onDonorLastNameInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear selectedDonor', () => {
      component.selectedDonor = { donorNumber: 1, firstName: 'John', lastName: 'Doe' } as any;
      component.linkForm.get('donorLastName')!.setValue('Sm');

      component.onDonorLastNameInput();

      expect(component.selectedDonor).toBeNull();
    });
  });

  describe('onDonorAutoSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockLinkUnitService.getSpecialDonors.and.returnValue(of([
        { donorNumber: 1, firstName: 'Jane', lastName: 'Doe', phoneNumber: '555-1234', internationalPhone: '+44-555' }
      ]));
    });

    it('should set selectedDonor and patch form', () => {
      const donor = { donorNumber: 1, firstName: 'Jane', lastName: 'Doe', phoneNumber: '555-1234', internationalPhone: '+44-555' };
      const event = { option: { value: donor } };

      component.onDonorAutoSelected(event);

      expect(component.selectedDonor).toBeTruthy();
      expect(component.selectedDonor!.firstName).toBe('Jane');
      expect(component.linkForm.get('donorFirstName')!.value).toBe('Jane');
      expect(component.linkForm.get('phone')!.value).toBe('555-1234');
      expect(component.linkForm.get('internationalPhone')!.value).toBe('+44-555');
    });

    it('should do nothing for null donor', () => {
      const event = { option: { value: null } };

      component.onDonorAutoSelected(event);

      expect(component.selectedDonor).toBeNull();
    });
  });

  describe('onBack', () => {
    it('should navigate to list view', () => {
      component.onBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/donor-functions/special-donations/link-unit-to-special-donation']
      );
    });
  });

  describe('chapterChanged$', () => {
    it('should navigate back to list when chapter changes', () => {
      fixture.detectChanges();

      chapterChangedSubject.next();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/donor-functions/special-donations/link-unit-to-special-donation']
      );
    });
  });

  describe('onDonorSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.specialDonors.set([
        { donorNumber: 3, firstName: 'C', lastName: 'Three' },
        { donorNumber: 1, firstName: 'A', lastName: 'One' },
        { donorNumber: 2, firstName: 'B', lastName: 'Two' }
      ]);
    });

    it('should sort donors ascending by donorNumber', () => {
      component.onDonorSortChange({ column: 'donorNumber', direction: 'A' });

      const sorted = component.specialDonors();
      expect(sorted[0].donorNumber).toBe(1);
      expect(sorted[1].donorNumber).toBe(2);
      expect(sorted[2].donorNumber).toBe(3);
    });

    it('should sort donors descending by donorNumber', () => {
      component.onDonorSortChange({ column: 'donorNumber', direction: 'D' });

      const sorted = component.specialDonors();
      expect(sorted[0].donorNumber).toBe(3);
      expect(sorted[2].donorNumber).toBe(1);
    });

    it('should reset to default order for default direction', () => {
      component.onDonorSortChange({ column: 'donorNumber', direction: 'default' });

      const sorted = component.specialDonors();
      expect(sorted[0].donorNumber).toBe(1);
    });
  });

  describe('loadLinkedUnits - error handling', () => {
    it('should set error message on linked units failure', (done) => {
      mockLinkUnitService.getLinkedUnits.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.linkedUnits().length).toBe(0);
        expect(component.isLinkedUnitsLoading()).toBe(false);
        expect(component.linkedUnitsError()).toBe('Failed to load linked units');
        done();
      }, 200);
    });
  });

  describe('loadDonors - error handling', () => {
    it('should set empty donors on API failure', (done) => {
      mockLinkUnitService.getSpecialDonors.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.specialDonors().length).toBe(0);
        expect(component.isDonorsLoading()).toBe(false);
        done();
      }, 200);
    });
  });

  describe('onUnitCleared - collection date reset', () => {
    it('should also clear collection date form control', () => {
      fixture.detectChanges();
      component.linkForm.get('collectionDate')!.setValue('2025-10-15');

      component.onUnitCleared();

      expect(component.linkForm.get('collectionDate')!.value).toBeNull();
    });
  });

  describe('onPostValidate - collection date auto-populate', () => {
    it('should auto-populate collection date for registered unit', (done) => {
      fixture.detectChanges();
      component.selectedDonor = { donorNumber: 1, firstName: 'John', lastName: 'Doe' };
      const scanResponse = {
        success: true, message: 'OK', error: null, errorCode: null, statusCode: 200,
        item: {
          isRegistered: true, collectionDate: '2025-10-10T00:00:00',
          collectionDateSource: 'DONATIONS' as const,
          donorId: 'D1', donorName: 'Doe, John', dateOfBirth: '1990-01-01', gender: 'M',
          isValid: true, hasWarnings: false, warnings: [], errorCode: null, errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      const event = {
        data: { parsedUnitId: 'W123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(event);

      setTimeout(() => {
        const collDate = component.linkForm.get('collectionDate')!.value;
        expect(collDate).toBeTruthy();
        expect(event.confirm).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should clear collection date for unregistered unit', (done) => {
      fixture.detectChanges();
      component.selectedDonor = { donorNumber: 1, firstName: 'John', lastName: 'Doe' };
      component.linkForm.get('collectionDate')!.setValue('existing-date');
      const scanResponse = {
        success: true, message: 'OK', error: null, errorCode: null, statusCode: 200,
        item: {
          isRegistered: false, collectionDate: null,
          collectionDateSource: null,
          donorId: null, donorName: null, dateOfBirth: null, gender: null,
          isValid: true, hasWarnings: false, warnings: [], errorCode: null, errorMessage: null
        }
      };
      mockLinkUnitService.validateScanUnit.and.returnValue(of(scanResponse));

      const event = {
        data: { parsedUnitId: 'W999' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(event);

      setTimeout(() => {
        const collDate = component.linkForm.get('collectionDate')!.value;
        expect(collDate).toBeNull();
        done();
      }, 100);
    });
  });

  describe('phone mutual exclusion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear international phone when domestic phone is set', () => {
      component.linkForm.get('internationalPhone')!.setValue('+44-555');
      component.linkForm.get('phone')!.setValue('555-1234');

      expect(component.linkForm.get('internationalPhone')!.value).toBe('');
    });

    it('should clear domestic phone when international phone is set', () => {
      component.linkForm.get('phone')!.setValue('555-1234');
      component.linkForm.get('internationalPhone')!.setValue('+44-555');

      expect(component.linkForm.get('phone')!.value).toBe('');
    });
  });

  describe('onLinkUnit - existing donor', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedDonor = { donorNumber: 1, firstName: 'John', lastName: 'Doe' };
      component.linkForm.get('donorLastName')!.setValue('Doe');
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123', clear: () => {} };
      component.linkForm.get('collectionDate')!.setValue('2025-10-10');
    });

    it('should not call createDonor for existing donor', () => {
      const successResponse = { success: true, message: 'Linked', statusCode: 200, item: true };
      mockLinkUnitService.linkUnit.and.returnValue(of(successResponse));

      component.onLinkUnit();

      expect(mockLinkUnitService.linkUnit).toHaveBeenCalled();
    });

    it('should show error snackbar on link failure', (done) => {
      const failResponse = { success: false, message: 'Link failed', statusCode: 400, item: false };
      mockLinkUnitService.linkUnit.and.returnValue(of(failResponse));

      component.onLinkUnit();

      setTimeout(() => {
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Link failed');
        expect(component.isLinking()).toBe(false);
        done();
      }, 100);
    });

    it('should handle link API error', (done) => {
      mockLinkUnitService.linkUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.onLinkUnit();

      setTimeout(() => {
        expect(mockSnackbarService.showError).toHaveBeenCalled();
        expect(component.isLinking()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('onLinkUnit - no donor name returns early', () => {
    it('should not call linkUnit when donor name is empty', () => {
      fixture.detectChanges();
      component.linkForm.get('donorLastName')!.setValue('');
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123', clear: () => {} };

      component.onLinkUnit();

      expect(mockLinkUnitService.linkUnit).not.toHaveBeenCalled();
    });

    it('should not call linkUnit when unitIdField is invalid', () => {
      fixture.detectChanges();
      component.linkForm.get('donorLastName')!.setValue('Doe');
      (component as any).unitIdField = { isValid: false, parsedUnitId: null, clear: () => {} };

      component.onLinkUnit();

      expect(mockLinkUnitService.linkUnit).not.toHaveBeenCalled();
    });
  });

  describe('filteredDonors', () => {
    it('should return all donors when search is empty', () => {
      fixture.detectChanges();
      component.specialDonors.set([
        { donorNumber: 1, firstName: 'John', lastName: 'Doe' },
        { donorNumber: 2, firstName: 'Jane', lastName: 'Smith' }
      ]);

      expect(component.filteredDonors().length).toBe(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });
  });
});
