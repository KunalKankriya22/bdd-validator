import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssociateNicknameListComponent } from './associate-nickname-list';
import { AssociateNicknameToNameApiService } from '../services/associate-nickname-to-name-api.service';
import { PageHeaderService } from '../../../../../shared/services/page-header.service';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('AssociateNicknameListComponent', () => {
  let component: AssociateNicknameListComponent;
  let fixture: ComponentFixture<AssociateNicknameListComponent>;
  let mockApiService: jasmine.SpyObj<AssociateNicknameToNameApiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPageHeaderService: any;

  const mockData = {
    data: [
      {
        nickName: 'BOB',
        firstName: 'ROBERT',
        effDate: '2024-01-01',
        termDate: null,
        programId: 'TEST',
        insertDate: '2024-01-01',
        insertUser: 'admin',
        auditKey: 1,
        isActive: true
      }
    ],
    total: 1
  };

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('AssociateNicknameToNameApiService', [
      'getAssociateNicknames',
      'getAssociateNicknameByKey',
      'createAssociateNickname',
      'updateAssociateNickname'
    ]);
    mockDialog = createMockMatDialog();
    mockSnackBar = createMockMatSnackBar();
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    mockPageHeaderService = {
      actionClicks$: new BehaviorSubject<string>(''),
      setPageHeader: jasmine.createSpy('setPageHeader')
    };

    mockApiService.getAssociateNicknames.and.returnValue(of(mockData));



      TestBed.configureTestingModule({
      imports: [
        AssociateNicknameListComponent,
        HttpClientTestingModule],
      providers: [
        { provide: AssociateNicknameToNameApiService, useValue: mockApiService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: {} },
            queryParams: of({})
          }
        }
      ]
    });


    


      mockApiService.getAssociateNicknames.calls.reset();


      mockApiService.getAssociateNicknameByKey.calls.reset();


      mockApiService.createAssociateNickname.calls.reset();


      mockApiService.updateAssociateNickname.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockApiService.getAssociateNicknames.and.returnValue(of(mockData));


    fixture = TestBed.createComponent(AssociateNicknameListComponent);
    component = fixture.componentInstance;


    });




  it('should initialize search config with searchOnEnterOnly true', () => {
    component.ngOnInit();
    expect(component.searchConfig.searchOnEnterOnly).toBe(true);
  });

  it('should initialize search config with minLength of 1', () => {
    component.ngOnInit();
    expect(component.searchConfig.minLength).toBe(1);
  });

  it('should handle search with minimum 2 characters', () => {
    component.searchTerm = 'BO';

    component.onSearch('BO');

    expect(component.currentFilters.searchItem).toBe('BO');
    expect(component.pageIndex).toBe(0);
    expect(mockApiService.getAssociateNicknames).toHaveBeenCalled();
  });

  it('should handle sort change with server-side sorting', () => {
    component.sortDirection = 'A';

    component.onSortClick();

    expect(component.sortColumn).toBe('nickName');
    expect(component.sortDirection).toBe('D');
    expect(mockApiService.getAssociateNicknames).toHaveBeenCalled();
  });

  it('should send A for ascending sort', () => {
    component.sortDirection = 'D';

    component.onSortClick();

    expect(component.sortDirection).toBe('A');
  });





  it('should open edit panel and fetch data', () => {
    const row = mockData.data[0];
    mockApiService.getAssociateNicknameByKey.and.returnValue(of(row));

    component.openEditDialog(row);

    expect(mockApiService.getAssociateNicknameByKey).toHaveBeenCalledWith('BOB', 'ROBERT');
    expect(component.sidePanelMode).toBe('edit');
    expect(component.isSidePanelOpen).toBe(true);
  });

  it('should handle panel close', () => {
    component.isSidePanelOpen = true;
    component.sidePanelData = mockData.data[0];

    component.onPanelClose();

    expect(component.isSidePanelOpen).toBe(false);
    expect(component.sidePanelData).toBeNull();
  });

  it('should handle save success and reload data', () => {
    const result = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: new Date('2024-01-01'),
      termDate: null
    };

    component.onSaveSuccess(result);

    expect(component.pageIndex).toBe(0);
    expect(mockApiService.getAssociateNicknames).toHaveBeenCalled();
  });

  it('should build filter chips with symbols for effective date', () => {
    component.currentFilters = {
      effectiveDate: '2024-01-15T00:00:00.000Z',
      effectivePeriod: 'AFTER'
    };

    component['buildFilterChips']();

    const effectiveDateChip = component.activeFilterChips.find(chip => chip.key === 'effectiveDate');
    expect(effectiveDateChip).toBeDefined();
    expect(effectiveDateChip?.label).toContain('≥');
    expect(effectiveDateChip?.label).toContain('15-JAN-2024');
  });

  it('should build filter chips with symbols for termination date BEFORE', () => {
    component.currentFilters = {
      terminationDate: '2024-12-31T00:00:00.000Z',
      terminationPeriod: 'BEFORE'
    };

    component['buildFilterChips']();

    const terminationDateChip = component.activeFilterChips.find(chip => chip.key === 'terminationDate');
    expect(terminationDateChip).toBeDefined();
    expect(terminationDateChip?.label).toContain('≤');
    expect(terminationDateChip?.label).toContain('31-DEC-2024');
  });





  it('should remove termination date filter correctly', () => {
    component.currentFilters = {
      terminationDate: '2024-12-31T00:00:00.000Z',
      terminationPeriod: 'BEFORE'
    };

    component.removeFilter('terminationDate');

    expect(component.currentFilters.terminationDate).toBeUndefined();
    expect(component.currentFilters.terminationPeriod).toBeUndefined();
  });

  it('should format date correctly using formatTableDate', () => {
    const formatted = component.formatDate('2024-01-15');
    expect(formatted).toBe('15-JAN-2024');
  });



  it('should set filters with new date structure', () => {
    component.currentFilters = {
      effectiveDate: '2024-01-01T00:00:00.000Z',
      effectivePeriod: 'AFTER',
      terminationDate: '2024-12-31T00:00:00.000Z',
      terminationPeriod: 'BEFORE'
    };

    expect(component.currentFilters.effectiveDate).toBe('2024-01-01T00:00:00.000Z');
    expect(component.currentFilters.effectivePeriod).toBe('AFTER');
    expect(component.currentFilters.terminationDate).toBe('2024-12-31T00:00:00.000Z');
    expect(component.currentFilters.terminationPeriod).toBe('BEFORE');
  });
});
