import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { EquipmentDetailsView } from './equipment-details-view';
import { EquipmentStatusQueryApiService } from '../services/equipment-status-query-api.service';

describe('EquipmentDetailsView', () => {
  let component: EquipmentDetailsView;
  let fixture: ComponentFixture<EquipmentDetailsView>;
  let apiServiceSpy: jasmine.SpyObj<EquipmentStatusQueryApiService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockRow = {
    chapterId: 'OBK', equipType: '8150', equipId: 'E196', equipReference: 'EQ-000040',
    serialNumber: 'SN123', location: 'CENT', locationDescription: 'Central Lab',
    status: 'IN', statusDescription: 'In Operation',
    firstProductionDate: '2024-01-01', lastProductionDate: null,
    receivedDate: '2023-12-15', usageHoursPerDay: 8, usageDaysPerWeek: 5,
    manufacturer: 'Haemonetics', serviceContact: 'John Doe', servicePhone: '555-1234',
    serviceStartDate: '2024-01-01', serviceEndDate: null,
  };

  const mockDetailResponse = {
    ...mockRow,
    locationDescription: 'Central Laboratory',
    manufacturer: 'Haemonetics Corp',
  };

  const mockParmValues = [
    { sequence: 100, description: 'RPM Setting', value: '3400' },
    { sequence: 200, description: 'Electrical Socket Type', value: '110V' },
    { sequence: 400, description: 'Check Tubing', value: 'YES' },
  ];

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('EquipmentStatusQueryApiService', [
      'getEquipmentById', 'getEquipmentParmValues',
    ]);
    apiServiceSpy.getEquipmentById.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: [mockDetailResponse], totalCount: 1,
    }));
    apiServiceSpy.getEquipmentParmValues.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: mockParmValues, totalCount: 3,
    }));

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: signal({ title: 'Status and History Query', subtitle: '' }),
    });

    await TestBed.configureTestingModule({
      imports: [EquipmentDetailsView, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: EquipmentStatusQueryApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentDetailsView);
    component = fixture.componentInstance;
  });

  // ── Component lifecycle ──────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have loading false initially', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should have null details initially', () => {
    expect(component.details).toBeNull();
  });

  it('should have empty configurable details initially', () => {
    expect(component.configurableDetails).toEqual([]);
  });

  // ── Loading details ──────────────────────────────────────────────────────────

  it('should load details when row input changes', () => {
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(apiServiceSpy.getEquipmentById).toHaveBeenCalledWith('8150', 'E196', 'EQ-000040');
    expect(apiServiceSpy.getEquipmentParmValues).toHaveBeenCalledWith('8150', 'E196', 'EQ-000040');
  });

  it('should set details from API response', () => {
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.details).toBeTruthy();
    expect(component.details!.manufacturer).toBe('Haemonetics Corp');
  });

  it('should set loading to false after API completes', () => {
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.isLoading).toBeFalse();
  });

  // ── Sequence renumbering ─────────────────────────────────────────────────────

  it('should renumber configurable details sequence starting from 1', () => {
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.configurableDetails.length).toBe(3);
    expect(component.configurableDetails[0].sequence).toBe(1);
    expect(component.configurableDetails[1].sequence).toBe(2);
    expect(component.configurableDetails[2].sequence).toBe(3);
  });

  it('should preserve description and value during renumbering', () => {
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.configurableDetails[0].description).toBe('RPM Setting');
    expect(component.configurableDetails[0].value).toBe('3400');
  });

  // ── Empty data handling ──────────────────────────────────────────────────────

  it('should handle empty configurable details', () => {
    apiServiceSpy.getEquipmentParmValues.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: [], totalCount: 0,
    }));
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.configurableDetails).toEqual([]);
  });

  it('should handle null data in equipment response', () => {
    apiServiceSpy.getEquipmentById.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: null as any, totalCount: 0,
    }));
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.details).toEqual(mockRow as any);
  });

  it('should handle null data in parm values response', () => {
    apiServiceSpy.getEquipmentParmValues.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: null as any, totalCount: 0,
    }));
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.configurableDetails).toEqual([]);
  });

  // ── Error handling ───────────────────────────────────────────────────────────

  it('should fall back to input row on API error', () => {
    apiServiceSpy.getEquipmentById.and.returnValue(throwError(() => new Error('Server error')));
    apiServiceSpy.getEquipmentParmValues.and.returnValue(throwError(() => new Error('Server error')));
    component.row = mockRow as any;
    component.ngOnChanges();

    expect(component.details).toEqual(mockRow as any);
    expect(component.configurableDetails).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  // ── Header config ────────────────────────────────────────────────────────────

  it('should update header title with equipId and equipType', () => {
    component.row = mockRow as any;
    component.ngOnChanges();
    expect(component.headerConfig.title).toBe('E196 - 8150');
  });

  it('should have back button enabled in header', () => {
    expect(component.headerConfig.showBackButton).toBeTrue();
  });

  // ── goBack output ────────────────────────────────────────────────────────────

  it('should emit goBack when back button is clicked', () => {
    spyOn(component.goBack, 'emit');
    component.headerConfig.onBackClick!();
    expect(component.goBack.emit).toHaveBeenCalled();
  });

  // ── Table config ─────────────────────────────────────────────────────────────

  it('should have 3 columns for configurable details table', () => {
    expect(component.configTableConfig.columns.length).toBe(3);
    expect(component.configTableConfig.columns[0].key).toBe('sequence');
    expect(component.configTableConfig.columns[1].key).toBe('description');
    expect(component.configTableConfig.columns[2].key).toBe('value');
  });

  it('should not show pagination in config table', () => {
    expect(component.configTableConfig.showPagination).toBeFalse();
  });
});
