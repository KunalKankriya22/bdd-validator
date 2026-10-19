import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ViewTestPanel, ViewTestRow } from './view-test-panel';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ViewTestPanel', () => {
  let component: any;
  let fixture: ComponentFixture<ViewTestPanel>;

  const mockScheduledTests: ViewTestRow[] = [
    { testId: 'ABO', ts: 1, result: 'PASS', tbId: 'TB20240115001', absorbance: '0.125', ratio: '1.5' },
    { testId: 'RH', ts: 1, result: 'PASS', tbId: 'TB20240115001', absorbance: '0.200', ratio: '2.0' },
    { testId: 'HBC', ts: 2, result: 'FAIL', tbId: 'TB20240115002', absorbance: '0.500', ratio: '3.1' }
  ];

  const mockUnscheduledTests: ViewTestRow[] = [
    { testId: 'HCV', ts: 1, result: 'PASS', tbId: 'TB20240115003', absorbance: '0.150', ratio: '1.2' }
  ];

  beforeEach(() => {

    const mockTranslateService = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [ViewTestPanel, NoopAnimationsModule],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    



    fixture = TestBed.createComponent(ViewTestPanel);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should default unitId to empty string', () => {
      expect(component.unitId()).toBe('');
    });

    it('should default scheduledTests to empty array', () => {
      expect(component.scheduledTests()).toEqual([]);
    });

    it('should default unscheduledTests to empty array', () => {
      expect(component.unscheduledTests()).toEqual([]);
    });

    it('should reflect scheduledTests input changes', () => {
      fixture.componentRef.setInput('scheduledTests', mockScheduledTests);
      fixture.componentRef.setInput('unscheduledTests', mockUnscheduledTests);
      fixture.detectChanges();

      expect(component.scheduledTests()).toEqual(mockScheduledTests);
      expect(component.scheduledTests().length).toBe(3);
    });

    it('should reflect unscheduledTests input changes', () => {
      fixture.componentRef.setInput('scheduledTests', mockScheduledTests);
      fixture.componentRef.setInput('unscheduledTests', mockUnscheduledTests);
      fixture.detectChanges();

      expect(component.unscheduledTests()).toEqual(mockUnscheduledTests);
      expect(component.unscheduledTests().length).toBe(1);
    });
  });

  describe('Table Configuration', () => {








    it('should disable pagination on both tables', () => {
      expect(component.scheduledTableConfig.showPagination).toBeFalse();
      expect(component.unscheduledTableConfig.showPagination).toBeFalse();
    });

    it('should enable sticky header on both tables', () => {
      expect(component.scheduledTableConfig.stickyHeader).toBeTrue();
      expect(component.unscheduledTableConfig.stickyHeader).toBeTrue();
    });

    it('should disable row highlight on both tables', () => {
      expect(component.scheduledTableConfig.enableRowHighlight).toBeFalse();
      expect(component.unscheduledTableConfig.enableRowHighlight).toBeFalse();
    });
  });
  describe('Template', () => {
    it('should display unit ID in heading', () => {
      fixture.componentRef.setInput('unitId', 'W1234567890');
      fixture.componentRef.setInput('scheduledTests', []);
      fixture.componentRef.setInput('unscheduledTests', []);
      fixture.detectChanges();

      const heading = fixture.debugElement.query(By.css('.panel-heading'));
      expect(heading.nativeElement.textContent).toContain('W1234567890');
    });





    it('should render scheduled tests section', () => {
      fixture.detectChanges();

      const section = fixture.debugElement.queryAll(By.css('.section-title'));
      expect(section.length).toBe(2);
      expect(section[0].nativeElement.textContent).toContain('Unit Tests Scheduled');
      expect(section[1].nativeElement.textContent).toContain('Unit Test Not Scheduled');
    });

    it('should render two data tables', () => {
      fixture.componentRef.setInput('scheduledTests', mockScheduledTests);
      fixture.componentRef.setInput('unscheduledTests', mockUnscheduledTests);
      fixture.detectChanges();

      const tables = fixture.debugElement.queryAll(By.css('app-data-table'));
      expect(tables.length).toBe(2);
    });
  });
});
