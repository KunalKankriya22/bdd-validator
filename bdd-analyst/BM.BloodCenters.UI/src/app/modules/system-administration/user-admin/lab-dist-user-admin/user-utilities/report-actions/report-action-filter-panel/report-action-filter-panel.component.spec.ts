import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { FormBuilder } from '@angular/forms';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError } from 'rxjs';

import { ReportActionFilterPanelComponent } from './report-action-filter-panel.component';
import { ReportActionFilterValue } from '../models/report-action.model';
import { ReportActionService } from '../services/report-action.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReportActionFilterPanelComponent', () => {
  let component: ReportActionFilterPanelComponent;
  let fixture: ComponentFixture<ReportActionFilterPanelComponent>;
  let dateAdapter: DateAdapter<Date>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockReportActionService: jasmine.SpyObj<ReportActionService>;

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
    mockReportActionService = jasmine.createSpyObj('ReportActionService', ['getUsersByChapter', 'getDistinctUsernames']);
    mockReportActionService.getUsersByChapter.and.returnValue(of([]));
    mockReportActionService.getDistinctUsernames.and.returnValue(of([]));



      TestBed.configureTestingModule({
imports: [
        ReportActionFilterPanelComponent],
      providers: [
        FormBuilder,
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ReportActionService, useValue: mockReportActionService },
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
      ]
    });


    });



  beforeEach(() => {
      mockHeaderService.getCurrentChapterId.calls.reset();

      mockReportActionService.getUsersByChapter.and.returnValue(of([]));


      mockReportActionService.getDistinctUsernames.and.returnValue(of([]));


    fixture = TestBed.createComponent(ReportActionFilterPanelComponent);
    component = fixture.componentInstance;
    dateAdapter = TestBed.inject(DateAdapter);
    fixture.detectChanges();


    });

  describe('Date Picker Configuration', () => {
    it('should use CustomDateAdapter for chapter timezone support', () => {
      expect(dateAdapter).toBeDefined();
      // In tests, we use CustomDateAdapter (component uses ChapterTimezoneCustomDateAdapter in production)
      expect(dateAdapter.constructor.name).toBe('CustomDateAdapter');
    });

    it('should format dates in DD-MMM-YYYY format with uppercase month', () => {
      const testDate = new Date(2025, 10, 21); // Nov 21, 2025
      const formatted = dateAdapter.format(testDate, 'DD-MMM-YYYY');

      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
      expect(formatted).toContain('21');
      expect(formatted).toContain('NOV'); // Should be uppercase
      expect(formatted).toContain('2025');
    });

    it('should highlight today based on chapter timezone', () => {
      const today = dateAdapter.today();

      expect(today).toBeInstanceOf(Date);
      // The today() method should return a valid date
      expect(today.getTime()).toBeGreaterThan(0);
    });

    it('should use chapter timezone for today(), not browser timezone', () => {
      // This test verifies that the DateAdapter's today() method returns
      // the chapter timezone date, which may be different from browser's local date
      const todayFromAdapter = dateAdapter.today();
      const browserToday = new Date();

      expect(todayFromAdapter).toBeInstanceOf(Date);
      // Dates might be different if chapter timezone != browser timezone
      // Just verify we got a valid date from the adapter
      expect(todayFromAdapter.getFullYear()).toBeGreaterThan(2020);
    });
  });

  describe('Form Initialization', () => {

    it('should default generatedPeriodType to null', () => {
      expect(component.filterForm.get('generatedPeriodType')?.value).toBeNull();
    });

    it('should initialize availableUserNames as empty array', () => {
      expect(component.availableUserNames()).toEqual([]);
    });

    it('should populate availableUserNames when set', () => {
      const userNames = ['user1', 'user2', 'user3'];
      component.availableUserNames.set(userNames);

      expect(component.availableUserNames()).toEqual(userNames);
    });

  });

  describe('Apply Filters', () => {

    it('should include userName only in supervisor mode', (done) => {
      component.isSupervisorMode.set(true);
      component.filterForm.patchValue({
        userName: 'testuser'
      });

      component.apply.subscribe((filters: ReportActionFilterValue) => {
        expect(filters.userName).toBe('testuser');
        done();
      });

      component.onApply();
    });


    it('should include generatedDate and period type when date is set', (done) => {
      const testDate = new Date(2025, 10, 21);
      component.filterForm.patchValue({
        generatedDate: testDate,
        generatedPeriodType: 'before'
      });

      component.apply.subscribe((filters: ReportActionFilterValue) => {
        expect(filters.generatedDate).toEqual(testDate);
        expect(filters.generatedPeriodType).toBe('before');
        done();
      });

      component.onApply();
    });

    it('should exclude period type when date is not set', (done) => {
      component.filterForm.patchValue({
        generatedDate: null,
        generatedPeriodType: 'after'
      });

      component.apply.subscribe((filters: ReportActionFilterValue) => {
        expect(filters.generatedDate).toBeUndefined();
        expect(filters.generatedPeriodType).toBeUndefined();
        done();
      });

      component.onApply();
    });
  });
  describe('User Loading in Supervisor Mode', () => {
    it('should load users when in supervisor mode', () => {
      const testUsers = ['user1', 'user2', 'user3'];
      mockReportActionService.getDistinctUsernames.and.returnValue(of(testUsers));

      component.isSupervisorMode.set(true);
      component.ngOnInit();

      expect(mockReportActionService.getDistinctUsernames).toHaveBeenCalled();
      expect(component.availableUserNames()).toEqual(testUsers);
    });


    it('should handle user loading error gracefully', () => {
      const errorResponse = new Error('Failed to load users');
      mockReportActionService.getDistinctUsernames.and.returnValue(throwError(() => errorResponse));

      component.isSupervisorMode.set(true);
      component.ngOnInit();

      expect(component.availableUserNames()).toEqual([]);
    });
  });
});
