import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReleaseSpecialProcessingComponent } from './release-special-processing.component';
import { ReleaseSpecialProcessingService } from './services/release-special-processing.service';
import { HeaderService } from '../../../../shared/services/header.service';
import { createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  ProcessCodeDto,
  ProductDto,
} from './models/release-special-processing.models';

describe('ReleaseSpecialProcessingComponent', () => {
  let component: ReleaseSpecialProcessingComponent;
  let fixture: ComponentFixture<ReleaseSpecialProcessingComponent>;
  let serviceSpy: jasmine.SpyObj<ReleaseSpecialProcessingService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<void>;

  const mockProcessCodes: ProcessCodeDto[] = [
    { processCode: 'FROZ', processCodeDesc: 'Freezing' },
    { processCode: 'CRYP', processCodeDesc: 'Cryoprecipitate Processing' },
    { processCode: 'THAW', processCodeDesc: 'Thawing Process' },
  ];

  const mockProducts: ProductDto[] = [
    { productCode: 'E0701V00', productDesc: 'Red Blood Cells | AS7/450mL/refg' },
    { productCode: 'E0701V01', productDesc: 'White Blood Cells | AS8/450mL/refg' },
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ReleaseSpecialProcessingService', [
      'getProcessCodes',
      'validateUnit',
      'getProducts',
      'getAliquots',
      'releaseComponent',
    ]);
    chapterChangedSubject = new Subject<void>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject });
    snackBarSpy = createMockMatSnackBar();

    serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
      TestBed.configureTestingModule({
      imports: [
        ReleaseSpecialProcessingComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        { provide: ReleaseSpecialProcessingService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });
      serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    fixture = TestBed.createComponent(ReleaseSpecialProcessingComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should initialize with empty process code', () => {
      fixture.detectChanges();
      expect(component.processCodeControl.value).toBe('');
    });

    it('should show default process description', () => {
      fixture.detectChanges();
      expect(component.processDescription).toBe('-');
    });
  });

  describe('Process Code Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update process description when code is selected', () => {
      component.processCodeControl.setValue('FROZ');
      component.onProcessCodeChange();

      expect(component.processDescription).toBe('Freezing');
    });

    it('should reset description when code is deselected', () => {
      component.processCodeControl.setValue('FROZ');
      component.onProcessCodeChange();
      component.processCodeControl.setValue('');
      component.onProcessCodeChange();

      expect(component.processDescription).toBe('-');
    });

    it('should expose selectedProcessCode getter', () => {
      component.processCodeControl.setValue('CRYP');
      expect(component.selectedProcessCode).toBe('CRYP');
    });
  });

  describe('Error Handling', () => {
    it('should show error when process codes fail to load', () => {
      serviceSpy.getProcessCodes.and.returnValue(
        throwError(() => ({ error: { message: 'API Error' } })),
      );

      spyOn(component['snackBar'], 'open');
      component['loadProcessCodes']();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Failed to load process codes.',
        'Close',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
        }),
      );
    });
  });

  describe('Unit Cleared', () => {
    it('should reset all entry fields', () => {
      component.productValue = 'E0701V00';
      component.productDescription = 'Red Blood Cells';
      component.unitScannedWarning = 'This Unit ID has been scanned';
      component.eligibleProducts = mockProducts;

      component.onUnitCleared();

      expect(component.productValue).toBe('');
      expect(component.productDescription).toBe('--');
      expect(component.unitScannedWarning).toBe('');
      expect(component.eligibleProducts.length).toBe(0);
    });
  });

  describe('Table Management', () => {
    it('should start with empty released entries', () => {
      expect(component.releasedEntries.length).toBe(0);
    });

    it('should return paginated entries', () => {
      component.releasedEntries = [
        { unitId: 'U1', product: 'P1', productDesc: 'D1' },
        { unitId: 'U2', product: 'P2', productDesc: 'D2' },
      ];

      const paginated = component.paginatedEntries;
      expect(paginated.length).toBe(2);
    });





    it('should reset page index on sort change', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: {
          ...component.tableConfig.pagination!,
          pageIndex: 2,
        },
      };

      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Release Entry', () => {
    it('should increment savedCount by number of aliquot responses', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.getAliquots.and.returnValue(of([
        { componentPrefix: '01' },
        { componentPrefix: '02' },
        { componentPrefix: '03' },
      ]));
      serviceSpy.releaseComponent.and.returnValue(of({
        success: true,
        message: 'Component released from special processing successfully',
        warningMessage: null,
      }));

      component.processCodeControl.setValue('FROZ');
      component.eligibleProducts = mockProducts;
      component.productValue = 'E0701V00';
      component['collDate'] = '2026-01-01';

      component.unitIdField = {
        parsedUnitId: 'W1234567890123',
        isValid: true,
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;

      component['releaseEntry']();
      tick();

      expect(component.savedCount).toBe(3);
      expect(serviceSpy.releaseComponent).toHaveBeenCalledTimes(3);
    }));
  });

  describe('Chapter Changes', () => {
    it('should reset state when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.processCodeControl.setValue('FROZ');
      component.processDescription = 'Freezing';
      component.releasedEntries = [{ unitId: 'U1', product: 'P1', productDesc: 'D1' }];
      component.savedCount = 3;

      chapterChangedSubject.next();
      tick();

      expect(component.processCodeControl.value).toBe('');
      expect(component.processDescription).toBe('-');
      expect(component.releasedEntries.length).toBe(0);
      expect(component.savedCount).toBe(0);
    }));
  });

  describe('Product Selection', () => {
    it('should not proceed if productValue is empty', () => {
      fixture.detectChanges();
      component.productValue = '';
      component.onProductSelected();
      expect(component.productDescription).toBe('--');
    });

    it('should update productDescription when valid product is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.eligibleProducts = mockProducts;
      component.productValue = 'E0701V00';

      component.unitIdField = {
        parsedUnitId: 'W1234567890123',
        isValid: true,
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;

      // Don't actually call releaseEntry for this test
      component.isReleasing = true;
      component.onProductSelected();

      expect(component.productDescription).toBe('Red Blood Cells | AS7/450mL/refg');
    }));
  });

  describe('Select Opened Change', () => {
    it('should clear search control when select panel closes', () => {
      fixture.detectChanges();
      component.processCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.processCodeSearchCtrl, false);
      expect(component.processCodeSearchCtrl.value).toBe('');
    });

    it('should not clear search control when select panel opens', () => {
      fixture.detectChanges();
      component.processCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.processCodeSearchCtrl, true);
      expect(component.processCodeSearchCtrl.value).toBe('test');
    });
  });

  describe('Page Change', () => {
    it('should update pagination config', () => {
      fixture.detectChanges();
      component.onPageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });
  });

  describe('Filtered Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all process codes when no search text', () => {
      expect(component.filteredProcessCodes().length).toBe(3);
    });

    it('should filter process codes by search text', fakeAsync(() => {
      component.processCodeSearchCtrl.setValue('froz');
      tick();
      expect(component.filteredProcessCodes().length).toBe(1);
    }));

    it('should return all products when no search text', () => {
      expect(component.filteredProducts().length).toBe(0);
    });
  });

  describe('Unit Post Validate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.processCodeControl.setValue('FROZ');
      component.onProcessCodeChange();
    }));

    it('should reject when unit is not valid', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: false, collDate: null }));

      const rejectSpy = jasmine.createSpy('reject');
      const confirmSpy = jasmine.createSpy('confirm');

      component.onUnitPostValidate({
        data: { parsedUnitId: 'UNIT001' } as any,
        reject: rejectSpy,
        confirm: confirmSpy
      });
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit not found or not eligible.');
    }));

    it('should reject when validateUnit API errors', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: { parsedUnitId: 'UNIT001' } as any,
        reject: rejectSpy,
        confirm: jasmine.createSpy('confirm')
      });
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Server error');
    }));

    it('should confirm and load products on valid unit', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: true, collDate: '2026-01-01' }));
      serviceSpy.getProducts.and.returnValue(of(mockProducts));

      const confirmSpy = jasmine.createSpy('confirm');
      component.onUnitPostValidate({
        data: { parsedUnitId: 'UNIT001' } as any,
        reject: jasmine.createSpy('reject'),
        confirm: confirmSpy
      });
      tick();

      expect(confirmSpy).toHaveBeenCalled();
      expect(component.eligibleProducts.length).toBe(2);
    }));

    it('should reject when no eligible products', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: true, collDate: '2026-01-01' }));
      serviceSpy.getProducts.and.returnValue(of([]));

      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: { parsedUnitId: 'UNIT001' } as any,
        reject: rejectSpy,
        confirm: jasmine.createSpy('confirm')
      });
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('No eligible products for this unit.');
    }));

    it('should set unit scanned warning when unit already in list', fakeAsync(() => {
      component.releasedEntries = [{ unitId: 'UNIT001', product: 'P1', productDesc: 'D1' }];
      serviceSpy.validateUnit.and.returnValue(of({ isValid: true, collDate: '2026-01-01' }));
      serviceSpy.getProducts.and.returnValue(of(mockProducts));

      component.onUnitPostValidate({
        data: { parsedUnitId: 'UNIT001' } as any,
        reject: jasmine.createSpy('reject'),
        confirm: jasmine.createSpy('confirm')
      });
      tick();

      expect(component.unitScannedWarning).toBe('This Unit ID has been scanned');
    }));

    it('should reject when getProducts API errors', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: true, collDate: '2026-01-01' }));
      serviceSpy.getProducts.and.returnValue(throwError(() => ({ error: { message: 'Product load failed' } })));

      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: { parsedUnitId: 'UNIT001' } as any,
        reject: rejectSpy,
        confirm: jasmine.createSpy('confirm')
      });
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Product load failed');
    }));
  });

  describe('Release Entry Error', () => {
    it('should set isReleasing false when release fails', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.getAliquots.and.returnValue(of([{ componentPrefix: '01' }]));
      serviceSpy.releaseComponent.and.returnValue(
        throwError(() => ({ error: { message: 'Release failed' } }))
      );

      component.processCodeControl.setValue('FROZ');
      component.eligibleProducts = mockProducts;
      component.productValue = 'E0701V00';
      component['collDate'] = '2026-01-01';

      component.unitIdField = {
        parsedUnitId: 'W1234567890123',
        isValid: true,
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;

      spyOn(component as any, 'showError');
      component['releaseEntry']();
      tick();

      expect(component.isReleasing).toBeFalse();
      expect((component as any).showError).toHaveBeenCalledWith('Release failed');
    }));

    it('should handle zero aliquots', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.getAliquots.and.returnValue(of([]));

      component.processCodeControl.setValue('FROZ');
      component.eligibleProducts = mockProducts;
      component.productValue = 'E0701V00';
      component['collDate'] = '2026-01-01';

      component.unitIdField = {
        parsedUnitId: 'W1234567890123',
        isValid: true,
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;

      spyOn(component as any, 'showError');
      component['releaseEntry']();
      tick();

      expect(component.isReleasing).toBeFalse();
      expect((component as any).showError).toHaveBeenCalledWith('No aliquots available for this product.');
    }));
  });

  describe('Sort Entries', () => {
    it('should sort entries ascending', () => {
      fixture.detectChanges();
      component.releasedEntries = [
        { unitId: 'B', product: 'P1', productDesc: 'D1' },
        { unitId: 'A', product: 'P2', productDesc: 'D2' },
      ];

      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(component.releasedEntries[0].unitId).toBe('A');
    });

    it('should sort entries descending', () => {
      fixture.detectChanges();
      component.releasedEntries = [
        { unitId: 'A', product: 'P1', productDesc: 'D1' },
        { unitId: 'B', product: 'P2', productDesc: 'D2' },
      ];

      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(component.releasedEntries[0].unitId).toBe('B');
    });
  });
});
