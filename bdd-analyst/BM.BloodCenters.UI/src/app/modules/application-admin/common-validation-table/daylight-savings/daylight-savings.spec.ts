import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';

import { DaylightSavingsComponent } from './daylight-savings';
import { DaylightSavingsService } from './services/daylight-savings.service';
import { DaylightSavingsModel } from './models/daylight-savings.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('DaylightSavingsComponent', () => {
  let component: DaylightSavingsComponent;
  let fixture: ComponentFixture<DaylightSavingsComponent>;
  let mockService: jasmine.SpyObj<DaylightSavingsService>;
  let mockRouter: any;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockActivatedRoute: any;
  let mockPageHeaderService: any;
  let routerEventsSubject: Subject<any>;

  const mockDaylightSavingsData: DaylightSavingsModel[] = [
    {
      chapterId: 'DAL',
      chapterName: 'Dallas Blood Center',
      startTime: '2026-03-09T02:00:00.000Z',
      endTime: '2026-11-02T02:00:00.000Z',
      baseOffSet: '-6',
      dstOffSet: -5,
      timeZoneRegion: 'UTC -06:00'
    },
    {
      chapterId: 'NYC',
      chapterName: 'New York Blood Center',
      startTime: '2026-03-09T02:00:00.000Z',
      endTime: '2026-11-02T02:00:00.000Z',
      baseOffSet: '-5',
      dstOffSet: -4,
      timeZoneRegion: 'UTC -05:00'
    }
  ];

  const mockServiceResponse = {
    data: mockDaylightSavingsData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DaylightSavingsService', [
      'getDaylightSavings',
      'getChapters',
      'getDaylightSavingsDropdown'
    ]);

    routerEventsSubject = new Subject();
    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree'),
      events: routerEventsSubject.asObservable(),
      url: '/daylight-savings'
    };

    mockTranslateService = createMockTranslateService();
    mockActivatedRoute = {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    };

    mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Set the Day Light Savings',
        subtitle: 'Manage dates and times for Day Light Savings'
      })
    };

    mockService.getDaylightSavings.and.returnValue(of(mockServiceResponse));
    mockService.getChapters.and.returnValue(of([]));
    mockService.getDaylightSavingsDropdown.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: [], total: 0 }));
    mockRouter.createUrlTree.and.returnValue({} as any);



      TestBed.configureTestingModule({
      imports: [
        DaylightSavingsComponent,
        OverlayModule
      ],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DaylightSavingsService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        Overlay
      ]
    });


    


      mockService.getDaylightSavings.calls.reset();


      mockService.getChapters.calls.reset();


      mockService.getDaylightSavingsDropdown.calls.reset();


      mockService.getDaylightSavings.and.returnValue(of(mockServiceResponse));


      mockService.getChapters.and.returnValue(of([]));


      mockService.getDaylightSavingsDropdown.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: [], total: 0 }));


      mockRouter.createUrlTree.and.returnValue({} as any);


    fixture = TestBed.createComponent(DaylightSavingsComponent);
    component = fixture.componentInstance;


    });

  describe('onRowAction()', () => {
    it('should call editRecord when action is edit', () => {
      spyOn(component, 'editRecord');
      const record = mockDaylightSavingsData[0];
      const event = { action: 'edit', row: record };

      component.onRowAction(event as any);

      expect(component.editRecord).toHaveBeenCalledWith(record);
    });
  });
  describe('Date and Offset formatting', () => {






    it('should format positive offset correctly', () => {
      const formatted = component['formatOffSet'](5.5);

      expect(formatted).toBe('+5.50');
    });

    it('should format negative offset correctly', () => {
      const formatted = component['formatOffSet'](-6);

      expect(formatted).toBe('-6.00');
    });

    it('should return dash for null offset', () => {
      const formatted = component['formatOffSet'](null);

      expect(formatted).toBe('-');
    });

    it('should handle string offset', () => {
      const formatted = component['formatOffSet']('4.5');

      expect(formatted).toBe('+4.50');
    });

    it('should handle negative string offset', () => {
      const formatted = component['formatOffSet']('-6');

      expect(formatted).toBe('-6.00');
    });
  });


  describe('Cleanup', () => {


    it('should dispose overlay on destroy if exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalledTimes(1);
    });
  });
});
