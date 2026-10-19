import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { EquipmentStatisticsPanel } from './equipment-statistics-panel';
import { EquipmentStatusQueryApiService } from '../services/equipment-status-query-api.service';

describe('EquipmentStatisticsPanel', () => {
  let component: EquipmentStatisticsPanel;
  let fixture: ComponentFixture<EquipmentStatisticsPanel>;
  let apiServiceSpy: jasmine.SpyObj<EquipmentStatusQueryApiService>;

  const mockRow = {
    chapterId: 'OBK', equipType: '8150', equipId: 'E196', equipReference: 'EQ-000040',
    serialNumber: 'SN123', location: 'CENT', status: 'IN', statusDescription: 'In Operation',
    firstProductionDate: '2024-01-01', lastProductionDate: null,
  };

  const mockPeriod = { daysInService: 28, eventCount: 3, totalDowntimeHours: 6.5, percentAvailable: 99.04 };
  const emptyPeriod = { daysInService: 0, eventCount: 0, totalDowntimeHours: 0, percentAvailable: 0 };

  const mockStatistics = {
    equipType: '8150', equipTypeDescription: 'MCS-8150',
    equipId: 'E196', equipReference: 'EQ-000040',
    firstProductionDate: '2024-01-01',
    monthToDate: mockPeriod,
    previousMonth: { daysInService: 30, eventCount: 2, totalDowntimeHours: 4.0, percentAvailable: 99.44 },
    yearToDate: { daysInService: 209, eventCount: 12, totalDowntimeHours: 36.0, percentAvailable: 99.28 },
    previousYear: { daysInService: 365, eventCount: 20, totalDowntimeHours: 48.0, percentAvailable: 99.45 },
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('EquipmentStatusQueryApiService', ['getStatistics']);
    apiServiceSpy.getStatistics.and.returnValue(of({
      success: true, message: '', statusCode: 200,
      data: [mockStatistics],
      totalCount: 1,
    }));

    await TestBed.configureTestingModule({
      imports: [EquipmentStatisticsPanel, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: EquipmentStatusQueryApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentStatisticsPanel);
    component = fixture.componentInstance;
  });

  // ── Component lifecycle ──────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have null statistics initially', () => {
    expect(component.statistics).toBeNull();
  });

  it('should have loading false initially', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should default isOpen to false', () => {
    expect(component.isOpen).toBeFalse();
  });

  // ── Loading statistics ───────────────────────────────────────────────────────

  it('should load statistics when row and isOpen are set', () => {
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(apiServiceSpy.getStatistics).toHaveBeenCalledWith('8150', 'E196', 'EQ-000040');
  });

  it('should populate statistics data from API response', () => {
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.statistics).toBeTruthy();
    expect(component.statistics!.equipType).toBe('8150');
    expect(component.statistics!.equipTypeDescription).toBe('MCS-8150');
  });

  it('should populate month-to-date period data', () => {
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.statistics!.monthToDate.daysInService).toBe(28);
    expect(component.statistics!.monthToDate.eventCount).toBe(3);
    expect(component.statistics!.monthToDate.totalDowntimeHours).toBe(6.5);
  });

  it('should populate all four period sections', () => {
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.statistics!.monthToDate).toBeTruthy();
    expect(component.statistics!.previousMonth).toBeTruthy();
    expect(component.statistics!.yearToDate).toBeTruthy();
    expect(component.statistics!.previousYear).toBeTruthy();
  });

  it('should set loading to false after API completes', () => {
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.isLoading).toBeFalse();
  });

  // ── Guard conditions ─────────────────────────────────────────────────────────

  it('should not load statistics when isOpen is false', () => {
    component.row = mockRow as any;
    component.isOpen = false;
    component.ngOnChanges();
    expect(apiServiceSpy.getStatistics).not.toHaveBeenCalled();
  });

  it('should not load statistics when row is null', () => {
    component.row = null;
    component.isOpen = true;
    component.ngOnChanges();
    expect(apiServiceSpy.getStatistics).not.toHaveBeenCalled();
  });

  it('should not load statistics when both row is null and isOpen is false', () => {
    component.row = null;
    component.isOpen = false;
    component.ngOnChanges();
    expect(apiServiceSpy.getStatistics).not.toHaveBeenCalled();
  });

  // ── Error handling ───────────────────────────────────────────────────────────

  it('should provide zeroed statistics on API error', () => {
    apiServiceSpy.getStatistics.and.returnValue(throwError(() => new Error('Server error')));
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();

    expect(component.statistics).toBeTruthy();
    expect(component.statistics!.equipType).toBe('8150');
    expect(component.statistics!.monthToDate.daysInService).toBe(0);
    expect(component.statistics!.monthToDate.eventCount).toBe(0);
    expect(component.statistics!.previousMonth.totalDowntimeHours).toBe(0);
    expect(component.statistics!.yearToDate.percentAvailable).toBe(0);
  });

  it('should set loading to false on API error', () => {
    apiServiceSpy.getStatistics.and.returnValue(throwError(() => new Error('Server error')));
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.isLoading).toBeFalse();
  });

  it('should handle null data in successful response', () => {
    apiServiceSpy.getStatistics.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: null as any, totalCount: 0,
    }));
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.statistics).toBeNull();
  });

  it('should handle empty data array in response', () => {
    apiServiceSpy.getStatistics.and.returnValue(of({
      success: true, message: '', statusCode: 200, data: [], totalCount: 0,
    }));
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();
    expect(component.statistics).toBeNull();
  });

  // ── Close panel ──────────────────────────────────────────────────────────────

  it('should emit closePanel on close()', () => {
    spyOn(component.closePanel, 'emit');
    component.close();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  // ── Re-open with different row ────────────────────────────────────────────────

  it('should reload statistics when row changes while open', () => {
    component.row = mockRow as any;
    component.isOpen = true;
    component.ngOnChanges();

    const newRow = { ...mockRow, equipId: 'E999', equipReference: 'EQ-000999' };
    component.row = newRow as any;
    component.ngOnChanges();

    expect(apiServiceSpy.getStatistics).toHaveBeenCalledTimes(2);
    expect(apiServiceSpy.getStatistics).toHaveBeenCalledWith('8150', 'E999', 'EQ-000999');
  });
});
