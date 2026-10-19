import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DefineOperatorsComponent } from './define-operators';
import { DefineOperatorsService } from './services/define-operators.service';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { ValidOperator } from './models/define-operators.model';

describe('DefineOperatorsComponent', () => {
  let component: DefineOperatorsComponent;
  let fixture: ComponentFixture<DefineOperatorsComponent>;
  let mockService: jasmine.SpyObj<DefineOperatorsService>;

  // Helper function to get future date
  const getFutureDate = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  };

  const mockOperators: ValidOperator[] = [
    { operator: 'EQ', description: 'Equal to', valueStyle: 'S', effectiveDate: getFutureDate(15), terminationDate: null },
    { operator: 'NE', description: 'Not equal to', valueStyle: 'S', effectiveDate: getFutureDate(30), terminationDate: null },
    { operator: 'BETWEEN', description: 'Between range', valueStyle: 'R', effectiveDate: getFutureDate(60), terminationDate: getFutureDate(365) }
  ];

  const mockListResponse = {
    data: mockOperators,
    totalRecords: 3
  };

  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineOperatorsService', [
      'getValidOperators'
    ]);
    mockService.getValidOperators.and.returnValue(of(mockListResponse));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    const backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);



      TestBed.configureTestingModule({
      imports: [
        DefineOperatorsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: DefineOperatorsService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


      mockService.getValidOperators.and.returnValue(of(mockListResponse));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(DefineOperatorsComponent);
    component = fixture.componentInstance;


    });
  describe('loadData', () => {


    it('should set dataSource from response', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.dataSource).toEqual(mockOperators);
    }));



    it('should handle error and set hasError', fakeAsync(() => {
      mockService.getValidOperators.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBeTruthy();
    }));

    it('should pass correct take and skip values', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 1;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();
      tick();

      expect(mockService.getValidOperators).toHaveBeenCalledWith(10, 10, jasmine.any(Object));
    }));
  });







  describe('onRowAction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open side panel in edit mode for edit action', () => {
      component.onRowAction({ action: 'edit', row: mockOperators[0] });

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockOperators[0]);
    });
  });
  describe('Value Style Display', () => {
    it('should format valueStyle S as Single in table', () => {
      fixture.detectChanges();

      const valueStyleColumn = component.tableConfig.columns.find(c => c.key === 'valueStyle');
      expect(valueStyleColumn?.valueFormatter!('S', {} as any)).toBe('Single');
    });

    it('should format valueStyle R as Range in table', () => {
      fixture.detectChanges();

      const valueStyleColumn = component.tableConfig.columns.find(c => c.key === 'valueStyle');
      expect(valueStyleColumn?.valueFormatter!('R', {} as any)).toBe('Range');
    });

    it('should format valueStyle M as Multiple in table', () => {
      fixture.detectChanges();

      const valueStyleColumn = component.tableConfig.columns.find(c => c.key === 'valueStyle');
      expect(valueStyleColumn?.valueFormatter!('M', {} as any)).toBe('Multiple');
    });

    it('should format valueStyle X as Mixed in table', () => {
      fixture.detectChanges();

      const valueStyleColumn = component.tableConfig.columns.find(c => c.key === 'valueStyle');
      expect(valueStyleColumn?.valueFormatter!('X', {} as any)).toBe('Mixed');
    });
  });

  describe('Filter Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should return false for hasActiveFilters when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });
  });
});
