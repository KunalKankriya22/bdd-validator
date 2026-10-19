import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { ReleaseProductQuarantineComponent } from './release-product-quarantine.component';
import { ReleaseProductQuarantineApiService } from './services/release-product-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { QuarantineType, QuarantineProduct } from './models/release-product-quarantine.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ReleaseProductQuarantineComponent', () => {
  let loggingSpy: any;
  let apiServiceSpy: any;
  let component: any;
  let fixture: ComponentFixture<ReleaseProductQuarantineComponent>;
  let apiService: jasmine.SpyObj<ReleaseProductQuarantineApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;

  const mockQuarantineTypes: QuarantineType[] = [
    { code: 'QU', description: 'Quarantine' },
    { code: 'RT', description: 'Returns' }
  ];

  const mockProducts: QuarantineProduct[] = [
    {
      unitId: 'C1234567',
      productCode: 'RBC',
      aliquot: '00',
      chapterId: 'CH01',
      collDate: '2024-04-25T00:00:00Z',
      expDate: '2024-06-25T00:00:00Z',
      bloodType: 'O',
      inventoryClass: 'QU',
      reasonCode: 'R01',
      reasonDesc: 'Quality Control Hold',
      locationId: 'W01-D01-R01-T01',
      productDesc: 'Red Blood Cells',
      aboDesc: 'O Positive'
    }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ReleaseProductQuarantineApiService', [
      'getQuarantineTypes',
      'getQuarantineProducts',
      'getQuarantineProduct',
      'getQuarantineReasons',
      'getStorageLocations',
      'releaseProduct',
      'removeQuarantineReason'
    ]);

    const snackbarSpy = createMockSnackbarService();
    loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);



      TestBed.configureTestingModule({
      imports: [
        ReleaseProductQuarantineComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ReleaseProductQuarantineApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });


    


      apiServiceSpy.getQuarantineTypes.calls.reset();


      apiServiceSpy.getQuarantineProducts.calls.reset();


      apiServiceSpy.getQuarantineProduct.calls.reset();


      apiServiceSpy.getQuarantineReasons.calls.reset();


      apiServiceSpy.getStorageLocations.calls.reset();


      apiServiceSpy.releaseProduct.calls.reset();


      apiServiceSpy.removeQuarantineReason.calls.reset();


      loggingSpy.log.calls.reset();


      loggingSpy.error.calls.reset();


      loggingSpy.warn.calls.reset();


      loggingSpy.debug.calls.reset();


    apiService = TestBed.inject(ReleaseProductQuarantineApiService) as jasmine.SpyObj<ReleaseProductQuarantineApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    apiService.getQuarantineTypes.and.returnValue(of(mockQuarantineTypes));
    apiService.getQuarantineProducts.and.returnValue(of({ data: mockProducts, total: 1 }));

    fixture = TestBed.createComponent(ReleaseProductQuarantineComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load quarantine types on init', () => {
      fixture.detectChanges();
      expect(apiService.getQuarantineTypes).toHaveBeenCalled();
      expect(component.quarantineTypes().length).toBe(2);
    });



    it('should default to QU (Quarantine) type', () => {
      fixture.detectChanges();
      expect(component.selectedType()).toBe('QU');
    });

    it('should have valid component ID', () => {
      expect(component.componentId).toMatch(/^release-product-quarantine-\d+$/);
    });
  });

  describe('Search Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize search form with unit ID validation', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('unitId')).toBeDefined();
    });

    it('should validate unit ID length', () => {
      const unitIdControl = component.searchForm.get('unitId');

      unitIdControl?.setValue('C123');
      expect(unitIdControl?.hasError('minlength')).toBeTrue();

      unitIdControl?.setValue('C123456789');
      expect(unitIdControl?.hasError('maxlength')).toBeTrue();

      unitIdControl?.setValue('C1234567');
      expect(unitIdControl?.valid).toBeTrue();
    });

    it('should validate unit ID pattern (must start with C or I)', () => {
      const unitIdControl = component.searchForm.get('unitId');

      unitIdControl?.setValue('X1234567');
      expect(unitIdControl?.hasError('pattern')).toBeTrue();

      unitIdControl?.setValue('C1234567');
      expect(unitIdControl?.valid).toBeTrue();

      unitIdControl?.setValue('I1234567');
      expect(unitIdControl?.valid).toBeTrue();
    });

    it('should require unit ID', () => {
      const unitIdControl = component.searchForm.get('unitId');

      unitIdControl?.setValue('');
      expect(unitIdControl?.hasError('required')).toBeTrue();
    });
  });

  describe('Data Loading', () => {


    it('should populate data source on successful load', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.dataSource.length).toBe(1);
        expect(component.dataSource[0].unitId).toBe('C1234567');
        expect(component.loading()).toBeFalse();
        done();
      }, 100);
    });


  });

  describe('Quarantine Type Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload data when quarantine type changes', () => {
      apiService.getQuarantineProducts.calls.reset();

      component.onQuarantineTypeChange('RT');

      expect(component.selectedType()).toBe('RT');
      expect(apiService.getQuarantineProducts).toHaveBeenCalled();
    });

    it('should update empty message based on type', () => {
      component.onQuarantineTypeChange('QU');
      expect(component.tableConfig.emptyMessage).toContain('quarantine');

      component.onQuarantineTypeChange('RT');
      expect(component.tableConfig.emptyMessage).toContain('returns');
    });

    it('should reset pagination when type changes', () => {
      component.tableConfig.pagination!.pageIndex = 2;

      component.onQuarantineTypeChange('RT');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle page change events', () => {
      spyOn(component, 'loadData');

      component.onPageChange({ pageSize: 50, pageIndex: 1, previousPageIndex: 0 });

      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(component.tableConfig.pagination!.pageIndex).toBe(1);
      expect(component.loadData).toHaveBeenCalled();
    });




  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should reset pagination to first page on sort', () => {
      component.tableConfig.pagination!.pageIndex = 2;

      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have release and view-reasons actions', () => {
      const actions = component.tableConfig.rowActions;

      expect(actions?.length).toBe(2);
      expect(actions?.[0].action).toBe('release');
      expect(actions?.[1].action).toBe('view-reasons');
    });

    it('should handle release action', () => {
      const product = mockProducts[0];

      component.onRowAction({ action: 'release', row: product });

      // Currently shows not implemented message
      // TODO: Update when dialog is implemented
    });

    it('should handle view-reasons action', () => {
      const product = mockProducts[0];

      component.onRowAction({ action: 'view-reasons', row: product });

      // Currently shows not implemented message
      // TODO: Update when dialog is implemented
    });
  });





  describe('Date Formatting', () => {


    it('should handle invalid dates gracefully', () => {
      const invalidDate = 'invalid-date';
      const formatted = component['formatDate'](invalidDate);

      expect(formatted).toBe(invalidDate);
    });
  });
});
