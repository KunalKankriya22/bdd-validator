import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable, Subject } from 'rxjs';

import { DefineDefaultDriveChecklistComponent } from './define-default-drive-checklist';
import { DefineDefaultDriveChecklistService } from './services/define-default-drive-checklist.service';
import {
  DefineDefaultDriveChecklistModel,
  DriveChecklistFilterValue
} from './models/define-default-drive-checklist.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockTranslateService, createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('DefineDefaultDriveChecklistComponent', () => {
  let mockPositionStrategy: any;
  let mockDialogRef: any;
  let component: DefineDefaultDriveChecklistComponent;
  let fixture: ComponentFixture<DefineDefaultDriveChecklistComponent>;
  let mockService: jasmine.SpyObj<DefineDefaultDriveChecklistService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockHeaderService: any;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockData: DefineDefaultDriveChecklistModel[] = [
    {
      sortSeq: 1,
      actionCode: 'BOOK_VENUE',
      actionDescription: 'Book Venue',
      targetDays: 30,
      timeFlag: 'BD',
      timeFlagDescription: 'Before Drive',
      chapterId: 'CH001'
    },
    {
      sortSeq: 2,
      actionCode: 'SEND_NOTICE',
      actionDescription: 'Send Notice',
      targetDays: 15,
      timeFlag: 'BD',
      timeFlagDescription: 'Before Drive',
      chapterId: 'CH001'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDefaultDriveChecklistService', [
      'getDriveChecklist',
      'deleteDriveChecklist'
    ]);

    // Create MatDialog mock with proper structure
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of(false));

    // Create comprehensive MatDialog mock with internal properties using Subject
    const afterOpenedSubject = new Subject<any>();
    const afterAllClosedSubject = new Subject<void>();

    mockDialog = jasmine.createSpyObj('MatDialog', ['open'], {
      openDialogs: [],
      _getAfterAllClosed: jasmine.createSpy('_getAfterAllClosed').and.returnValue(afterAllClosedSubject.asObservable()),
      _afterAllClosedAtThisLevel: afterAllClosedSubject,
      _afterOpenedAtThisLevel: afterOpenedSubject,
      _openDialogsAtThisLevel: []
    });
    mockDialog.open.and.returnValue(mockDialogRef);

    mockSnackBar = createMockMatSnackBar();
    mockTranslateService = createMockTranslateService();
    // Create HeaderService mock with signal
    mockHeaderService = {
      chapterId: signal('CH001'),
      warehouseId: signal('WH001'),
      chapterName: signal('Test Chapter'),
      warehouseName: signal('Test Warehouse')
    };

    // Create comprehensive Overlay mock
    mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy',
      ['flexibleConnectedTo', 'withPositions', 'withPush']
    );
    mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

    const mockScrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    mockOverlay.position.and.returnValue(mockPositionStrategy);
    Object.defineProperty(mockOverlay, 'scrollStrategies', {
      value: mockScrollStrategies,
      writable: false
    });

    mockService.getDriveChecklist.and.returnValue(
      of({ data: mockData, totalRecords: 2 })
    );



      TestBed.configureTestingModule({
      imports: [
        DefineDefaultDriveChecklistComponent
      ],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter([]),
        { provide: DefineDefaultDriveChecklistService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    


      mockService.getDriveChecklist.calls.reset();


      mockService.deleteDriveChecklist.calls.reset();


      mockDialogRef.afterClosed.calls.reset();


      mockDialog.open.calls.reset();


      mockPositionStrategy.flexibleConnectedTo.calls.reset();


      mockPositionStrategy.withPositions.calls.reset();


      mockPositionStrategy.withPush.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();


      mockDialogRef.afterClosed.and.returnValue(of(false));


      mockDialog.open.and.returnValue(mockDialogRef);


      mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);


      mockOverlay.position.and.returnValue(mockPositionStrategy);


    fixture = TestBed.createComponent(DefineDefaultDriveChecklistComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize search config', () => {
      expect(component.searchConfig).toBeDefined();
      expect(component.searchConfig.placeholder).toBe('Search by Action or Description');
      expect(component.searchConfig.minLength).toBe(2);
    });



    it('should set current year', () => {
      const currentYear = new Date().getFullYear();
      expect(component.currentYear).toBe(currentYear);
    });
  });
  describe('Data Loading', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should update data source after loading', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBeFalse();
    }));




    it('should load without showing loader when showLoading is false', fakeAsync(() => {
      component.loadData(false);
      tick();

      expect(component.dataSource.length).toBe(2);
    }));

    it('should pass correct skip and take parameters', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 1;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();
      tick();

      expect(mockService.getDriveChecklist).toHaveBeenCalledWith(
        25,
        25,
        jasmine.any(Object)
      );
    }));
  });





  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));









    it('should reload data without showing loader', fakeAsync(() => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'sortSeq', direction: 'A' });
      expect(component.loadData).toHaveBeenCalledWith(false);
    }));
  });

  describe('Row Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call editRecord on edit action', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

    it('should call deleteRecord on delete action', () => {
      spyOn(component, 'deleteRecord').and.stub();
      component.onRowAction({ action: 'delete', row: mockData[0] });
      expect(component.deleteRecord).toHaveBeenCalledWith(mockData[0]);
    });
  });
  describe('Edit Record', () => {


    it('should set side panel data', () => {
      component.editRecord(mockData[0]);
      expect(component.sidePanelData).toEqual(mockData[0]);
    });


  });
  describe('Filter Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should convert filters to chips', () => {
      const filters: DriveChecklistFilterValue = {
        condition: 'LE',
        noOfDays: 15,
        timeline: 'DD'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });









    it('should return true when filters are active', () => {
      component.appliedFilters = {
        condition: 'GE',
        noOfDays: 30,
        timeline: null
      };

      expect(component.hasActiveFilters()).toBeTrue();
    });


  });
  describe('Component Cleanup', () => {




    it('should not error on destroy if no overlay exists', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });


  describe('Header Action', () => {
    it('should have add new checklist item action', () => {
      const addAction = component.headerConfig.actions!.find(
        a => a.label === 'ADD NEW CHECKLIST ITEM'
      );
      expect(addAction).toBeDefined();
      expect(addAction?.icon).toBe('add');
    });


  });
});
