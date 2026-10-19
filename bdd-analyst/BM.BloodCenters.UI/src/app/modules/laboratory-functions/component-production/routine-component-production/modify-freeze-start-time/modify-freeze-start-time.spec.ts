import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitValidationResponse, UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';

import { ModifyFreezeStartTimeComponent } from './modify-freeze-start-time';
import { ModifyFreezeStartTimeApiService } from './services/modify-freeze-start-time-api.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitDto,
  ProductForUnitDto,
  AliquotDto,
  ComponentFreezeDetailsDto,
  UpdateFreezeStartTimeResponseDto,
  FREEZE_ERROR_MESSAGES,
  FreezeStartTimeErrorCode,
} from './models/modify-freeze-start-time.model';

@Component({
  selector: 'app-unit-id-field',
  standalone: true,
  template: '<div></div>',
})
class MockUnitIdFieldComponent {
  @Input() validateFfValue = 'N';
  @Input() label = 'Unit ID';
  @Input() required = false;
  @Output() validated = new EventEmitter<UnitValidationResponse>();
  @Output() cleared = new EventEmitter<void>();

  clear = jasmine.createSpy('clear');
  focus = jasmine.createSpy('focus');
}

@Component({
  selector: 'app-page-header-with-breadcrumb',
  standalone: true,
  template: '<div></div>',
})
class MockPageHeaderComponent {
  @Input() config: any;
}

