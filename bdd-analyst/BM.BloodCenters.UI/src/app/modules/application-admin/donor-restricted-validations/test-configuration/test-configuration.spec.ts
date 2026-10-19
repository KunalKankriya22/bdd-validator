import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { TestConfigurationComponent } from './test-configuration';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('TestConfigurationComponent', () => {
  let component: TestConfigurationComponent;
  let fixture: ComponentFixture<TestConfigurationComponent>;
  let router: Router;
  let pageHeaderSignal: any;
  let mockActivatedRoute: any;

  function setupTestBed(pageData?: { title: string; subtitle?: string } | null) {
    // Reset TestBed before configuring
    TestBed.resetTestingModule();

    pageHeaderSignal = signal(pageData !== undefined ? pageData : null);

    const mockPageHeaderService = {
      pageHeaderData: pageHeaderSignal,
      getTitle: () => '',
      getSubtitle: () => ''
    };

    TestBed.configureTestingModule({
      imports: [
        TestConfigurationComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    }).compileComponents();
  }

  function createComponent() {
    fixture = TestBed.createComponent(TestConfigurationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  function createMockActivatedRoute(path: string = 'lab-tests') {
    return {
      firstChild: {
        snapshot: {
          routeConfig: { path }
        }
      }
    };
  }

  afterEach(() => {
    // Clean up after each test
    TestBed.resetTestingModule();
  });

  beforeEach(() => {
    // Create fresh mock for each test
    mockActivatedRoute = createMockActivatedRoute();
  });

  describe('Component Initialization', () => {
    beforeEach(() => {
      setupTestBed(null);
      createComponent();
    });

    it('should initialize selectedTabIndex to 0', () => {
      expect(component.selectedTabIndex).toBe(0);
    });

  });

  describe('Dynamic Header from PageHeaderService', () => {
    it('should use page header data when available', () => {
      setupTestBed({
        title: 'Test Series/Test Configuration',
        subtitle: 'Custom subtitle from API'
      });
      createComponent();

      expect(component.headerConfig.title).toBe('Test Series/Test Configuration');
      expect(component.headerConfig.subtitle).toBe('Custom subtitle from API');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Test Series/Test Configuration');
    });

    it('should have initial empty state when page data not available', () => {
      setupTestBed(null);
      createComponent();

      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
      expect(component.headerConfig.breadcrumbs.length).toBe(1);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    });




  });

  describe('Tab Sync with Route', () => {
    it('should sync tab to lab-tests route (index 0)', () => {
      mockActivatedRoute = createMockActivatedRoute('lab-tests');
      setupTestBed(null);
      createComponent();

      expect(component.selectedTabIndex).toBe(0);
    });

    it('should sync tab to donor-tests route (index 1)', () => {
      mockActivatedRoute = createMockActivatedRoute('donor-tests');
      setupTestBed(null);
      createComponent();

      expect(component.selectedTabIndex).toBe(1);
    });

    it('should sync tab to override-rules route (index 2)', () => {
      mockActivatedRoute = createMockActivatedRoute('override-rules');
      setupTestBed(null);
      createComponent();

      expect(component.selectedTabIndex).toBe(2);
    });

  });

  describe('onTabChange', () => {
    beforeEach(() => {
      setupTestBed(null);
      createComponent();
    });



    it('should navigate to override-rules on tab 2', () => {
      const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      const event = { index: 2 } as MatTabChangeEvent;

      component.onTabChange(event);

      expect(navigateSpy).toHaveBeenCalledWith(
        ['override-rules'],
        { relativeTo: component['route'] }
      );
    });
  });

});
