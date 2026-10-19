import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { HHFilterPanel } from './hh-filter-panel';
import { HHTemplateQuestionDto } from '../../models/audit-donation.model';

const mockQuestions: HHTemplateQuestionDto[] = [
  { questionCode: 'Q001', questionDescription: 'Question 1', sortSequence: 1, donationType: 'AL', templateId: 'T1', effDate: '2024-01-01', termDate: '2099-12-31' },
  { questionCode: 'Q002', questionDescription: 'Question 2', sortSequence: 2, donationType: 'AL', templateId: 'T1', effDate: '2024-01-01', termDate: '2099-12-31' },
  { questionCode: 'Q003', questionDescription: 'Question 3', sortSequence: 3, donationType: 'AL', templateId: 'T1', effDate: '2024-01-01', termDate: '2099-12-31' },
];

describe('HHFilterPanel', () => {
  let component: HHFilterPanel;
  let fixture: ComponentFixture<HHFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HHFilterPanel,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HHFilterPanel);
    component = fixture.componentInstance;
    component.questions = mockQuestions;
    fixture.detectChanges();
  });

  describe('initialSelected', () => {
    it('should set selectedCodes from input', () => {
      component.initialSelected = new Set(['Q001', 'Q003']);
      expect(component.selectedCodes.has('Q001')).toBe(true);
      expect(component.selectedCodes.has('Q003')).toBe(true);
      expect(component.selectedCodes.has('Q002')).toBe(false);
    });

    it('should clear selectedCodes when empty set is passed', () => {
      component.initialSelected = new Set(['Q001']);
      component.initialSelected = new Set();
      expect(component.selectedCodes.size).toBe(0);
    });
  });

  describe('filteredQuestions', () => {
    it('should return all questions when search term is empty', () => {
      component.searchTerm = '';
      expect(component.filteredQuestions().length).toBe(3);
    });


    it('should filter by sort sequence', () => {
      component.searchTerm = '3';
      const results = component.filteredQuestions();
      expect(results.some(q => q.questionCode === 'Q003')).toBe(true);
    });
  });

  describe('onSelectionChange', () => {
    it('should update selectedCodes from selected rows', () => {
      component.onSelectionChange([mockQuestions[0], mockQuestions[2]]);
      expect(component.selectedCodes.has('Q001')).toBe(true);
      expect(component.selectedCodes.has('Q003')).toBe(true);
      expect(component.selectedCodes.has('Q002')).toBe(false);
    });

    it('should clear selectedCodes when empty array passed', () => {
      component.onSelectionChange([mockQuestions[0]]);
      component.onSelectionChange([]);
      expect(component.selectedCodes.size).toBe(0);
    });
  });
  describe('syncDataTableSelection — no NG0100', () => {
    it('should not throw ExpressionChangedAfterItHasBeenCheckedError', fakeAsync(() => {
      component.initialSelected = new Set(['Q001']);
      tick(); // let Promise.resolve() microtask fire
      expect(() => fixture.detectChanges()).not.toThrow();
    }));
  });

  // ---------------------------------------------------------------------------
  // Additional coverage
  // ---------------------------------------------------------------------------

  describe('filteredQuestions — description search', () => {
    it('should filter questions by questionDescription substring', () => {
      component.searchTerm = 'Question 2';
      const results = component.filteredQuestions();
      expect(results.length).toBe(1);
      expect(results[0].questionCode).toBe('Q002');
    });

    it('should return empty array when term matches nothing', () => {
      component.searchTerm = 'zzznomatch';
      expect(component.filteredQuestions().length).toBe(0);
    });

    it('should be case-insensitive', () => {
      component.searchTerm = 'QUESTION 1';
      const results = component.filteredQuestions();
      expect(results.some(q => q.questionCode === 'Q001')).toBe(true);
    });
  });

  describe('onApply', () => {
    it('should emit apply event with the current selectedCodes set', () => {
      const emittedValues: Set<string>[] = [];
      component.apply.subscribe((codes: Set<string>) => emittedValues.push(codes));

      component.onSelectionChange([mockQuestions[0], mockQuestions[1]]);
      component.onApply();

      expect(emittedValues.length).toBe(1);
      expect(emittedValues[0].has('Q001')).toBe(true);
      expect(emittedValues[0].has('Q002')).toBe(true);
      expect(emittedValues[0].size).toBe(2);
    });

    it('should emit empty set when no questions selected', () => {
      const emittedValues: Set<string>[] = [];
      component.apply.subscribe((codes: Set<string>) => emittedValues.push(codes));

      component.onSelectionChange([]);
      component.onApply();

      expect(emittedValues.length).toBe(1);
      expect(emittedValues[0].size).toBe(0);
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      let cancelEmitted = false;
      component.cancel.subscribe(() => { cancelEmitted = true; });

      component.onCancel();

      expect(cancelEmitted).toBe(true);
    });
  });
});
