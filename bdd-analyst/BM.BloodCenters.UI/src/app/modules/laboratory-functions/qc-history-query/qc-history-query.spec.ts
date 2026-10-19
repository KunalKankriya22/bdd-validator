import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QcHistoryQueryComponent } from './qc-history-query';
import { QcHistoryQueryService } from './services/qc-history-query.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QcHistoryDto } from './models/qc-history-query.model';
import { TableSortEvent } from '@shared/interfaces/data-table.interface';
import moment from 'moment';

describe('QcHistoryQueryComponent', () => {
  let serviceSpy: any;
  let component: QcHistoryQueryComponent;
  let fixture: ComponentFixture<QcHistoryQueryComponent>;
  let service: jasmine.SpyObj<QcHistoryQueryService>;

  const mockQcHistoryData: QcHistoryDto[] = [
    {
      equipType: 'CENTRIFUGE',
      equipId: 'CENT-001',
      equipReference: 'REF-001',
      equipStatus: 'Active',
      qcReference: 'QC-001',
      qcType: 'Daily',
      qcDate: '2024-06-01T10:00:00.000Z',
      qcTech1: 'TECH1',
      qcTech2: 'TECH2',
      qcStatus: 'PASS',
      qcStatusDesc: 'Passed',
    },
    {
      equipType: 'CENTRIFUGE',
      equipId: 'CENT-002',
      equipReference: 'REF-002',
      equipStatus: null,
      qcReference: 'QC-002',
      qcType: 'Weekly',
      qcDate: '2024-06-02T14:30:00.000Z',
      qcTech1: null,
      qcTech2: null,
      qcStatus: 'FAIL',
      qcStatusDesc: 'Failed',
    },
  ];

  const mockEquipTypes = [
    { equipType: 'CENTRIFUGE', description: 'Centrifuge Equipment' },
    { equipType: 'SCALE', description: 'Scale Equipment' },
  ];

  const mockEquipIds = [
    { equipId: 'CENT-001', equipReference: 'REF-001', serviceDates: '01-JAN-2024' },
    { equipId: 'CENT-002', equipReference: 'REF-002', serviceDates: '15-FEB-2024' },
  ];

  const mockEquipRefs = [
    { equipReference: 'REF-001', serviceDates: '01-JAN-2024' },
  ];

  const mockQcStatuses = [
    { code: 'PASS', codeDesc: 'Passed' },
    { code: 'FAIL', codeDesc: 'Failed' },
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('QcHistoryQueryService', [
      'getList',
      'getEquipmentTypes',
      'getEquipmentIds',
      'getEquipmentReferences',
      'getQcStatuses',
    ]);

    serviceSpy.getEquipmentTypes.and.returnValue(of(mockEquipTypes));
    serviceSpy.getQcStatuses.and.returnValue(of(mockQcStatuses));
    serviceSpy.getEquipmentIds.and.returnValue(of(mockEquipIds));
    serviceSpy.getEquipmentReferences.and.returnValue(of(mockEquipRefs));
    serviceSpy.getList.and.returnValue(of({ data: mockQcHistoryData, totalRecords: 2 }));



      TestBed.configureTestingModule({
      imports: [
        QcHistoryQueryComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: QcHistoryQueryService, useValue: serviceSpy },
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


    


      serviceSpy.getList.calls.reset();


      serviceSpy.getEquipmentTypes.calls.reset();


      serviceSpy.getEquipmentIds.calls.reset();


      serviceSpy.getEquipmentReferences.calls.reset();


      serviceSpy.getQcStatuses.calls.reset();


      serviceSpy.getEquipmentTypes.and.returnValue(of(mockEquipTypes));


      serviceSpy.getQcStatuses.and.returnValue(of(mockQcStatuses));


      serviceSpy.getEquipmentIds.and.returnValue(of(mockEquipIds));


      serviceSpy.getEquipmentReferences.and.returnValue(of(mockEquipRefs));


      serviceSpy.getList.and.returnValue(of({ data: mockQcHistoryData, totalRecords: 2 }));


    service = TestBed.inject(QcHistoryQueryService) as jasmine.SpyObj<QcHistoryQueryService>;

    fixture = TestBed.createComponent(QcHistoryQueryComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {




    it('should initialize form controls', () => {
      expect(component.equipmentTypeControl.value).toBeNull();
      expect(component.equipmentIdControl.disabled).toBe(true);
      expect(component.equipmentReferenceControl.disabled).toBe(true);
      expect(component.qcStatusControl.value).toBeNull();
      expect(component.startDateControl.value).toBeNull();
      expect(component.endDateControl.value).toBeNull();
    });




  });

  describe('Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve data when retrieve is called', () => {
      component.onRetrieve();

      expect(component.isRetrieved).toBe(true);
      expect(component.hasSearched).toBe(true);
      expect(service.getList).toHaveBeenCalled();
    });

    it('should set data source from response', (done) => {
      component.onRetrieve();

      setTimeout(() => {
        expect(component.dataSource).toEqual(mockQcHistoryData);
        expect(component.tableConfig.pagination?.totalRecords).toBe(2);
        done();
      });
    });

    it('should reset page index on retrieve', () => {
      component.tableConfig.pagination!.pageIndex = 3;

      component.onRetrieve();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });



    it('should not retrieve when dates are invalid', () => {
      fixture.detectChanges();
      component.startDateControl.setValue(moment('2024-12-31'));
      component.startDateControl.markAsTouched();
      component.endDateControl.setValue(moment('2024-01-01'));
      component.endDateControl.markAsTouched();

      component.onRetrieve();

      expect(service.getList).not.toHaveBeenCalled();
      expect(component.getEndDateError()).toContain('End Date must be greater than or equal to Start Date');
    });

    it('should handle error when loading data fails', (done) => {
      service.getList.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.onRetrieve();

      setTimeout(() => {
        expect(component.hasError).toBe(true);
        expect(component.dataSource).toEqual([]);
        expect(component.tableConfig.pagination?.totalRecords).toBe(0);
        done();
      });
    });



    it('should calculate correct skip and take for pagination', () => {
      component.onRetrieve();
      service.getList.calls.reset();

      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;
      component.loadTableData();

      expect(service.getList).toHaveBeenCalledWith(25, 50, jasmine.any(Object));
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all form controls', () => {
      component.equipmentTypeControl.setValue('CENTRIFUGE');
      component.qcStatusControl.setValue('PASS');
      component.startDateControl.setValue(moment());
      component.endDateControl.setValue(moment());

      component.onClearAll();

      expect(component.equipmentTypeControl.value).toBeNull();
      expect(component.equipmentIdControl.value).toBeNull();
      expect(component.equipmentReferenceControl.value).toBeNull();
      expect(component.qcStatusControl.value).toBeNull();
      expect(component.startDateControl.value).toBeNull();
      expect(component.endDateControl.value).toBeNull();
    });

    it('should reset state flags', () => {
      component.isRetrieved = true;
      component.isDirtyAfterRetrieve = true;
      component.hasSearched = true;
      component.hasError = true;

      component.onClearAll();

      expect(component.isRetrieved).toBe(false);
      expect(component.isDirtyAfterRetrieve).toBe(false);
      expect(component.hasSearched).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should clear data source and pagination', () => {
      component.dataSource = mockQcHistoryData;
      component.tableConfig.pagination!.totalRecords = 100;
      component.tableConfig.pagination!.pageIndex = 5;

      component.onClearAll();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });



    it('should clear equipment description and date errors', () => {
      component.equipmentDescription = 'Some description';
      component.startDateControl.setValue(moment('2024-12-31'));
      component.endDateControl.setValue(moment('2024-01-01'));

      component.onClearAll();

      expect(component.equipmentDescription).toBe('');
      expect(component.getStartDateError()).toBe('');
      expect(component.getEndDateError()).toBe('');
    });
  });
  describe('Cascading Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should set equipment description when type is selected', () => {
      component.onEquipmentTypeChange('CENTRIFUGE');

      expect(component.equipmentDescription).toBe('Centrifuge Equipment');
    });



    it('should reset equipment ID and reference when type changes', () => {
      component.equipmentIdControl.setValue('CENT-001');
      component.equipmentReferenceControl.setValue('REF-001');

      component.onEquipmentTypeChange('SCALE');

      expect(component.equipmentIdControl.value).toBeNull();
      expect(component.equipmentReferenceControl.value).toBeNull();
    });



    it('should auto-select reference when only one match exists', () => {
      component.equipmentTypeControl.setValue('CENTRIFUGE');
      component.allEquipIds.set([
        { equipId: 'CENT-001', equipReference: 'REF-ONLY', serviceDates: '01-JAN-2024' },
      ]);

      component.onEquipmentIdChange('CENT-001');

      expect(component.equipmentReferenceControl.value).toBe('REF-ONLY');
    });

    it('should load references when multiple matches exist', () => {
      component.equipmentTypeControl.setValue('CENTRIFUGE');
      component.allEquipIds.set([
        { equipId: 'CENT-001', equipReference: 'REF-A', serviceDates: '01-JAN-2024' },
        { equipId: 'CENT-001', equipReference: 'REF-B', serviceDates: '15-FEB-2024' },
      ]);

      component.onEquipmentIdChange('CENT-001');

      expect(service.getEquipmentReferences).toHaveBeenCalledWith('CENTRIFUGE', 'CENT-001');
    });



    it('should mark dirty on equipment type change after retrieve', () => {
      component.isRetrieved = true;

      component.onEquipmentTypeChange('CENTRIFUGE');

      expect(component.isDirtyAfterRetrieve).toBe(true);
    });

    it('should mark dirty on QC status change after retrieve', () => {
      component.isRetrieved = true;

      component.onQcStatusChange('PASS');

      expect(component.isDirtyAfterRetrieve).toBe(true);
    });

    it('should mark dirty on equipment reference change after retrieve', () => {
      component.isRetrieved = true;

      component.onEquipmentReferenceChange('REF-001');

      expect(component.isDirtyAfterRetrieve).toBe(true);
    });
  });

  describe('Dropdown Loading Errors', () => {
    it('should handle equipment types load failure', (done) => {
      service.getEquipmentTypes.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.ngOnInit();

      setTimeout(() => {
        expect(component.allEquipTypes()).toEqual([]);
        done();
      });
    });

    it('should handle equipment IDs load failure', (done) => {
      service.getEquipmentIds.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.onEquipmentTypeChange('CENTRIFUGE');

      setTimeout(() => {
        expect(component.allEquipIds()).toEqual([]);
        done();
      });
    });

    it('should handle equipment references load failure', () => {
      service.getEquipmentReferences.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.equipmentTypeControl.setValue('CENTRIFUGE');
      component.allEquipRefs.set([]);
      component.allEquipIds.set([
        { equipId: 'CENT-001', equipReference: 'REF-A', serviceDates: '01-JAN-2024' },
        { equipId: 'CENT-001', equipReference: 'REF-B', serviceDates: '15-FEB-2024' },
      ]);
      component.onEquipmentIdChange('CENT-001');

      expect(service.getEquipmentReferences).toHaveBeenCalledWith('CENTRIFUGE', 'CENT-001');
      expect(component.allEquipRefs()).toEqual([]);
    });

    it('should handle QC statuses load failure', (done) => {
      service.getQcStatuses.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.ngOnInit();

      setTimeout(() => {
        expect(component.allQcStatuses()).toEqual([]);
        done();
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onRetrieve();
    });

    it('should handle sort change with ascending direction', () => {
      const event: TableSortEvent = { column: 'equipType', direction: 'A' };

      component.onSortChange(event);

      expect(component.tableConfig.sortConfig?.column).toBe('equipType');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.requestState.sortColumn).toBe('EquipType');
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(service.getList).toHaveBeenCalled();
    });




  });



  describe('Date Validation', () => {
    it('should fail validation when end date is before start date', () => {
      fixture.detectChanges();
      component.startDateControl.setValue(moment('2024-12-31'));
      component.startDateControl.markAsTouched();
      component.endDateControl.setValue(moment('2024-01-01'));
      component.endDateControl.markAsTouched();

      component.onRetrieve();

      expect(component.getEndDateError()).toContain('End Date must be greater than or equal to Start Date');
      expect(service.getList).not.toHaveBeenCalled();
    });

    it('should pass validation when end date is after start date', () => {
      fixture.detectChanges();
      component.startDateControl.setValue(moment('2024-01-01'));
      component.endDateControl.setValue(moment('2024-12-31'));

      component.onRetrieve();

      expect(component.getStartDateError()).toBe('');
      expect(component.getEndDateError()).toBe('');
      expect(service.getList).toHaveBeenCalled();
    });

    it('should pass validation when no dates are set', () => {
      component.onRetrieve();

      expect(component.dateError).toBe('');
      expect(service.getList).toHaveBeenCalled();
    });
  });
  describe('Filtered Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return all equipment types when search is empty', () => {
      component.allEquipTypes.set(mockEquipTypes);
      component.equipTypeSearchCtrl.setValue('');

      const filtered = component.filteredEquipTypes();

      expect(filtered.length).toBe(2);
    });





    it('should filter equipment references by search text', () => {
      component.allEquipRefs.set(mockEquipRefs);
      component.equipRefSearchCtrl.setValue('REF-001');

      const filtered = component.filteredEquipRefs();

      expect(filtered.length).toBe(1);
    });
  });
});
