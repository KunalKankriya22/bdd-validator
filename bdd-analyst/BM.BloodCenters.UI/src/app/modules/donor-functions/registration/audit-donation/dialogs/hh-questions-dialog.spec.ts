import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { HHQuestionsDialog, HHQuestionDto, HHQuestionsDialogData } from './hh-questions-dialog';

describe('HHQuestionsDialog', () => {
  let component: HHQuestionsDialog;
  let fixture: ComponentFixture<HHQuestionsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HHQuestionsDialog>>;

  const mockQuestions: HHQuestionDto[] = [
    {
      questionCode: 'Q001',
      questionText: 'Have you donated blood before?',
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
      questionText: 'Are you feeling well today?',
      ask: 'Y',
      abbrFlag: 'N',
      abbrSeq: 2,
      repeated: 'Y',
      sequence: 2,
      questionNumber: '2',
      parentQuestion: 'Q001',
      responseFlag: 'Y',
      subFlag: 'Y',
      goToNotes: 'See page 5',
    },
  ];

  const defaultDialogData: HHQuestionsDialogData = {
    questions: mockQuestions,
  };

  function createComponent(data: HHQuestionsDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [HHQuestionsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(HHQuestionsDialog);
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

    it('should populate questions from injected data on ngOnInit', () => {
      expect(component.questions().length).toBe(2);
      expect(component.questions()[0].questionCode).toBe('Q001');
    });

    it('should have correct displayedColumns', () => {
      expect(component.displayedColumns).toContain('questionCode');
      expect(component.displayedColumns).toContain('ask');
      expect(component.displayedColumns).toContain('goToNotes');
    });

    it('should define all displayed columns', () => {
      expect(component.displayedColumns).toContain('questionCode');
      expect(component.displayedColumns).toContain('ask');
      expect(component.displayedColumns).toContain('abbrFlag');
      expect(component.displayedColumns).toContain('goToNotes');
      expect(component.displayedColumns.length).toBe(11);
    });
  });

  describe('filteredQuestions computed', () => {
    it('should return all questions', () => {
      expect(component.filteredQuestions().length).toBe(2);
    });

    it('should return same reference as questions signal', () => {
      expect(component.filteredQuestions()).toEqual(component.questions());
    });
  });

  describe('close', () => {
    it('should call dialogRef.close()', () => {
      component.close();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('ngOnInit — empty data', () => {
    it('should handle empty questions array', () => {
      createComponent({ questions: [] });
      expect(component.questions().length).toBe(0);
      expect(component.filteredQuestions().length).toBe(0);
    });
  });

  describe('ngOnInit — null data', () => {
    it('should handle null questions gracefully', () => {
      createComponent({ questions: null as any });
      expect(component.questions().length).toBe(0);
    });
  });

  it('should expose data from MAT_DIALOG_DATA', () => {
    expect(component.data.questions).toEqual(mockQuestions);
  });
});
