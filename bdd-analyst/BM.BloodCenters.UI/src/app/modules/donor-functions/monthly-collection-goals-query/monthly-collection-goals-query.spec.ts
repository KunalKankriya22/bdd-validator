import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { MonthlyCollectionGoalsQueryComponent } from './monthly-collection-goals-query';
import { MonthlyCollectionGoalsService } from './services/monthly-collection-goals.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('MonthlyCollectionGoalsQueryComponent', () => {
  let goalsServiceSpy: any;
  let component: MonthlyCollectionGoalsQueryComponent;
  let fixture: ComponentFixture<MonthlyCollectionGoalsQueryComponent>;
  let goalsService: jasmine.SpyObj<MonthlyCollectionGoalsService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockYears = Array.from({ length: 21 }, (_, i) => 2016 + i);

  beforeEach(() => {

    goalsServiceSpy = jasmine.createSpyObj('MonthlyCollectionGoalsService', [
      'getYearRange', 'getGoalTypes', 'getCustodians', 'searchGoals',
      'getMonthDetails', 'getByDonationType', 'getByProcedureType',
      'getTerritories', 'getFixedSites'
    ]);
    goalsServiceSpy.getYearRange.and.returnValue(of(mockYears));
    goalsServiceSpy.getGoalTypes.and.returnValue(of([]));

    headerServiceSpy = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        MonthlyCollectionGoalsQueryComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: MonthlyCollectionGoalsService, useValue: goalsServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    


      goalsServiceSpy.getYearRange.calls.reset();


      goalsServiceSpy.getGoalTypes.calls.reset();


      goalsServiceSpy.getCustodians.calls.reset();


      goalsServiceSpy.searchGoals.calls.reset();


      goalsServiceSpy.getMonthDetails.calls.reset();


      goalsServiceSpy.getByDonationType.calls.reset();


      goalsServiceSpy.getByProcedureType.calls.reset();


      goalsServiceSpy.getTerritories.calls.reset();


      goalsServiceSpy.getFixedSites.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      goalsServiceSpy.getYearRange.and.returnValue(of(mockYears));


      goalsServiceSpy.getGoalTypes.and.returnValue(of([]));
    fixture = TestBed.createComponent(MonthlyCollectionGoalsQueryComponent);
    component = fixture.componentInstance;
    goalsService = TestBed.inject(MonthlyCollectionGoalsService) as jasmine.SpyObj<MonthlyCollectionGoalsService>;
    fixture.detectChanges();


    });


  it('should have 5 tabs configured', () => {
    expect(component.tabs.length).toBe(5);
    expect(component.tabs[0].label).toBe('Search');
    expect(component.tabs[1].label).toBe('By Donation Type');
    expect(component.tabs[2].label).toBe('By Procedure Type');
    expect(component.tabs[3].label).toBe('Territories');
    expect(component.tabs[4].label).toBe('Fixed Sites');
  });

  it('should initialize with first tab selected', () => {
    expect(component.selectedTabIndex()).toBe(0);
  });

  it('should load year options on init', fakeAsync(() => {
    tick();
    expect(component.yearOptions.length).toBeGreaterThan(0);
    expect(component.yearOptions.length).toBe(21); // Years from API
  }));



  it('should correctly identify active tab', () => {
    expect(component.isTabActive(0)).toBe(true);
    expect(component.isTabActive(1)).toBe(false);

    component.onTabChange({ index: 3, tab: {} } as any);
    expect(component.isTabActive(0)).toBe(false);
    expect(component.isTabActive(3)).toBe(true);
  });

  it('should return correct tab type for index', () => {
    expect(component.getTabType(1)).toBe('donation-type');
    expect(component.getTabType(2)).toBe('procedure-type');
    expect(component.getTabType(3)).toBe('territories');
    expect(component.getTabType(4)).toBe('fixed-sites');
  });



  it('should have correct aria-label for accessibility', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabGroup = compiled.querySelector('mat-tab-group');
    expect(tabGroup?.getAttribute('aria-label')).toBe('Monthly Collection Goals Query tabs');
  });
});
