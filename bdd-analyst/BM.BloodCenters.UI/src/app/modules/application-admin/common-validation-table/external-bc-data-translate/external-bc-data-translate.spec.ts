import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ExternalBcDataTranslateComponent } from './external-bc-data-translate';
import { ExternalBcDataTranslateService } from './services/external-bc-data-translate.service';
import { NotificationService } from '@shared/services/notification.service';
import {
  ExternalBcDataTranslateModel,
  ExternalBcDataTranslateDropdownsResponse,
  CodeDescriptionOption
} from './models/external-bc-data-translate.model';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ExternalBcDataTranslateComponent', () => {
  let notificationServiceSpy: any;
  let serviceSpy: any;
  let component: ExternalBcDataTranslateComponent;
  let fixture: ComponentFixture<ExternalBcDataTranslateComponent>;
  let service: jasmine.SpyObj<ExternalBcDataTranslateService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
    sourceIds: [
      { code: 'VISTA', description: 'Vista System' },
      { code: 'LFTRK', description: 'LifeTrak' },
      { code: 'MEDIC', description: 'Medical System' }
    ],
    targetIds: [{ code: 'LFTRK', description: 'LifeTrak' }],
    sourceCodeTypes: [
      { code: 'TYPE1', description: 'Type One' },
      { code: 'TYPE2', description: 'Type Two' },
      { code: 'TYPE3', description: 'Type Three' }
    ],
    targetCodeTypes: [
      { code: 'TYPE3', description: 'Type Three' },
      { code: 'TYPE4', description: 'Type Four' }
    ],
    targetValues: ['VALUE1', 'VALUE2']
  };

  const mockData: ExternalBcDataTranslateModel[] = [
    {
      convRefValueId: 1,
      sourceId: 'VISTA',
      targetId: 'LFTRK',
      sourceCodeType: 'TYPE1',
      targetCodeType: 'TYPE2',
      sourceValue: 'VALUE1',
      targetValue: 'VALUE2',
      sourceColumn: 'COL1',
      effDate: '2024-01-01',
      termDate: null,
      convProcCall: '1'
    },
    {
      convRefValueId: 2,
      sourceId: 'MEDIC',
      targetId: 'LFTRK',
      sourceCodeType: 'TYPE2',
      targetCodeType: 'TYPE3',
      sourceValue: 'VALUE3',
      targetValue: 'VALUE4',
      sourceColumn: 'COL2',
      effDate: '2024-02-01',
      termDate: '2024-12-31',
      convProcCall: '2'
    }
  ];

  beforeEach(async () => {

    serviceSpy = jasmine.createSpyObj('ExternalBcDataTranslateService', [
      'getDropdowns',
      'getFilterDropdowns',
      'getExternalBcDataTranslate'
    ]);
    const translateSpy = createMockTranslateService();
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError',
      'showWarning',
      'showInfo'
    ]);
    const activatedRouteSpy = {
      snapshot: { queryParams: {} },
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [
        ExternalBcDataTranslateComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ExternalBcDataTranslateService, useValue: serviceSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    service = TestBed.inject(ExternalBcDataTranslateService) as jasmine.SpyObj<ExternalBcDataTranslateService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture = TestBed.createComponent(ExternalBcDataTranslateComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {

    it('should load main dropdowns on init but not filter dropdowns', () => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      fixture.detectChanges();

      expect(service.getDropdowns).toHaveBeenCalled();
      expect(service.getFilterDropdowns).not.toHaveBeenCalled();
      expect(component.sourceIdOptions).toEqual(mockDropdowns.sourceIds);
      expect(component.targetIdOptions).toEqual(mockDropdowns.targetIds);
    });

    it('should set up row actions', () => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      fixture.detectChanges();

      expect(component.tableConfig.rowActions?.length).toBeGreaterThan(0);
      expect(component.tableConfig.rowActions?.some(action => action.action === 'edit')).toBeTrue();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
    });

    it('should use "ALL" as default sourceId when not provided', fakeAsync(() => {
      service.getExternalBcDataTranslate.and.returnValue(of({
        data: mockData,
        totalRecords: 2
      }));

      component.sourceIdCtrl.setValue('');
      component.targetIdCtrl.setValue('LFTRK');
      fixture.detectChanges();

      component.loadData();
      tick();

      expect(service.getExternalBcDataTranslate).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        'ALL',
        'LFTRK',
        jasmine.any(Object)
      );
    }));

    it('should call loadData and loadFilterDropdowns when onRetrieve is called with valid target ID', () => {
      spyOn(component, 'loadData').and.stub();
      spyOn(component, 'loadFilterDropdowns').and.stub();
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');
      component.onRetrieve();

      expect(component.loadFilterDropdowns).toHaveBeenCalled();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should mark controls as touched and not load data when onRetrieve is called without required fields', () => {
      spyOn(component, 'loadData').and.stub();
      component.sourceIdCtrl.setValue('');
      component.targetIdCtrl.setValue('');
      component.onRetrieve();

      expect(component.sourceIdCtrl.touched).toBeTrue();
      expect(component.targetIdCtrl.touched).toBeTrue();
      expect(component.loadData).not.toHaveBeenCalled();
    });
  });

  describe('Filter Dropdowns Loading', () => {
    beforeEach(() => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      fixture.detectChanges();
    });

    it('should load filter dropdowns with selected Source ID and Target ID', fakeAsync(() => {
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');

      component.loadFilterDropdowns();
      tick();

      expect(service.getFilterDropdowns).toHaveBeenCalledWith('VISTA', 'LFTRK');
      expect(component.sourceCodeTypeOptions).toEqual(mockDropdowns.sourceCodeTypes);
      expect(component.targetCodeTypeOptions).toEqual(mockDropdowns.targetCodeTypes);
    }));

    it('should load filter dropdowns with ALL as sourceId when no source is selected', fakeAsync(() => {
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      component.sourceIdCtrl.setValue('');
      component.targetIdCtrl.setValue('LFTRK');

      component.loadFilterDropdowns();
      tick();

      expect(service.getFilterDropdowns).toHaveBeenCalledWith('ALL', 'LFTRK');
    }));

    it('should reload filter dropdowns when sourceId changes', fakeAsync(() => {
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      component.targetIdCtrl.setValue('LFTRK');

      // First call with VISTA
      component.sourceIdCtrl.setValue('VISTA');
      component.loadFilterDropdowns();
      tick();

      expect(service.getFilterDropdowns).toHaveBeenCalledWith('VISTA', 'LFTRK');

      // Second call with different sourceId
      component.sourceIdCtrl.setValue('MEDIC');
      component.loadFilterDropdowns();
      tick();

      expect(service.getFilterDropdowns).toHaveBeenCalledWith('MEDIC', 'LFTRK');
      expect(service.getFilterDropdowns).toHaveBeenCalledTimes(2);
    }));

    it('should reload filter dropdowns when targetId changes', fakeAsync(() => {
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      component.sourceIdCtrl.setValue('VISTA');

      // First call with LFTRK
      component.targetIdCtrl.setValue('LFTRK');
      component.loadFilterDropdowns();
      tick();

      expect(service.getFilterDropdowns).toHaveBeenCalledWith('VISTA', 'LFTRK');

      // Second call with different targetId
      component.targetIdCtrl.setValue('MEDIC');
      component.loadFilterDropdowns();
      tick();

      expect(service.getFilterDropdowns).toHaveBeenCalledWith('VISTA', 'MEDIC');
      expect(service.getFilterDropdowns).toHaveBeenCalledTimes(2);
    }));

    it('should clear filter dropdown options when target ID is empty', () => {
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('');
      component.sourceCodeTypeOptions = [{ code: 'DON', description: 'Donor' }, { code: 'PROD', description: 'Product' }];
      component.targetCodeTypeOptions = [{ code: 'DON', description: 'Donor' }, { code: 'UNIT', description: 'Unit' }];

      component.loadFilterDropdowns();

      expect(service.getFilterDropdowns).not.toHaveBeenCalled();
      // Options should remain unchanged when not loading
      expect(component.sourceCodeTypeOptions).toEqual([{ code: 'DON', description: 'Donor' }, { code: 'PROD', description: 'Product' }]);
      expect(component.targetCodeTypeOptions).toEqual([{ code: 'DON', description: 'Donor' }, { code: 'UNIT', description: 'Unit' }]);
    });

    it('should handle partial dropdown response with only source code types', fakeAsync(() => {
      const partialDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: [{ code: 'DON', description: 'Donor' }, { code: 'PROD', description: 'Product' }],
        targetCodeTypes: [],
        targetValues: []
      };

      service.getFilterDropdowns.and.returnValue(of(partialDropdowns));
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');

      component.loadFilterDropdowns();
      tick();

      expect(component.sourceCodeTypeOptions).toEqual([{ code: 'DON', description: 'Donor' }, { code: 'PROD', description: 'Product' }]);
      expect(component.targetCodeTypeOptions).toEqual([]);
    }));

    it('should handle partial dropdown response with only target code types', fakeAsync(() => {
      const partialDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: [],
        targetCodeTypes: [{ code: 'DON', description: 'Donor' }, { code: 'UNIT', description: 'Unit' }],
        targetValues: []
      };

      service.getFilterDropdowns.and.returnValue(of(partialDropdowns));
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');

      component.loadFilterDropdowns();
      tick();

      expect(component.sourceCodeTypeOptions).toEqual([]);
      expect(component.targetCodeTypeOptions).toEqual([{ code: 'DON', description: 'Donor' }, { code: 'UNIT', description: 'Unit' }]);
    }));


  });

  describe('Pagination', () => {
    beforeEach(() => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      service.getExternalBcDataTranslate.and.returnValue(of({ data: mockData, totalRecords: 100 }));
      fixture.detectChanges();
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');
    });


    it('should reset to first page when page size changes', () => {
      spyOn(component, 'loadData');
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }

      const pageEvent: TablePageEvent = {
        pageIndex: 0,
        pageSize: 50,
        previousPageIndex: 5
      };

      component.onPageChange(pageEvent);

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Side Panel - Add/Edit', () => {
    beforeEach(() => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      fixture.detectChanges();
    });

    it('should open side panel for adding new record', () => {
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');
      component.createRecord();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData?.sourceId).toBe('VISTA');
      expect(component.sidePanelData?.targetId).toBe('LFTRK');
    });

    it('should open side panel for editing record', () => {
      const record = mockData[0];
      component.editRecord(record);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(record);
    });

    it('should handle edit action from table row', () => {
      spyOn(component, 'editRecord');
      const event: TableRowActionEvent<ExternalBcDataTranslateModel> = {
        action: 'edit',
        row: mockData[0]
      };

      component.onRowAction(event);

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      service.getExternalBcDataTranslate.and.returnValue(of({ data: mockData, totalRecords: 2 }));
      fixture.detectChanges();
      component.sourceIdCtrl.setValue('VISTA');
      component.targetIdCtrl.setValue('LFTRK');
    });

    it('should apply filters and load data', () => {
      spyOn(component, 'loadData');
      const filters = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.isFilterOpen).toBeFalse();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should create filter chips when filters are applied', () => {
      const filters = {
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

  });

  describe('Component Lifecycle', () => {
    it('should cleanup on destroy', () => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      fixture.detectChanges();

      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      service.getDropdowns.and.returnValue(of(mockDropdowns));
      service.getFilterDropdowns.and.returnValue(of(mockDropdowns));
      fixture.detectChanges();
    });

    it('should handle undefined row action', () => {
      const event: TableRowActionEvent<ExternalBcDataTranslateModel> = {
        action: 'unknown',
        row: mockData[0]
      };

      expect(() => component.onRowAction(event)).not.toThrow();
    });

    it('should handle empty filter application', () => {
      spyOn(component, 'loadData');
      const filters = {
        sourceId: null,
        targetId: null
      };
      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBe(0);
    });

    it('should handle removing non-existent filter chip', () => {
      spyOn(component, 'loadData');
      component.appliedFilters = {
        sourceId: null,
        targetId: null
      };

      expect(() => component.removeFilterChip('nonExistent')).not.toThrow();
    });
  });
});
