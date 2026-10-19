import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AddInterdictionForUnitsNotCheckedComponent } from './add-interdiction-for-units-not-checked';
import { AddInterdictionService } from './services/add-interdiction.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';

describe('AddInterdictionForUnitsNotCheckedComponent', () => {
  let component: AddInterdictionForUnitsNotCheckedComponent;
  let fixture: ComponentFixture<AddInterdictionForUnitsNotCheckedComponent>;
  let mockService: jasmine.SpyObj<AddInterdictionService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('AddInterdictionService', [
      'checkUnitExists',
      'getValidInterdictions',
      'addInterdiction'
    ]);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: of(null)
    });
    mockMenuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockMenuService.getMenuItemsSignal.and.returnValue(() => []);

    await TestBed.configureTestingModule({
      imports: [
        AddInterdictionForUnitsNotCheckedComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AddInterdictionService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddInterdictionForUnitsNotCheckedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Unit ID Validation', () => {
    it('should check if unit exists when unit ID is validated', (done) => {
      const mockCheckResult = {
        exists: false,
        collectionDate: null,
        message: 'Unit does not exist - can add interdiction'
      };
      mockService.checkUnitExists.and.returnValue(of(mockCheckResult));

      const mockEvent = {
        data: { parsedUnitId: 'ABC123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockService.checkUnitExists).toHaveBeenCalledWith('ABC123');
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(mockEvent.reject).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should reject validation if unit already exists', (done) => {
      const mockCheckResult = {
        exists: true,
        collectionDate: '2026-07-29',
        message: 'Unit already checked in - cannot add interdiction'
      };
      mockService.checkUnitExists.and.returnValue(of(mockCheckResult));

      const mockEvent = {
        data: { parsedUnitId: 'ABC123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockService.checkUnitExists).toHaveBeenCalledWith('ABC123');
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit already checked in - cannot add interdiction');
        expect(mockEvent.confirm).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should load valid interdictions after unit validation', (done) => {
      const mockInterdictions = [
        { interCode: 'HOLD', interDesc: 'Hold for Review', interType: 'Hold' },
        { interCode: 'NFT1', interDesc: 'Not for Transfusion', interType: 'NFT' }
      ];
      mockService.getValidInterdictions.and.returnValue(of(mockInterdictions));

      const mockValidationData = {
        parsedUnitId: 'ABC123',
        checkDigit: '45',
        codeScheme: 'I' as const,
        manualUnitId: 'ABC123',
        codabarUnitScheme: null,
        entryMode: 'S' as const,
        barcodeType: 'CODE128' as const,
        chapterScheme: 'I' as const
      };

      component.onUnitIdValidated(mockValidationData);

      setTimeout(() => {
        expect(mockService.getValidInterdictions).toHaveBeenCalledWith('ABC123');
        expect(component.validInterdictions()).toEqual(mockInterdictions);
        expect(component.filteredInterdictions()).toEqual(mockInterdictions);
        expect(component.currentUnitId()).toBe('ABC123');
        expect(component.checkDigit()).toBe('45');
        done();
      }, 100);
    });
  });

  describe('Interdiction Search', () => {
    it('should filter interdictions by code', () => {
      const mockInterdictions = [
        { interCode: 'HOLD', interDesc: 'Hold for Review', interType: 'Hold' },
        { interCode: 'NFT1', interDesc: 'Not for Transfusion', interType: 'NFT' },
        { interCode: 'NFT2', interDesc: 'No Transfusion', interType: 'NFT' }
      ];
      component.validInterdictions.set(mockInterdictions);
      component.filteredInterdictions.set(mockInterdictions);

      component.interdictionSearchControl.setValue('NFT');

      setTimeout(() => {
        const filtered = component.filteredInterdictions();
        expect(filtered.length).toBe(2);
        expect(filtered.every(i => i.interCode.includes('NFT'))).toBe(true);
      }, 100);
    });

    it('should filter interdictions by description (case-insensitive)', () => {
      const mockInterdictions = [
        { interCode: 'HOLD', interDesc: 'Hold for Review', interType: 'Hold' },
        { interCode: 'NFT1', interDesc: 'Not for Transfusion', interType: 'NFT' }
      ];
      component.validInterdictions.set(mockInterdictions);
      component.filteredInterdictions.set(mockInterdictions);

      component.interdictionSearchControl.setValue('transfusion');

      setTimeout(() => {
        const filtered = component.filteredInterdictions();
        expect(filtered.length).toBe(1);
        expect(filtered[0].interCode).toBe('NFT1');
      }, 100);
    });
  });

  describe('Add Interdiction', () => {
    beforeEach(() => {
      // Setup valid state
      component.currentUnitId.set('ABC123');
      component.interdictionForm.get('interCode')?.setValue('HOLD');
      component.selectedInterdiction.set({
        interCode: 'HOLD',
        interDesc: 'Hold for Review',
        interType: 'Hold'
      });

      // Mock unitIdField as valid
      Object.defineProperty(component, 'unitIdField', {
        value: { isValid: true, parsedUnitId: 'ABC123' },
        writable: true
      });
    });

    it('should add interdiction successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Interdiction added successfully',
        statusCode: 201,
        data: {
          unitId: 'ABC123',
          interCode: 'HOLD',
          insertDate: '2026-07-29T12:00:00Z',
          insertUser: 'testuser'
        }
      };
      mockService.addInterdiction.and.returnValue(of(mockResponse));

      component.onPlaceInterdiction();

      setTimeout(() => {
        expect(mockService.addInterdiction).toHaveBeenCalledWith({
          unitId: 'ABC123',
          interCode: 'HOLD'
        });
        expect(component.addedInterdictions().length).toBe(1);
        expect(component.sessionCount()).toBe(1);
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
          '1 Units ID Interdiction Placed Successfully'
        );
        done();
      }, 100);
    });

    it('should handle API error when adding interdiction', (done) => {
      const mockError = {
        error: { message: 'Interdiction code not valid' }
      };
      mockService.addInterdiction.and.returnValue(throwError(() => mockError));

      component.onPlaceInterdiction();

      setTimeout(() => {
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Interdiction code not valid');
        expect(component.addedInterdictions().length).toBe(0);
        expect(component.sessionCount()).toBe(0);
        done();
      }, 100);
    });

    it('should increment session counter for multiple interdictions', (done) => {
      const mockResponse1 = {
        success: true,
        message: 'Success',
        statusCode: 201,
        data: {
          unitId: 'ABC123',
          interCode: 'HOLD',
          insertDate: '2026-07-29T12:00:00Z',
          insertUser: 'testuser'
        }
      };
      const mockResponse2 = {
        success: true,
        message: 'Success',
        statusCode: 201,
        data: {
          unitId: 'DEF456',
          interCode: 'NFT1',
          insertDate: '2026-07-29T12:05:00Z',
          insertUser: 'testuser'
        }
      };

      mockService.addInterdiction.and.returnValues(of(mockResponse1), of(mockResponse2));

      component.onPlaceInterdiction();

      setTimeout(() => {
        expect(component.sessionCount()).toBe(1);

        // Setup for second interdiction
        component.currentUnitId.set('DEF456');
        component.interdictionForm.get('interCode')?.setValue('NFT1');
        Object.defineProperty(component, 'unitIdField', {
          value: { isValid: true, parsedUnitId: 'DEF456' },
          writable: true
        });

        component.onPlaceInterdiction();

        setTimeout(() => {
          expect(component.sessionCount()).toBe(2);
          expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
            '2 Units ID Interdiction Placed Successfully'
          );
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Clear Functions', () => {
    it('should clear form for next entry', () => {
      component.currentUnitId.set('ABC123');
      component.checkDigit.set('45');
      component.interdictionForm.get('interCode')?.setValue('HOLD');
      component.selectedInterdiction.set({
        interCode: 'HOLD',
        interDesc: 'Hold',
        interType: 'Hold'
      });

      component.onUnitIdCleared();

      expect(component.currentUnitId()).toBe('');
      expect(component.checkDigit()).toBeNull();
      expect(component.interdictionForm.get('interCode')?.value).toBe('');
      expect(component.selectedInterdiction()).toBeNull();
    });

    it('should clear all data including table', () => {
      component.currentUnitId.set('ABC123');
      component.addedInterdictions.set([
        {
          unitId: 'ABC123',
          interCode: 'HOLD',
          interDesc: 'Hold',
          interType: 'Hold'
        }
      ]);
      component.sessionCount.set(5);

      component.clearAll();

      expect(component.currentUnitId()).toBe('');
      expect(component.addedInterdictions().length).toBe(0);
      expect(component.sessionCount()).toBe(0);
    });
  });

  describe('Chapter Change', () => {
    it('should reset component when chapter changes', (done) => {
      // Setup some data
      component.currentUnitId.set('ABC123');
      component.addedInterdictions.set([
        {
          unitId: 'ABC123',
          interCode: 'HOLD',
          interDesc: 'Hold',
          interType: 'Hold'
        }
      ]);

      // Simulate chapter change
      (mockHeaderService.chapterChanged$ as any).next(null);

      setTimeout(() => {
        expect(component.currentUnitId()).toBe('');
        expect(component.addedInterdictions().length).toBe(0);
        done();
      }, 100);
    });
  });
});
