import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { DrivesBySponsorQuery } from './drives-by-sponsor-query';
import { DrivesBySponsorQueryService } from './services/drives-by-sponsor-query.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SponsorLookup, SponsorDrive } from './models/drives-by-sponsor-query.model';
import { createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DrivesBySponsorQuery', () => {
  let component: DrivesBySponsorQuery;
  let fixture: ComponentFixture<DrivesBySponsorQuery>;
  let mockService: jasmine.SpyObj<DrivesBySponsorQueryService>;
  let mockHeaderService: any;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockSponsors: SponsorLookup[] = [
    { code: 'SPON001', description: 'Sponsor One' },
    { code: 'SPON002', description: 'Sponsor Two' }
  ];

  const mockDrives: SponsorDrive[] = [
    {
      driveId: 'DRV001',
      driveDate: '2026-04-01T00:00:00',
      driveType: 'M',
      locationDescription: 'Test Location',
      status: 'CNFRM',
      projectedShow: 50,
      projectedDraw: 40,
      actualCredits: 35,
      actualDraw: 35,
      deferralCount: 5,
      deferralPercentage: 12.5,
      scheduleStartTime: '2026-04-01T09:00:00',
      scheduleEndTime: '2026-04-01T17:00:00'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DrivesBySponsorQueryService', [
      'getSponsorsLookup',
      'searchSponsorDrives'
    ]);

    mockHeaderService = createMockHeaderService();

    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], { url: '/test' });
    // Add events observable to Router mock
    Object.defineProperty(mockRouter, 'events', {
      get: () => of(),
      enumerable: true,
      configurable: true
    });

    mockTranslateService = createMockTranslateService();
    mockService.getSponsorsLookup.and.returnValue(of(mockSponsors));
    mockService.searchSponsorDrives.and.returnValue(of({
      drives: mockDrives,
      total: 1,
      totals: {
        totalRecords: 1,
        totalProjectedShow: 50,
        totalProjectedDraw: 40,
        totalActualCredits: 35,
        totalActualDraw: 35,
        totalDeferralCount: 5,
        otherCredits: 0,
        otherDraws: 0
      }
    }));
    mockMenuService.findMenuItemByPath.and.returnValue({
      label: 'Drives by Sponsor Query',
      remarks: 'Test subtitle',
      routePath: '/test'
    });



      TestBed.configureTestingModule({
      imports: [
        DrivesBySponsorQuery,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DrivesBySponsorQueryService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    


      mockService.getSponsorsLookup.calls.reset();


      mockService.searchSponsorDrives.calls.reset();


      mockMenuService.findMenuItemByPath.calls.reset();


      mockRouter.navigate.calls.reset();


      mockService.getSponsorsLookup.and.returnValue(of(mockSponsors));


    fixture = TestBed.createComponent(DrivesBySponsorQuery);
    component = fixture.componentInstance;


    });







  it('should validate required sponsor ID', () => {
    const sponsorIdControl = component.filterForm.get('sponsorId');
    sponsorIdControl?.setValue('');
    sponsorIdControl?.markAsTouched();
    expect(sponsorIdControl?.hasError('required')).toBe(true);
  });











  it('should have correct drive status options', () => {
    expect(component.driveStatusOptions.length).toBe(4);
    expect(component.driveStatusOptions[0].value).toBe('CNFRM');
    expect(component.driveStatusOptions[1].value).toBe('CANCL');
  });




  it('should have accessibility attributes', () => {
    expect(component.tableConfig.emptyMessage).toBeDefined();
    expect(component.tableConfig.loadingMessage).toBeDefined();
    expect(component.tableConfig.rowActions?.[0].ariaLabel).toBeDefined();
  });




});
