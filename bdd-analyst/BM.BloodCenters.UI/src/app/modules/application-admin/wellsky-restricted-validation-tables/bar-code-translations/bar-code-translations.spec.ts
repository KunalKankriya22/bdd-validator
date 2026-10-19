import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { BarCodeTranslationsComponent } from './bar-code-translations';
import { BarCodeTranslationsService } from './services/bar-code-translations.service';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderService } from '@shared/services/header.service';
import { BarCodeTranslation } from './models/bar-code-translations.model';

describe('BarCodeTranslationsComponent', () => {
  let component: BarCodeTranslationsComponent;
  let fixture: ComponentFixture<BarCodeTranslationsComponent>;
  let mockService: jasmine.SpyObj<BarCodeTranslationsService>;

  const mockTranslations: BarCodeTranslation[] = [
    { machineCode: '00', eyeReadTrns: ' C', effDate: '2025-11-02T00:00:00Z', termDate: '2025-12-02T00:00:00Z', lastModified: '2025-11-02T00:00:00Z' },
    { machineCode: '01', eyeReadTrns: 'E2', effDate: '2025-11-02T00:00:00Z', termDate: null, lastModified: '2025-11-02T00:00:00Z' }
  ];

  const mockListResponse = { data: mockTranslations, totalRecords: 2 };

  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('BarCodeTranslationsService', ['getBarCodeTranslations']);
    mockService.getBarCodeTranslations.and.returnValue(of(mockListResponse));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/', events: of(new NavigationEnd(0, '/', '/'))
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
    mockOverlay.scrollStrategies = { block: jasmine.createSpy('block').and.returnValue({}) } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);

    chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = {
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [BarCodeTranslationsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: BarCodeTranslationsService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });

    fixture = TestBed.createComponent(BarCodeTranslationsComponent);
    component = fixture.componentInstance;
  });

  describe('Table Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have no row actions (read-only)', () => {
      expect(component.tableConfig.rowActions!.length).toBe(0);
    });

    it('should not have any header actions', () => {
      expect(component.headerConfig.actions).toBeUndefined();
    });
  });

  describe('Date Formatting', () => {
    it('should format effDate in table column', () => {
      fixture.detectChanges();
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = effDateCol?.valueFormatter!('2025-11-02T00:00:00Z', {} as any);
      expect(result).toMatch(/\d{2}-\w{3}-\d{4}/);
    });
  });

  describe('Filter Management', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return false for hasActiveFilters when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should map date period to correct API field', () => {
      component.applyFilters({
        machineCode: null, eyeReadTrns: null,
        effDate: '2025-11-01T00:00:00Z', effDatePeriod: 'AFTER',
        termDate: '2025-12-31T00:00:00Z', termDatePeriod: 'BEFORE'
      });
      expect(component.requestState.effDateAfter).toBe('2025-11-01T00:00:00Z');
      expect(component.requestState.effDateBefore).toBeUndefined();
      expect(component.requestState.termDateBefore).toBe('2025-12-31T00:00:00Z');
      expect(component.requestState.termDateAfter).toBeUndefined();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not have Alt+C shortcut', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
      component.handleKeyboardShortcut(event);
      // No side panel properties exist — Alt+C is a no-op
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset state and reload data on chapter change', fakeAsync(() => {
      component.searchText = 'test';
      component.appliedFilters = { machineCode: '00', eyeReadTrns: null, effDate: null, effDatePeriod: null, termDate: null, termDatePeriod: null };
      component.filterChips = [{ key: 'machineCode', label: 'Machine Code', value: '00' }];
      component.requestState = { searchKeyword: 'test', machineCode: '00' };
      component.hasError = true;
      component.errorMessage = 'Some error';

      mockService.getBarCodeTranslations.calls.reset();
      mockService.getBarCodeTranslations.and.returnValue(of({ data: [], totalRecords: 0 }));

      chapterChangedSubject.next();
      tick();

      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState).toEqual({});
      expect(component.tableConfig.sortConfig?.column).toBe('machineCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(mockService.getBarCodeTranslations).toHaveBeenCalled();
    }));

    it('should dispose overlay if filter panel is open on chapter change', () => {
      const localOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = localOverlayRef;
      component.isFilterOpen = true;

      chapterChangedSubject.next();

      expect(localOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });
});
