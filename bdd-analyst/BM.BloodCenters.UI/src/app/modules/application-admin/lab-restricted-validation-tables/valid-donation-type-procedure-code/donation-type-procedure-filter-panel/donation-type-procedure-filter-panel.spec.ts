import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import moment from 'moment';
import { DonationTypeProcedureFilterPanel } from './donation-type-procedure-filter-panel';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ValidDonationTypeProcedureCodeService } from '../services/valid-donation-type-procedure-code.service';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DonationTypeLookup,
  ProcedureCodeLookup,
  AttributeGroupLookup
} from '../models/valid-donation-type-procedure-code.model';

describe('DonationTypeProcedureFilterPanel', () => {
  let component: DonationTypeProcedureFilterPanel;
  let fixture: ComponentFixture<DonationTypeProcedureFilterPanel>;
  let mockService: jasmine.SpyObj<ValidDonationTypeProcedureCodeService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    // Create mock service
    mockService = jasmine.createSpyObj('ValidDonationTypeProcedureCodeService', [
      'getFilters'
    ]);

    // Mock to return empty arrays with ReturnResult wrapper
    mockService.getFilters.and.returnValue(of({
      success: true,
      message: '',
      statusCode: 200,
      data: {
        donationTypes: [],
        procedureCodes: [],
        attributeGroups: []
      }
    }));

    // Create mock HeaderService with signal
    mockHeaderService = createMockHeaderService();
    (mockHeaderService as any).chapterTimeZone = signal('America/Chicago');



      TestBed.configureTestingModule({
imports: [
        DonationTypeProcedureFilterPanel,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ValidDonationTypeProcedureCodeService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {
      mockService.getFilters.and.returnValue(of({
    }));


    fixture = TestBed.createComponent(DonationTypeProcedureFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Searchable Dropdown Filtering - Signals', () => {
    const mockDonationTypes: DonationTypeLookup[] = [
      { code: 'AL', description: 'Allogeneic' },
      { code: 'WHOLE', description: 'Whole Blood' },
      { code: 'PLASMA', description: 'Plasma Donation' },
      { code: 'PLATELETS', description: 'Platelet Donation' }
    ];

    const mockProcedureCodes: ProcedureCodeLookup[] = [
      { code: 'PP', description: 'Plasma Pheresis' },
      { code: 'WB', description: 'Whole Blood' },
      { code: 'PLT', description: 'Platelet' },
      { code: 'APH', description: 'Apheresis' }
    ];

    const mockAttributeGroups: AttributeGroupLookup[] = [
      { code: 'DON', description: 'Donation' },
      { code: 'PHER', description: 'Pheresis' },
      { code: 'TEST', description: 'Testing' }
    ];

    beforeEach(() => {
      // Set up sample data with lookup objects
      (component as any).donationTypeOptionsSignal.set(mockDonationTypes);
      (component as any).procedureCodeOptionsSignal.set(mockProcedureCodes);
      (component as any).attributeGroupOptionsSignal.set(mockAttributeGroups);
    });

    it('should return all donation types when search is empty', () => {
      (component as any).donationTypeSearch.set('');
      const result = component.filteredDonationTypes();
      expect(result).toEqual(mockDonationTypes);
    });

    it('should filter donation types by search term (case-insensitive)', () => {
      (component as any).donationTypeSearch.set('pla');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([mockDonationTypes[2], mockDonationTypes[3]]);
    });

    it('should filter donation types with exact match', () => {
      (component as any).donationTypeSearch.set('AL');
      const result = component.filteredDonationTypes();
      // "AL" matches: AL (code) and Allogeneic (description)
      expect(result).toEqual([mockDonationTypes[0]]);
    });

    it('should return empty array when no donation types match search', () => {
      (component as any).donationTypeSearch.set('xyz');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([]);
    });

    it('should return all procedure codes when search is empty', () => {
      (component as any).procedureCodeSearch.set('');
      const result = component.filteredProcedureCodes();
      expect(result).toEqual(mockProcedureCodes);
    });

    it('should filter procedure codes by search term (case-insensitive)', () => {
      (component as any).procedureCodeSearch.set('p');
      const result = component.filteredProcedureCodes();
      expect(result).toEqual([mockProcedureCodes[0], mockProcedureCodes[2], mockProcedureCodes[3]]);
    });

    it('should filter procedure codes with specific match', () => {
      (component as any).procedureCodeSearch.set('wb');
      const result = component.filteredProcedureCodes();
      expect(result).toEqual([mockProcedureCodes[1]]);
    });

    it('should return all attribute groups when search is empty', () => {
      (component as any).attributeGroupSearch.set('');
      const result = component.filteredAttributeGroups();
      expect(result).toEqual(mockAttributeGroups);
    });

    it('should filter attribute groups by search term (case-insensitive)', () => {
      (component as any).attributeGroupSearch.set('he');
      const result = component.filteredAttributeGroups();
      expect(result).toEqual([mockAttributeGroups[1]]);
    });

    it('should filter attribute groups with exact match', () => {
      (component as any).attributeGroupSearch.set('don');
      const result = component.filteredAttributeGroups();
      expect(result).toEqual([mockAttributeGroups[0]]);
    });

    it('should reactively update when search control value changes', () => {
      component.donationTypeSearchControl.setValue('who');
      expect(component.filteredDonationTypes()).toEqual([mockDonationTypes[1]]);

      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes()).toEqual(mockDonationTypes);
    });

    it('should handle empty options array gracefully', () => {
      (component as any).donationTypeOptionsSignal.set([]);
      (component as any).donationTypeSearch.set('test');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([]);
    });

    it('should filter procedure codes reactively', () => {
      component.procedureCodeSearchControl.setValue('pl');
      // "pl" matches: PP (Plasma Pheresis) and PLT (Platelet)
      expect(component.filteredProcedureCodes()).toEqual([mockProcedureCodes[0], mockProcedureCodes[2]]);
    });

    it('should filter attribute groups reactively', () => {
      component.attributeGroupSearchControl.setValue('test');
      expect(component.filteredAttributeGroups()).toEqual([mockAttributeGroups[2]]);
    });
  });

  describe('Moment to Date Conversion in onApply', () => {
    it('should convert Moment effectiveDate to Date object when applying filters', (done) => {
      const momentDate = moment('2026-04-18');
      component.filterForm.patchValue({
        donationType: 'AL',
        effectiveDate: momentDate,
        period: 'After'
      });

      component.apply.subscribe((filters) => {
        expect(filters.effectiveDate).toBeInstanceOf(Date);
        expect(filters.effectiveDate?.getFullYear()).toBe(2026);
        expect(filters.effectiveDate?.getMonth()).toBe(3); // April is month 3 (0-based)
        expect(filters.effectiveDate?.getDate()).toBe(18);
        done();
      });

      component.onApply();
    });

    it('should convert Moment terminationDate to Date object when applying filters', (done) => {
      const momentDate = moment('2026-05-20');
      component.filterForm.patchValue({
        donationType: 'WHOLE',
        terminationDate: momentDate,
        terminationPeriod: 'Before'
      });

      component.apply.subscribe((filters) => {
        expect(filters.terminationDate).toBeInstanceOf(Date);
        expect(filters.terminationDate?.getFullYear()).toBe(2026);
        expect(filters.terminationDate?.getMonth()).toBe(4); // May is month 4 (0-based)
        expect(filters.terminationDate?.getDate()).toBe(20);
        done();
      });

      component.onApply();
    });



    it('should handle Date objects (not Moment) without conversion', (done) => {
      const jsDate = new Date('2026-04-18');
      component.filterForm.patchValue({
        donationType: 'AL',
        effectiveDate: jsDate,
        period: 'After'
      });

      component.apply.subscribe((filters) => {
        expect(filters.effectiveDate).toBeInstanceOf(Date);
        expect(filters.effectiveDate).toBe(jsDate);
        done();
      });

      component.onApply();
    });

    it('should emit filters with both dates converted when both are Moment objects', (done) => {
      const effectiveMoment = moment('2026-04-01');
      const terminationMoment = moment('2026-04-30');

      component.filterForm.patchValue({
        procedureCode: 'PP',
        effectiveDate: effectiveMoment,
        period: 'After',
        terminationDate: terminationMoment,
        terminationPeriod: 'Before'
      });

      component.apply.subscribe((filters) => {
        expect(filters.effectiveDate).toBeInstanceOf(Date);
        expect(filters.terminationDate).toBeInstanceOf(Date);
        expect(filters.effectiveDate?.getDate()).toBe(1);
        expect(filters.terminationDate?.getDate()).toBe(30);
        done();
      });

      component.onApply();
    });

    it('should preserve other filter values when converting dates', (done) => {
      const momentDate = moment('2026-04-18');
      component.filterForm.patchValue({
        donationType: 'WHOLE',
        procedureCode: null,
        attributeGroup: 'DON',
        effectiveDate: momentDate,
        period: 'On'
      });

      component.apply.subscribe((filters) => {
        expect(filters.donationType).toBe('WHOLE');
        expect(filters.procedureCode).toBeNull();
        expect(filters.attributeGroup).toBe('DON');
        expect(filters.period).toBe('On');
        expect(filters.effectiveDate).toBeInstanceOf(Date);
        done();
      });

      component.onApply();
    });
  });

  describe('Filter Form Initialization', () => {
    it('should initialize form with all filter fields', () => {
      expect(component.filterForm.get('donationType')).toBeTruthy();
      expect(component.filterForm.get('procedureCode')).toBeTruthy();
      expect(component.filterForm.get('attributeGroup')).toBeTruthy();
      expect(component.filterForm.get('effectiveDate')).toBeTruthy();
      expect(component.filterForm.get('period')).toBeTruthy();
      expect(component.filterForm.get('terminationDate')).toBeTruthy();
      expect(component.filterForm.get('terminationPeriod')).toBeTruthy();
    });
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when form is empty and unchanged', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only period is selected without a date', () => {
      component.filterForm.patchValue({ period: 'After' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only termination period is selected without a date', () => {
      component.filterForm.patchValue({ terminationPeriod: 'Before' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when effective date is complete but termination period has no date', () => {
      component.filterForm.patchValue({
        period: 'After',
        effectiveDate: new Date('2026-08-01'),
        terminationPeriod: 'Before'
      });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when donation type is selected and form changed', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when procedure code is selected and form changed', () => {
      component.filterForm.patchValue({ procedureCode: 'PP' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when attribute group is selected and form changed', () => {
      component.filterForm.patchValue({ attributeGroup: 'DON' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when effective date with period is set', () => {
      component.filterForm.patchValue({
        period: 'After',
        effectiveDate: new Date('2026-08-01')
      });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when termination date with period is set', () => {
      component.filterForm.patchValue({
        terminationPeriod: 'Before',
        terminationDate: new Date('2026-12-31')
      });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when effective date has invalidDateFormat error', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when termination date has matDatepickerParse error', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when date has invalidDate error', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when period has validation error', () => {
      component.filterForm.patchValue({ effectiveDate: new Date('2026-08-01') });
      component.filterForm.get('period')?.setErrors({ required: true });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('formChanged tracking', () => {
    it('should start with formChanged as false', () => {
      expect((component as any).formChanged).toBeFalse();
    });

    it('should set formChanged to true when a form value changes', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      expect((component as any).formChanged).toBeTrue();
    });

    it('should set formChanged to true after onClear resets the form', () => {
      component.onClear();
      expect((component as any).formChanged).toBeTrue();
    });
  });

  describe('hasValidationErrors', () => {
    it('should return false when no period validation errors', () => {
      expect(component.hasValidationErrors).toBeFalse();
    });

    it('should return true when period has required error', () => {
      component.filterForm.get('period')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationPeriod has required error', () => {
      component.filterForm.get('terminationPeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });
  });
});
