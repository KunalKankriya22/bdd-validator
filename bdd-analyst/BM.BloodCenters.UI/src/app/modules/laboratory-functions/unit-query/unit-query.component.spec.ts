import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UnitQueryComponent } from './unit-query.component';
import { UnitQueryService } from './unit-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitQueryResult } from './unit-query.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('UnitQueryComponent', () => {
  let component: UnitQueryComponent;
  let fixture: ComponentFixture<UnitQueryComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockUnit: UnitQueryResult = {
    unitId: 'U001',
    collDate: '2025-01-01',
    chapterId: 'CH1',
    osUnitId: 'OS001',
    receivedDate: '2025-01-02',
    contractId: null,
    contractName: null,
    driveId: null,
    batchId: null,
    warehouseId: null,
    groupSiteId: null,
    siteName: null,
    bleedStartTime: null,
    bleedEndTime: null,
    bleedDuration: null,
    priorAbo: null,
    priorAboDescription: null,
    testedAbo: null,
    testedAboDescription: null,
    systemLabelDecision: null,
    numberOfBags: null,
    catalogNumber: null,
    lotNumber: null,
    donorDecisionCode: null,
    donorDecisionCodeDescription: null,
    bagCode: null,
    nursingAuditStatus: null,
    nursingAuditFlag: null,
    donorLabDats: null,
    labDistDats: null,
    qcCheckinFlag: null,
    qcCheckinDate: null,
    qcLabelFlag: null,
    qcLabelDate: null,
    redTubeFlag: null,
    redTube2: null,
    purpleTubeFlag: null,
    serumPlasmaInd: null,
    checkDigit: null,
    unitSchemeType: null,
    testMessage: null,
    firstSepTime: null,
    secondSepTime: null,
    thirdSepTime: null,
    firstSepCentrifugeId: null,
    secondSepCentrifugeId: null,
    thirdSepCentrifugeId: null,
    firstSepUserId: null,
    secondSepUserId: null,
    thirdSepUserId: null,
    firstSepWeight: null,
    secondSepWeight: null,
    thirdSepWeight: null,
    firstSepEntryMode: null,
    secondSepEntryMode: null,
    thirdSepEntryMode: null,
    firstSepDuration: null,
    secondSepDuration: null,
    thirdSepDuration: null,
    noteId: null,
    hasAttributes: true,
    hasInterdictions: false,
    hasTests: false,
    hasComponents: true,
    isArchived: false,
    hasDocuments: false,
    hasPathogenDetails: false,
    hasFreezeDetails: false,
    hasAddOnBags: false,
    hasAntigensPermission: false,
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('UnitQueryService', [
      'getByUnitId',
      'getByOsUnitId',
      'getComponents',
    ]);
    mockService.getComponents.and.returnValue(of([]));

    mockSnackbar = createMockSnackbarService();

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/')),
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    mockHeaderService = createMockHeaderService();

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal(null),
    });



      TestBed.configureTestingModule({
      imports: [
        UnitQueryComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UnitQueryService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: SnackbarService, useValue: mockSnackbar },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {}, params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
            children: [],
          },
        },
      ],
    });


    


      mockService.getByUnitId.calls.reset();


      mockService.getByOsUnitId.calls.reset();


      mockService.getComponents.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockService.getComponents.and.returnValue(of([]));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


    fixture = TestBed.createComponent(UnitQueryComponent);
    component = fixture.componentInstance;


    });


  it('should initialize search form on ngOnInit', () => {
    fixture.detectChanges();
    expect(component['searchForm']).toBeDefined();
    expect(component['searchForm'].get('unitId')).toBeTruthy();
    expect(component['searchForm'].get('osUnit')).toBeTruthy();
  });



  it('should call getByUnitId when unitId is provided', () => {
    mockService.getByUnitId.and.returnValue(of(mockUnit));
    fixture.detectChanges();
    component['searchForm'].patchValue({ unitId: 'U001' });
    component['onRetrieve']();
    expect(mockService.getByUnitId).toHaveBeenCalledWith('U001', undefined);
  });

  it('should set unit to null and show error on getByUnitId returning null', () => {
    mockService.getByUnitId.and.returnValue(of(null));
    fixture.detectChanges();
    component['searchForm'].patchValue({ unitId: 'U999' });
    component['onRetrieve']();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Unit not found.');
  });

  it('should handle getByUnitId error', () => {
    mockService.getByUnitId.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
    fixture.detectChanges();
    component['searchForm'].patchValue({ unitId: 'U001' });
    component['onRetrieve']();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Server error');
  });





  it('should clearAll reset form and signals', () => {
    fixture.detectChanges();
    component['clearAll']();
    expect(component['unit']()).toBeNull();
    expect(component['components']()).toEqual([]);
    expect(component['hasQueried']()).toBeFalse();
  });

  describe('intrAttrLabel computed', () => {


    it('should return Attributes when only hasAttributes', () => {
      fixture.detectChanges();
      component['unit'].set({ ...mockUnit, hasAttributes: true, hasInterdictions: false });
      expect(component['intrAttrLabel']()).toBe('Attributes');
    });

    it('should return Both when hasAttributes and hasInterdictions', () => {
      fixture.detectChanges();
      component['unit'].set({ ...mockUnit, hasAttributes: true, hasInterdictions: true });
      expect(component['intrAttrLabel']()).toBe('Both');
    });
  });

  describe('format helpers', () => {
    beforeEach(() => fixture.detectChanges());

    it('formatDate should return -- for null', () => {
      expect(component['formatDate'](null)).toBe('--');
    });

    it('formatDateTime should return -- for null', () => {
      expect(component['formatDateTime'](null)).toBe('--');
    });

    it('formatNursingStatus should map codes', () => {
      expect(component['formatNursingStatus']('O')).toBe('OK');
      expect(component['formatNursingStatus']('P')).toBe('Problem');
      expect(component['formatNursingStatus']('N')).toBe('Not Checked');
      expect(component['formatNursingStatus']('H')).toBe('Hold');
      expect(component['formatNursingStatus'](null)).toBe('--');
    });

    it('formatAuditFlag should map Y/N', () => {
      expect(component['formatAuditFlag']('Y')).toBe('Yes');
      expect(component['formatAuditFlag']('N')).toBe('No');
      expect(component['formatAuditFlag'](null)).toBe('--');
    });


  });

  describe('side panel', () => {
    it('should set activePanelAction on quick link click for panel actions', () => {
      fixture.detectChanges();
      component['unit'].set(mockUnit);
      component['onQuickLinkClick']({ label: 'Unit Notes', icon: 'note', enabled: true, action: 'unitNotes' });
      expect(component['activePanelAction']()).toBe('unitNotes');
    });




  });


});
