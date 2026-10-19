import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { DefineProcedureGroupsComponent } from './define-procedure-groups';
import { DefineProcedureGroupsService } from './services/define-procedure-groups.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DefineProcedureGroupsModel, DefineProcedureGroupsFilterValue } from './models/define-procedure-groups.model';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockPageHeaderService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DefineProcedureGroupsComponent', () => {
  let matDialogRefSpy: any;
  let dialogSpy: any;
  let overlayRefSpy: any;
  let overlaySpy: any;
  let routerSpy: any;
  let serviceSpy: any;
  let component: DefineProcedureGroupsComponent;
  let fixture: ComponentFixture<DefineProcedureGroupsComponent>;
  let mockService: jasmine.SpyObj<DefineProcedureGroupsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockMatDialogRef: jasmine.SpyObj<MatDialogRef<any>>;

  const mockData: DefineProcedureGroupsModel[] = [
    {
      procedureGroup: 'PLASM',
      groupDescription: 'Plasma Collection',
      eligCreditCount: 1,
      procedureCode: 'P001',
      procedureDescription: 'Plasma Donation',
      effDate: new Date('2024-01-01'),
      termDate: null
    },
    {
      procedureGroup: 'WHOLE',
      groupDescription: 'Whole Blood',
      eligCreditCount: 2,
      procedureCode: 'W001',
      procedureDescription: 'Whole Blood Donation',
      effDate: new Date('2024-01-01'),
      termDate: new Date('2024-12-31')
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineProcedureGroupsService', ['getDefineProcedureGroups']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    overlaySpy = jasmine.createSpyObj('Overlay', ['create', 'position']);
    overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose', 'attach', 'backdropClick']);
    const pageHeaderServiceSpy = createMockPageHeaderService();
    dialogSpy = createMockMatDialog();
    matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    matDialogRefSpy.afterClosed.and.returnValue(of(undefined));
    dialogSpy.open.and.returnValue(matDialogRefSpy);
    
    // Mock the pageTitle$ and breadcrumbs$ observables
    pageHeaderServiceSpy.pageTitle$ = of('');
    pageHeaderServiceSpy.breadcrumbs$ = of([]);
    pageHeaderServiceSpy.actions$ = of([]);



      TestBed.configureTestingModule({
      imports: [
        DefineProcedureGroupsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: DefineProcedureGroupsService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Overlay, useValue: overlaySpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });


    


      serviceSpy.getDefineProcedureGroups.calls.reset();


      routerSpy.navigate.calls.reset();


      overlaySpy.create.calls.reset();


      overlaySpy.position.calls.reset();


      overlayRefSpy.dispose.calls.reset();


      overlayRefSpy.attach.calls.reset();


      overlayRefSpy.backdropClick.calls.reset();


      matDialogRefSpy.afterClosed.calls.reset();


      matDialogRefSpy.afterClosed.and.returnValue(of(undefined));


      dialogSpy.open.and.returnValue(matDialogRefSpy);


    fixture = TestBed.createComponent(DefineProcedureGroupsComponent);
    component = fixture.componentInstance;
    mockService = TestBed.inject(DefineProcedureGroupsService) as jasmine.SpyObj<DefineProcedureGroupsService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockOverlay = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;
    mockOverlayRef = overlayRefSpy;
    mockPageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockMatDialogRef = matDialogRefSpy;

    mockService.getDefineProcedureGroups.and.returnValue(
      of({ data: mockData, totalRecords: mockData.length })
    );


    });
  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      spyOn(component, 'editRecord');
      const row = mockData[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.editRecord).toHaveBeenCalledWith(row);
    });
  });
  describe('Filter Operations', () => {


    it('should apply filters and update filter chips', fakeAsync(() => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: 'PLASM',
        procedureCode: 'PL',
        donationCredits: 1,
        effectiveDatePeriod: null,
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.isFilterOpen).toBe(false);
      expect(mockService.getDefineProcedureGroups).toHaveBeenCalled();
    }));

    it('should map period filter "After" to API parameters', fakeAsync(() => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'After',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-01-01')
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.effectiveDateAfter).toBeDefined();
      expect(component.requestState.effectiveDateBefore).toBeUndefined();
    }));

    it('should map period filter "Before" to API parameters', fakeAsync(() => {
      const filters: DefineProcedureGroupsFilterValue = {
        procedureGroupCode: null,
        procedureCode: null,
        donationCredits: null,
        effectiveDatePeriod: 'Before',
        terminationDatePeriod: null,
        terminationDate: null,
        effectiveDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.effectiveDateBefore).toBeDefined();
      expect(component.requestState.effectiveDateAfter).toBeUndefined();
    }));








    it('should close filter panel on Escape when filter is open', () => {
      component.isFilterOpen = true;
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('Header Actions', () => {
    it('should have ADD PROCEDURE GROUP MAPPING action', () => {
      const action = component.headerConfig.actions?.find(a => a.label === 'ADD PROCEDURE GROUP MAPPING');
      expect(action).toBeDefined();
      expect(action?.icon).toBe('add');
    });




  });
});
