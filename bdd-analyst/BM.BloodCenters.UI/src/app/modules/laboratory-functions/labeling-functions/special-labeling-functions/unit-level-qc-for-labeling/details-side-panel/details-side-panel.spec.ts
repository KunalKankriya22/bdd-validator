import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { UnitLevelQcDetailsSidePanel } from './details-side-panel';
import { UnitLevelQcApiService } from '../services/unit-level-qc-api.service';
import { UnitLevelQCDetailDto } from '../models/unit-level-qc.model';

describe('UnitLevelQcDetailsSidePanel', () => {
  let component: any;
  let fixture: ComponentFixture<UnitLevelQcDetailsSidePanel>;
  let apiServiceSpy: jasmine.SpyObj<UnitLevelQcApiService>;

  const mockDetailDto: UnitLevelQCDetailDto = {
    unitId: 'UNIT001',
    collDate: '2024-01-15T00:00:00Z',
    chapterId: 'CHAP01',
    productCode: 'RBC',
    productDescription: 'Red Blood Cells',
    qcLabelFlag: 'Y',
    systemLabelDecision: 'APPROVED',
    labelDats: '2024-01-16T00:00:00Z',
    abo: 'A',
    rh: '+',
    donorInterface: 'DI001',
    expirationDate: '2024-02-15T00:00:00Z',
    volume: 450,
    status: 'ACTIVE',
    insertDate: '2024-01-15T10:00:00Z',
    insertUser: 'TESTUSER',
    testResultStatus: 'COMPLETED',
    testCompletionDate: '2024-01-16T12:00:00Z',
    testCount: 5,
    testsPassed: 5,
    testsFailed: 0
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('UnitLevelQcApiService', ['getUnitDetail']);



      TestBed.configureTestingModule({
imports: [UnitLevelQcDetailsSidePanel, NoopAnimationsModule],
      providers: [
        { provide: UnitLevelQcApiService, useValue: apiServiceSpy }
      ]
    });


    });



  beforeEach(() => {


      apiServiceSpy.getUnitDetail.calls.reset();


    fixture = TestBed.createComponent(UnitLevelQcDetailsSidePanel);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {
    it('should load unit detail on init if unitId is provided', () => {
      component.unitId = 'UNIT001';
      apiServiceSpy.getUnitDetail.and.returnValue(of(mockDetailDto));

      fixture.detectChanges();

      expect(apiServiceSpy.getUnitDetail).toHaveBeenCalledWith('UNIT001');
      expect(component.unitDetail()).toEqual(mockDetailDto);
    });

  });
  describe('Error State', () => {
    it('should show error message on load failure', () => {
      component.unitId = 'UNIT001';
      apiServiceSpy.getUnitDetail.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load');
    });

  });

  describe('Display Unit Details', () => {
    beforeEach(() => {
      component.unitId = 'UNIT001';
      apiServiceSpy.getUnitDetail.and.returnValue(of(mockDetailDto));
      fixture.detectChanges();
    });

    it('should display basic information section', () => {
      const content = fixture.nativeElement;
      expect(content.textContent).toContain('Basic Information');
      expect(content.textContent).toContain('UNIT001');
      expect(content.textContent).toContain('CHAP01');
    });

    it('should display QC and labeling section', () => {
      const content = fixture.nativeElement;
      expect(content.textContent).toContain('QC and Labeling');
      expect(content.textContent).toContain('APPROVED');
    });

    it('should display test results section when available', () => {
      const content = fixture.nativeElement;
      expect(content.textContent).toContain('Test Results');
      expect(content.textContent).toContain('COMPLETED');
    });

    it('should display audit information section', () => {
      const content = fixture.nativeElement;
      expect(content.textContent).toContain('Audit Information');
      expect(content.textContent).toContain('TESTUSER');
    });
  });

  describe('Date Formatting', () => {


    it('should handle invalid date strings', () => {
      const result = component.formatDate('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('Value Formatting', () => {
    it('should return "N/A" for null or undefined values', () => {
      expect(component.formatValue(null)).toBe('N/A');
      expect(component.formatValue(undefined)).toBe('N/A');
      expect(component.formatValue('')).toBe('N/A');
    });

  });
  describe('Accessibility', () => {
    beforeEach(() => {
      component.unitId = 'UNIT001';
      apiServiceSpy.getUnitDetail.and.returnValue(of(mockDetailDto));
      fixture.detectChanges();
    });



    it('should have unique section heading IDs', () => {
      const headings = fixture.debugElement.queryAll(By.css('h3[id]'));
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs for multiple instances', () => {
      const fixture2 = TestBed.createComponent(UnitLevelQcDetailsSidePanel);
      const component2 = fixture2.componentInstance as any;

      expect(component.componentId).not.toBe(component2.componentId);
    });
  });
});
