import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { DonorDecisionCodes } from './donor-decision-codes';
import { DonorDecisionCodesService } from '../services/donor-decision-codes.service';
import { of, throwError } from 'rxjs';

describe('DonorDecisionCodes', () => {
  let serviceSpy: any;
  let component: DonorDecisionCodes;
  let fixture: ComponentFixture<DonorDecisionCodes>;
  let service: jasmine.SpyObj<DonorDecisionCodesService>;

  const mockTableData = [
    {
      barCodeValue: 'BC001',
      donorDecisionCode: 'Y',
      displayCode: 'Yes (OK for Transfusion)',
      effDate: new Date('2024-01-01'),
      termDate: new Date('2024-12-31'),
      lastModifiedDate: new Date('2024-06-15'),
      programId: 'PROG01'
    },
    {
      barCodeValue: 'BC002',
      donorDecisionCode: 'N',
      displayCode: 'No (Not OK for Transfusion)',
      effDate: new Date('2024-02-01'),
      termDate: null,
      lastModifiedDate: new Date('2024-07-20'),
      programId: 'PROG02'
    }
  ];

  const mockApiResponse = { data: mockTableData, totalRecords: 2 };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DonorDecisionCodesService', [
      'getDonorDecisionCodes',
      'getDonorDecisionCodeByBarcode',
      'addDonorDecisionCode',
      'updateDonorDecisionCode'
    ]);



      TestBed.configureTestingModule({
      imports: [DonorDecisionCodes,
        HttpClientTestingModule
        TranslateModule.forRoot(),
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DonorDecisionCodesService, useValue: serviceSpy }
      ]
    });


    


      serviceSpy.getDonorDecisionCodes.calls.reset();


      serviceSpy.getDonorDecisionCodeByBarcode.calls.reset();


      serviceSpy.addDonorDecisionCode.calls.reset();


      serviceSpy.updateDonorDecisionCode.calls.reset();


    fixture = TestBed.createComponent(DonorDecisionCodes);
    component = fixture.componentInstance;
    service = TestBed.inject(DonorDecisionCodesService) as jasmine.SpyObj<DonorDecisionCodesService>;
    service.getDonorDecisionCodes.and.returnValue(of(mockApiResponse));


    });












  it('should handle pagination changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    service.getDonorDecisionCodes.calls.reset();
    component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });

    expect(service.getDonorDecisionCodes).toHaveBeenCalled();
    expect(component.tableConfig.pagination?.pageIndex).toBe(1);
    expect(component.tableConfig.pagination?.pageSize).toBe(25);
  }));









  it('should map column names correctly', () => {
    expect(component['mapColumnToAPIName']('barCodeValue')).toBe('BarCodeValue');
    expect(component['mapColumnToAPIName']('donorDecisionCode')).toBe('DonorDecisionCode');
    expect(component['mapColumnToAPIName']('displayCode')).toBe('DisplayCode');
  });

  it('should open side panel for adding', () => {
    component.createRecord();

    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelData).toBeNull();
  });

  it('should fetch record by barcode when editing', fakeAsync(() => {
    const record = mockTableData[0];
    service.getDonorDecisionCodeByBarcode.and.returnValue(of(record));

    component.editRecord(record);
    tick();

    expect(service.getDonorDecisionCodeByBarcode).toHaveBeenCalledWith('BC001');
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelOpen).toBe(true);
  }));

  it('should handle edit errors gracefully', fakeAsync(() => {
    const record = mockTableData[0];
    service.getDonorDecisionCodeByBarcode.and.returnValue(
      throwError(() => ({ message: 'Error fetching record' }))
    );
    spyOn(console, 'error');

    component.editRecord(record);
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(component.hasError).toBe(true);
    expect(component.sidePanelOpen).toBe(true); // Panel opens with error
  }));

  it('should handle API errors during load', fakeAsync(() => {
    service.getDonorDecisionCodes.and.returnValue(
      throwError(() => ({ message: 'Error loading data' }))
    );
    spyOn(console, 'error');

    component.loadTableData();
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(component.hasError).toBe(true);
  }));





  it('should apply filters correctly', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const filters = {
      barcode: 'BC001',
      donorDecisionCode: 'Y',
      effectiveDatePeriod: 'After' as const,
      effectiveDate: new Date('2024-01-01'),
      terminationDatePeriod: null,
      terminationDate: null
    };

    component.applyFilters(filters);

    expect(component.requestState.barcode).toBe('BC001');
    expect(component.requestState.donorDecisionCode).toBe('Y');
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
  }));

  it('should format dates correctly for API', () => {
    const date = new Date(Date.UTC(2024, 1, 15, 0, 0, 0, 0));
    expect(component['formatDateForAPI'](date)).toBe('2024-02-15');
  });






});
