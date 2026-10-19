import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { ValidFacilityIdentifiersComponent } from './valid-facility-identifiers';
import { ValidFacilityIdentifiersService } from './services/valid-facility-identifiers.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { Router, NavigationEnd } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ValidFacilityIdentifiersComponent', () => {
  let component: ValidFacilityIdentifiersComponent;
  let fixture: ComponentFixture<ValidFacilityIdentifiersComponent>;
  let mockService: jasmine.SpyObj<ValidFacilityIdentifiersService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ValidFacilityIdentifiersService', [
      'getValidFacilityIdentifiers',
      'addFacilityIdentifier',
      'updateFacilityIdentifier',
      'getChapterIds'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    mockDialog = createMockMatDialog();

    // Mock PageHeaderService with signal
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal(null)
    });



      TestBed.configureTestingModule({
      imports: [
        ValidFacilityIdentifiersComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ValidFacilityIdentifiersService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });


    


      mockService.getValidFacilityIdentifiers.calls.reset();


      mockService.addFacilityIdentifier.calls.reset();


      mockService.updateFacilityIdentifier.calls.reset();


      mockService.getChapterIds.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


    fixture = TestBed.createComponent(ValidFacilityIdentifiersComponent);
    component = fixture.componentInstance;


    });


  it('should initialize configurations on construction', () => {
    expect(component.headerConfig).toBeDefined();
    expect(component.headerConfig.title).toBe('');
    expect(component.headerConfig.subtitle).toBe('');
    expect(component.headerConfig.breadcrumbs.length).toBe(1);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
    expect(component.searchConfig).toBeDefined();
    expect(component.tableConfig).toBeDefined();
  });









  it('should format date values correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component['formatDate'](date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('JAN');
    expect(formatted).toContain('2024');
  });



  it('should format date from string', () => {
    const dateString = '2024-01-15T00:00:00.000Z';
    const formatted = component['formatDate'](dateString);
    expect(formatted).toContain('15');
    expect(formatted).toContain('JAN');
    expect(formatted).toContain('2024');
  });

  it('should handle empty search', () => {
    mockService.getValidFacilityIdentifiers.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    component.onSearch('');

    expect(component.requestState.searchKeyword).toBeUndefined();
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
  });



  describe('Sort functionality', () => {
    beforeEach(() => {
      mockService.getValidFacilityIdentifiers.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should handle ascending sort', () => {
      component.onSortChange({ column: 'chapterId', direction: 'A' });

      expect(component.requestState.sort).toBe('A');
      expect(component.tableConfig.sortConfig?.column).toBe('chapterId');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should handle descending sort', () => {
      component.onSortChange({ column: 'chapterId', direction: 'D' });

      expect(component.requestState.sort).toBe('D');
      expect(component.tableConfig.sortConfig?.column).toBe('chapterId');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should handle default sort (no sort)', () => {
      component.requestState.sort = 'A';
      component.onSortChange({ column: 'chapterId', direction: 'default' });

      expect(component.requestState.sort).toBeUndefined();
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });


  });

  describe('Row actions', () => {
    const mockRow = {
      chapterId: 'AB12',
      facilityIdentifier: 'A1234',
      effDate: new Date(),
      termDate: null
    };

    it('should open edit dialog on edit action', () => {
      component.onRowAction({ action: 'edit', row: mockRow });

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any)?.mode).toBe('edit');
      expect((dialogConfig?.data as any)?.data).toBe(mockRow);
    });
  });

  describe('Dialog management', () => {
    it('should open add dialog with correct config', () => {
      component.createRecord();

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any)?.mode).toBe('add');
      expect(dialogConfig?.hasBackdrop).toBe(false);
      expect(dialogConfig?.position?.right).toBe('0');
    });

    it('should open edit dialog with correct config', () => {
      const mockRecord = {
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effDate: new Date(),
        termDate: null
      };

      component.editRecord(mockRecord);

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any)?.mode).toBe('edit');
      expect((dialogConfig?.data as any)?.data).toBe(mockRecord);
      expect(dialogConfig?.hasBackdrop).toBe(false);
    });




  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      mockService.getValidFacilityIdentifiers.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

















    it('should remove effective date filter chip', () => {
      component.appliedFilters = {
        chapterId: null,
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationPeriod: null,
        terminationDate: null
      };
      component.requestState.effectiveDate = '2024-01-15';
      component.requestState.effectivePeriod = 'After';

      component.removeFilterChip('effectiveDate');

      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectivePeriod).toBeUndefined();
    });

    it('should remove termination date filter chip', () => {
      component.appliedFilters = {
        chapterId: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };
      component.requestState.terminationDate = '2024-12-31';
      component.requestState.terminationPeriod = 'Before';

      component.removeFilterChip('terminationDate');

      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationPeriod).toBeUndefined();
    });




  });

  describe('Filter chips', () => {
    beforeEach(() => {
      mockService.getValidFacilityIdentifiers.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should generate filter chips when filters are applied', () => {
      const filters = {
        chapterId: 'AB12',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationPeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });


  });
});
