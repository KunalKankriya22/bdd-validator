import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QaLibraryListComponent } from './qa-library-list.component';
import { Question } from '../../models/qa-library.models';

describe('QaLibraryListComponent', () => {
  let component: QaLibraryListComponent;
  let fixture: ComponentFixture<QaLibraryListComponent>;

  const mockQuestions: Question[] = [
    {
      questionCode: 'Q001',
      questionText: 'Test Question 1',
      sex: 'ALL',
      responseType: 'Single',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      isEditable: true,
      answerOptions: [],
      commentConfig: null
    },
    {
      questionCode: 'Q002',
      questionText: 'Test Question 2',
      sex: 'MALE',
      responseType: 'Multiple',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      isEditable: true,
      answerOptions: [],
      commentConfig: null
    },
    {
      questionCode: 'Q003',
      questionText: 'Test Question 3',
      sex: 'FEMALE',
      responseType: 'Comment',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      isEditable: false,
      answerOptions: [],
      commentConfig: null
    },
    {
      questionCode: 'Q004',
      questionText: 'Test Question 4',
      sex: 'ALL',
      responseType: 'Ranking',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      isEditable: true,
      answerOptions: [],
      commentConfig: null
    }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        QaLibraryListComponent]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(QaLibraryListComponent);
    component = fixture.componentInstance;


    });

  describe('question display', () => {
    it('should display all questions', () => {
      component.questions = mockQuestions;
      fixture.detectChanges();

      expect(component.questions.length).toBe(4);
    });

  });


  describe('selection state', () => {
    beforeEach(() => {
      component.questions = mockQuestions;
      fixture.detectChanges();
    });


    it('should return false when no question is selected', () => {
      component.selectedQuestionCode = null;

      expect(component.isSelected(mockQuestions[0])).toBe(false);
    });


    it('should handle selection state changes', () => {
      component.selectedQuestionCode = 'Q001';
      expect(component.isSelected(mockQuestions[0])).toBe(true);

      component.selectedQuestionCode = 'Q002';
      expect(component.isSelected(mockQuestions[0])).toBe(false);
      expect(component.isSelected(mockQuestions[1])).toBe(true);
    });
  });

  describe('icon mapping', () => {
    describe('response type icons', () => {
      it('should return correct icon for Single response type', () => {
        const icon = component.getResponseTypeIcon('Single');
        expect(icon).toBe('/assets/images/donor survey manager/radio-on.svg');
      });

      it('should return correct icon for Multiple response type', () => {
        const icon = component.getResponseTypeIcon('Multiple');
        expect(icon).toBe('/assets/images/donor survey manager/checked.svg');
      });

      it('should return correct icon for Comment response type', () => {
        const icon = component.getResponseTypeIcon('Comment');
        expect(icon).toBe('/assets/images/donor survey manager/Comment.svg');
      });

      it('should return correct icon for Ranking response type', () => {
        const icon = component.getResponseTypeIcon('Ranking');
        expect(icon).toBe('/assets/images/donor survey manager/Ranking.svg');
      });


    });

    describe('gender icons', () => {
      it('should return correct icon for MALE gender', () => {
        const icon = component.getGenderIcon('MALE');
        expect(icon).toBe('/assets/images/People/Male.svg');
      });

      it('should return correct icon for FEMALE gender', () => {
        const icon = component.getGenderIcon('FEMALE');
        expect(icon).toBe('/assets/images/People/Female.svg');
      });

      it('should return correct icon for ALL gender', () => {
        const icon = component.getGenderIcon('ALL');
        expect(icon).toBe('/assets/images/People/All.svg');
      });


    });
  });

  describe('input changes', () => {

    it('should update when selectedQuestionCode input changes', () => {
      component.selectedQuestionCode = 'Q001';
      fixture.detectChanges();
      expect(component.isSelected(mockQuestions[0])).toBe(true);

      component.selectedQuestionCode = 'Q002';
      fixture.detectChanges();
      expect(component.isSelected(mockQuestions[0])).toBe(false);
      expect(component.isSelected(mockQuestions[1])).toBe(true);
    });

  });

  describe('edge cases', () => {


    it('should handle non-editable questions', () => {
      const nonEditableQuestion: Question = {
        questionCode: 'Q001',
        questionText: 'Test',
        sex: 'ALL',
        responseType: 'Single',
        effectiveDate: new Date(),
        terminationDate: null,
        isEditable: false,
        answerOptions: [],
        commentConfig: null
      };

      component.questions = [nonEditableQuestion];
      fixture.detectChanges();

      expect(component.questions[0].isEditable).toBe(false);
    });
  });

  describe('event emission', () => {
    it('should only emit questionSelected event, not modify state', () => {
      spyOn(component.questionSelected, 'emit');
      const initialSelectedCode = component.selectedQuestionCode;

      component.onSelectQuestion(mockQuestions[0]);

      expect(component.selectedQuestionCode).toBe(initialSelectedCode);
      expect(component.questionSelected.emit).toHaveBeenCalled();
    });

    it('should emit complete question object with all properties', () => {
      spyOn(component.questionSelected, 'emit');
      const question = mockQuestions[2]; // Comment type with isEditable: false

      component.onSelectQuestion(question);

      const emittedQuestion = (component.questionSelected.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedQuestion.questionCode).toBeDefined();
      expect(emittedQuestion.questionText).toBeDefined();
      expect(emittedQuestion.sex).toBeDefined();
      expect(emittedQuestion.responseType).toBeDefined();
      expect(emittedQuestion.effectiveDate).toBeDefined();
      expect(emittedQuestion.isEditable).toBeDefined();
    });
  });
});
