import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';

import { SupplierQueryComponent } from './supplier-query.component';
import { SupplierQueryService } from './services/supplier-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  SupplierLookup,
  SupplierQueryResult
} from './models/supplier-query.model';

describe('SupplierQueryComponent', () => {
  let serviceSpy: any;
  let component: SupplierQueryComponent;
  let fixture: ComponentFixture<SupplierQueryComponent>;
  let supplierQueryServiceSpy: jasmine.SpyObj<SupplierQueryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockSuppliers: SupplierLookup[] = [
    { supplierCode: '1', supplierName: 'ORTHO' },
    { supplierCode: '2', supplierName: 'ABBOTT' }
  ];

  const mockResults: SupplierQueryResult[] = [
    {
      reagentId: 'R001',
      testId: 'ABID',
      testDesc: 'Antibody Identification',
      reagentCode: 'ABRGT',
      reagentName: 'Antibody ID',
      supplierCode: '1',
      receivedBy: 'JDoe',
      receivedDate: '2001-08-16',
      expiryDate: '2001-08-16',
      noOfTests: 100,
      remainingTests: 50,
      lotNumber: '',
      kitLotNumber: '',
      rejectReasonCode: '',
      rejectReasonDesc: ''
    },
    {
      reagentId: 'R002',
      testId: 'ABIT',
      testDesc: 'Antibody Identification',
      reagentCode: 'ABRGT',
      reagentName: 'Antibody ID',
      supplierCode: '1',
      receivedBy: 'JSmith',
      receivedDate: '2001-08-17',
      expiryDate: '2001-08-17',
      noOfTests: 200,
      remainingTests: 150,
      lotNumber: 'LOT123',
      kitLotNumber: 'KIT456',
      rejectReasonCode: '',
      rejectReasonDesc: ''
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('SupplierQueryService', [
      'getSuppliersLookup',
      'searchSupplierQuery',
      'getReagentById'
    ]);
    const snackbarSpy = createMockSnackbarService();
    const translateSpy = createMockTranslateService();
    const activatedRouteSpy = { snapshot: { paramMap: { get: () => null } } };

    serviceSpy.getSuppliersLookup.and.returnValue(of(mockSuppliers));
    serviceSpy.searchSupplierQuery.and.returnValue(of({ data: mockResults, total: 2 }));



      TestBed.configureTestingModule({
      imports: [SupplierQueryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SupplierQueryService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    });


    


      serviceSpy.getSuppliersLookup.calls.reset();


      serviceSpy.searchSupplierQuery.calls.reset();


      serviceSpy.getReagentById.calls.reset();


      serviceSpy.getSuppliersLookup.and.returnValue(of(mockSuppliers));


      serviceSpy.searchSupplierQuery.and.returnValue(of({ data: mockResults, total: 2 }));


    fixture = TestBed.createComponent(SupplierQueryComponent);
    component = fixture.componentInstance;
    supplierQueryServiceSpy = TestBed.inject(SupplierQueryService) as jasmine.SpyObj<SupplierQueryService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    });

  describe('Initialization', () => {




    it('should load suppliers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(supplierQueryServiceSpy.getSuppliersLookup).toHaveBeenCalled();
      expect((component as any).suppliers()).toEqual(mockSuppliers);
      expect((component as any).loadingSuppliers()).toBe(false);
    }));


  });
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be invalid when supplier is not selected', () => {
      expect(component.filterForm.valid).toBeFalse();
      expect(component.filterForm.get('supplierId')?.hasError('required')).toBeTrue();
    });



    it('should show error when supplier field is touched and empty', () => {
      component.filterForm.get('supplierId')?.markAsTouched();
      (component as any).submitted.set(true);
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Supplier is required');
    });
  });

  describe('Supplier Description Auto-population', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).suppliers.set(mockSuppliers);
    });



    it('should clear supplier name when supplier is deselected', () => {
      component.filterForm.patchValue({ supplierId: '1' });
      fixture.detectChanges();
      expect((component as any).selectedSupplierName()).toBe('ORTHO');

      component.filterForm.patchValue({ supplierId: '' });
      fixture.detectChanges();
      expect((component as any).selectedSupplierName()).toBe('');
      expect(component.filterForm.get('supplierDescription')?.value).toBe('');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should search when form is valid', fakeAsync(() => {
      component.filterForm.patchValue({
        supplierId: '1',
        receivedDateFrom: moment('2001-08-01'),
        receivedDateTo: moment('2001-08-31')
      });

      component.onRetrieve();
      tick();

      expect(supplierQueryServiceSpy.searchSupplierQuery).toHaveBeenCalledWith({
        supplierCode: '1',
        dateStart: '2001-08-01',
        dateEnd: '2001-08-31',
        take: 10,
        skip: 0,
        sortColumn: undefined,
        sortOrder: undefined
      });
    }));

    it('should update results on successful search', fakeAsync(() => {
      component.filterForm.patchValue({ supplierId: '1' });
      component.onRetrieve();
      tick();

      expect((component as any).results()).toEqual(mockResults);
      expect((component as any).totalRecords()).toBe(2);
      expect((component as any).loading()).toBe(false);
    }));




  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        supplierId: '1',
        receivedDateFrom: moment('2001-08-01')
      });
      (component as any).results.set(mockResults);
      (component as any).submitted.set(true);
    });

    it('should reset form when clear all is clicked', () => {
      component.onClearAll();

      expect(component.filterForm.get('supplierId')?.value).toBeNull();
      expect(component.filterForm.get('receivedDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('receivedDateTo')?.value).toBeNull();
    });

    it('should clear results when clear all is clicked', () => {
      component.onClearAll();

      expect((component as any).results()).toEqual([]);
      expect((component as any).totalRecords()).toBe(0);
      expect((component as any).submitted()).toBe(false);
    });

    it('should reset pagination and sort when clear all is clicked', () => {
      (component as any).currentPage.set(2);
      (component as any).sortColumn.set('test');
      (component as any).sortDirection.set('A');

      component.onClearAll();

      expect((component as any).currentPage()).toBe(0);
      expect((component as any).sortColumn()).toBe('');
      expect((component as any).sortDirection()).toBe('default');
    });
  });



  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ supplierId: '1' });
      (component as any).results.set(mockResults);
    });

    it('should handle sort change event', fakeAsync(() => {
      const sortEvent = { column: 'test', direction: 'A' as const };
      component.onSortChange(sortEvent);
      tick();

      expect((component as any).sortColumn()).toBe('test');
      expect((component as any).sortDirection()).toBe('A');
      expect(supplierQueryServiceSpy.searchSupplierQuery).toHaveBeenCalled();
    }));

    it('should include sort parameters in search request', fakeAsync(() => {
      (component as any).sortColumn.set('receivedDate');
      (component as any).sortDirection.set('D');
      component.filterForm.patchValue({ supplierId: '1' });
      component.onRetrieve();
      tick();

      expect(supplierQueryServiceSpy.searchSupplierQuery).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortColumn: 'receivedDate',
          sortOrder: 'D'
        })
      );
    }));
  });

  describe('Date Formatting', () => {
    it('should format valid dates to MM-DD-YY', () => {
      const formatted = (component as any).formatDate('2001-08-16');
      expect(formatted).toBe('08-16-01');
    });






  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should have unique error IDs for accessibility', () => {
      component.filterForm.get('supplierId')?.markAsTouched();
      (component as any).submitted.set(true);
      fixture.detectChanges();

      const errId = (component as any).errorId('supplier');
      const select = fixture.debugElement.query(By.css('mat-select'));
      expect(select.attributes['aria-describedby']).toContain(errId);
    });


  });
  describe('Supplier Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).suppliers.set(mockSuppliers);
    });

    it('should initialize supplier search control', () => {
      expect(component.supplierSearchControl).toBeTruthy();
      expect(component.supplierSearchControl.value).toBe('');
    });







    it('should show all suppliers when search is empty', fakeAsync(() => {
      component.supplierSearchControl.setValue('');
      tick();
      fixture.detectChanges();

      const filtered = (component as any).filteredSuppliers();
      expect(filtered.length).toBe(2);
    }));

    it('should show no suppliers when search does not match', fakeAsync(() => {
      component.supplierSearchControl.setValue('NONEXISTENT');
      tick();
      fixture.detectChanges();

      const filtered = (component as any).filteredSuppliers();
      expect(filtered.length).toBe(0);
    }));

    it('should update supplierSearch signal when search control changes', fakeAsync(() => {
      component.supplierSearchControl.setValue('ABBOTT');
      tick();

      expect((component as any).supplierSearch()).toBe('ABBOTT');
    }));


  });
});
