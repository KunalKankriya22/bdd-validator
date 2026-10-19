import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TerritoryManagementComponent } from './territory-management';
import { TerritoryService } from './services/territory.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TerritoryModel } from './models/territory.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('TerritoryManagementComponent', () => {
  let component: TerritoryManagementComponent;
  let fixture: ComponentFixture<TerritoryManagementComponent>;
  let territoryServiceSpy: jasmine.SpyObj<TerritoryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockTerritories: TerritoryModel[] = [
    {
      territoryId: 'TERRY00478',
      chapterId: 'DAL',
      territoryShortName: 'ABILENE',
      territoryName: 'Abilene community Center',
      territoryGroup: 'CCOLL',
      territoryType: 'TRTMR',
      effDate: '2025-05-04',
      termDate: '2025-07-14',
      comments: 'Test description',
      programId: 'VDITERTR',
      insertDate: '2025-01-01',
      insertUser: 'ADMIN',
      auditKey: 1
    },
    {
      territoryId: 'BROOKE12111',
      chapterId: 'DAL',
      territoryShortName: 'BROOKE',
      territoryName: 'Brooke Army Medical Center',
      territoryGroup: 'GENER',
      territoryType: 'TRTMR',
      effDate: '2025-01-11',
      termDate: '2025-12-11',
      comments: null,
      programId: 'VDITERTR',
      insertDate: '2025-01-01',
      insertUser: 'ADMIN',
      auditKey: 2
    }
  ];

  beforeEach(() => {

    territoryServiceSpy = jasmine.createSpyObj('TerritoryService', [
      'getTerritories',
      'getFilterOptions'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Create and Maintain Territories', subtitle: '' })
    });

    territoryServiceSpy.getTerritories.and.returnValue(
      of({ data: mockTerritories, totalRecords: 2 })
    );
    territoryServiceSpy.getFilterOptions.and.returnValue(
      of({ groups: [{ code: 'CCOLL', description: 'Collection' }], types: [{ code: 'TRTMR', description: 'Territory' }] })
    );



      TestBed.configureTestingModule({
      imports: [TerritoryManagementComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TerritoryService, useValue: territoryServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      territoryServiceSpy.getTerritories.calls.reset();


      territoryServiceSpy.getFilterOptions.calls.reset();


    fixture = TestBed.createComponent(TerritoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load territories on init', () => {
    expect(territoryServiceSpy.getTerritories).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(2);
    expect(component.totalRecords).toBe(2);
  });







  it('should open edit panel with data', () => {
    component.openEditPanel(mockTerritories[0]);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(mockTerritories[0]);
  });



  it('should toggle expanded row', () => {
    component.toggleRow(mockTerritories[0]);
    expect(component.isExpanded(mockTerritories[0])).toBeTrue();

    component.toggleRow(mockTerritories[0]);
    expect(component.isExpanded(mockTerritories[0])).toBeFalse();
  });



  it('should search and reload data', () => {
    territoryServiceSpy.getTerritories.calls.reset();
    component.onSearch('ABILENE');
    expect(component.searchText).toBe('ABILENE');
    expect(component.pageIndex).toBe(0);
    expect(territoryServiceSpy.getTerritories).toHaveBeenCalled();
  });



  it('should apply filters and reload', () => {
    const filters = {
      showTerminated: false,
      territoryGroup: 'CCOLL',
      territoryType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    };
    territoryServiceSpy.getTerritories.calls.reset();
    component.onFilterApply(filters);
    expect(component.currentFilters).toEqual(filters);
    expect(component.isFilterOpen).toBeFalse();
    expect(territoryServiceSpy.getTerritories).toHaveBeenCalled();
  });










});
