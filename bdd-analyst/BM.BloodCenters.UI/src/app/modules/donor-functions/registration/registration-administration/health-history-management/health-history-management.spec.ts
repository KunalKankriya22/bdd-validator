import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HealthHistoryManagement } from './health-history-management';
import { MenuService } from '@shared/services/menu.service';
import { HealthHistoryService } from './services/health-history.service';
import { HeaderService } from '@shared/services/header.service';

describe('HealthHistoryManagement', () => {
  let component: HealthHistoryManagement;
  let fixture: ComponentFixture<HealthHistoryManagement>;
  let menuServiceMock: Partial<MenuService>;
  let headerServiceMock: Partial<HeaderService>;

  beforeEach(async () => {
    menuServiceMock = {
      getMenuItemsSignal: () => signal([]),
      findMenuItemByPath: jasmine.createSpy('findMenuItemByPath').and.returnValue(null)
    };

    const chapterChanged$ = new Subject<void>();
    headerServiceMock = {
      chapterTimeZone: signal('-06:00'),
      chapterChanged$: chapterChanged$.asObservable()
    } as any;

    const hhServiceMock = {
      searchQuestions: () => of({ data: [], totalRecords: 0 }),
      getQuestionByCode: () => of(null),
      getGenderDropdown: () => of([]),
      getInterdictionCodes: () => of([]),
      getGroupCodes: () => of([]),
      getPeriodTypes: () => of([]),
      searchAnswers: () => of({ success: true, data: [], total: 0 }),
      getTemplates: () => of({ data: [], totalRecords: 0 }),
      searchTemplates: () => of({ data: [], totalRecords: 0 }),
      getTemplateQuestions: () => of({ assignedQuestions: [] }),
      getDonationTypes: () => of([]),
      getAvailableQuestionsForTemplate: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [HealthHistoryManagement, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MenuService, useValue: menuServiceMock },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: HealthHistoryService, useValue: hhServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HealthHistoryManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should start with first tab selected', () => {
    expect(component.selectedTabIndex).toBe(0);
  });



  it('should update header when menu items are loaded', () => {
    const mockMenuItem = {
      label: 'Health History Questions Bank',
      routeKey: 'HEALTH_HISTORY_MANAGEMENT',
      routePath: '/donor-functions/registration/registration-administration/health-history-management',
      remarks: 'Manage health history questions'
    };

    (menuServiceMock.findMenuItemByPath as jasmine.Spy).and.returnValue(mockMenuItem);

    const menuSignal = signal([mockMenuItem]);
    (menuServiceMock as any).getMenuItemsSignal = () => menuSignal;

    fixture = TestBed.createComponent(HealthHistoryManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();

    menuSignal.set([mockMenuItem]);
    fixture.detectChanges();
  });
});
