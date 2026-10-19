import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { GenerateOutdatesPicklist } from './generate-outdates-picklist';
import { GenerateOutdatesPicklistService } from './services/generate-outdates-picklist.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { LoginService } from '@shared/services/login.service';
import { provideCommonTestMocks } from '@shared/testing/page-header-service.mock';
import { OutdatesSummaryItem, OutdatesDetailItem } from './models/generate-outdates-picklist.model';

import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('GenerateOutdatesPicklist', () => {
  let menuServiceSpy: any;
  let headerServiceSpy: any;
  let loginServiceSpy: any;
  let serviceSpy: any;
  let component: GenerateOutdatesPicklist;
  let fixture: ComponentFixture<GenerateOutdatesPicklist>;
  let service: jasmine.SpyObj<GenerateOutdatesPicklistService>;
  let chapterChanged$: Subject<void>;

  const mockSummaryItems: OutdatesSummaryItem[] = [
    { productType: 'PLT', bloodType: '11', bloodTypeDescription: 'A Pos', quantity: 11 },
    { productType: 'RBC', bloodType: '52', bloodTypeDescription: 'B Pos Manual Off', quantity: 12 },
    { productType: 'CRYO', bloodType: '77', bloodTypeDescription: 'B Group', quantity: 5 }
  ];

  const mockSummaryResponse = { success: true, data: mockSummaryItems, totalCount: 28 };

  const mockDetailItems: OutdatesDetailItem[] = [
    { unitId: 'W633317070126', chkDigit: 'B', productCode: 'E2807V00', expirationDate: '2018-01-22T23:00:00', locationId: 'HR052200114', inventoryClass: 'RB' },
    { unitId: 'W633317070127', chkDigit: 'C', productCode: 'E2807V00', expirationDate: '2018-01-23T23:00:00', locationId: 'HR052200115', inventoryClass: 'RB' }
  ];

  const mockDetailResponse = { success: true, data: mockDetailItems };

  const mockInventoryClasses = {
    success: true,
    data: [
      { code: 'RB', description: 'Regular Blood' },
      { code: 'AU', description: 'Autologous' }
    ]
  };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('GenerateOutdatesPicklistService', [
      'getSummary', 'getDetails', 'getInventoryClasses', 'commitOutdates',
      'getReportStatus', 'getReportUrl', 'pollReportUntilComplete'
    ]);
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');
    headerServiceSpy = createMockHeaderService();
    headerServiceSpy.chapterChanged$ = chapterChanged$.asObservable();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(null);

    const chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [], {
      chapterLocalDate: signal(moment())
    });

    serviceSpy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    serviceSpy.getSummary.and.returnValue(of(mockSummaryResponse));
    serviceSpy.getDetails.and.returnValue(of(mockDetailResponse));
    serviceSpy.commitOutdates.and.returnValue(of({
      success: true,
      data: { pickSlipId: 'PS-001', orderNo: 'ORD-001', productCount: 28 }
    }));



      TestBed.configureTestingModule({
      imports: [GenerateOutdatesPicklist],
      providers: [
        { provide: GenerateOutdatesPicklistService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        ...provideCommonTestMocks()
      ]
    });


    


      serviceSpy.getSummary.calls.reset();


      serviceSpy.getDetails.calls.reset();


      serviceSpy.getInventoryClasses.calls.reset();


      serviceSpy.commitOutdates.calls.reset();


      serviceSpy.getReportStatus.calls.reset();


      serviceSpy.getReportUrl.calls.reset();


      serviceSpy.pollReportUntilComplete.calls.reset();


      loginServiceSpy.getStoredUsername.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      headerServiceSpy.getCurrentChapterTimezone.calls.reset();


      menuServiceSpy.getMenuItemsSignal.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      menuServiceSpy.findMenuItemByPath.and.returnValue(null);


      serviceSpy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));


      serviceSpy.getSummary.and.returnValue(of(mockSummaryResponse));


      serviceSpy.getDetails.and.returnValue(of(mockDetailResponse));


      serviceSpy.commitOutdates.and.returnValue(of({
    }));


    service = TestBed.inject(GenerateOutdatesPicklistService) as jasmine.SpyObj<GenerateOutdatesPicklistService>;
    fixture = TestBed.createComponent(GenerateOutdatesPicklist);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize search form with outdateAsOf and inventoryClass', () => {
      expect(component.searchForm.get('outdateAsOf')).toBeTruthy();
      expect(component.searchForm.get('inventoryClass')).toBeTruthy();
    });

    it('should load inventory classes on init', () => {
      expect(service.getInventoryClasses).toHaveBeenCalled();
      expect(component['inventoryClasses']().length).toBe(2);
    });







    it('should have no selected summary row initially', () => {
      expect(component['selectedSummaryRow']()).toBeNull();
    });

    it('should not be able to print initially', () => {
      expect(component['canPrint']()).toBe(false);
    });

    it('should compute maxDate from chapter timezone service', () => {
      const maxDate = component['maxDate']();
      expect(maxDate).toBeTruthy();
      expect(moment.isMoment(maxDate)).toBe(true);
    });

    it('should update headerConfig when menu items are present', () => {
      const menuItem = {
        label: 'Generate Outdates Picklist',
        path: '/product-management-functions/inventory-management/product-management/generate-outdates-picklist',
        remarks: 'Some subtitle'
      };
      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([menuItem]));
      menuServiceSpy.findMenuItemByPath.and.returnValue(menuItem);

      const newFixture = TestBed.createComponent(GenerateOutdatesPicklist);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.headerConfig.title).toBe('Generate Outdates Picklist');
      expect(newComponent.headerConfig.subtitle).toBe('Some subtitle');
      expect(newComponent.headerConfig.breadcrumbs.length).toBe(2);
      expect(newComponent.headerConfig.breadcrumbs[1].label).toBe('Generate Outdates Picklist');
      expect(newComponent.headerConfig.breadcrumbs[1].link).toBeNull();

      newFixture.destroy();
    });

    it('should use subtitle when remarks is absent on menu item', () => {
      const menuItem = {
        label: 'Generate Outdates Picklist',
        path: '/some/path',
        subtitle: 'Subtitle text'
      };
      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([menuItem]));
      menuServiceSpy.findMenuItemByPath.and.returnValue(menuItem);

      const newFixture = TestBed.createComponent(GenerateOutdatesPicklist);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.headerConfig.subtitle).toBe('Subtitle text');

      newFixture.destroy();
    });

    it('should not update headerConfig when findMenuItemByPath returns null', () => {
      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([{ label: 'Some Item' }]));
      menuServiceSpy.findMenuItemByPath.and.returnValue(null);

      const newFixture = TestBed.createComponent(GenerateOutdatesPicklist);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.headerConfig.title).toBe('');

      newFixture.destroy();
    });

    it('should set inventoryClasses to empty array when getInventoryClasses fails', fakeAsync(() => {
      service.getInventoryClasses.and.returnValue(throwError(() => new Error('Load failed')));
      component['loadInventoryClasses']();
      tick();
      expect(component['inventoryClasses']()).toEqual([]);
    }));

    it('should return true for canPrint when summaryData has items and not printing', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();
      expect(component['canPrint']()).toBe(true);
    }));
  });

  describe('Chapter Changes', () => {
    it('should clear all state and reload inventory classes when chapter changes', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();
      expect(component['summaryData']().length).toBeGreaterThan(0);

      const callsBefore = service.getInventoryClasses.calls.count();

      chapterChanged$.next();
      tick();

      expect(component['summaryData']()).toEqual([]);
      expect(component['hasSearched']()).toBe(false);
      expect(component['detailData']()).toEqual([]);
      expect(service.getInventoryClasses.calls.count()).toBeGreaterThan(callsBefore);
    }));
  });

  describe('Form Validation', () => {
    it('should require outdateAsOf', () => {
      component.searchForm.get('outdateAsOf')?.setValue(null);
      expect(component.searchForm.get('outdateAsOf')?.hasError('required')).toBe(true);
    });








  });

  describe('Search (getSummary)', () => {
    it('should call getSummary with correct request', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(service.getSummary).toHaveBeenCalled();
      const request = service.getSummary.calls.mostRecent().args[0];
      expect(request.outdateAsOf).toBeTruthy();
    }));



    it('should use totalCount from API response', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(component['totalOutdates']()).toBe(28);
    }));





    it('should set hasSearched to true after search', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(component['hasSearched']()).toBe(true);
    }));

    it('should show split view after successful search with results', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(component['showSplitView']()).toBe(true);
    }));

    it('should include inventoryClass in request when selected', fakeAsync(() => {
      component.searchForm.patchValue({
        outdateAsOf: moment('2018-03-13'),
        inventoryClass: 'RB'
      });
      component.onSearch();
      tick();

      const request = service.getSummary.calls.mostRecent().args[0];
      expect(request.inventoryClass).toBe('RB');
    }));



    it('should handle search API error', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.getSummary.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(component['loading']()).toBe(false);
      expect(component['summaryData']().length).toBe(0);
      expect(snackBarSpy).toHaveBeenCalled();
    }));

    it('should show "No units are out of date" snackbar when getSummary returns empty list', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.getSummary.and.returnValue(of({ success: true, data: [], totalCount: 0 }));

      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'No units are out of date',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component['summaryData']()).toEqual([]);
      expect(component['hasSearched']()).toBe(true);
    }));

    it('should show fallback error message when error has no message property', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.getSummary.and.returnValue(throwError(() => ({})));

      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to search outdated products',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should not call getSummary when form is invalid', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: null });
      service.getSummary.calls.reset();

      component.onSearch();
      tick();

      expect(service.getSummary).not.toHaveBeenCalled();
    }));

  });

  describe('Summary Row Selection (getDetails)', () => {
    beforeEach(fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();
    }));







    it('should call getDetails with no sort params on row click (backend default order)', fakeAsync(() => {
      service.getDetails.calls.reset();
      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();

      const request = service.getDetails.calls.mostRecent().args[0];
      expect(request.sortColumn).toBeUndefined();
      expect(request.sortOrder).toBeUndefined();
    }));



    it('should set selectedSummaryRow', fakeAsync(() => {
      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();

      expect(component['selectedSummaryRow']()).toEqual(mockSummaryItems[0]);
    }));





    it('should handle detail API error', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.getDetails.and.returnValue(throwError(() => new Error('Detail error')));

      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();

      expect(component['loadingDetails']()).toBe(false);
      expect(component['detailData']().length).toBe(0);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load detail data',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });


  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13'), inventoryClass: 'RB' });
      component.onSearch();
      tick();
      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();
    }));



    it('should hide split view after clear', () => {
      component.onClearAll();
      expect(component['showSplitView']()).toBe(false);
    });

    it('should reset all state signals to initial values after onClearAll', fakeAsync(() => {
      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();

      component.onClearAll();

      expect(component['summaryData']()).toEqual([]);
      expect(component['detailData']()).toEqual([]);
      expect(component['totalOutdates']()).toBe(0);
      expect(component['selectedSummaryRow']()).toBeNull();
      expect(component['hasSearched']()).toBe(false);
      expect(component['loading']()).toBe(false);
      expect(component['loadingDetails']()).toBe(false);
    }));

  });




  describe('Commit Outdates (Print Pick Slip)', () => {
    beforeEach(fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();
    }));

    it('should call commitOutdates when print pick slip is clicked', fakeAsync(() => {
      component.onPrintPickSlip();
      tick();

      expect(service.commitOutdates).toHaveBeenCalled();
      const request = service.commitOutdates.calls.mostRecent().args[0];
      expect(request.outdateAsOf).toBeTruthy();
    }));



    it('should start polling when report status is QUEUED', fakeAsync(() => {
      service.commitOutdates.and.returnValue(of({
        success: true,
        data: {
          pickSlipId: 'PS-002', orderNo: 'ORD-002', productCount: 5,
          reportParmId: 'USER_061926_1', reportJobId: '100', reportStatus: 'QUEUED'
        }
      }));
      service.pollReportUntilComplete.and.returnValue(of({ item: { statusCode: 'C' } }));
      service.getReportUrl.and.returnValue(of({
        success: true,
        item: { fileName: 'SCROUTDT_100_USER.pdf' }
      }));
      spyOn(window, 'open');

      component.onPrintPickSlip();
      tick();

      expect(service.pollReportUntilComplete).toHaveBeenCalledWith('SCROUTDT', 'USER_061926_1');
      expect(service.getReportUrl).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith('/reports/SCROUTDT_100_USER.pdf', '_blank');
      expect(component['isPrinting']()).toBe(false);
    }));

    it('should handle report timeout gracefully', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(of({
        success: true,
        data: {
          pickSlipId: 'PS-003', orderNo: 'ORD-003', productCount: 2,
          reportParmId: 'USER_061926_2', reportJobId: '101', reportStatus: 'QUEUED'
        }
      }));
      service.pollReportUntilComplete.and.returnValue(of({ item: { statusCode: 'S' } }));

      component.onPrintPickSlip();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('timed out'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component['isPrinting']()).toBe(false);
    }));

    it('should show report failed message with details', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(of({
        success: true,
        data: {
          pickSlipId: 'PS-004', orderNo: 'ORD-004', productCount: 1,
          reportStatus: 'FAILED', reportMessage: 'Report not found'
        }
      }));

      component.onPrintPickSlip();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Report not found'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component['isPrinting']()).toBe(false);
    }));

    it('should include inventoryClass in commit request when selected', fakeAsync(() => {
      component.searchForm.patchValue({ inventoryClass: 'RB' });

      component.onPrintPickSlip();
      tick();

      const request = service.commitOutdates.calls.mostRecent().args[0];
      expect(request.inventoryClass).toBe('RB');
    }));

    it('should handle commit error', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(throwError(() => ({ error: { message: 'Commit failed' } })));

      component.onPrintPickSlip();
      tick();

      expect(component['isPrinting']()).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Commit failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should not call commitOutdates when outdateAsOf is null', fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: null });
      service.commitOutdates.calls.reset();

      component.onPrintPickSlip();
      tick();

      expect(service.commitOutdates).not.toHaveBeenCalled();
    }));

    it('should show QUEUED snackbar message while report is generating', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(of({
        success: true,
        data: {
          pickSlipId: 'PS-010',
          orderNo: 'ORD-010',
          productCount: 5,
          reportParmId: 'USER_061926_10',
          reportJobId: '200',
          reportStatus: 'QUEUED'
        }
      }));
      service.pollReportUntilComplete.and.returnValue(of({ item: { statusCode: 'C' } }));
      service.getReportUrl.and.returnValue(of({ item: { fileName: 'test.pdf' } }));
      spyOn(window, 'open');

      component.onPrintPickSlip();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Pick slip PS-010 created — Generating report...',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should show success message with product count when response is not QUEUED status', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(of({
        success: true,
        data: { pickSlipId: 'PS-020', orderNo: 'ORD-020', productCount: 7 }
      }));

      component.onPrintPickSlip();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Pick slip PS-020 created — 7 product(s) committed (Order: ORD-020)',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component['isPrinting']()).toBe(false);
    }));

    it('should show "Outdates committed successfully" when response has no data or item', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(of({ success: true }));

      component.onPrintPickSlip();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Outdates committed successfully',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component['isPrinting']()).toBe(false);
    }));

    it('should handle commit error with fallback message when no error message', fakeAsync(() => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      service.commitOutdates.and.returnValue(throwError(() => ({})));

      component.onPrintPickSlip();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to commit outdated products',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component['isPrinting']()).toBe(false);
    }));

  });

  describe('Table Configuration', () => {
    it('should configure summary table with 3 columns, no pagination, and default sort', () => {
      expect(component.summaryTableConfig.columns.length).toBe(3);
      expect(component.summaryTableConfig.columns[0].key).toBe('productType');
      expect(component.summaryTableConfig.columns[1].key).toBe('bloodTypeDescription');
      expect(component.summaryTableConfig.columns[2].key).toBe('quantity');
      expect(component.summaryTableConfig.showPagination).toBe(false);
      expect(component.summaryTableConfig.enableRowHighlight).toBe(true);
      expect(component.summaryTableConfig.sortConfig).toBeUndefined();
    });







    it('should format unitId with chkDigit in detail table', () => {
      const unitIdCol = component.detailTableConfig.columns.find(c => c.key === 'unitId');
      const row: OutdatesDetailItem = { unitId: 'W633317070126', chkDigit: 'B', productCode: 'E2807V00', expirationDate: '', locationId: '', inventoryClass: '' };
      expect(unitIdCol?.valueFormatter?.('W633317070126', row)).toBe('W633317070126-B');
    });

    it('should return unitId without chkDigit when chkDigit is absent', () => {
      const unitIdCol = component.detailTableConfig.columns.find(c => c.key === 'unitId');
      const row: OutdatesDetailItem = { unitId: 'W633317070126', productCode: 'E2807V00', expirationDate: '', locationId: '', inventoryClass: '' };
      expect(unitIdCol?.valueFormatter?.('W633317070126', row)).toBe('W633317070126');
    });

    it('should format expiration date using formatDateTime in detail table', () => {
      const expirationCol = component.detailTableConfig.columns.find(c => c.key === 'expirationDate');
      const result = expirationCol?.valueFormatter?.('2018-01-22T23:00:00', {} as OutdatesDetailItem);
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });
  });

  describe('Sort Operations', () => {
    beforeEach(fakeAsync(() => {
      component.searchForm.patchValue({ outdateAsOf: moment('2018-03-13') });
      component.onSearch();
      tick();
    }));

    it('should call getSummary with sortColumn productType and sortOrder ASC when direction is A', () => {
      service.getSummary.calls.reset();
      component.onSummarySortChange({ column: 'productType', direction: 'A' });

      expect(component.summaryTableConfig.sortConfig).toEqual({ column: 'productType', direction: 'A' });
      const request = service.getSummary.calls.mostRecent().args[0];
      expect(request.sortColumn).toBe('productType');
      expect(request.sortOrder).toBe('ASC');
    });

    it('should call getSummary with sortColumn productType and sortOrder DESC when direction is D', () => {
      service.getSummary.calls.reset();
      component.onSummarySortChange({ column: 'productType', direction: 'D' });

      expect(component.summaryTableConfig.sortConfig).toEqual({ column: 'productType', direction: 'D' });
      const request = service.getSummary.calls.mostRecent().args[0];
      expect(request.sortColumn).toBe('productType');
      expect(request.sortOrder).toBe('DESC');
    });

    it('should sort detailData ascending by unitId when direction is A', fakeAsync(() => {
      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();

      service.getDetails.calls.reset();
      component.onDetailSortChange({ column: 'unitId', direction: 'A' });
      tick();

      expect(component.detailTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
      const request = service.getDetails.calls.mostRecent().args[0];
      expect(request.sortColumn).toBe('unitId');
      expect(request.sortOrder).toBe('ASC');
    }));

    it('should sort detailData descending by unitId when direction is D', fakeAsync(() => {
      component.onSummaryRowClick(mockSummaryItems[0]);
      tick();

      service.getDetails.calls.reset();
      component.onDetailSortChange({ column: 'unitId', direction: 'D' });
      tick();

      expect(component.detailTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
      const request = service.getDetails.calls.mostRecent().args[0];
      expect(request.sortColumn).toBe('unitId');
      expect(request.sortOrder).toBe('DESC');
    }));
  });

  describe('formatDateTime (private)', () => {
    it('should format a valid ISO date string to DD-MMM-YYYY HH:mm uppercase', () => {
      const result = component['formatDateTime']('2018-01-22T23:00:00');
      expect(result).toBe('22-JAN-2018 23:00');
    });

    it('should return empty string for empty input', () => {
      expect(component['formatDateTime']('')).toBe('');
    });

    it('should return the original value when the date is invalid', () => {
      const invalidDate = 'not-a-valid-date-string-xyz';
      const m = moment(invalidDate);
      if (!m.isValid()) {
        expect(component['formatDateTime'](invalidDate)).toBe(invalidDate);
      } else {
        // moment parsed it; just verify a non-empty string is returned
        expect(component['formatDateTime'](invalidDate)).toBeTruthy();
      }
    });
  });
});
