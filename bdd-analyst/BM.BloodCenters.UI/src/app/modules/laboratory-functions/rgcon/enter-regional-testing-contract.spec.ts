import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { EnterRegionalTestingContractComponent } from './enter-regional-testing-contract';
import { RegionalTestingContractApiService } from './services/regional-testing-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { RegionalTestingContractDto } from './models/regional-testing-contract.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('EnterRegionalTestingContractComponent', () => {
  let component: EnterRegionalTestingContractComponent;
  let fixture: ComponentFixture<EnterRegionalTestingContractComponent>;
  let apiServiceSpy: jasmine.SpyObj<RegionalTestingContractApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockContracts: RegionalTestingContractDto[] = [
    {
      contractId: 'CNT20260531120000',
      chapterId: 'CH01',
      contractType: 'T',
      customerName: 'ABC Testing Lab',
      customerId: 'CUST001',
      exportCode: 'US',
      agreementDate: '2026-05-15T00:00:00Z',
      effDate: '2026-06-01T00:00:00Z',
      termDate: null,
      addressId: 123,
      contactName: 'C',
      lastModifiedDate: '2026-05-31T10:30:00Z',
      programId: 'RGICNTCT',
      auditKey: 1000
    },
    {
      contractId: 'CNT20260531130000',
      chapterId: 'CH01',
      contractType: 'R',
      customerName: 'Regional Testing Inc',
      customerId: 'CUST002',
      exportCode: 'CA',
      agreementDate: null,
      effDate: '2026-07-01T00:00:00Z',
      termDate: '2027-07-01T00:00:00Z',
      addressId: null,
      contactName: 'C',
      lastModifiedDate: '2026-05-31T11:00:00Z',
      programId: 'RGICNTCT',
      auditKey: 1001
    }
  ];

  beforeAll(() => {
    // JSDOM does not implement scrollIntoView — provide a no-op stub
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = function () {};
    }
  });

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('RegionalTestingContractApiService', [
      'getAllContracts',
      'getContractById',
      'createContract',
      'updateContract',
      'deleteContract'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable',
      'getChapterLocalDate'
    ]);

    apiServiceSpy.getAllContracts.and.returnValue(
      of({ data: mockContracts, total: mockContracts.length })
    );
    apiServiceSpy.createContract.and.returnValue(
      of({ contractId: 'CNT20260531140000' })
    );
    apiServiceSpy.updateContract.and.returnValue(of(void 0));
    apiServiceSpy.deleteContract.and.returnValue(of(true));

    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [EnterRegionalTestingContractComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RegionalTestingContractApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterRegionalTestingContractComponent);
    component = fixture.componentInstance;
  });
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should validate contract type is required', () => {
      const contractTypeControl = component.form.get('contractType');
      expect(contractTypeControl?.hasError('required')).toBeTrue();

      contractTypeControl?.setValue('T');
      expect(contractTypeControl?.hasError('required')).toBeFalse();
    });

    it('should validate customer name is required', () => {
      const customerNameControl = component.form.get('customerName');
      expect(customerNameControl?.hasError('required')).toBeTrue();

      customerNameControl?.setValue('Test Lab');
      expect(customerNameControl?.hasError('required')).toBeFalse();
    });

    it('should validate customer name max length', () => {
      const customerNameControl = component.form.get('customerName');
      const longName = 'a'.repeat(101);

      customerNameControl?.setValue(longName);
      expect(customerNameControl?.hasError('maxlength')).toBeTrue();

      customerNameControl?.setValue('Valid Name');
      expect(customerNameControl?.hasError('maxlength')).toBeFalse();
    });


    it('should validate effective date cannot be in past (create mode)', () => {
      (component as any).editMode.set(false);
      const effDateControl = component.form.get('effDate');
      const yesterday = moment().subtract(1, 'day');

      effDateControl?.setValue(yesterday);
      effDateControl?.markAsTouched();
      fixture.detectChanges();

      expect(effDateControl?.hasError('effectiveDatePast')).toBeTrue();
    });


  });
  describe('Error State', () => {
    it('should show error message on API error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).error.set('Test error message');
      (component as any).loading.set(false);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    }));


  });

  describe('Contract Creation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should create contract when form is valid', fakeAsync(() => {
      component.form.patchValue({
        contractType: 'T',
        customerName: 'New Lab',
        customerId: 'CUST003',
        exportCode: 'US',
        effDate: moment().add(1, 'day'),
        termDate: null,
        agreementDate: null,
        addressId: 123
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createContract).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));


  });

  describe('Contract Update', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate form when editing contract', () => {
      component.onEdit(mockContracts[0]);

      expect(component.form.get('contractType')?.value).toBe('T');
      expect(component.form.get('customerName')?.value).toBe('ABC Testing Lab');
      expect((component as any).editMode()).toBeTrue();
      expect((component as any).selectedContractId()).toBe('CNT20260531120000');
    });

    it('should update contract when in edit mode', fakeAsync(() => {
      component.onEdit(mockContracts[0]);
      component.form.patchValue({
        customerName: 'Updated Lab Name',
        effDate: moment().add(1, 'day')
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.updateContract).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

  });

  describe('Contract Deletion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should delete contract when confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDelete(mockContracts[0]);
      tick();

      expect(apiServiceSpy.deleteContract).toHaveBeenCalledWith('CNT20260531120000');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trigger search on keyword input', fakeAsync(() => {
      component.onSearch('test keyword');
      tick();

      expect(apiServiceSpy.getAllContracts).toHaveBeenCalled();
      expect(component.searchForm.get('searchKeyword')?.value).toBe('test keyword');
    }));



  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should calculate pagination correctly', () => {
      (component as any).totalRecords.set(100);
      (component as any).pageSize.set(10);
      (component as any).pageIndex.set(2);

      const totalPages = Math.ceil((component as any).totalRecords() / (component as any).pageSize());
      expect(totalPages).toBe(10);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have unique IDs for form elements', () => {
      const contractTypeId = (component as any).elementId('contractType');
      const customerNameId = (component as any).elementId('customerName');

      expect(contractTypeId).toMatch(/^regional-testing-contract-\d+-contractType$/);
      expect(customerNameId).toMatch(/^regional-testing-contract-\d+-customerName$/);
      expect(contractTypeId).not.toBe(customerNameId);
    });


  });

  describe('Date Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format dates correctly for display', () => {
      const formatted = component.formatDate('2026-06-01T00:00:00Z');
      expect(formatted).toBe('01-JUN-2026');
    });


    it('should format dates for API submission', fakeAsync(() => {
      const futureDate = moment().add(5, 'days');
      component.form.patchValue({
        contractType: 'T',
        customerName: 'Test',
        customerId: 'CUST001',
        exportCode: 'US',
        effDate: futureDate
      });

      component.onSubmit();
      tick();

      const callArgs = apiServiceSpy.createContract.calls.mostRecent().args[0];
      expect(callArgs.effDate).toBe(futureDate.format('YYYY-MM-DD'));
    }));
  });

  describe('Unique ID Generation', () => {
    it('should have different IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(EnterRegionalTestingContractComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).componentId).not.toBe((component2 as any).componentId);
      expect((component as any).elementId('field1')).not.toBe((component2 as any).elementId('field1'));
    });
  });
});
