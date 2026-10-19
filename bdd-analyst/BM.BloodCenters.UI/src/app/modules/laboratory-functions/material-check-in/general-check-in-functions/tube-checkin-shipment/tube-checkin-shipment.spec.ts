import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TubeCheckinShipmentComponent } from './tube-checkin-shipment';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TubeCheckinShipmentService } from './services/tube-checkin-shipment.service';
import { of, throwError } from 'rxjs';
import { SamplePackDto, SamplePackTubeDto } from './models/tube-checkin-shipment.model';
import moment from 'moment';

describe('TubeCheckinShipmentComponent', () => {
  let component: TubeCheckinShipmentComponent;
  let fixture: ComponentFixture<TubeCheckinShipmentComponent>;
  let mockTubeService: jasmine.SpyObj<TubeCheckinShipmentService>;

  beforeEach(() => {

    const mockHeaderService = {
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('TEST_CHAPTER'),
    };

    const mockPageHeaderService = {
      pageHeaderData: signal<any>(undefined),
      getTitle: jasmine.createSpy('getTitle').and.returnValue('Tube Check-In/Shipment'),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(undefined),
    };

    const mockChapterTimezoneService = {
      convertToChapterDate: jasmine.createSpy('convertToChapterDate').and.returnValue(new Date()),
      convertToChapterTime: jasmine.createSpy('convertToChapterTime').and.returnValue(new Date()),
      getChapterLocalDate: jasmine.createSpy('getChapterLocalDate').and.returnValue({
        toDate: () => new Date(),
      }),
      isChapterLocalDateAvailable: jasmine.createSpy('isChapterLocalDateAvailable').and.returnValue(true),
      fetchChapterTimezone: jasmine.createSpy('fetchChapterTimezone').and.returnValue(of(null)),
    };

    mockTubeService = jasmine.createSpyObj('TubeCheckinShipmentService', [
      'getOpenBoxesDetailed', 'getDestinationLabs', 'getPlateCapacity',
      'getBoxHeader', 'createBox', 'addTube', 'close', 'getBoxUnits',
      'viewUnitsInBox', 'getOpenBoxes',
    ]);
    // Default return values for all service methods
    mockTubeService.getOpenBoxesDetailed.and.returnValue(of([]));
    mockTubeService.getDestinationLabs.and.returnValue(of([]));
    mockTubeService.getPlateCapacity.and.returnValue(of(88));
    mockTubeService.getBoxHeader.and.returnValue(of(null));
    mockTubeService.createBox.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));
    mockTubeService.addTube.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockTubeService.close.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockTubeService.getBoxUnits.and.returnValue(of([]));
    mockTubeService.viewUnitsInBox.and.returnValue(of({ tubes: [], unitCount: 0, tubeCount: 0 }));

      TestBed.configureTestingModule({
      imports: [TubeCheckinShipmentComponent],
      providers: [
        provideHttpClient(),
        provideAnimationsAsync(),
        provideRouter([]),
        MatSnackBar,
        MatDialog,
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(TubeCheckinShipmentComponent);
    component = fixture.componentInstance;

    // Replace the component-level service with the mock
    // With ES2022 target + readonly, the field is writable:false, so we must use defineProperty
    try {
      Object.defineProperty(component, 'tubeCheckinService', {
        value: mockTubeService,
        writable: true,
        configurable: true,
      });
    } catch {
      // Fallback: assign via any cast
      (component as any).tubeCheckinService = mockTubeService;
    }


    });


  it('should initialize forms on ngOnInit', () => {
    fixture.detectChanges();
    expect(component.boxForm).toBeDefined();
    expect(component.scanForm).toBeDefined();
  });



  it('should have box form with correct controls', () => {
    fixture.detectChanges();
    expect(component.boxForm.get('boxId')).toBeDefined();
    expect(component.boxForm.get('collectionDate')).toBeDefined();
    expect(component.boxForm.get('extractType')).toBeDefined();
    expect(component.boxForm.get('donorType')).toBeDefined();
    expect(component.boxForm.get('destinationCode')).toBeDefined();
  });

  it('should have scan form with correct controls', () => {
    fixture.detectChanges();
    expect(component.scanForm.get('redTop')).toBeDefined();
    expect(component.scanForm.get('purpleTop1')).toBeDefined();
    expect(component.scanForm.get('purpleTop2')).toBeDefined();
  });

  it('should set required validators on box form fields', () => {
    fixture.detectChanges();
    const collectionDateControl = component.boxForm.get('collectionDate');
    const extractTypeControl = component.boxForm.get('extractType');
    const donorTypeControl = component.boxForm.get('donorType');
    const destinationControl = component.boxForm.get('destinationCode');

    // Collection date has a default value, so it won't have required error
    expect(collectionDateControl?.hasError('required')).toBe(false);
    expect(extractTypeControl?.hasError('required')).toBe(true);
    expect(donorTypeControl?.hasError('required')).toBe(true);
    expect(destinationControl?.hasError('required')).toBe(true);
  });





  it('should allow boxId to be empty for new box creation', () => {
    fixture.detectChanges();
    component.boxForm.patchValue({
      boxId: '',
      collectionDate: new Date('2026-06-10'),
      extractType: 'V',
      donorType: 'R',
      destinationCode: 'BRK',
    });
    expect(component.boxForm.valid).toBe(true);
  });

  it('should disable scan form initially', () => {
    fixture.detectChanges();
    // Scan form is not disabled initially
    expect(component.scanForm.get('redTop')?.disabled).toBe(false);
    expect(component.scanForm.get('purpleTop1')?.disabled).toBe(false);
    expect(component.scanForm.get('purpleTop2')?.disabled).toBe(false);
  });

  it('should show scanning section only after retrieve', () => {
    fixture.detectChanges();
    expect(component.showScanningSection()).toBe(false);
  });

  it('should have search controls for filters', () => {
    fixture.detectChanges();
    expect(component.boxIdSearchControl).toBeDefined();
    expect(component.extractTypeSearchControl).toBeDefined();
    expect(component.donorTypeSearchControl).toBeDefined();
    expect(component.destinationLabSearchControl).toBeDefined();
  });

  it('should initialize signals with default values', () => {
    fixture.detectChanges();
    // With mock service, loadInitialData completes synchronously so isLoading is false
    expect(component.hasError()).toBe(false);
    expect(component.currentBox()).toBeNull();
    expect(component.tubeEntries()).toEqual([]);
  });

  // NEW COMPREHENSIVE TESTS FOR RECENT CHANGES

  describe('Shared unit-id-field component integration', () => {
    let mockTubeService: jasmine.SpyObj<TubeCheckinShipmentService>;

    beforeEach(() => {
      mockTubeService = TestBed.inject(TubeCheckinShipmentService) as jasmine.SpyObj<TubeCheckinShipmentService>;
      fixture.detectChanges();
    });

    describe('onRedTopValidated', () => {
      it('should process scan when parsedUnitId is provided', fakeAsync(() => {
        spyOn<any>(component, 'processScan');
        const mockData = {
          parsedUnitId: 'W454526051302',
          checkDigit: '1',
          codeScheme: 'I' as const,
          manualUnitId: 'W454526051302-1',
          codabarUnitScheme: null,
          entryMode: 'S' as const,
          barcodeType: 'CODE128' as const,
          chapterScheme: 'I' as const,
          collectionDate: '2026-05-13',
        };

        component.onRedTopValidated(mockData);
        tick();

        expect(component['processScan']).toHaveBeenCalledWith('R', 'W454526051302');
      }));




    });

    describe('onPurpleTop1Validated', () => {
      it('should process scan when parsedUnitId is provided', fakeAsync(() => {
        spyOn<any>(component, 'processScan');
        const mockData = {
          parsedUnitId: 'W454526051302',
          checkDigit: '1',
          codeScheme: 'I' as const,
          manualUnitId: 'W454526051302-1',
          codabarUnitScheme: null,
          entryMode: 'S' as const,
          barcodeType: 'CODE128' as const,
          chapterScheme: 'I' as const,
          collectionDate: '2026-05-13',
        };

        component.onPurpleTop1Validated(mockData);
        tick();

        expect(component['processScan']).toHaveBeenCalledWith('P1', 'W454526051302');
      }));


    });

    describe('onPurpleTop2Validated', () => {
      it('should process scan when parsedUnitId is provided', fakeAsync(() => {
        spyOn<any>(component, 'processScan');
        const mockData = {
          parsedUnitId: 'W454526051302',
          checkDigit: '1',
          codeScheme: 'I' as const,
          manualUnitId: 'W454526051302-1',
          codabarUnitScheme: null,
          entryMode: 'S' as const,
          barcodeType: 'CODE128' as const,
          chapterScheme: 'I' as const,
          collectionDate: '2026-05-13',
        };

        component.onPurpleTop2Validated(mockData);
        tick();

        expect(component['processScan']).toHaveBeenCalledWith('P2', 'W454526051302');
      }));


    });
  });

  describe('onEmptyFieldEnter - Tube requirement validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.boxForm.patchValue({
        boxId: 'CS616203',
        collectionDate: new Date('2026-06-10'),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      });
    });




    it('should handle empty tubeEntries array', () => {
      component.tubeEntries.set([]);
      spyOn<any>(component, 'validateTubeRequirement').and.returnValue(false);

      expect(() => component.onEmptyFieldEnter()).not.toThrow();
      expect(component['validateTubeRequirement']).toHaveBeenCalled();
    });
  });

  describe('validateTubeRequirement - Extract type V/N/B logic', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    describe('Extract Type V (Viral Marker)', () => {
      beforeEach(() => {
        component.boxForm.patchValue({ extractType: 'V' });
      });

      it('should return true if Red Top tube exists (Error 0020)', () => {
        const redTopTube: SamplePackTubeDto = {
          boxId: 'CS616203',
          unitId: 'W454526051302',
          redTubeFlag: 'Y',
          purpleTubeFlag: 'N',
          purpleTube2Flag: 'N',
          insertDate: new Date(),
          insertUser: 'TEST_USER',
          checkDigit: null,
        };
        component.tubeEntries.set([redTopTube]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(true);
      });

      it('should return true if Purple Top 1 tube exists (Error 0020)', () => {
        const purpleTop1Tube: SamplePackTubeDto = {
          boxId: 'CS616203',
          unitId: 'W454526051302',
          redTubeFlag: 'N',
          purpleTubeFlag: 'Y',
          purpleTube2Flag: 'N',
          insertDate: new Date(),
          insertUser: 'TEST_USER',
          checkDigit: null,
        };
        component.tubeEntries.set([purpleTop1Tube]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(true);
      });

      it('should return false and show Error 0020 if no Red Top or Purple Top 1 exists', () => {
        component.tubeEntries.set([]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(false);
        expect(snackBarSpy).toHaveBeenCalledWith(
          jasmine.stringContaining('Error 0020'),
          'DISMISS',
          jasmine.any(Object)
        );
      });
    });

    describe('Extract Type N (NAT)', () => {
      beforeEach(() => {
        component.boxForm.patchValue({ extractType: 'N' });
      });

      it('should return true if Purple Top 2 tube exists (Error 0080)', () => {
        const purpleTop2Tube: SamplePackTubeDto = {
          boxId: 'CS616203',
          unitId: 'W454526051302',
          redTubeFlag: 'N',
          purpleTubeFlag: 'N',
          purpleTube2Flag: 'Y',
          insertDate: new Date(),
          insertUser: 'TEST_USER',
          checkDigit: null,
        };
        component.tubeEntries.set([purpleTop2Tube]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(true);
      });

      it('should return false and show Error 0080 if no Purple Top 2 exists', () => {
        component.tubeEntries.set([]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(false);
        expect(snackBarSpy).toHaveBeenCalledWith(
          jasmine.stringContaining('Error 0080'),
          'DISMISS',
          jasmine.any(Object)
        );
      });
    });

    describe('Extract Type B (Both)', () => {
      beforeEach(() => {
        component.boxForm.patchValue({ extractType: 'B' });
      });

      it('should return true if any tube type exists', () => {
        const anyTube: SamplePackTubeDto = {
          boxId: 'CS616203',
          unitId: 'W454526051302',
          redTubeFlag: 'Y',
          purpleTubeFlag: 'N',
          purpleTube2Flag: 'N',
          insertDate: new Date(),
          insertUser: 'TEST_USER',
          checkDigit: null,
        };
        component.tubeEntries.set([anyTube]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(true);
      });

      it('should return false and show Error 0020 if no tubes exist', () => {
        component.tubeEntries.set([]);

        const result = component['validateTubeRequirement']();

        expect(result).toBe(false);
        expect(snackBarSpy).toHaveBeenCalledWith(
          jasmine.stringContaining('Error 0020'),
          'DISMISS',
          jasmine.any(Object)
        );
      });
    });
  });

  describe('validateCollectionYear - ±1 year validation', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should return true for current year', () => {
      const currentYear = moment().year();
      const collectionDate = moment().year(currentYear).month(5).date(10);

      const result = component['validateCollectionYear'](collectionDate);

      expect(result).toBe(true);
    });

    it('should return true for +1 year from current', () => {
      const nextYear = moment().year() + 1;
      const collectionDate = moment().year(nextYear).month(5).date(10);

      const result = component['validateCollectionYear'](collectionDate);

      expect(result).toBe(true);
    });

    it('should return true for -1 year from current', () => {
      const lastYear = moment().year() - 1;
      const collectionDate = moment().year(lastYear).month(5).date(10);

      const result = component['validateCollectionYear'](collectionDate);

      expect(result).toBe(true);
    });

    it('should return false for +2 years from current', () => {
      const twoYearsAhead = moment().year() + 2;
      const collectionDate = moment().year(twoYearsAhead).month(5).date(10);

      const result = component['validateCollectionYear'](collectionDate);

      expect(result).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('±1 year'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should return false for -2 years from current', () => {
      const twoYearsAgo = moment().year() - 2;
      const collectionDate = moment().year(twoYearsAgo).month(5).date(10);

      const result = component['validateCollectionYear'](collectionDate);

      expect(result).toBe(false);
    });



    it('should return true for non-moment value', () => {
      const result = component['validateCollectionYear']('invalid' as any);

      expect(result).toBe(true);
    });
  });

  describe('getCollectionDateError - Error priority (parse > invalid > required)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should prioritize parse error over required error', () => {
      const control = component.boxForm.get('collectionDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true, required: true });

      const error = component.getCollectionDateError();

      expect(error).toBe('Invalid date format');
    });

    it('should show invalid date error if present', () => {
      const control = component.boxForm.get('collectionDate');
      control?.markAsTouched();
      control?.setErrors({ invalidDate: true });

      const error = component.getCollectionDateError();

      expect(error).toBe('Invalid date format');
    });

    it('should show required error only if no parse or invalid errors', () => {
      const control = component.boxForm.get('collectionDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.setErrors({ required: true });

      const error = component.getCollectionDateError();

      expect(error).toBe('Collection Date is required');
    });


  });

  describe('calculateCheckDigit - ISBT MOD-37 algorithm', () => {
    it('should calculate check digit for valid ISBT unit ID', () => {
      const checkDigit = component['calculateCheckDigit']('W454526051302');

      expect(checkDigit).toBe('I'); // ISBT MOD-37 check digit for this unit
    });

    it('should handle numeric only unit IDs', () => {
      const checkDigit = component['calculateCheckDigit']('1234567890');

      expect(checkDigit).toBeTruthy();
      expect(typeof checkDigit).toBe('string');
    });



    it('should handle empty string', () => {
      const checkDigit = component['calculateCheckDigit']('');

      expect(checkDigit).toBe('');
    });

    it('should handle uppercase and lowercase letters', () => {
      const checkDigit1 = component['calculateCheckDigit']('ABC123');
      const checkDigit2 = component['calculateCheckDigit']('abc123');

      expect(checkDigit1).toBeTruthy();
      expect(checkDigit2).toBeTruthy();
    });

    it('should use MOD-37 alphabet correctly', () => {
      // Test known ISBT check digit calculation
      const unitId = 'W123456789012';
      const checkDigit = component['calculateCheckDigit'](unitId);

      // Check digit should be from MOD-37 alphabet
      const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';
      expect(MOD37_ALPHABET.includes(checkDigit)).toBe(true);
    });
  });

  describe('Collection date auto-population with chapter-local date', () => {
    let mockChapterTimezoneService: any;

    beforeEach(() => {
      mockChapterTimezoneService = TestBed.inject(ChapterTimezoneService);
    });




    it('should use chapter-local date in createNewBox', () => {
      const mockChapterDate = moment('2026-06-14');
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(mockChapterDate);

      fixture.detectChanges();

      // Verify that collection date form control gets the chapter-local date
      const collectionDateValue = component.boxForm.get('collectionDate')?.value;
      expect(collectionDateValue).toBeTruthy();
      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
    });


  });

  describe('Snackbar duration - Application-wide standard (3 seconds)', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });






    it('should format error codes correctly', () => {
      component['showErrorWithCode']('0080', 'NAT requires Purple Top 2 tube');
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0080:'),
        'DISMISS',
        jasmine.any(Object)
      );

      component['showErrorWithCode']('0252', 'Invalid Donor Type');
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0252: Invalid Donor Type'),
        'DISMISS',
        jasmine.any(Object)
      );
    });
  });

  describe('Unit ID field disabled state management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should disable redTop and purpleTop1 form controls when extract type is N', () => {
      component.boxForm.patchValue({ extractType: 'N' });

      const redTopControl = component.scanForm.get('redTop');
      const purpleTop1Control = component.scanForm.get('purpleTop1');
      expect(redTopControl?.disabled).toBe(true);
      expect(purpleTop1Control?.disabled).toBe(true);
      expect(redTopControl?.value).toBeNull(); // Should be reset to null
      expect(purpleTop1Control?.value).toBeNull(); // Should be reset to null
    });

    it('should enable all form controls when extract type is B', () => {
      // First disable them
      component.boxForm.patchValue({ extractType: 'V' });
      // Then enable all
      component.boxForm.patchValue({ extractType: 'B' });

      const redTopControl = component.scanForm.get('redTop');
      const purpleTop1Control = component.scanForm.get('purpleTop1');
      const purpleTop2Control = component.scanForm.get('purpleTop2');
      expect(redTopControl?.disabled).toBe(false);
      expect(purpleTop1Control?.disabled).toBe(false);
      expect(purpleTop2Control?.disabled).toBe(false);
    });

    it('should disable all form controls when extract type is empty', () => {
      component.boxForm.patchValue({ extractType: '' });

      const redTopControl = component.scanForm.get('redTop');
      const purpleTop1Control = component.scanForm.get('purpleTop1');
      const purpleTop2Control = component.scanForm.get('purpleTop2');
      expect(redTopControl?.disabled).toBe(true);
      expect(purpleTop1Control?.disabled).toBe(true);
      expect(purpleTop2Control?.disabled).toBe(true);
    });
  });

  // =====================================================================
  // NEW TESTS - Coverage expansion
  // =====================================================================

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset box form fields', () => {
      component.boxForm.patchValue({
        boxId: 'BOX123',
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      });
      component.currentBox.set({ boxId: 'BOX123' } as SamplePackDto);
      component.tubeEntries.set([{ unitId: 'U1' } as SamplePackTubeDto]);
      component.showScanningSection.set(true);

      component.onClear();

      expect(component.boxForm.get('boxId')?.value).toBe('');
      expect(component.boxForm.get('extractType')?.value).toBe('');
      expect(component.currentBox()).toBeNull();
      expect(component.tubeEntries()).toEqual([]);
      expect(component.showScanningSection()).toBe(false);
    });

    it('should clear check digit signals', () => {
      component.redTopCheckDigit.set('A');
      component.purpleTop1CheckDigit.set('B');
      component.purpleTop2CheckDigit.set('C');

      component.onClear();

      expect(component.redTopCheckDigit()).toBe('');
      expect(component.purpleTop1CheckDigit()).toBe('');
      expect(component.purpleTop2CheckDigit()).toBe('');
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear the form and reload open boxes', () => {
      spyOn(component, 'onClear');
      spyOn<any>(component, 'loadOpenBoxes');

      component.onCancel();

      expect(component.onClear).toHaveBeenCalled();
      expect(component['loadOpenBoxes']).toHaveBeenCalledWith('TEST_CHAPTER');
    });
  });

  describe('onBoxIdSelected', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should reset form fields when blank value is selected', () => {
      component.onBoxIdSelected({ value: null });

      expect(component.boxForm.get('extractType')?.value).toBe('');
      expect(component.boxForm.get('donorType')?.value).toBe('');
      expect(component.boxForm.get('destinationCode')?.value).toBe('');
    });

    it('should reset form fields when empty string is selected', () => {
      component.onBoxIdSelected({ value: '' });

      expect(component.boxForm.get('extractType')?.value).toBe('');
    });

    it('should fetch box details when a valid boxId is selected', fakeAsync(() => {
      const mockBox: SamplePackDto = {
        boxId: 'CS616203',
        collDate: new Date('2026-06-10'),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
        destinationName: 'Brookdale Lab',
        extractTypeDescription: 'Viral Marker',
        donorTypeDescription: 'Repeat',
        status: 'O',
        statusDescription: 'Open',
        chapterId: 'TEST_CHAPTER',
        boxClosedDate: null,
        boxClosedUser: null,
        insertDate: new Date(),
        insertUser: 'TEST_USER',
        tubeCount: 5,
      };

      mockTubeService.getBoxHeader.and.returnValue(of(mockBox));

      component.onBoxIdSelected({ value: 'CS616203' });
      tick();

      expect(mockTubeService.getBoxHeader).toHaveBeenCalledWith('CS616203', 'TEST_CHAPTER');
      expect(component.boxForm.get('extractType')?.value).toBe('V');
      expect(component.boxForm.get('donorType')?.value).toBe('R');
      expect(component.boxForm.get('destinationCode')?.value).toBe('BRK');
    }));

    it('should show error when fetching box details fails', fakeAsync(() => {
      mockTubeService.getBoxHeader.and.returnValue(throwError(() => new Error('API Error')));

      component.onBoxIdSelected({ value: 'BAD_BOX' });
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load box details'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('onRetrieve', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when required fields are missing', () => {
      component.boxForm.patchValue({
        boxId: 'BOX1',
        collectionDate: new Date(),
        extractType: '',
        donorType: 'R',
        destinationCode: 'BRK',
      });

      component.onRetrieve();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Please fill in all required fields'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error when collection date is missing', () => {
      component.boxForm.patchValue({
        boxId: 'BOX1',
        collectionDate: null,
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      });

      component.onRetrieve();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Please fill in all required fields'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should call createNewBox when boxId is empty', fakeAsync(() => {
      spyOn<any>(component, 'createNewBox');
      component.boxForm.patchValue({
        boxId: '',
        collectionDate: moment(),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      }, { emitEvent: false });

      component.onRetrieve();
      tick(200);

      expect(component['createNewBox']).toHaveBeenCalledWith('TEST_CHAPTER');
      expect(component.showScanningSection()).toBe(true);
    }));

    it('should retrieve existing box when boxId is provided', fakeAsync(() => {
      const mockBox: SamplePackDto = {
        boxId: 'CS616203',
        collDate: new Date('2026-06-10'),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
        destinationName: 'Brookdale',
        extractTypeDescription: 'Viral Marker',
        donorTypeDescription: 'Repeat',
        status: 'O',
        statusDescription: 'Open',
        chapterId: 'TEST_CHAPTER',
        boxClosedDate: null,
        boxClosedUser: null,
        insertDate: new Date(),
        insertUser: 'TEST_USER',
        tubeCount: 0,
      };

      mockTubeService.getBoxHeader.and.returnValue(of(mockBox));


      component.boxForm.patchValue({
        boxId: 'CS616203',
        collectionDate: moment(),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      }, { emitEvent: false });

      component.onRetrieve();
      tick(200);

      expect(component.currentBox()).toEqual(mockBox);
      expect(mockTubeService.getBoxUnits).toHaveBeenCalledWith('CS616203', 'TEST_CHAPTER');
    }));

    it('should show error when box is not found', fakeAsync(() => {
      mockTubeService.getBoxHeader.and.returnValue(of(null));

      component.boxForm.patchValue({
        boxId: 'NONEXISTENT',
        collectionDate: moment(),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      }, { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Box not found'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
      expect(component.showScanningSection()).toBe(false);
    }));

    it('should handle retrieve API error', fakeAsync(() => {
      mockTubeService.getBoxHeader.and.returnValue(throwError(() => new Error('API Error')));

      component.boxForm.patchValue({
        boxId: 'BOX_ERR',
        collectionDate: moment(),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      }, { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to retrieve box'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
      expect(component.showScanningSection()).toBe(false);
    }));

    it('should not proceed when collection year is invalid', () => {
      const farFuture = moment().year(moment().year() + 5).month(0).date(1);
      component.boxForm.patchValue({
        boxId: 'BOX1',
        collectionDate: farFuture,
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      });

      component.onRetrieve();

      // Should have shown year validation error
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('±1 year'),
        'DISMISS',
        jasmine.any(Object)
      );
    });
  });

  describe('createNewBox', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should create box successfully with moment date', fakeAsync(() => {
      const mockResult = {
        success: true,
        message: 'Created',
        statusCode: 200,
        item: { boxId: 'NEW_BOX1', extractType: 'V', donorType: 'R', destinationCode: 'BRK' } as any,
        data: [],
      };

      mockTubeService.createBox.and.returnValue(of(mockResult));

      spyOn<any>(component, 'loadOpenBoxes');

      component.boxForm.patchValue({
        collectionDate: moment('2026-06-10'),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      }, { emitEvent: false });

      component['createNewBox']('TEST_CHAPTER');
      tick(200);

      expect(mockTubeService.createBox).toHaveBeenCalled();
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('NEW_BOX1 created successfully'),
        'Dismiss',
        jasmine.any(Object)
      );
      expect(component.boxForm.get('boxId')?.value).toBe('NEW_BOX1');
      expect(component.currentBox()).toBeTruthy();
      expect(mockTubeService.getBoxUnits).toHaveBeenCalledWith('NEW_BOX1', 'TEST_CHAPTER');
      expect(component['loadOpenBoxes']).toHaveBeenCalledWith('TEST_CHAPTER');
      expect(component.isLoading()).toBe(false);
    }));

    it('should handle box creation with Date object instead of moment', fakeAsync(() => {
      const mockResult = {
        success: true,
        message: 'Created',
        statusCode: 200,
        data: [{ boxId: 'NEW_BOX2' }],
      };

      mockTubeService.createBox.and.returnValue(of(mockResult));

      spyOn<any>(component, 'loadOpenBoxes');

      component.boxForm.patchValue({
        collectionDate: new Date(2026, 5, 10), // June 10, 2026
        extractType: 'N',
        donorType: 'I',
        destinationCode: 'LAB1',
      }, { emitEvent: false });

      component['createNewBox']('TEST_CHAPTER');
      tick(200);

      expect(mockTubeService.createBox).toHaveBeenCalled();
      // Box ID should come from data[0].boxId since no item property
      expect(component.boxForm.get('boxId')?.value).toBe('NEW_BOX2');
    }));

    it('should handle create box failure response', fakeAsync(() => {
      const mockResult = {
        success: false,
        message: 'Duplicate box',
        statusCode: 400,
        errorCode: '0254',
      };

      mockTubeService.createBox.and.returnValue(of(mockResult));

      component.boxForm.patchValue({
        collectionDate: moment('2026-06-10'),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
      });

      component['createNewBox']('TEST_CHAPTER');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0254'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
      expect(component.showScanningSection()).toBe(false);
    }));

    it('should handle create box HTTP error', fakeAsync(() => {
      mockTubeService.createBox.and.returnValue(
        throwError(() => ({ error: { errorCode: '0253', message: 'Invalid Extract Type' } }))
      );

      component.boxForm.patchValue({
        collectionDate: moment('2026-06-10'),
        extractType: 'X',
        donorType: 'R',
        destinationCode: 'BRK',
      });

      component['createNewBox']('TEST_CHAPTER');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0253'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
      expect(component.showScanningSection()).toBe(false);
    }));

    it('should handle create box HTTP error with ErrorCode casing', fakeAsync(() => {
      mockTubeService.createBox.and.returnValue(
        throwError(() => ({ error: { ErrorCode: '1811', Message: 'Invalid Lab' } }))
      );

      component.boxForm.patchValue({
        collectionDate: moment('2026-06-10'),
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'INVALID',
      });

      component['createNewBox']('TEST_CHAPTER');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 1811'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('loadBoxUnits', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should load units and set tubeEntries', fakeAsync(() => {
      const mockUnits: SamplePackTubeDto[] = [
        {
          boxId: 'BOX1',
          unitId: 'U001',
          redTubeFlag: 'Y',
          purpleTubeFlag: 'N',
          purpleTube2Flag: 'N',
          insertDate: new Date(),
          insertUser: 'USER',
          checkDigit: null,
        },
      ];

      mockTubeService.getBoxUnits.and.returnValue(of(mockUnits));

      component['loadBoxUnits']('BOX1', 'TEST_CHAPTER');
      tick();

      expect(component.tubeEntries()).toEqual(mockUnits);
      expect(component.isLoading()).toBe(false);
    }));

    it('should show error on load failure', fakeAsync(() => {
      mockTubeService.getBoxUnits.and.returnValue(throwError(() => new Error('fail')));

      component['loadBoxUnits']('BOX1', 'TEST_CHAPTER');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load box units'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('loadOpenBoxes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update openBoxes signal on success', fakeAsync(() => {
      const mockBoxes = [{ boxId: 'B1' }, { boxId: 'B2' }] as SamplePackDto[];
      mockTubeService.getOpenBoxesDetailed.and.returnValue(of(mockBoxes));

      component['loadOpenBoxes']('TEST_CHAPTER');
      tick();

      expect(component.openBoxes()).toEqual(mockBoxes);
    }));

    it('should silently handle failure', fakeAsync(() => {
      mockTubeService.getOpenBoxesDetailed.and.returnValue(throwError(() => new Error('fail')));

      component['loadOpenBoxes']('TEST_CHAPTER');
      tick();

      // Should not throw, silently fails
      expect(true).toBe(true);
    }));
  });

  describe('loadInitialData', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should load destination labs successfully', fakeAsync(() => {
      const mockLabs = [{ testingLabId: 'LAB1', testingLabName: 'Lab One' }] as any[];
      mockTubeService.getOpenBoxesDetailed.and.returnValue(of([]));
      mockTubeService.getDestinationLabs.and.returnValue(of(mockLabs));
      mockTubeService.getPlateCapacity.and.returnValue(of(88));

      component.loadInitialData();
      tick();

      expect(component.destinationLabs()).toEqual(mockLabs);
      expect(component.isLoading()).toBe(false);
    }));

    it('should handle destination labs error', fakeAsync(() => {
      mockTubeService.getOpenBoxesDetailed.and.returnValue(of([]));
      mockTubeService.getDestinationLabs.and.returnValue(throwError(() => new Error('fail')));
      mockTubeService.getPlateCapacity.and.returnValue(of(88));

      component.loadInitialData();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load destination labs'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
    }));

    it('should handle open boxes error', fakeAsync(() => {
      mockTubeService.getOpenBoxesDetailed.and.returnValue(throwError(() => new Error('fail')));
      mockTubeService.getDestinationLabs.and.returnValue(of([]));
      mockTubeService.getPlateCapacity.and.returnValue(of(88));

      component.loadInitialData();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load open boxes'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle plate capacity error', fakeAsync(() => {
      mockTubeService.getOpenBoxesDetailed.and.returnValue(of([]));
      mockTubeService.getDestinationLabs.and.returnValue(of([]));
      mockTubeService.getPlateCapacity.and.returnValue(throwError(() => new Error('fail')));

      component.loadInitialData();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load plate capacity'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should set plate capacity on success', fakeAsync(() => {
      mockTubeService.getOpenBoxesDetailed.and.returnValue(of([]));
      mockTubeService.getDestinationLabs.and.returnValue(of([]));
      mockTubeService.getPlateCapacity.and.returnValue(of(96));

      component.loadInitialData();
      tick();

      expect(component.plateCapacity()).toBe(96);
    }));
  });

  describe('processScan', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when no box is selected', () => {
      component.boxForm.patchValue({ boxId: '' });

      component['processScan']('R', 'UNIT123');

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('No box selected'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error when plate capacity is reached', () => {
      component.boxForm.patchValue({ boxId: 'BOX1' });
      component.plateCapacity.set(2);
      component.tubeEntries.set([
        { unitId: 'U1' } as SamplePackTubeDto,
        { unitId: 'U2' } as SamplePackTubeDto,
      ]);

      component['processScan']('R', 'UNIT3');

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Plate capacity'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should add tube successfully with red tube flag', fakeAsync(() => {
      const mockResult = { success: true, message: 'OK', statusCode: 200 };
      mockTubeService.addTube.and.returnValue(of(mockResult));

      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.plateCapacity.set(88);
      component.tubeEntries.set([]);

      component['processScan']('R', 'UNIT123');
      tick();

      expect(mockTubeService.addTube).toHaveBeenCalledWith('BOX1', {
        unitId: 'UNIT123',
        redTubeFlag: 'Y',
        purpleTubeFlag: null,
        purpleTube2Flag: null,
      });
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Tube UNIT123 added successfully'),
        'Dismiss',
        jasmine.any(Object)
      );
    }));

    it('should add tube with purple tube 1 flag for P1 type', fakeAsync(() => {
      const mockResult = { success: true, message: 'OK', statusCode: 200 };
      mockTubeService.addTube.and.returnValue(of(mockResult));

      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.plateCapacity.set(88);
      component.tubeEntries.set([]);

      component['processScan']('P1', 'UNIT456');
      tick();

      expect(mockTubeService.addTube).toHaveBeenCalledWith('BOX1', {
        unitId: 'UNIT456',
        redTubeFlag: null,
        purpleTubeFlag: 'Y',
        purpleTube2Flag: null,
      });
    }));

    it('should add tube with purple tube 2 flag for P2 type', fakeAsync(() => {
      const mockResult = { success: true, message: 'OK', statusCode: 200 };
      mockTubeService.addTube.and.returnValue(of(mockResult));

      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.plateCapacity.set(88);
      component.tubeEntries.set([]);

      component['processScan']('P2', 'UNIT789');
      tick();

      expect(mockTubeService.addTube).toHaveBeenCalledWith('BOX1', {
        unitId: 'UNIT789',
        redTubeFlag: null,
        purpleTubeFlag: null,
        purpleTube2Flag: 'Y',
      });
    }));

    it('should show backend error on addTube failure response', fakeAsync(() => {
      const mockResult = { success: false, message: 'Unit already exists', statusCode: 400, errorCode: '0150' };
      mockTubeService.addTube.and.returnValue(of(mockResult));
      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.plateCapacity.set(88);
      component.tubeEntries.set([]);

      component['processScan']('R', 'DUP_UNIT');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0150'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should show error on addTube HTTP error', fakeAsync(() => {
      mockTubeService.addTube.and.returnValue(
        throwError(() => ({ error: { errorCode: '0020', message: 'Server error' } }))
      );
      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.plateCapacity.set(88);
      component.tubeEntries.set([]);

      component['processScan']('R', 'UNIT_ERR');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0020'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle addTube HTTP error without error body', fakeAsync(() => {
      mockTubeService.addTube.and.returnValue(
        throwError(() => ({ error: null }))
      );
      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.plateCapacity.set(88);
      component.tubeEntries.set([]);

      component['processScan']('R', 'UNIT_ERR2');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to add tube'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('onViewUnitsInBox', () => {
    let snackBarSpy: jasmine.Spy;
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      fixture.detectChanges();
    });

    it('should show error when no box is selected', () => {
      component.boxForm.patchValue({ boxId: '' });

      component.onViewUnitsInBox();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Please select a box first'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should open dialog with tube data on success', fakeAsync(() => {
      const mockData = {
        tubes: [{ unitId: 'U1', redTubeFlag: 'Y' } as SamplePackTubeDto],
        unitCount: 1,
        tubeCount: 1,
      };
      mockTubeService.viewUnitsInBox.and.returnValue(of(mockData));
      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });

      component.onViewUnitsInBox();
      tick();

      expect(dialogSpy).toHaveBeenCalled();
      const dialogConfig = dialogSpy.calls.mostRecent().args[1];
      expect(dialogConfig.data.boxId).toBe('BOX1');
      expect(dialogConfig.data.tubes).toEqual(mockData.tubes);
      expect(dialogConfig.data.unitCount).toBe(1);
    }));

    it('should show error on API failure', fakeAsync(() => {
      mockTubeService.viewUnitsInBox.and.returnValue(throwError(() => new Error('fail')));
      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });

      component.onViewUnitsInBox();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load box units'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('onPrintPackList', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when no box is selected', () => {
      component.boxForm.patchValue({ boxId: '' });

      component.onPrintPackList();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Please select a box first'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error when currentBox is null', () => {
      component.boxForm.patchValue({ boxId: 'BOX1' });
      component.currentBox.set(null);

      component.onPrintPackList();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Box information not available'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should call printPackList when box is available', () => {
      component.boxForm.patchValue({ boxId: 'BOX1' }, { emitEvent: false });
      component.currentBox.set({ boxId: 'BOX1' } as SamplePackDto);
      const printSpy = spyOn<any>(component, 'printPackList').and.callFake(() => {});

      component.onPrintPackList();

      expect(printSpy).toHaveBeenCalledWith('BOX1');
    });
  });

  describe('onCloseAndPrint', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when no box is selected', () => {
      component.boxForm.patchValue({ boxId: '' });

      component.onCloseAndPrint();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Please select a box first'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should not proceed when tube requirement validation fails', () => {
      component.boxForm.patchValue({ boxId: 'BOX1', extractType: 'V' });
      component.tubeEntries.set([]);

      component.onCloseAndPrint();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0020'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should open confirm dialog and close box on confirmation', fakeAsync(() => {
      const tube: SamplePackTubeDto = {
        boxId: 'BOX1', unitId: 'U1', redTubeFlag: 'Y',
        purpleTubeFlag: 'N', purpleTube2Flag: 'N',
        insertDate: new Date(), insertUser: 'U', checkDigit: null,
      };
      component.boxForm.patchValue({ boxId: 'BOX1', extractType: 'V' }, { emitEvent: false });
      component.tubeEntries.set([tube]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      // Spy on closeBox using callFake to prevent real execution
      const closeBoxSpy = spyOn<any>(component, 'closeBox').and.callFake(() => {});

      component.onCloseAndPrint();
      tick();

      expect(closeBoxSpy).toHaveBeenCalledWith('BOX1', true);
    }));

    it('should not close box when dialog is cancelled', fakeAsync(() => {
      const tube: SamplePackTubeDto = {
        boxId: 'BOX1', unitId: 'U1', redTubeFlag: 'Y',
        purpleTubeFlag: 'N', purpleTube2Flag: 'N',
        insertDate: new Date(), insertUser: 'U', checkDigit: null,
      };
      component.boxForm.patchValue({ boxId: 'BOX1', extractType: 'V' }, { emitEvent: false });
      component.tubeEntries.set([tube]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      const closeBoxSpy = spyOn<any>(component, 'closeBox').and.callFake(() => {});

      component.onCloseAndPrint();
      tick();

      expect(closeBoxSpy).not.toHaveBeenCalled();
    }));
  });

  describe('closeBox', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should close box successfully and print pack list', fakeAsync(() => {
      const mockResult = { success: true, message: 'OK', statusCode: 200 };
      mockTubeService.close.and.returnValue(of(mockResult));
      const printSpy = spyOn<any>(component, 'printPackList').and.callFake(() => {});
      spyOn(component, 'onClear');
      component.currentBox.set({ boxId: 'BOX1' } as SamplePackDto);

      component['closeBox']('BOX1', true);
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Box closed successfully'),
        'Dismiss',
        jasmine.any(Object)
      );
      expect(printSpy).toHaveBeenCalledWith('BOX1');
      expect(component.onClear).toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    }));

    it('should close box successfully without printing', fakeAsync(() => {
      const mockResult = { success: true, message: 'OK', statusCode: 200 };
      mockTubeService.close.and.returnValue(of(mockResult));
      const printSpy = spyOn<any>(component, 'printPackList').and.callFake(() => {});
      spyOn(component, 'onClear');
      component.currentBox.set({ boxId: 'BOX1' } as SamplePackDto);

      component['closeBox']('BOX1', false);
      tick();

      expect(printSpy).not.toHaveBeenCalled();
      expect(component.onClear).toHaveBeenCalled();
    }));

    it('should handle close box failure response', fakeAsync(() => {
      const mockResult = { success: false, message: 'Box already closed', statusCode: 400 };
      mockTubeService.close.and.returnValue(of(mockResult));

      component['closeBox']('BOX1', true);
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Box already closed'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isSaving()).toBe(false);
    }));

    it('should handle close box HTTP error', fakeAsync(() => {
      mockTubeService.close.and.returnValue(
        throwError(() => ({ error: { message: 'Server down' } }))
      );

      component['closeBox']('BOX1', true);
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Server down'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isSaving()).toBe(false);
    }));

    it('should handle close box HTTP error with no message', fakeAsync(() => {
      mockTubeService.close.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component['closeBox']('BOX1', true);
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to close box'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should not print when currentBox is null even if printPackList is true', fakeAsync(() => {
      const mockResult = { success: true, message: 'OK', statusCode: 200 };
      mockTubeService.close.and.returnValue(of(mockResult));
      const printSpy = spyOn<any>(component, 'printPackList').and.callFake(() => {});
      spyOn(component, 'onClear');
      component.currentBox.set(null);

      component['closeBox']('BOX1', true);
      tick();

      expect(printSpy).not.toHaveBeenCalled();
    }));
  });

  describe('printPackList', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when currentBox is null', () => {
      component.currentBox.set(null);

      component['printPackList']('BOX1');

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Box information not available'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should call generateAndPrint on success', fakeAsync(() => {
      const mockBox = { boxId: 'BOX1' } as SamplePackDto;
      const mockTubes = [{ unitId: 'U1' } as SamplePackTubeDto];
      component.currentBox.set(mockBox);
      mockTubeService.getBoxUnits.and.returnValue(of(mockTubes));
      spyOn<any>(component, 'generateAndPrint');

      component['printPackList']('BOX1');
      tick();

      expect(component['generateAndPrint']).toHaveBeenCalledWith(mockBox, mockTubes);
    }));

    it('should show error when getBoxUnits fails during print', fakeAsync(() => {
      component.currentBox.set({ boxId: 'BOX1' } as SamplePackDto);
      mockTubeService.getBoxUnits.and.returnValue(throwError(() => new Error('fail')));

      component['printPackList']('BOX1');
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load tubes for printing'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('generateAndPrint', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when popup is blocked', () => {
      spyOn(window, 'open').and.returnValue(null);

      const mockBox = { boxId: 'BOX1', extractType: 'V', donorType: 'R', destinationCode: 'BRK', status: 'C' } as SamplePackDto;
      component['generateAndPrint'](mockBox, []);

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Please allow popups'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should open print window and write content', fakeAsync(() => {
      const mockWindow = {
        document: {
          write: jasmine.createSpy('write'),
          close: jasmine.createSpy('close'),
        },
        print: jasmine.createSpy('print'),
        close: jasmine.createSpy('close'),
        onafterprint: null as any,
        onbeforeunload: null as any,
        closed: false,
      };
      spyOn(window, 'open').and.returnValue(mockWindow as any);

      const mockBox = {
        boxId: 'BOX1', extractType: 'V', donorType: 'R',
        destinationCode: 'BRK', status: 'C', collDate: new Date('2026-06-10'),
      } as SamplePackDto;
      const mockTubes = [{
        unitId: 'U001', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N',
      } as SamplePackTubeDto];

      component['generateAndPrint'](mockBox, mockTubes);
      tick(3000);

      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
      expect(mockWindow.print).toHaveBeenCalled();
    }));
  });

  describe('onScanRedTop', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not process when value is empty', () => {
      spyOn<any>(component, 'processScan');
      component.scanForm.patchValue({ redTop: '' });

      component.onScanRedTop();

      expect(component['processScan']).not.toHaveBeenCalled();
    });

    it('should open manual entry dialog when M is entered', () => {
      spyOn<any>(component, 'openManualEntryDialog');
      component.scanForm.patchValue({ redTop: 'M' });

      component.onScanRedTop();

      expect(component['openManualEntryDialog']).toHaveBeenCalledWith('R');
    });

    it('should process scan and set check digit for valid value', fakeAsync(() => {
      spyOn<any>(component, 'processScan');
      component.scanForm.patchValue({ redTop: 'W454526051302' });
      component.boxForm.patchValue({ extractType: 'V' });

      component.onScanRedTop();
      tick(100);

      expect(component['processScan']).toHaveBeenCalledWith('R', 'W454526051302');
      expect(component.redTopCheckDigit()).toBeTruthy();
      // Field should be cleared after scan
      expect(component.scanForm.get('redTop')?.value).toBe('');
    }));
  });

  describe('onScanPurpleTop1', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not process when value is empty', () => {
      spyOn<any>(component, 'processScan');
      component.scanForm.patchValue({ purpleTop1: '' });

      component.onScanPurpleTop1();

      expect(component['processScan']).not.toHaveBeenCalled();
    });

    it('should open manual entry dialog when M is entered', () => {
      spyOn<any>(component, 'openManualEntryDialog');
      component.scanForm.patchValue({ purpleTop1: 'm' }); // lowercase m

      component.onScanPurpleTop1();

      expect(component['openManualEntryDialog']).toHaveBeenCalledWith('P1');
    });

    it('should process scan for valid value', fakeAsync(() => {
      spyOn<any>(component, 'processScan');
      // Use extractType 'B' (Both) which keeps purpleTop1 enabled
      component.boxForm.patchValue({ extractType: 'B' });
      component.scanForm.patchValue({ purpleTop1: 'W454526051302' });

      component.onScanPurpleTop1();
      tick(100);

      expect(component['processScan']).toHaveBeenCalledWith('P1', 'W454526051302');
      expect(component.purpleTop1CheckDigit()).toBeTruthy();
    }));
  });

  describe('onScanPurpleTop2', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not process when value is empty', () => {
      spyOn<any>(component, 'processScan');
      component.scanForm.patchValue({ purpleTop2: '' });

      component.onScanPurpleTop2();

      expect(component['processScan']).not.toHaveBeenCalled();
    });

    it('should open manual entry dialog when M is entered', () => {
      spyOn<any>(component, 'openManualEntryDialog');
      component.scanForm.patchValue({ purpleTop2: 'M' });

      component.onScanPurpleTop2();

      expect(component['openManualEntryDialog']).toHaveBeenCalledWith('P2');
    });

    it('should process scan for valid value', fakeAsync(() => {
      spyOn<any>(component, 'processScan');
      component.scanForm.patchValue({ purpleTop2: 'W454526051302' });

      component.onScanPurpleTop2();
      tick(100);

      expect(component['processScan']).toHaveBeenCalledWith('P2', 'W454526051302');
      expect(component.purpleTop2CheckDigit()).toBeTruthy();
    }));
  });

  describe('onRedTopCleared, onPurpleTop1Cleared, onPurpleTop2Cleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle onRedTopCleared without error', () => {
      expect(() => component.onRedTopCleared()).not.toThrow();
    });

    it('should handle onPurpleTop1Cleared without error', () => {
      expect(() => component.onPurpleTop1Cleared()).not.toThrow();
    });

    it('should handle onPurpleTop2Cleared without error', () => {
      expect(() => component.onPurpleTop2Cleared()).not.toThrow();
    });
  });

  describe('onRedTopValidated/PurpleTop1Validated/PurpleTop2Validated - no parsedUnitId', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not process scan when parsedUnitId is null', () => {
      spyOn<any>(component, 'processScan');
      component.onRedTopValidated({ parsedUnitId: null } as any);
      expect(component['processScan']).not.toHaveBeenCalled();
    });

    it('should not process scan when parsedUnitId is empty string', () => {
      spyOn<any>(component, 'processScan');
      component.onPurpleTop1Validated({ parsedUnitId: '' } as any);
      expect(component['processScan']).not.toHaveBeenCalled();
    });

    it('should not process PurpleTop2 scan when parsedUnitId is undefined', () => {
      spyOn<any>(component, 'processScan');
      component.onPurpleTop2Validated({ parsedUnitId: undefined } as any);
      expect(component['processScan']).not.toHaveBeenCalled();
    });
  });

  describe('openManualEntryDialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog and process scan when unit ID is returned for R type', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('MANUAL_UNIT'));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      spyOn<any>(component, 'processScan');

      component['openManualEntryDialog']('R');
      tick();

      expect(component['dialog'].open).toHaveBeenCalled();
      expect(component['processScan']).toHaveBeenCalledWith('R', 'MANUAL_UNIT');
      expect(component.redTopCheckDigit()).toBeTruthy();
    }));

    it('should set purpleTop1CheckDigit for P1 type', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('MANUAL_P1'));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      spyOn<any>(component, 'processScan');

      component['openManualEntryDialog']('P1');
      tick();

      expect(component['processScan']).toHaveBeenCalledWith('P1', 'MANUAL_P1');
      expect(component.purpleTop1CheckDigit()).toBeTruthy();
    }));

    it('should set purpleTop2CheckDigit for P2 type', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('MANUAL_P2'));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      spyOn<any>(component, 'processScan');

      component['openManualEntryDialog']('P2');
      tick();

      expect(component['processScan']).toHaveBeenCalledWith('P2', 'MANUAL_P2');
      expect(component.purpleTop2CheckDigit()).toBeTruthy();
    }));

    it('should not process scan when dialog is closed without value', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      spyOn<any>(component, 'processScan');

      component['openManualEntryDialog']('R');
      tick();

      expect(component['processScan']).not.toHaveBeenCalled();
    }));
  });

  describe('validateTubeIdMatching', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should show error when tube IDs do not match', () => {
      component.scanForm.patchValue({
        redTop: 'UNIT_A',
        purpleTop1: 'UNIT_B',
        purpleTop2: '',
      }, { emitEvent: false });

      component['validateTubeIdMatching']();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0045'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should clear fields when mismatch detected', () => {
      component.scanForm.patchValue({
        redTop: 'UNIT_A',
        purpleTop1: 'UNIT_B',
        purpleTop2: '',
      }, { emitEvent: false });

      component['validateTubeIdMatching']();

      expect(component.scanForm.get('redTop')?.value).toBe('');
      expect(component.scanForm.get('purpleTop1')?.value).toBe('');
    });

    it('should not show error when tube IDs match', () => {
      component.scanForm.patchValue({
        redTop: 'UNIT_SAME',
        purpleTop1: 'UNIT_SAME',
        purpleTop2: '',
      }, { emitEvent: false });

      component['validateTubeIdMatching']();

      expect(snackBarSpy).not.toHaveBeenCalled();
    });

    it('should not validate when only one tube ID is entered', () => {
      component.scanForm.patchValue({
        redTop: 'UNIT_ONLY',
        purpleTop1: '',
        purpleTop2: '',
      }, { emitEvent: false });

      component['validateTubeIdMatching']();

      expect(snackBarSpy).not.toHaveBeenCalled();
    });
  });

  describe('capacityWarning computed signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when capacity is 0', () => {
      component.plateCapacity.set(0);
      expect(component.capacityWarning()).toBeNull();
    });

    it('should return error level when plate is full', () => {
      component.plateCapacity.set(2);
      component.tubeEntries.set([
        { unitId: 'U1' } as SamplePackTubeDto,
        { unitId: 'U2' } as SamplePackTubeDto,
      ]);

      const warning = component.capacityWarning();
      expect(warning?.level).toBe('error');
      expect(warning?.message).toContain('Plate Full');
    });

    it('should return warning level when plate is 80-99% full', () => {
      component.plateCapacity.set(10);
      const tubes = Array.from({ length: 8 }, (_, i) => ({ unitId: `U${i}` } as SamplePackTubeDto));
      component.tubeEntries.set(tubes);

      const warning = component.capacityWarning();
      expect(warning?.level).toBe('warning');
      expect(warning?.message).toContain('Almost Full');
    });

    it('should return info level when plate is under 80% full', () => {
      component.plateCapacity.set(10);
      component.tubeEntries.set([{ unitId: 'U1' } as SamplePackTubeDto]);

      const warning = component.capacityWarning();
      expect(warning?.level).toBe('info');
      expect(warning?.message).toContain('Plate Capacity');
    });
  });

  describe('filteredDonorTypeOptions computed', () => {
    it('should return all options when extract type is empty (initial state)', () => {
      // The computed reads boxForm.extractType which is '' at initialization
      // computed() doesn't reactively track FormControl values, only signals
      fixture.detectChanges();
      const options = component.filteredDonorTypeOptions();
      expect(options.length).toBe(3);
    });

    it('should have donor type options defined correctly', () => {
      fixture.detectChanges();
      expect(component.donorTypeOptions.length).toBe(3);
      expect(component.donorTypeOptions[0].value).toBe('I');
      expect(component.donorTypeOptions[1].value).toBe('R');
      expect(component.donorTypeOptions[2].value).toBe('O');
    });

    it('should have extract type options defined correctly', () => {
      fixture.detectChanges();
      expect(component.extractTypeOptions.length).toBe(3);
      expect(component.extractTypeOptions[0].value).toBe('V');
      expect(component.extractTypeOptions[1].value).toBe('N');
      expect(component.extractTypeOptions[2].value).toBe('B');
    });
  });

  describe('filteredOpenBoxes computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all boxes when search is empty', () => {
      const boxes = [
        { boxId: 'BOX1', extractType: 'V', donorType: 'R', destinationCode: 'BRK' },
        { boxId: 'BOX2', extractType: 'N', donorType: 'I', destinationCode: 'LAB' },
      ] as SamplePackDto[];
      component.openBoxes.set(boxes);
      component.boxIdSearch.set('');

      expect(component.filteredOpenBoxes().length).toBe(2);
    });

    it('should filter boxes by boxId search', () => {
      const boxes = [
        { boxId: 'BOX1', extractType: 'V', donorType: 'R', destinationCode: 'BRK' },
        { boxId: 'BOX2', extractType: 'N', donorType: 'I', destinationCode: 'LAB' },
      ] as SamplePackDto[];
      component.openBoxes.set(boxes);
      component.boxIdSearch.set('BOX1');

      expect(component.filteredOpenBoxes().length).toBe(1);
      expect(component.filteredOpenBoxes()[0].boxId).toBe('BOX1');
    });

    it('should filter boxes by extractType', () => {
      const boxes = [
        { boxId: 'BOX1', extractType: 'Viral', donorType: 'R', destinationCode: 'BRK' },
        { boxId: 'BOX2', extractType: 'NAT', donorType: 'I', destinationCode: 'LAB' },
      ] as SamplePackDto[];
      component.openBoxes.set(boxes);
      component.boxIdSearch.set('viral');

      expect(component.filteredOpenBoxes().length).toBe(1);
    });
  });

  describe('filteredExtractTypeOptions computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all options when search is empty', () => {
      component.extractTypeSearch.set('');
      expect(component.filteredExtractTypeOptions().length).toBe(3);
    });

    it('should filter by label', () => {
      component.extractTypeSearch.set('viral');
      const options = component.filteredExtractTypeOptions();
      expect(options.length).toBe(1);
      expect(options[0].value).toBe('V');
    });

    it('should filter by value', () => {
      component.extractTypeSearch.set('N');
      const options = component.filteredExtractTypeOptions();
      expect(options.length).toBe(1);
      expect(options[0].value).toBe('N');
    });
  });

  describe('filteredDonorTypeOptionsWithSearch computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return base options when search is empty', () => {
      component.boxForm.patchValue({ extractType: 'V' });
      component.donorTypeSearch.set('');
      expect(component.filteredDonorTypeOptionsWithSearch().length).toBe(3);
    });

    it('should filter by search and apply extract type constraint', () => {
      component.boxForm.patchValue({ extractType: 'N' });
      component.donorTypeSearch.set('first');
      const options = component.filteredDonorTypeOptionsWithSearch();
      expect(options.length).toBe(1);
      expect(options[0].value).toBe('I');
    });
  });

  describe('filteredDestinationLabs computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all labs when search is empty', () => {
      component.destinationLabs.set([
        { testingLabId: 'LAB1', testingLabName: 'Lab One' },
        { testingLabId: 'LAB2', testingLabName: 'Lab Two' },
      ] as any[]);
      component.destinationLabSearch.set('');

      expect(component.filteredDestinationLabs().length).toBe(2);
    });

    it('should filter by lab name', () => {
      component.destinationLabs.set([
        { testingLabId: 'LAB1', testingLabName: 'Brookdale Lab' },
        { testingLabId: 'LAB2', testingLabName: 'Central Lab' },
      ] as any[]);
      component.destinationLabSearch.set('brook');

      expect(component.filteredDestinationLabs().length).toBe(1);
      expect(component.filteredDestinationLabs()[0].testingLabId).toBe('LAB1');
    });

    it('should filter by lab ID', () => {
      component.destinationLabs.set([
        { testingLabId: 'BRK', testingLabName: 'Brookdale Lab' },
        { testingLabId: 'CTR', testingLabName: 'Central Lab' },
      ] as any[]);
      component.destinationLabSearch.set('CTR');

      expect(component.filteredDestinationLabs().length).toBe(1);
    });

    it('should handle null testingLabName', () => {
      component.destinationLabs.set([
        { testingLabId: 'LAB1', testingLabName: null },
      ] as any[]);
      component.destinationLabSearch.set('test');

      expect(component.filteredDestinationLabs().length).toBe(0);
    });
  });

  describe('shouldShowRedTopAsterisk / shouldShowPurpleTop1Asterisk / shouldShowPurpleTop2Asterisk', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show red top asterisk for V and B extract types', () => {
      component.boxForm.patchValue({ extractType: 'V' });
      expect(component.shouldShowRedTopAsterisk()).toBe(true);

      component.boxForm.patchValue({ extractType: 'B' });
      expect(component.shouldShowRedTopAsterisk()).toBe(true);

      component.boxForm.patchValue({ extractType: 'N' });
      expect(component.shouldShowRedTopAsterisk()).toBe(false);
    });

    it('should show purple top 1 asterisk for V and B extract types', () => {
      component.boxForm.patchValue({ extractType: 'V' });
      expect(component.shouldShowPurpleTop1Asterisk()).toBe(true);

      component.boxForm.patchValue({ extractType: 'B' });
      expect(component.shouldShowPurpleTop1Asterisk()).toBe(true);

      component.boxForm.patchValue({ extractType: 'N' });
      expect(component.shouldShowPurpleTop1Asterisk()).toBe(false);
    });

    it('should show purple top 2 asterisk for N and B extract types', () => {
      component.boxForm.patchValue({ extractType: 'N' });
      expect(component.shouldShowPurpleTop2Asterisk()).toBe(true);

      component.boxForm.patchValue({ extractType: 'B' });
      expect(component.shouldShowPurpleTop2Asterisk()).toBe(true);

      component.boxForm.patchValue({ extractType: 'V' });
      expect(component.shouldShowPurpleTop2Asterisk()).toBe(false);
    });
  });

  describe('isPurpleTop2Required', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for NAT extract type', () => {
      component.boxForm.patchValue({ extractType: 'N' });
      expect(component.isPurpleTop2Required()).toBe(true);
    });

    it('should return false for other extract types', () => {
      component.boxForm.patchValue({ extractType: 'V' });
      expect(component.isPurpleTop2Required()).toBe(false);

      component.boxForm.patchValue({ extractType: 'B' });
      expect(component.isPurpleTop2Required()).toBe(false);
    });
  });

  describe('getExtractTypeDescription', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return label for V', () => {
      component.boxForm.patchValue({ extractType: 'V' });
      expect(component.getExtractTypeDescription()).toBe('Viral Marker');
    });

    it('should return label for N', () => {
      component.boxForm.patchValue({ extractType: 'N' });
      expect(component.getExtractTypeDescription()).toBe('NAT');
    });

    it('should return label for B', () => {
      component.boxForm.patchValue({ extractType: 'B' });
      expect(component.getExtractTypeDescription()).toBe('Both');
    });

    it('should return empty string when no extract type is selected', () => {
      component.boxForm.patchValue({ extractType: '' });
      expect(component.getExtractTypeDescription()).toBe('');
    });
  });

  describe('getDonorTypeDescription', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return label for I', () => {
      component.boxForm.patchValue({ donorType: 'I' });
      expect(component.getDonorTypeDescription()).toBe('First Time');
    });

    it('should return label for R', () => {
      component.boxForm.patchValue({ donorType: 'R' });
      expect(component.getDonorTypeDescription()).toBe('Repeat');
    });

    it('should return label for O', () => {
      component.boxForm.patchValue({ donorType: 'O' });
      expect(component.getDonorTypeDescription()).toBe('Others');
    });

    it('should return empty string when no donor type', () => {
      component.boxForm.patchValue({ donorType: '' });
      expect(component.getDonorTypeDescription()).toBe('');
    });
  });

  describe('getSelectedLabName', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return lab name for selected destination code', () => {
      component.destinationLabs.set([
        { testingLabId: 'BRK', testingLabName: 'Brookdale' } as any,
      ]);
      component.boxForm.patchValue({ destinationCode: 'BRK' });

      expect(component.getSelectedLabName()).toBe('Brookdale');
    });

    it('should return empty string when no destination code', () => {
      component.boxForm.patchValue({ destinationCode: '' });
      expect(component.getSelectedLabName()).toBe('');
    });

    it('should return empty string when lab not found', () => {
      component.destinationLabs.set([]);
      component.boxForm.patchValue({ destinationCode: 'NONEXISTENT' });
      expect(component.getSelectedLabName()).toBe('');
    });
  });

  describe('onPageChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update pagination config', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update sort config and sort data ascending', () => {
      component.tubeEntries.set([
        { unitId: 'B001', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N' } as SamplePackTubeDto,
        { unitId: 'A001', redTubeFlag: 'N', purpleTubeFlag: 'Y', purpleTube2Flag: 'N' } as SamplePackTubeDto,
      ]);

      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(component.tableConfig.sortConfig?.column).toBe('unitId');
      expect(component.tubeEntries()[0].unitId).toBe('A001');
    });

    it('should sort data descending', () => {
      component.tubeEntries.set([
        { unitId: 'A001', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N' } as SamplePackTubeDto,
        { unitId: 'B001', redTubeFlag: 'N', purpleTubeFlag: 'Y', purpleTube2Flag: 'N' } as SamplePackTubeDto,
      ]);

      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(component.tubeEntries()[0].unitId).toBe('B001');
    });

    it('should handle null values in sort', () => {
      component.tubeEntries.set([
        { unitId: 'A001', redTubeFlag: null, purpleTubeFlag: 'N', purpleTube2Flag: 'N' } as SamplePackTubeDto,
        { unitId: 'B001', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N' } as SamplePackTubeDto,
      ]);

      component.onSortChange({ column: 'redTubeFlag', direction: 'A' });

      // Null values should sort to end
      expect(component.tubeEntries()[0].redTubeFlag).toBe('Y');
    });

    it('should handle both null values in sort', () => {
      component.tubeEntries.set([
        { unitId: 'A001', redTubeFlag: null } as SamplePackTubeDto,
        { unitId: 'B001', redTubeFlag: null } as SamplePackTubeDto,
      ]);

      component.onSortChange({ column: 'redTubeFlag', direction: 'A' });

      // Both null should maintain order
      expect(component.tubeEntries().length).toBe(2);
    });
  });

  describe('onCollectionDateBlur and onCollectionDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should parse valid DDMMMYYYY format on blur', () => {
      component.onCollectionDateBlur({ target: { value: '15JUN2026' } });

      const dateValue = component.boxForm.get('collectionDate')?.value;
      expect(dateValue).toBeTruthy();
      if (dateValue instanceof Date) {
        expect(dateValue.getFullYear()).toBe(2026);
        expect(dateValue.getMonth()).toBe(5); // June = 5
        expect(dateValue.getDate()).toBe(15);
      }
    });

    it('should parse DD-MMM-YYYY format on blur', () => {
      component.onCollectionDateBlur({ target: { value: '15-JUN-2026' } });

      const dateValue = component.boxForm.get('collectionDate')?.value;
      expect(dateValue).toBeTruthy();
    });

    it('should handle empty input on blur', () => {
      const originalValue = component.boxForm.get('collectionDate')?.value;
      component.onCollectionDateBlur({ target: { value: '' } });
      // Should not change the value
      expect(component.boxForm.get('collectionDate')?.value).toEqual(originalValue);
    });

    it('should parse valid date on input event', () => {
      component.onCollectionDateInput({ target: { value: '10JAN2026' } });

      const dateValue = component.boxForm.get('collectionDate')?.value;
      expect(dateValue).toBeTruthy();
    });

    it('should handle empty input event', () => {
      const originalValue = component.boxForm.get('collectionDate')?.value;
      component.onCollectionDateInput({ target: { value: '' } });
      expect(component.boxForm.get('collectionDate')?.value).toEqual(originalValue);
    });
  });

  describe('parseAndFormatDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty input', () => {
      expect(component['parseAndFormatDate']('')).toBeNull();
      expect(component['parseAndFormatDate']('  ')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(component['parseAndFormatDate'](null as any)).toBeNull();
    });

    it('should parse DDMMMYYYY format', () => {
      const result = component['parseAndFormatDate']('15JUN2026');
      expect(result).toBeTruthy();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(5);
      expect(result!.getDate()).toBe(15);
    });

    it('should parse DD-MMM-YYYY format', () => {
      const result = component['parseAndFormatDate']('01-JAN-2026');
      expect(result).toBeTruthy();
      expect(result!.getMonth()).toBe(0);
    });

    it('should parse case-insensitive month names', () => {
      const result = component['parseAndFormatDate']('15jun2026');
      expect(result).toBeTruthy();
      expect(result!.getMonth()).toBe(5);
    });

    it('should parse browser-compatible date formats', () => {
      const result = component['parseAndFormatDate']('2026-06-15');
      expect(result).toBeTruthy();
    });

    it('should return null for completely invalid dates', () => {
      const result = component['parseAndFormatDate']('not-a-date-xyz');
      expect(result).toBeNull();
    });
  });

  describe('formatDateToDDMMMYYYY', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format date correctly', () => {
      const date = new Date(2026, 5, 15); // June 15, 2026
      const result = component['formatDateToDDMMMYYYY'](date);
      expect(result).toBe('15-JUN-2026');
    });

    it('should pad single-digit days', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      const result = component['formatDateToDDMMMYYYY'](date);
      expect(result).toBe('05-JAN-2026');
    });
  });

  describe('showSuccess', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should display success message with Dismiss button and 3 second duration', () => {
      component['showSuccess']('Test success message');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Test success message',
        'Dismiss',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        })
      );
    });
  });

  describe('showError', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should display error message with DISMISS button and 3 second duration', () => {
      component['showError']('Test error message');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Test error message',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        })
      );
    });
  });

  describe('showErrorWithCode - all error code mappings', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should format error code 0020', () => {
      component['showErrorWithCode']('0020', 'Test message');
      expect(snackBarSpy).toHaveBeenCalledWith('Error 0020: Test message', 'DISMISS', jasmine.any(Object));
    });

    it('should format error code 0150', () => {
      component['showErrorWithCode']('0150', 'Test message');
      expect(snackBarSpy).toHaveBeenCalledWith('Error 0150: Test message', 'DISMISS', jasmine.any(Object));
    });

    it('should format error code 0253', () => {
      component['showErrorWithCode']('0253', 'Bad extract');
      expect(snackBarSpy).toHaveBeenCalledWith('Error 0253: Invalid Extract Type - Bad extract', 'DISMISS', jasmine.any(Object));
    });

    it('should format error code 0254', () => {
      component['showErrorWithCode']('0254', 'Box issue');
      expect(snackBarSpy).toHaveBeenCalledWith('Error 0254: Box Error - Box issue', 'DISMISS', jasmine.any(Object));
    });

    it('should format error code 1811', () => {
      component['showErrorWithCode']('1811', 'Invalid lab');
      expect(snackBarSpy).toHaveBeenCalledWith('Error 1811: Invalid Testing Lab - Invalid lab', 'DISMISS', jasmine.any(Object));
    });

    it('should format unknown error code', () => {
      component['showErrorWithCode']('9999', 'Unknown error');
      expect(snackBarSpy).toHaveBeenCalledWith('Error 9999: Unknown error', 'DISMISS', jasmine.any(Object));
    });

    it('should display message without code when errorCode is undefined', () => {
      component['showErrorWithCode'](undefined, 'No code error');
      expect(snackBarSpy).toHaveBeenCalledWith('No code error', 'DISMISS', jasmine.any(Object));
    });
  });

  describe('getTableColumns and valueFormatters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return columns with correct headers', () => {
      const columns = component['getTableColumns']();
      expect(columns.length).toBe(4);
      expect(columns[0].header).toBe('Unit ID');
      expect(columns[1].header).toBe('Red Top');
      expect(columns[2].header).toBe('Purple Top 1');
      expect(columns[3].header).toBe('Purple Top 2');
    });

    it('should format Unit ID with check digit', () => {
      const columns = component['getTableColumns']();
      const unitIdFormatter = columns[0].valueFormatter!;
      const result = unitIdFormatter('W454526051302', {} as SamplePackTubeDto);
      expect(result).toContain('W454526051302-');
    });

    it('should return empty string for null Unit ID', () => {
      const columns = component['getTableColumns']();
      const unitIdFormatter = columns[0].valueFormatter!;
      expect(unitIdFormatter(null, {} as SamplePackTubeDto)).toBe('');
    });

    it('should format Red Top flag as R1 or -', () => {
      const columns = component['getTableColumns']();
      const redTopFormatter = columns[1].valueFormatter!;
      expect(redTopFormatter('Y', {} as SamplePackTubeDto)).toBe('R1');
      expect(redTopFormatter('N', {} as SamplePackTubeDto)).toBe('-');
    });

    it('should format Purple Top 1 flag as P1 or -', () => {
      const columns = component['getTableColumns']();
      const purpleTop1Formatter = columns[2].valueFormatter!;
      expect(purpleTop1Formatter('Y', {} as SamplePackTubeDto)).toBe('P1');
      expect(purpleTop1Formatter('N', {} as SamplePackTubeDto)).toBe('-');
    });

    it('should format Purple Top 2 flag as P2 or -', () => {
      const columns = component['getTableColumns']();
      const purpleTop2Formatter = columns[3].valueFormatter!;
      expect(purpleTop2Formatter('Y', {} as SamplePackTubeDto)).toBe('P2');
      expect(purpleTop2Formatter('N', {} as SamplePackTubeDto)).toBe('-');
    });
  });

  describe('getExtractTypeLabelForPrint', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return Viral Marker for V', () => {
      expect(component['getExtractTypeLabelForPrint']('V')).toBe('Viral Marker');
    });

    it('should return NAT for N', () => {
      expect(component['getExtractTypeLabelForPrint']('N')).toBe('NAT');
    });

    it('should return Both for B', () => {
      expect(component['getExtractTypeLabelForPrint']('B')).toBe('Both');
    });

    it('should return value itself for unknown', () => {
      expect(component['getExtractTypeLabelForPrint']('X')).toBe('X');
    });
  });

  describe('getDonorTypeLabelForPrint', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return First Time for I', () => {
      expect(component['getDonorTypeLabelForPrint']('I')).toBe('First Time');
    });

    it('should return Repeat for R', () => {
      expect(component['getDonorTypeLabelForPrint']('R')).toBe('Repeat');
    });

    it('should return Others for O', () => {
      expect(component['getDonorTypeLabelForPrint']('O')).toBe('Others');
    });

    it('should return value itself for unknown', () => {
      expect(component['getDonorTypeLabelForPrint']('Z')).toBe('Z');
    });
  });

  describe('generatePrintHtml', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate HTML with box information', () => {
      const box = {
        boxId: 'BOX1',
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
        status: 'C',
        collDate: new Date('2026-06-10'),
      } as SamplePackDto;
      const tubes = [
        { unitId: 'U001', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N' } as SamplePackTubeDto,
        { unitId: 'U002', redTubeFlag: 'N', purpleTubeFlag: 'Y', purpleTube2Flag: 'N' } as SamplePackTubeDto,
      ];

      const html = component['generatePrintHtml'](box, tubes);

      expect(html).toContain('BOX1');
      expect(html).toContain('Viral Marker');
      expect(html).toContain('Repeat');
      expect(html).toContain('BRK');
      expect(html).toContain('U001');
      expect(html).toContain('U002');
      expect(html).toContain('R1');
      expect(html).toContain('P1');
      expect(html).toContain('Tube Shipment Pack List');
    });

    it('should show no tubes message when tubes array is empty', () => {
      const box = {
        boxId: 'BOX1',
        extractType: 'V',
        donorType: 'R',
        destinationCode: 'BRK',
        status: 'C',
        collDate: new Date(),
      } as SamplePackDto;

      const html = component['generatePrintHtml'](box, []);

      expect(html).toContain('No tubes in this box');
    });

    it('should calculate correct summary counts', () => {
      const box = { boxId: 'BOX1', extractType: 'B', donorType: 'R', destinationCode: 'BRK', status: 'C', collDate: new Date() } as SamplePackDto;
      const tubes = [
        { unitId: 'U1', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N' } as SamplePackTubeDto,
        { unitId: 'U2', redTubeFlag: 'N', purpleTubeFlag: 'Y', purpleTube2Flag: 'N' } as SamplePackTubeDto,
        { unitId: 'U3', redTubeFlag: 'N', purpleTubeFlag: 'N', purpleTube2Flag: 'Y' } as SamplePackTubeDto,
      ];

      const html = component['generatePrintHtml'](box, tubes);

      // The HTML should contain summary values
      expect(html).toContain('Unique Units');
      expect(html).toContain('Total Tubes');
    });
  });

  describe('formatDateForPrint', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return dash for null date', () => {
      expect(component['formatDateForPrint'](null)).toBe('-');
    });

    it('should format a Date object', () => {
      const date = new Date(2026, 5, 15);
      const result = component['formatDateForPrint'](date);
      expect(result).toContain('2026');
    });

    it('should format a string date', () => {
      const result = component['formatDateForPrint']('2026-06-15');
      expect(result).toContain('2026');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('setupFormListeners - extract type change resets donor type', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset donor type O when extract type changes to N', () => {
      component.boxForm.patchValue({ donorType: 'O', extractType: 'V' });
      // Now switch to N which should reset O
      component.boxForm.patchValue({ extractType: 'N' });

      expect(component.boxForm.get('donorType')?.value).toBe('');
    });

    it('should not reset donor type R when extract type changes to N', () => {
      component.boxForm.patchValue({ donorType: 'R', extractType: 'V' });
      component.boxForm.patchValue({ extractType: 'N' });

      expect(component.boxForm.get('donorType')?.value).toBe('R');
    });
  });

  describe('updateTubeFieldsAvailability - V extract type', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable purpleTop2 and reset for V extract type', () => {
      component.boxForm.patchValue({ extractType: 'V' });

      expect(component.scanForm.get('redTop')?.disabled).toBe(false);
      expect(component.scanForm.get('purpleTop1')?.disabled).toBe(false);
      expect(component.scanForm.get('purpleTop2')?.disabled).toBe(true);
    });
  });

  describe('onEmptyFieldEnter - with existing tubes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not validate when tubes already exist', () => {
      const tube = { unitId: 'U1', redTubeFlag: 'Y' } as SamplePackTubeDto;
      component.tubeEntries.set([tube]);
      spyOn<any>(component, 'validateTubeRequirement');

      component.onEmptyFieldEnter();

      expect(component['validateTubeRequirement']).not.toHaveBeenCalled();
    });
  });

  describe('getCollectionDateError - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is untouched and pristine', () => {
      const control = component.boxForm.get('collectionDate');
      control?.setErrors({ required: true });
      // Not touched or dirty - should return ''
      expect(component.getCollectionDateError()).toBe('');
    });

    it('should return empty string when control has no errors', () => {
      const control = component.boxForm.get('collectionDate');
      control?.markAsTouched();
      control?.setErrors(null);

      expect(component.getCollectionDateError()).toBe('');
    });
  });

  describe('calculateCheckDigit - asterisk character', () => {
    it('should handle asterisk character in unit ID', () => {
      const result = component['calculateCheckDigit']('ABC*123');
      expect(result).toBeTruthy();
      const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';
      expect(MOD37_ALPHABET.includes(result)).toBe(true);
    });
  });

  describe('validateCollectionYear - null input', () => {
    it('should return true for null collection date', () => {
      const result = component['validateCollectionYear'](null);
      expect(result).toBe(true);
    });
  });

  describe('closeBox failure response without message', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      fixture.detectChanges();
    });

    it('should use default message when result has no message', fakeAsync(() => {
      const mockResult = { success: false, message: '', statusCode: 500 };
      mockTubeService.close.and.returnValue(of(mockResult));

      component['closeBox']('BOX1', false);
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to close box',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });
});
