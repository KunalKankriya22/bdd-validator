import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ValidOptionsReference } from './valid-options-reference';
import { DefineDurationBetweenProceduresService } from '../services/define-duration-between-procedures.service';
import { DonationType, ProcedureCode } from '../models/define-duration-between-procedures.model';

describe('ValidOptionsReference', () => {
  let component: ValidOptionsReference;
  let fixture: ComponentFixture<ValidOptionsReference>;
  let mockService: jasmine.SpyObj<DefineDurationBetweenProceduresService>;

  const mockDonationTypes: DonationType[] = [
    { donationType: 'WB', description: 'Whole Blood', sortSequence: 1 },
    { donationType: 'RBC', description: 'Red Blood Cells', sortSequence: 2 }
  ];

  const mockProcedureCodes: ProcedureCode[] = [
    { procedureCode: 'APH', description: 'Apheresis', sortSequence: 1 },
    { procedureCode: 'PLT', description: 'Platelets', sortSequence: 2 }
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DefineDurationBetweenProceduresService', [
      'getDonationTypes',
      'getProcedureCodes'
    ]);
    mockService.getDonationTypes.and.returnValue(of({ data: mockDonationTypes }));
    mockService.getProcedureCodes.and.returnValue(of({ data: mockProcedureCodes }));

    TestBed.configureTestingModule({
      imports: [
        ValidOptionsReference,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DefineDurationBetweenProceduresService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(ValidOptionsReference);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize donationTypes as empty array', () => {
      expect(component.donationTypes).toEqual([]);
    });

    it('should initialize procedureCodes as empty array', () => {
      expect(component.procedureCodes).toEqual([]);
    });

    it('should initialize isLoadingDonationTypes as false', () => {
      expect(component.isLoadingDonationTypes).toBe(false);
    });

    it('should initialize isLoadingProcedureCodes as false', () => {
      expect(component.isLoadingProcedureCodes).toBe(false);
    });

    it('should initialize hasErrorDonationTypes as false', () => {
      expect(component.hasErrorDonationTypes).toBe(false);
    });

    it('should initialize hasErrorProcedureCodes as false', () => {
      expect(component.hasErrorProcedureCodes).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call getDonationTypes on init', () => {
      fixture.detectChanges();
      expect(mockService.getDonationTypes).toHaveBeenCalled();
    });

    it('should call getProcedureCodes on init', () => {
      fixture.detectChanges();
      expect(mockService.getProcedureCodes).toHaveBeenCalled();
    });
  });

  describe('loadDonationTypes', () => {
    it('should populate donationTypes from response.data', () => {
      mockService.getDonationTypes.and.returnValue(of({ data: mockDonationTypes }));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual(mockDonationTypes);
      expect(component.isLoadingDonationTypes).toBe(false);
      expect(component.hasErrorDonationTypes).toBe(false);
    });

    it('should populate donationTypes from response.item when data is absent', () => {
      mockService.getDonationTypes.and.returnValue(of({ item: mockDonationTypes } as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual(mockDonationTypes);
      expect(component.isLoadingDonationTypes).toBe(false);
    });

    it('should set donationTypes to empty array when response has neither data nor item arrays', () => {
      mockService.getDonationTypes.and.returnValue(of({} as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual([]);
      expect(component.isLoadingDonationTypes).toBe(false);
    });

    it('should set donationTypes to empty array when response.data is not an array', () => {
      mockService.getDonationTypes.and.returnValue(of({ data: 'not-an-array' } as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual([]);
      expect(component.isLoadingDonationTypes).toBe(false);
    });

    it('should set donationTypes to empty array when response.item is not an array', () => {
      mockService.getDonationTypes.and.returnValue(of({ item: { donationType: 'WB' } } as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual([]);
      expect(component.isLoadingDonationTypes).toBe(false);
    });

    it('should handle error when loading donation types', () => {
      const consoleSpy = spyOn(console, 'error');
      mockService.getDonationTypes.and.returnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();

      expect(component.hasErrorDonationTypes).toBe(true);
      expect(component.isLoadingDonationTypes).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading donation types:', jasmine.any(Error));
    });

    it('should reset hasErrorDonationTypes to false before loading', () => {
      component.hasErrorDonationTypes = true;
      mockService.getDonationTypes.and.returnValue(of({ data: mockDonationTypes }));

      fixture.detectChanges();

      expect(component.hasErrorDonationTypes).toBe(false);
    });
  });

  describe('loadProcedureCodes', () => {
    it('should populate procedureCodes from response.data', () => {
      mockService.getProcedureCodes.and.returnValue(of({ data: mockProcedureCodes }));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual(mockProcedureCodes);
      expect(component.isLoadingProcedureCodes).toBe(false);
      expect(component.hasErrorProcedureCodes).toBe(false);
    });

    it('should populate procedureCodes from response.item when data is absent', () => {
      mockService.getProcedureCodes.and.returnValue(of({ item: mockProcedureCodes } as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual(mockProcedureCodes);
      expect(component.isLoadingProcedureCodes).toBe(false);
    });

    it('should set procedureCodes to empty array when response has neither data nor item arrays', () => {
      mockService.getProcedureCodes.and.returnValue(of({} as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual([]);
      expect(component.isLoadingProcedureCodes).toBe(false);
    });

    it('should set procedureCodes to empty array when response.data is not an array', () => {
      mockService.getProcedureCodes.and.returnValue(of({ data: 'not-an-array' } as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual([]);
      expect(component.isLoadingProcedureCodes).toBe(false);
    });

    it('should set procedureCodes to empty array when response.item is not an array', () => {
      mockService.getProcedureCodes.and.returnValue(of({ item: { procedureCode: 'APH' } } as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual([]);
      expect(component.isLoadingProcedureCodes).toBe(false);
    });

    it('should handle error when loading procedure codes', () => {
      const consoleSpy = spyOn(console, 'error');
      mockService.getProcedureCodes.and.returnValue(throwError(() => new Error('Server error')));

      fixture.detectChanges();

      expect(component.hasErrorProcedureCodes).toBe(true);
      expect(component.isLoadingProcedureCodes).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading procedure codes:', jasmine.any(Error));
    });

    it('should reset hasErrorProcedureCodes to false before loading', () => {
      component.hasErrorProcedureCodes = true;
      mockService.getProcedureCodes.and.returnValue(of({ data: mockProcedureCodes }));

      fixture.detectChanges();

      expect(component.hasErrorProcedureCodes).toBe(false);
    });

    it('should log procedure codes response to console', () => {
      const consoleSpy = spyOn(console, 'log');
      mockService.getProcedureCodes.and.returnValue(of({ data: mockProcedureCodes }));

      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Procedure Codes Response:', { data: mockProcedureCodes });
    });
  });

  describe('Combined loading scenarios', () => {
    it('should handle both services returning errors', () => {
      spyOn(console, 'error');
      mockService.getDonationTypes.and.returnValue(throwError(() => new Error('Error 1')));
      mockService.getProcedureCodes.and.returnValue(throwError(() => new Error('Error 2')));

      fixture.detectChanges();

      expect(component.hasErrorDonationTypes).toBe(true);
      expect(component.hasErrorProcedureCodes).toBe(true);
      expect(component.isLoadingDonationTypes).toBe(false);
      expect(component.isLoadingProcedureCodes).toBe(false);
    });

    it('should handle donation types success and procedure codes error', () => {
      spyOn(console, 'error');
      mockService.getDonationTypes.and.returnValue(of({ data: mockDonationTypes }));
      mockService.getProcedureCodes.and.returnValue(throwError(() => new Error('Error')));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual(mockDonationTypes);
      expect(component.hasErrorDonationTypes).toBe(false);
      expect(component.hasErrorProcedureCodes).toBe(true);
    });

    it('should handle donation types error and procedure codes success', () => {
      spyOn(console, 'error');
      mockService.getDonationTypes.and.returnValue(throwError(() => new Error('Error')));
      mockService.getProcedureCodes.and.returnValue(of({ data: mockProcedureCodes }));

      fixture.detectChanges();

      expect(component.hasErrorDonationTypes).toBe(true);
      expect(component.procedureCodes).toEqual(mockProcedureCodes);
      expect(component.hasErrorProcedureCodes).toBe(false);
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should emit close event with no arguments', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalledWith();
    });
  });

  describe('Edge cases for response.data and response.item precedence', () => {
    it('should prefer response.data over response.item for donation types when both exist', () => {
      const alternateTypes: DonationType[] = [
        { donationType: 'PLT', description: 'Platelets', sortSequence: 3 }
      ];
      mockService.getDonationTypes.and.returnValue(of({
        data: mockDonationTypes,
        item: alternateTypes
      } as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual(mockDonationTypes);
    });

    it('should prefer response.data over response.item for procedure codes when both exist', () => {
      const alternateCodes: ProcedureCode[] = [
        { procedureCode: 'WB', description: 'Whole Blood', sortSequence: 3 }
      ];
      mockService.getProcedureCodes.and.returnValue(of({
        data: mockProcedureCodes,
        item: alternateCodes
      } as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual(mockProcedureCodes);
    });

    it('should use response.item for donation types when response.data is null', () => {
      mockService.getDonationTypes.and.returnValue(of({
        data: null,
        item: mockDonationTypes
      } as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual(mockDonationTypes);
    });

    it('should use response.item for procedure codes when response.data is null', () => {
      mockService.getProcedureCodes.and.returnValue(of({
        data: null,
        item: mockProcedureCodes
      } as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual(mockProcedureCodes);
    });

    it('should set empty array for donation types when response.data is undefined and response.item is undefined', () => {
      mockService.getDonationTypes.and.returnValue(of({
        data: undefined,
        item: undefined
      } as any));

      fixture.detectChanges();

      expect(component.donationTypes).toEqual([]);
    });

    it('should set empty array for procedure codes when response.data is undefined and response.item is undefined', () => {
      mockService.getProcedureCodes.and.returnValue(of({
        data: undefined,
        item: undefined
      } as any));

      fixture.detectChanges();

      expect(component.procedureCodes).toEqual([]);
    });
  });

  describe('State transitions during loading', () => {
    it('should set isLoadingDonationTypes to true then false on success', () => {
      mockService.getDonationTypes.and.returnValue(of({ data: mockDonationTypes }));

      component['loadDonationTypes']();

      expect(component.isLoadingDonationTypes).toBe(false);
      expect(component.donationTypes).toEqual(mockDonationTypes);
    });

    it('should set isLoadingDonationTypes to true then false on error', () => {
      spyOn(console, 'error');
      mockService.getDonationTypes.and.returnValue(throwError(() => new Error('Error')));

      component['loadDonationTypes']();

      expect(component.isLoadingDonationTypes).toBe(false);
      expect(component.hasErrorDonationTypes).toBe(true);
    });

    it('should set isLoadingProcedureCodes to true then false on success', () => {
      mockService.getProcedureCodes.and.returnValue(of({ data: mockProcedureCodes }));

      component['loadProcedureCodes']();

      expect(component.isLoadingProcedureCodes).toBe(false);
      expect(component.procedureCodes).toEqual(mockProcedureCodes);
    });

    it('should set isLoadingProcedureCodes to true then false on error', () => {
      spyOn(console, 'error');
      mockService.getProcedureCodes.and.returnValue(throwError(() => new Error('Error')));

      component['loadProcedureCodes']();

      expect(component.isLoadingProcedureCodes).toBe(false);
      expect(component.hasErrorProcedureCodes).toBe(true);
    });

    it('should clear hasErrorDonationTypes before reloading', () => {
      component.hasErrorDonationTypes = true;
      mockService.getDonationTypes.and.returnValue(of({ data: [] }));

      component['loadDonationTypes']();

      expect(component.hasErrorDonationTypes).toBe(false);
    });

    it('should clear hasErrorProcedureCodes before reloading', () => {
      component.hasErrorProcedureCodes = true;
      mockService.getProcedureCodes.and.returnValue(of({ data: [] }));

      component['loadProcedureCodes']();

      expect(component.hasErrorProcedureCodes).toBe(false);
    });
  });
});