describe('ModifyFreezeStartTimeComponent', () => {
  let component: ModifyFreezeStartTimeComponent;
  let fixture: ComponentFixture<ModifyFreezeStartTimeComponent>;
  let apiServiceSpy: jasmine.SpyObj<ModifyFreezeStartTimeApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceStub: { chapterChanged$: Subject<void> };
  let pageHeaderServiceStub: { pageHeaderData: ReturnType<typeof signal> };
  let dialogSpy: jasmine.Spy;

  const mockUnitValidation: UnitValidationResponse = {
    parsedUnitId: 'W1234567890123',
    checkDigit: '5',
    codeScheme: 'I',
    manualUnitId: 'W1234567890123',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  const mockValidateUnitDto: ValidateUnitDto = {
    unitId: 'W1234567890123',
    collDate: '2025-06-15T00:00:00',
    chapterId: 'BOS',
    codeScheme: 'I',
  };

  const mockProducts: ProductForUnitDto[] = [
    { productCode: 'RBC', productDescription: 'Red Blood Cells' },
    { productCode: 'PLT', productDescription: 'Platelets' },
    { productCode: 'FFP', productDescription: 'Fresh Frozen Plasma' },
  ];

  const mockAliquots: AliquotDto[] = [{ aliquot: '00' }];

  const mockComponentDetails: ComponentFreezeDetailsDto = {
    unitId: 'W1234567890123',
    productCode: 'FFP',
    productDescription: 'Fresh Frozen Plasma',
    aliquot: '00',
    collDate: '2025-06-15',
    freezeStartTime: '2025-06-15T14:30:00',
    bleedStartTime: '2025-06-15T10:00:00',
    bleedEndTime: '2025-06-15T10:15:00',
    chapterId: 'BOS',
    parmValue: null,
  };

  const mockUpdateResponse: UpdateFreezeStartTimeResponseDto = {
    unitId: 'W1234567890123',
    productCode: 'FFP',
    aliquot: '00',
    collDate: '2025-06-15',
    productDescription: 'Fresh Frozen Plasma',
    freezeStartTime: '2025-06-15T14:30:00',
    cmtiGenerated: false,
    warning: null,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ModifyFreezeStartTimeApiService', [
      'validateUnit',
      'getProducts',
      'getAliquots',
      'getComponentDetails',
      'updateFreezeStartTime',
    ]);

    snackbarServiceSpy = createMockSnackbarService();

    headerServiceStub = {
      chapterChanged$: new Subject<void>(),
    };

    pageHeaderServiceStub = {
      pageHeaderData: signal(undefined),
    };



      TestBed.configureTestingModule({
      imports: [ModifyFreezeStartTimeComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: ModifyFreezeStartTimeApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: pageHeaderServiceStub },
      ],
    })
      .overrideComponent(ModifyFreezeStartTimeComponent, {
        remove: { imports: [UnitIdFieldComponent, PageHeaderWithBreadcrumb] },
        add: { imports: [MockUnitIdFieldComponent, MockPageHeaderComponent] },
      });


    


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.getProducts.calls.reset();


      apiServiceSpy.getAliquots.calls.reset();


      apiServiceSpy.getComponentDetails.calls.reset();


      apiServiceSpy.updateFreezeStartTime.calls.reset();


    fixture = TestBed.createComponent(ModifyFreezeStartTimeComponent);
    component = fixture.componentInstance;

    dialogSpy = spyOn(component['dialog'], 'open');

    fixture.detectChanges();


    });


  describe('Initialization', () => {








    it('should have hasSavedEntries as false initially', () => {
      expect(component['hasSavedEntries']()).toBeFalse();
    });




  });

  describe('onUnitValidated', () => {
    it('should set unit data and load metadata', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['onUnitValidated'](mockUnitValidation);
      tick();

      expect(component['unitData']()).toEqual(mockUnitValidation);
      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W1234567890123');
    }));

    it('should set collection date after unit validation', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['onUnitValidated'](mockUnitValidation);
      tick();

      expect(component['collectionDate']()).toBe('2025-06-15T00:00:00');
    }));

    it('should load products after unit validation', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['onUnitValidated'](mockUnitValidation);
      tick();

      expect(apiServiceSpy.getProducts).toHaveBeenCalledWith('W1234567890123', '2025-06-15T00:00:00', 'I');
      expect(component['products']()).toEqual(mockProducts);
      expect(component['filteredProducts']()).toEqual(mockProducts);
    }));

    it('should mark unit as already scanned if it exists in saved entries', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['savedEntries'].set([
        {
          unitId: 'W1234567890123',
          collectionDate: '2025-06-15',
          productCode: 'FFP',
          productDescription: 'Fresh Frozen Plasma',
          freezeStartDateTime: '15-JUN-2025  14:30',
          aliquot: '00',
        },
      ]);

      component['onUnitValidated'](mockUnitValidation);
      tick();

      expect(component['unitAlreadyScanned']()).toBeTrue();
    }));



    it('should handle error with errorResponse.error format', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Specific error message' } },
        }))
      );

      component['onUnitValidated'](mockUnitValidation);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Specific error message');
    }));

    it('should handle error with errorResponse.errorCode format', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: FreezeStartTimeErrorCode.UNIT_NOT_FOUND } },
        }))
      );

      component['onUnitValidated'](mockUnitValidation);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        FREEZE_ERROR_MESSAGES[FreezeStartTimeErrorCode.UNIT_NOT_FOUND]
      );
    }));
  });

  describe('onUnitCleared', () => {
    it('should clear form state', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['onUnitValidated'](mockUnitValidation);
      tick();

      component['onUnitCleared']();

      expect(component['unitData']()).toBeNull();
      expect(component['collectionDate']()).toBe('');
      expect(component['productDescription']()).toBe('');
      expect(component['products']()).toEqual([]);
    }));
  });

  describe('Product selection', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      apiServiceSpy.getAliquots.and.returnValue(of(mockAliquots));
      apiServiceSpy.getComponentDetails.and.returnValue(of(mockComponentDetails));

      component['onUnitValidated'](mockUnitValidation);
      tick();
    }));

    it('should set product description when a product is selected', fakeAsync(() => {
      component['productControl'].setValue('FFP');
      tick();

      expect(component['productDescription']()).toBe('Fresh Frozen Plasma');
    }));

    it('should load aliquots when a product is selected', fakeAsync(() => {
      component['productControl'].setValue('FFP');
      tick();

      expect(apiServiceSpy.getAliquots).toHaveBeenCalledWith('W1234567890123', 'FFP', '2025-06-15T00:00:00');
    }));

    it('should set aliquot when single aliquot returned', fakeAsync(() => {
      component['productControl'].setValue('FFP');
      tick();

      expect(component['aliquot']()).toBe('00');
    }));

    it('should load component details after aliquot resolved', fakeAsync(() => {
      component['productControl'].setValue('FFP');
      tick();

      expect(apiServiceSpy.getComponentDetails).toHaveBeenCalledWith(
        'W1234567890123', 'FFP', '00', '2025-06-15T00:00:00'
      );
    }));

    it('should populate freeze date and time from component details', fakeAsync(() => {
      component['productControl'].setValue('FFP');
      tick();

      expect(component['freezeDateControl'].value).toBeTruthy();
      expect(component['freezeTimeControl'].value).toBe('14:30');
    }));

    it('should clear description when product is deselected', fakeAsync(() => {
      component['productControl'].setValue('FFP');
      tick();

      component['productControl'].setValue('');
      tick();

      expect(component['productDescription']()).toBe('');
      expect(component['aliquot']()).toBe('');
      expect(component['componentDetails']()).toBeNull();
    }));



    it('should prefer aliquot "00" when multiple aliquots exist', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of([{ aliquot: '01' }, { aliquot: '00' }, { aliquot: '02' }]));

      component['productControl'].setValue('RBC');
      tick();

      expect(component['aliquot']()).toBe('00');
    }));

    it('should fallback to first aliquot when "00" not available', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of([{ aliquot: '01' }, { aliquot: '02' }]));

      component['productControl'].setValue('RBC');
      tick();

      expect(component['aliquot']()).toBe('01');
    }));
  });

  describe('Product search/filter', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['onUnitValidated'](mockUnitValidation);
      tick();
    }));







    it('should return empty when no products match', fakeAsync(() => {
      component['productSearchCtrl'].setValue('XYZ');
      tick();

      expect(component['filteredProducts']().length).toBe(0);
    }));


  });

  describe('saveCurrentEntry', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      apiServiceSpy.getAliquots.and.returnValue(of(mockAliquots));
      apiServiceSpy.getComponentDetails.and.returnValue(of(mockComponentDetails));

      component['onUnitValidated'](mockUnitValidation);
      tick();
      component['productControl'].setValue('FFP');
      tick();
    }));





    it('should set dateTimeError when date is missing', () => {
      component['freezeDateControl'].setValue(null);
      component['freezeTimeControl'].setValue('14:30');
      component['saveCurrentEntry']();
      expect(component['dateTimeError']()).toBe('Date and Time are mandatory.');
    });

    it('should set dateTimeError when time is missing', () => {
      component['freezeDateControl'].setValue(new Date(2025, 5, 15));
      component['freezeTimeControl'].setValue('');
      component['saveCurrentEntry']();
      expect(component['dateTimeError']()).toBe('Date and Time are mandatory.');
    });



    it('should call updateFreezeStartTime with correct request', fakeAsync(() => {
      apiServiceSpy.updateFreezeStartTime.and.returnValue(of(mockUpdateResponse));

      component['freezeDateControl'].setValue(new Date(2025, 5, 15));
      component['freezeTimeControl'].setValue('14:30');

      component['saveCurrentEntry']();
      tick();

      expect(apiServiceSpy.updateFreezeStartTime).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W1234567890123',
          productCode: 'FFP',
          aliquot: '00',
          collDate: '2025-06-15',
          freezeStartTime: '2025-06-15T14:30:00',
        })
      );
    }));

    it('should add entry to saved entries on success', fakeAsync(() => {
      apiServiceSpy.updateFreezeStartTime.and.returnValue(of(mockUpdateResponse));

      component['freezeDateControl'].setValue(new Date(2025, 5, 15));
      component['freezeTimeControl'].setValue('14:30');

      component['saveCurrentEntry']();
      tick();

      expect(component['savedEntries']().length).toBe(1);
      expect(component['savedEntries']()[0].unitId).toBe('W1234567890123');
      expect(component['savedEntries']()[0].productCode).toBe('FFP');
    }));



    it('should show plural "Entries" when count > 1', fakeAsync(() => {
      apiServiceSpy.updateFreezeStartTime.and.returnValue(of(mockUpdateResponse));

      component['savedEntries'].set([
        {
          unitId: 'EXISTING',
          collectionDate: '2025-06-14',
          productCode: 'RBC',
          productDescription: 'Red Blood Cells',
          freezeStartDateTime: '14-JUN-2025  10:00',
          aliquot: '00',
        },
      ]);

      component['freezeDateControl'].setValue(new Date(2025, 5, 15));
      component['freezeTimeControl'].setValue('14:30');

      component['saveCurrentEntry']();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('2 Entries modified');
    }));

    it('should clear input fields after successful save', fakeAsync(() => {
      apiServiceSpy.updateFreezeStartTime.and.returnValue(of(mockUpdateResponse));

      component['freezeDateControl'].setValue(new Date(2025, 5, 15));
      component['freezeTimeControl'].setValue('14:30');

      component['saveCurrentEntry']();
      tick();

      expect(component['freezeDateControl'].value).toBeNull();
      expect(component['freezeTimeControl'].value).toBe('');
      expect(component['aliquot']()).toBe('');
    }));







    it('should clear dateTimeError on successful validation', fakeAsync(() => {
      component['dateTimeError'].set('Previous error');
      apiServiceSpy.updateFreezeStartTime.and.returnValue(of(mockUpdateResponse));

      component['freezeDateControl'].setValue(new Date(2025, 5, 15));
      component['freezeTimeControl'].setValue('14:30');

      component['saveCurrentEntry']();
      tick();

      expect(component['dateTimeError']()).toBeNull();
    }));
  });

  describe('handleEnterKey', () => {
    it('should call saveCurrentEntry on Enter key', () => {
      spyOn<any>(component, 'saveCurrentEntry');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component['handleEnterKey'](event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component['saveCurrentEntry']).toHaveBeenCalled();
    });


  });

  describe('Pagination', () => {




    it('should paginate entries correctly', () => {
      const entries = Array.from({ length: 25 }, (_, i) => ({
        unitId: `UNIT${i}`,
        collectionDate: '2025-06-15',
        productCode: 'FFP',
        productDescription: 'Fresh Frozen Plasma',
        freezeStartDateTime: '15-JUN-2025  14:30',
        aliquot: '00',
      }));
      component['savedEntries'].set(entries);

      expect(component['paginatedEntries']().length).toBe(10);

      component['onPageChange']({ pageIndex: 1, pageSize: 10, length: 25 });
      expect(component['paginatedEntries']().length).toBe(10);

      component['onPageChange']({ pageIndex: 2, pageSize: 10, length: 25 });
      expect(component['paginatedEntries']().length).toBe(5);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      component['savedEntries'].set([
        { unitId: 'C0001', collectionDate: '2025-06-15', productCode: 'FFP', productDescription: 'Fresh Frozen Plasma', freezeStartDateTime: '15-JUN-2025  14:30', aliquot: '00' },
        { unitId: 'A0001', collectionDate: '2025-06-14', productCode: 'RBC', productDescription: 'Red Blood Cells', freezeStartDateTime: '14-JUN-2025  10:00', aliquot: '00' },
        { unitId: 'B0001', collectionDate: '2025-06-13', productCode: 'PLT', productDescription: 'Platelets', freezeStartDateTime: '13-JUN-2025  08:00', aliquot: '00' },
      ]);
    });

    it('should sort by unitId ascending', () => {
      component['onSortChange']({ active: 'unitId', direction: 'asc' });
      const entries = component['paginatedEntries']();
      expect(entries[0].unitId).toBe('A0001');
      expect(entries[1].unitId).toBe('B0001');
      expect(entries[2].unitId).toBe('C0001');
    });

    it('should sort by unitId descending', () => {
      component['onSortChange']({ active: 'unitId', direction: 'desc' });
      const entries = component['paginatedEntries']();
      expect(entries[0].unitId).toBe('C0001');
      expect(entries[1].unitId).toBe('B0001');
      expect(entries[2].unitId).toBe('A0001');
    });



    it('should reset page index on sort change', () => {
      component['pageIndex'].set(2);
      component['onSortChange']({ active: 'unitId', direction: 'asc' });
      expect(component['pageIndex']()).toBe(0);
    });
  });

  describe('Chapter change', () => {
    it('should clear form and filters on chapter change', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitDto));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component['onUnitValidated'](mockUnitValidation);
      tick();

      headerServiceStub.chapterChanged$.next();

      expect(component['unitData']()).toBeNull();
      expect(component['collectionDate']()).toBe('');
      expect(component['products']()).toEqual([]);
      expect(component['savedEntries']()).toEqual([]);
    }));
  });

  describe('formatDate', () => {
    it('should format date string to DD-MMM-YYYY', () => {
      const result = component['formatDate']('2025-06-15T00:00:00');
      expect(result).toBe('15-JUN-2025');
    });


  });

  describe('Error message extraction', () => {
    it('should extract errorResponse.error', () => {
      const error = { error: { errorResponse: { error: 'Direct error' } } };
      const result = component['extractErrorMessage'](error);
      expect(result).toBe('Direct error');
    });

    it('should map known error codes to messages', () => {
      const error = { error: { errorResponse: { errorCode: '0380' } } };
      const result = component['extractErrorMessage'](error);
      expect(result).toBe('Freeze start time cannot be in the future');
    });

    it('should fall back to error.error.message', () => {
      const error = { error: { message: 'Server error' } };
      const result = component['extractErrorMessage'](error);
      expect(result).toBe('Server error');
    });

    it('should fall back to error.message', () => {
      const error = { message: 'Generic error' };
      const result = component['extractErrorMessage'](error);
      expect(result).toBe('Generic error');
    });

    it('should return default message when no error info', () => {
      const result = component['extractErrorMessage']({});
      expect(result).toBe('An unexpected error occurred');
    });
  });
});
