import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DonorDecisionCodesFilterPanel } from './donor-decision-codes-filter-panel';
import { DonorDecisionCodesService } from '../services/donor-decision-codes.service';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

describe('DonorDecisionCodesFilterPanel', () => {
  let serviceSpy: any;
  let component: DonorDecisionCodesFilterPanel;
  let fixture: ComponentFixture<DonorDecisionCodesFilterPanel>;
  let service: jasmine.SpyObj<DonorDecisionCodesService>;

  const mockBarcodes = ['BC001', 'BC002', 'BC003'];
  const mockDonorDecisionCodeOptions = [
    { donorDecisionCode: 'Y', description: 'Yes (OK for Transfusion)' },
    { donorDecisionCode: 'N', description: 'No (Not OK for Transfusion)' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DonorDecisionCodesService', [
      'getBarcodes',
      'getDonorDecisionCodeOptions'
    ]);



      TestBed.configureTestingModule({
      imports: [
        DonorDecisionCodesFilterPanel,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DonorDecisionCodesService, useValue: serviceSpy }
      ]
    });


    


      serviceSpy.getBarcodes.calls.reset();


      serviceSpy.getDonorDecisionCodeOptions.calls.reset();


    fixture = TestBed.createComponent(DonorDecisionCodesFilterPanel);
    component = fixture.componentInstance;
    service = TestBed.inject(DonorDecisionCodesService) as jasmine.SpyObj<DonorDecisionCodesService>;

    service.getBarcodes.and.returnValue(of(mockBarcodes));
    service.getDonorDecisionCodeOptions.and.returnValue(of(mockDonorDecisionCodeOptions));


    });


  it('should initialize filter form with all fields', () => {
    fixture.detectChanges();

    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('barcode')).toBeDefined();
    expect(component.filterForm.get('donorDecisionCode')).toBeDefined();
    expect(component.filterForm.get('effectiveDatePeriod')).toBeDefined();
    expect(component.filterForm.get('effectiveDate')).toBeDefined();
    expect(component.filterForm.get('terminationDatePeriod')).toBeDefined();
    expect(component.filterForm.get('terminationDate')).toBeDefined();
  });

  it('should load barcodes on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(service.getBarcodes).toHaveBeenCalled();
    expect(component.barcodeOptions().length).toBe(3);
    expect(component.barcodeOptions()[0]).toBe('BC001');
    expect(component.barcodeOptions()[1]).toBe('BC002');
  }));

  it('should load donor decision code options on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(service.getDonorDecisionCodeOptions).toHaveBeenCalled();
    expect(component.donorDecisionCodeOptions().length).toBe(2);
    expect(component.donorDecisionCodeOptions()[0].donorDecisionCode).toBe('Y');
  }));






  it('should emit apply event with filter values when onApply is called', (done) => {
    fixture.detectChanges();

    component.filterForm.patchValue({
      barcode: 'BC001',
      donorDecisionCode: 'Y',
      effectiveDatePeriod: 'After',
      effectiveDate: new Date('2024-01-01'),
      terminationDatePeriod: null,
      terminationDate: null
    });

    component.apply.subscribe(filters => {
      expect(filters.barcode).toBe('BC001');
      expect(filters.donorDecisionCode).toBe('Y');
      expect(filters.effectiveDatePeriod).toBe('After');
      expect(filters.effectiveDate).toBeTruthy();
      expect(filters.terminationDatePeriod).toBeNull();
      expect(filters.terminationDate).toBeNull();
      done();
    });

    component.onApply();
  });


  it('should reset all form fields when onClear is called', () => {
    fixture.detectChanges();

    component.filterForm.patchValue({
      barcode: 'BC001',
      donorDecisionCode: 'Y',
      effectiveDatePeriod: 'After',
      effectiveDate: moment('2024-01-01'),
      terminationDatePeriod: 'Before',
      terminationDate: moment('2024-12-31')
    });

    component.onClear();

    expect(component.filterForm.get('barcode')?.value).toBeNull();
    expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('terminationDate')?.value).toBeNull();
  });

  it('should populate form with current filters on init', fakeAsync(() => {
    const currentFilters = {
      barcode: 'BC001',
      donorDecisionCode: 'Y',
      effectiveDatePeriod: 'After' as const,
      effectiveDate: new Date('2024-01-01'),
      terminationDatePeriod: null,
      terminationDate: null
    };

    component.currentFilters = currentFilters;
    fixture.detectChanges();
    tick();

    expect(component.filterForm.get('barcode')?.value).toBe('BC001');
    expect(component.filterForm.get('donorDecisionCode')?.value).toBe('Y');
    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
  }));




  it('should set loading state while fetching filters', () => {
    // Use Subjects to manually control when data arrives
    const barcodeSubject = new Subject<string[]>();
    const codeSubject = new Subject<any[]>();

    service.getBarcodes.and.returnValue(barcodeSubject.asObservable());
    service.getDonorDecisionCodeOptions.and.returnValue(codeSubject.asObservable());

    expect(component.isLoadingFilters).toBe(false);

    fixture.detectChanges(); // triggers ngOnInit -> loadDropdownData -> isLoadingFilters = true
    expect(component.isLoadingFilters).toBe(true);

    // Emit data to complete the observables
    barcodeSubject.next(mockBarcodes);
    barcodeSubject.complete();
    codeSubject.next(mockDonorDecisionCodeOptions);
    codeSubject.complete();

    expect(component.isLoadingFilters).toBe(false);
  });

});
