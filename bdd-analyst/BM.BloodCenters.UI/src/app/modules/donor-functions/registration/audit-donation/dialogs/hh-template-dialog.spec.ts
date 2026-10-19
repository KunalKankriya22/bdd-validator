import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { HHTemplateDialog, HHTemplateDialogData, HHTemplateQuestion } from './hh-template-dialog';

const mockTemplateQuestions: HHTemplateQuestion[] = [
  {
    questionCode: 'Q001',
    ask: 'Y',
    abbrFlag: 'N',
    abbrSeq: null,
    repeated: 'N',
    sequence: 1,
    questionNumber: '1',
    parentQuestion: '',
    responseFlag: 'Y',
    subFlag: 'N',
    goToNotes: '',
  },
  {
    questionCode: 'Q002',
    ask: 'Y',
    abbrFlag: 'Y',
    abbrSeq: 2,
    repeated: 'Y',
    sequence: 2,
    questionNumber: '2',
    parentQuestion: 'Q001',
    responseFlag: 'N',
    subFlag: 'Y',
    goToNotes: 'Go to page 10',
  },
  {
    questionCode: 'ACODE',
    ask: 'N',
    abbrFlag: 'N',
    abbrSeq: null,
    repeated: 'N',
    sequence: 3,
    questionNumber: '3',
    parentQuestion: '',
    responseFlag: 'Y',
    subFlag: 'N',
    goToNotes: '',
  },
];

describe('HHTemplateDialog', () => {
  let component: HHTemplateDialog;
  let fixture: ComponentFixture<HHTemplateDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HHTemplateDialog>>;

  function createComponent(data: HHTemplateDialogData = { templateQuestions: mockTemplateQuestions, templateName: 'AL' }) {
    TestBed.resetTestingModule();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [HHTemplateDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(HHTemplateDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  describe('Initialization', () => {
    it('should create the dialog component', () => {
      expect(component).toBeTruthy();
    });

    it('should populate questions from injected data', () => {
      expect(component.questions().length).toBe(3);
    });

    it('should set templateName from dialog data', () => {
      expect(component.data.templateName).toBe('AL');
    });

    it('should have correct displayedColumns', () => {
      expect(component.displayedColumns).toContain('questionCode');
      expect(component.displayedColumns).toContain('ask');
      expect(component.displayedColumns).toContain('goToNotes');
    });

    it('should define all displayed columns', () => {
      expect(component.displayedColumns).toContain('questionCode');
      expect(component.displayedColumns).toContain('ask');
      expect(component.displayedColumns).toContain('sequence');
      expect(component.displayedColumns.length).toBe(11);
    });

    it('should initialize with empty searchTermValue', () => {
      expect(component.searchTermValue).toBe('');
    });
  });

  describe('filteredQuestions — search', () => {
    it('should return all questions when search is empty', () => {
      component.onSearchChange('');
      expect(component.filteredQuestions().length).toBe(3);
    });

    it('should filter by questionCode (case-insensitive)', () => {
      component.onSearchChange('q001');
      const filtered = component.filteredQuestions();
      expect(filtered.some(q => q.questionCode === 'Q001')).toBe(true);
      expect(filtered.some(q => q.questionCode === 'ACODE')).toBe(false);
    });

    it('should filter by questionNumber', () => {
      component.onSearchChange('2');
      const filtered = component.filteredQuestions();
      expect(filtered.some(q => q.questionNumber === '2')).toBe(true);
    });

    it('should filter by parentQuestion', () => {
      component.onSearchChange('q001');
      const filtered = component.filteredQuestions();
      // Q002 has parentQuestion='Q001', so it also matches
      expect(filtered.some(q => q.questionCode === 'Q002')).toBe(true);
    });

    it('should return empty when no match', () => {
      component.onSearchChange('XXXXNOTFOUND');
      expect(component.filteredQuestions().length).toBe(0);
    });

    it('should update searchTerm signal on onSearchChange', () => {
      component.onSearchChange('test');
      expect(component.searchTerm()).toBe('test');
    });
  });

  describe('close', () => {
    it('should call dialogRef.close()', () => {
      component.close();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('Empty/null data handling', () => {
    it('should handle null templateQuestions gracefully', () => {
      createComponent({ templateQuestions: null as any });
      expect(component.questions().length).toBe(0);
    });

    it('should return empty filtered list when no questions', () => {
      createComponent({ templateQuestions: null as any });
      component.onSearchChange('anything');
      expect(component.filteredQuestions().length).toBe(0);
    });
  });

  describe('No templateName', () => {
    it('should work correctly without template name', () => {
      createComponent({ templateQuestions: mockTemplateQuestions });
      expect(component.data.templateName).toBeUndefined();
      expect(component.questions().length).toBe(3);
    });
  });
});
