import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd, provideRouter } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { LabelingConfigurationComponent } from './labeling-configuration';

describe('LabelingConfigurationComponent', () => {
  let component: LabelingConfigurationComponent;
  let fixture: ComponentFixture<LabelingConfigurationComponent>;
  let router: Router;
  let routerEvents$: Subject<any>;

  beforeEach(async () => {
    routerEvents$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [LabelingConfigurationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            firstChild: { snapshot: { routeConfig: { path: 'bar-code' } } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LabelingConfigurationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  describe('Component Initialization', () => {
    it('should have correct tabs configuration', () => {
      expect(component.tabs.length).toBe(5);
      expect(component.tabs[0]).toEqual({ route: 'bar-code', label: 'Bar Code' });
      expect(component.tabs[1]).toEqual({ route: 'product-type-prioritization', label: 'Product Type Prioritization' });
      expect(component.tabs[2]).toEqual({ route: 'recovered-plasma-test', label: 'Recovered Plasma Test' });
      expect(component.tabs[3]).toEqual({ route: 'test-message-mapping', label: 'Test Message Mapping' });
      expect(component.tabs[4]).toEqual({ route: 'rbc-antigen-product-type', label: 'RBC Antigen Product Type' });
    });


    it('should initialize with default tab index', () => {
      expect(component.selectedTabIndex).toBe(0);
    });
  });

  describe('Tab Change', () => {

    it('should not overwrite header config on tab change', () => {
      const initialSubtitle = component.headerConfig.subtitle;
      const event = { index: 1 } as MatTabChangeEvent;
      component.onTabChange(event);

      expect(component.headerConfig.subtitle).toBe(initialSubtitle);
    });
  });
});
