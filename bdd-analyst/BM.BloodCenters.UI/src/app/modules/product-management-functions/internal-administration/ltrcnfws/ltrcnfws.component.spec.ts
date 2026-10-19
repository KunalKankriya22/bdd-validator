import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LtrcnfwsComponent } from './ltrcnfws.component';
import { AttributeServiceCodeApiService } from './services/attribute-service-code-api.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  AttributeServiceCodeModel,
  AttributeGroupDropdownDto
} from './models/attribute-service-code.model';

describe('LtrcnfwsComponent', () => {
  let component: LtrcnfwsComponent;
  let fixture: ComponentFixture<LtrcnfwsComponent>;
  let apiServiceSpy: jasmine.SpyObj<AttributeServiceCodeApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;

  const mockData: AttributeServiceCodeModel[] = [
    {
      attribGroup: 'BLOOD',
      attribCode: '1234',
      attribDesc: 'RED BLOOD CELLS | AS3/450mL/refq | Open',
      attribCustom: 'Y',
      normalStockFlag: 'N',
      price: 125.50,
      serviceCode: 'SVC001',
      creditFlag: 'Y',
      lastModifiedDate: '2026-05-30T10:30:00Z',
      programId: 'SFIATTR',
      uniqueRowId: 'BLOOD-1234-0'
    },
    {
      attribGroup: 'BLOOD',
      attribCode: '420',
      attribDesc: 'RED BLOOD CELLS | AS3/450mL/refq | Open',
      attribCustom: 'Y',
      normalStockFlag: 'N',
      price: 150.00,
      serviceCode: 'SVC002',
      creditFlag: 'N',
      lastModifiedDate: '2026-05-29T14:15:00Z',
      programId: 'SFIATTR',
      uniqueRowId: 'BLOOD-420-1'
    }
  ];

  const mockGroups: AttributeGroupDropdownDto[] = [
    { code: 'BLOOD', description: 'Blood Product Attributes' },
    { code: 'LAB', description: 'Laboratory Attributes' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('AttributeServiceCodeApiService', [
      'getAttributeServiceCodes',
      'getAttributeGroupsDropdown'
    ]);
    snackBarSpy = createMockMatSnackBar();
    headerServiceSpy = createMockHeaderService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', [
      'getMenuItemsSignal',
      'findMenuItemByPath'
    ]);

    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));

    apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));
    apiServiceSpy.getAttributeServiceCodes.and.returnValue(of({ data: [], totalCount: 0 }));



      TestBed.configureTestingModule({
      imports: [LtrcnfwsComponent, NoopAnimationsModule],
      providers: [
        { provide: AttributeServiceCodeApiService, useValue: apiServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy }
      ]
    });


    


      apiServiceSpy.getAttributeServiceCodes.calls.reset();


      apiServiceSpy.getAttributeGroupsDropdown.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      menuServiceSpy.getMenuItemsSignal.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));


      apiServiceSpy.getAttributeServiceCodes.and.returnValue(of({ data: [], totalCount: 0 }));


    fixture = TestBed.createComponent(LtrcnfwsComponent);
    component = fixture.componentInstance;

    snackBarSpy = (component as any).snackBar;
    spyOn(snackBarSpy, 'open').and.callThrough();


    });

  describe('Component Initialization', () => {


    it('should load attribute groups on init', fakeAsync(() => {
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));

      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getAttributeGroupsDropdown).toHaveBeenCalled();
      expect(component.attributeGroupOptions).toEqual(mockGroups);
      expect(component.filteredAttributeGroups).toEqual(mockGroups);
    }));




  });

  describe('Data Loading', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));
    });





    it('should set loading state during data fetch', fakeAsync(() => {
      const subject = new Subject<{ data: AttributeServiceCodeModel[]; totalCount: number }>();
      apiServiceSpy.getAttributeServiceCodes.and.returnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(false);

      component.loadData();
      expect(component.isLoading).toBe(true);

      subject.next({ data: mockData, totalCount: 2 });
      subject.complete();
      tick();
      expect(component.isLoading).toBe(false);
    }));
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeServiceCodes.and.returnValue(
        of({ data: mockData, totalCount: 2 })
      );
      fixture.detectChanges();
    });

    it('should filter by attribute group', fakeAsync(() => {
      component.attributeGroupControl.setValue('BLOOD');
      component.onAttributeGroupChange();
      tick();

      expect(component.requestState.attributeGroup).toBe('BLOOD');
      expect(apiServiceSpy.getAttributeServiceCodes).toHaveBeenCalled();
    }));

    it('should reset page index when changing attribute group', () => {
      component.tableConfig.pagination!.pageIndex = 2;

      component.attributeGroupControl.setValue('LAB');
      component.onAttributeGroupChange();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });




  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeServiceCodes.and.returnValue(
        of({ data: mockData, totalCount: 2 })
      );
      fixture.detectChanges();
    });

    it('should trigger search via onSearch', fakeAsync(() => {
      component.onSearch('test');
      tick();

      expect(component.requestState.searchKeyword).toBe('test');
      expect(apiServiceSpy.getAttributeServiceCodes).toHaveBeenCalled();
    }));




  });

  describe('Pagination', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeServiceCodes.and.returnValue(
        of({ data: mockData, totalCount: 100 })
      );
      fixture.detectChanges();
    });



    it('should calculate correct skip value', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();
      tick();

      expect(apiServiceSpy.getAttributeServiceCodes).toHaveBeenCalledWith(
        10,
        20,
        jasmine.any(Object)
      );
    }));
  });

  describe('Sorting', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeServiceCodes.and.returnValue(
        of({ data: mockData, totalCount: 2 })
      );
      fixture.detectChanges();
    });



    it('should reset page index when sorting', () => {
      component.tableConfig.pagination!.pageIndex = 2;

      component.onSortChange({ column: 'attribDesc', direction: 'D' });

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });



  describe('Table Columns', () => {
    it('should have all required columns', () => {
      const columns = component.tableConfig.columns;
      const columnKeys = columns.map(col => col.key);

      expect(columnKeys).toContain('attribCode');
      expect(columnKeys).toContain('attribDesc');
      expect(columnKeys).toContain('attribCustom');
      expect(columnKeys).toContain('normalStockFlag');
      expect(columnKeys).toContain('price');
      expect(columnKeys).toContain('serviceCode');
      expect(columnKeys).toContain('creditFlag');
    });

    it('should display Code column', () => {
      const codeColumn = component.tableConfig.columns.find(col => col.key === 'attribCode');
      expect(codeColumn).toBeDefined();
      expect(codeColumn?.header).toBe('Code');
      expect(codeColumn?.sortable).toBe(false);
    });

    it('should display Special Order column', () => {
      const column = component.tableConfig.columns.find(col => col.key === 'attribCustom');
      expect(column).toBeDefined();
      expect(column?.header).toBe('Special Order');
    });

    it('should display Normal Stock Status column', () => {
      const column = component.tableConfig.columns.find(col => col.key === 'normalStockFlag');
      expect(column).toBeDefined();
      expect(column?.header).toBe('Normal Stock Status');
    });

    it('should display Credit Allowed column', () => {
      const column = component.tableConfig.columns.find(col => col.key === 'creditFlag');
      expect(column).toBeDefined();
      expect(column?.header).toBe('Credit Allowed');
    });

    it('should format price without dollar sign', () => {
      const priceColumn = component.tableConfig.columns.find(col => col.key === 'price');
      expect(priceColumn?.valueFormatter).toBeDefined();

      if (priceColumn?.valueFormatter) {
        expect(priceColumn.valueFormatter(125.50, mockData[0])).toBe('125.50');
        expect(priceColumn.valueFormatter(null, mockData[0])).toBe('');
      }
    });

    it('should format Y/N values as Yes/No', () => {
      const specialOrderCol = component.tableConfig.columns.find(col => col.key === 'attribCustom');
      const creditCol = component.tableConfig.columns.find(col => col.key === 'creditFlag');
      const normalStockCol = component.tableConfig.columns.find(col => col.key === 'normalStockFlag');

      expect(specialOrderCol?.valueFormatter?.('Y', mockData[0])).toBe('Yes');
      expect(specialOrderCol?.valueFormatter?.('N', mockData[0])).toBe('No');
      expect(creditCol?.valueFormatter?.('Y', mockData[0])).toBe('Yes');
      expect(creditCol?.valueFormatter?.('N', mockData[0])).toBe('No');
      expect(normalStockCol?.valueFormatter?.('Y', mockData[0])).toBe('Yes');
      expect(normalStockCol?.valueFormatter?.('N', mockData[0])).toBe('No');
    });
  });

  describe('Row Actions', () => {


    it('should execute edit action via onRowAction', () => {
      spyOn(component, 'openEditPanel');

      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.openEditPanel).toHaveBeenCalledWith(mockData[0]);
    });
  });

  describe('Error Handling', () => {
    it('should show error on attribute groups load failure', fakeAsync(() => {
      const error = { message: 'Failed to load groups' };
      apiServiceSpy.getAttributeGroupsDropdown.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to load attribute groups',
        'Close',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));
  });

  describe('Multiple Instances', () => {


    it('should generate unique element IDs across instances', () => {
      const fixture2 = TestBed.createComponent(LtrcnfwsComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).elementId('attr-group')).not.toBe((component2 as any).elementId('attr-group'));
    });
  });
});
