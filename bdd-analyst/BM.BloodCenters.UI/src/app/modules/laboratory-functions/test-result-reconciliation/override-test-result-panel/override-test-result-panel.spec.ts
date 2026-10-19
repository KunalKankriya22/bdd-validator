import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { OverrideTestResultPanel } from './override-test-result-panel';
import {
  ReconciliationUnitDto,
  ValidTestResultDto
} from '../models/test-result-reconciliation.model';

describe('OverrideTestResultPanel', () => {
  let component: OverrideTestResultPanel;
  let fixture: ComponentFixture<OverrideTestResultPanel>;

  const mockUnit: ReconciliationUnitDto = {
    tbSeqNo: 2,
    unitId: 'W633316100205',
    checkDigit: 'X',
    collDate: '2026-05-28T00:00:00Z',
    tempResult1: 'P',
    tempResult2: 'N',
    resultCodeDesc1: 'Positive',
    resultCodeDesc2: 'Negative',
    tech1UserId: 'JOHNL',
    tech1UserName: 'John Lee',
    tech2UserId: 'CELHUN',
    tech2UserName: 'Celeste Hunter',
    supervisorResult: null,
    resultStatDesc: null
  };

  const mockValidResults: ValidTestResultDto[] = [
    { resultStatus: 'P', codeDesc: 'Positive' },
    { resultStatus: 'N', codeDesc: 'Negative' },
    { resultStatus: 'NR', codeDesc: 'Nonreactive' }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [OverrideTestResultPanel, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(OverrideTestResultPanel);
    component = fixture.componentInstance;

    // Set required inputs
    component.tbId = '100216-TB 1021';
    component.testId = 'IAT';
    component.testDesc = 'IAT - Indirect Antiglobulin Test';
    component.unit = mockUnit;
    component.validResults = mockValidResults;

    fixture.detectChanges();


    });

  describe('Initialization', () => {

    it('should initialize form with empty supervisor result', () => {
      expect(component.form.get('supervisorResult')?.value).toBe('');
    });


    it('should display unit information', () => {
      const unitIdElement = fixture.debugElement.query(By.css('.unit-id'));
      expect(unitIdElement.nativeElement.textContent).toContain('W633316100205-X');
    });

    it('should display test description', () => {
      const detailsElement = fixture.debugElement.query(
        By.css('.unit-details')
      );
      expect(detailsElement.nativeElement.textContent).toContain(
        'IAT - Indirect Antiglobulin Test'
      );
    });
  });

  describe('Discrepancy Detection', () => {
    it('should show discrepancy badge when Tech 1 and Tech 2 results differ', () => {
      const badge = fixture.debugElement.query(
        By.css('.discrepancy-badge')
      );
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent.trim()).toBe('1 discrepancy');
    });

    it('should highlight Tech 2 card when supervisor selects matching result', () => {
      component.form.patchValue({ supervisorResult: 'N' });
      fixture.detectChanges();

      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      const tech2Card = techCards[1];
      expect(tech2Card.nativeElement.classList.contains('discrepancy-highlight')).toBeTrue();
    });

    it('should highlight Tech 1 card when supervisor selects matching result', () => {
      component.form.patchValue({ supervisorResult: 'P' });
      fixture.detectChanges();

      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      const tech1Card = techCards[0];
      expect(tech1Card.nativeElement.classList.contains('discrepancy-highlight')).toBeTrue();
    });

    it('should not highlight any card before supervisor selects a result', () => {
      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      expect(techCards[0].nativeElement.classList.contains('discrepancy-highlight')).toBeFalse();
      expect(techCards[1].nativeElement.classList.contains('discrepancy-highlight')).toBeFalse();
    });



    it('should show confirmed message when Tech 2 result is NULL marker', () => {
      component.unit = {
        ...mockUnit,
        tempResult2: 'NULL'
      };
      fixture.detectChanges();

      const noResult = fixture.debugElement.query(By.css('.no-result'));
      expect(noResult).toBeTruthy();
      expect(noResult.nativeElement.textContent.trim()).toBe('Confirmed Tech 1 result');
    });
  });

  describe('Tech Result Display', () => {

    it('should display Tech 1 result with description', () => {
      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      const tech1Card = techCards[0];
      const result = tech1Card.query(By.css('.tech-result'));

      expect(result.nativeElement.textContent.trim()).toBe('P - Positive');
    });


    it('should display Tech 2 result with description', () => {
      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      const tech2Card = techCards[1];
      const result = tech2Card.query(By.css('.tech-result'));

      expect(result.nativeElement.textContent.trim()).toBe('N - Negative');
    });

    it('should display Tech 1 badge', () => {
      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      const tech1Badge = techCards[0].query(By.css('.tech-badge'));
      expect(tech1Badge.nativeElement.textContent.trim()).toBe('Tech 1');
    });

    it('should display Tech 2 badge', () => {
      const techCards = fixture.debugElement.queryAll(By.css('.tech-card'));
      const tech2Badge = techCards[1].query(By.css('.tech-badge'));
      expect(tech2Badge.nativeElement.textContent.trim()).toBe('Tech 2');
    });
  });

  describe('Supervisor Result Dropdown', () => {
    it('should populate dropdown with valid results', () => {
      const select = fixture.debugElement.query(
        By.css('mat-select[formControlName="supervisorResult"]')
      );
      select.nativeElement.click();
      fixture.detectChanges();

      const allOptions = fixture.debugElement.queryAll(By.css('mat-option'));
      const resultOptions = allOptions.filter(o => o.nativeElement.getAttribute('value') !== null || o.nativeElement.querySelector('ngx-mat-select-search') === null);
      expect(allOptions.length).toBeGreaterThanOrEqual(3);
    });


  });

  describe('Warning Message', () => {
    it('should display warning message', () => {
      const warning = fixture.debugElement.query(
        By.css('.warning-message')
      );
      expect(warning).toBeTruthy();
      expect(warning.nativeElement.textContent).toContain(
        'The supervisor result is final and overrides both Tech 1 and Tech 2 entries'
      );
    });


    it('should display warning icon', () => {
      const icon = fixture.debugElement.query(
        By.css('.warning-message mat-icon')
      );
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toBe('warning');
    });
  });
  describe('Accessibility', () => {



    it('should link error message to input with aria-describedby', () => {
      component.form.get('supervisorResult')?.markAsTouched();
      fixture.detectChanges();

      const select = fixture.debugElement.query(
        By.css('mat-select[formControlName="supervisorResult"]')
      );
      const ariaDescribedBy = select.nativeElement.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toContain('error');
    });

  });
  describe('Unit ID Formatting', () => {
    it('should format unit ID with check digit', () => {
      expect(component.formatUnitId()).toBe('W633316100205-X');
    });

    it('should format unit ID without check digit', () => {
      component.unit = { ...mockUnit, checkDigit: null };
      expect(component.formatUnitId()).toBe('W633316100205');
    });

  });
});
