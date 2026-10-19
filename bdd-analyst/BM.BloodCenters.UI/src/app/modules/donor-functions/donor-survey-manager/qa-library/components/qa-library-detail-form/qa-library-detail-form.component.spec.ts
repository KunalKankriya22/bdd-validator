import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { QaLibraryDetailFormComponent } from './qa-library-detail-form.component';
import { Question, Answer } from '../../models/qa-library.models';

describe('QaLibraryDetailFormComponent', () => {
  let component: QaLibraryDetailFormComponent;
  let fixture: ComponentFixture<QaLibraryDetailFormComponent>;

  const mockQuestion: Question = {
    questionCode: 'Q001',
    questionText: 'Test Question',
    sex: 'ALL',
    responseType: 'Single',
    effectiveDate: new Date('2024-01-01'),
    terminationDate: new Date('2024-12-31'),
    isEditable: true,
    answerOptions: [
      {
        sequence: 1,
        answerCode: 'A001',
        answerCodeDescription: 'Answer 1',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 1,
        isEditable: true,
        errors: {}
      }
    ],
    commentConfig: null
  };

  const mockCommentQuestion: Question = {
    questionCode: 'Q002',
    questionText: 'Comment Question',
    sex: 'MALE',
    responseType: 'Comment',
    effectiveDate: new Date('2024-01-01'),
    terminationDate: null,
    isEditable: true,
    answerOptions: [],
    commentConfig: {
      characterLimit: 240,
      answerCode: 'C001',
      answerDesc: 'Enter your comments here',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null
    }
  };

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [
        QaLibraryDetailFormComponent,
        ReactiveFormsModule],
      providers: [provideHttpClient()]
    });


    



    fixture = TestBed.createComponent(QaLibraryDetailFormComponent);
    component = fixture.componentInstance;


    });


  describe('form initialization', () => {


    it('should populate form in edit mode', () => {
      component.mode = 'edit';
      component.question = mockQuestion;
      component.ngOnInit();

      expect(component.form.get('questionCode')?.value).toBe('Q001');
      expect(component.form.get('questionText')?.value).toBe('Test Question');
      expect(component.form.get('sex')?.value).toBe('ALL');
      expect(component.form.get('responseType')?.value).toBe('Single');
      expect(component.answerOptions.length).toBe(1);
    });

    it('should populate comment fields in edit mode for Comment type', () => {
      component.mode = 'edit';
      component.question = mockCommentQuestion;
      component.ngOnInit();

      expect(component.form.get('characterLimit')?.value).toBe(240);
      expect(component.form.get('commentAnswerCode')?.value).toBe('C001');
      expect(component.form.get('commentEffectiveDate')?.value).toBeDefined();
    });

    it('should set required validators on required fields', () => {
      component.ngOnInit();

      expect(component.form.get('questionCode')?.hasError('required')).toBe(true);
      expect(component.form.get('sex')?.hasError('required')).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
      expect(component.form.get('questionText')?.hasError('required')).toBe(true);
    });


  });

  describe('response type changes', () => {
    beforeEach(() => {
      component.ngOnInit();
    });









    it('should set validators on comment fields when Comment selected', fakeAsync(() => {
      component.form.patchValue({ responseType: 'Comment' });
      tick(0);

      // Force updateValueAndValidity on controls not explicitly updated in the component's setTimeout.
      // setValue(null) on characterLimit (which defaults to 240) exposes the required error.
      component.form.get('characterLimit')?.setValue(null);
      component.form.get('commentAnswerCode')?.updateValueAndValidity();

      expect(component.form.get('characterLimit')?.hasError('required')).toBe(true);
      expect(component.form.get('commentAnswerCode')?.hasError('required')).toBe(true);
      expect(component.form.get('commentEffectiveDate')?.hasError('required')).toBe(true);
    }));





    it('should initialize one empty row when switching to Single/Multiple/Ranking', fakeAsync(() => {
      component.answerOptions = [];
      component.form.patchValue({ responseType: 'Single' });
      tick(0);

      expect(component.answerOptions.length).toBe(1);
      expect(component.answerOptions[0].sequence).toBe(1);
      expect(component.answerOptions[0].auditKey).toBe(0);
    }));


  });

  describe('answer options change handler', () => {
    it('should update answerOptions when emitted from table', () => {
      const newOptions: Answer[] = [
        {
          sequence: 1,
          answerCode: 'A001',
          answerCodeDescription: 'Answer 1',
          effectiveDate: new Date(),
          terminationDate: null,
          auditKey: 0,
          isEditable: true,
          errors: {}
        },
        {
          sequence: 2,
          answerCode: 'A002',
          answerCodeDescription: 'Answer 2',
          effectiveDate: new Date(),
          terminationDate: null,
          auditKey: 0,
          isEditable: true,
          errors: {}
        }
      ];

      component.onAnswerOptionsChange(newOptions);

      expect(component.answerOptions).toEqual(newOptions);
      expect(component.answerOptions.length).toBe(2);
    });
  });

  describe('save operation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });









    it('should preserve isEditable from existing question', () => {
      spyOn(component.save, 'emit');
      component.question = { ...mockQuestion, isEditable: false };
      component.ngOnInit();
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2027-01-01'),
        terminationDate: null,
        questionText: 'Test',
        responseType: 'Single'
      });

      component.onSave();

      const emittedEvent = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedEvent.question.isEditable).toBe(false);
    });

    it('should default isEditable to true for new questions', () => {
      spyOn(component.save, 'emit');
      component.question = null;
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2027-01-01'),
        questionText: 'Test',
        responseType: 'Single'
      });
      component.answerOptions = [{
        sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
        effectiveDate: new Date('2027-01-01'), terminationDate: null,
        auditKey: 0, isEditable: true, errors: {}
      }];

      component.onSave();

      const emittedEvent = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedEvent.question.isEditable).toBe(true);
    });

    it('should validate answer options table before saving', () => {
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2027-01-01'),
        questionText: 'Test',
        responseType: 'Single'
      });

      // Mock answer options table with invalid data
      const mockTable = {
        removeBlankRows: jasmine.createSpy('removeBlankRows'),
        validateAllRows: jasmine.createSpy('validateAllRows').and.returnValue(false)
      };
      component.answerOptionsTable = mockTable as any;
      spyOn(component.save, 'emit');

      component.onSave();

      expect(mockTable.validateAllRows).toHaveBeenCalled();
      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });


  describe('getResponseTypeIcon', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return correct icon path for Single', () => {
      const icon = component.getResponseTypeIcon('Single');
      expect(icon).toBe('/assets/images/donor survey manager/radio-on.svg');
    });

    it('should return correct icon path for Multiple', () => {
      const icon = component.getResponseTypeIcon('Multiple');
      expect(icon).toBe('/assets/images/donor survey manager/checked.svg');
    });

    it('should return correct icon path for Comment', () => {
      const icon = component.getResponseTypeIcon('Comment');
      expect(icon).toBe('/assets/images/donor survey manager/Comment.svg');
    });

    it('should return correct icon path for Ranking', () => {
      const icon = component.getResponseTypeIcon('Ranking');
      expect(icon).toBe('/assets/images/donor survey manager/Ranking.svg');
    });


  });

  describe('remainingCharacters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return characterLimit value', () => {
      component.form.patchValue({ characterLimit: 240 });

      expect(component.remainingCharacters).toBe(240);
    });

    it('should default to 240 if no value set', () => {
      component.form.patchValue({ characterLimit: null });

      expect(component.remainingCharacters).toBe(240);
    });
  });

  describe('canClearAll', () => {


    it('should be true in add mode when dirty', () => {
      component.mode = 'add';
      component.ngOnInit();
      component.isDirty = true;

      expect(component.canClearAll).toBe(true);
    });

    it('should be false in edit mode even when dirty', () => {
      component.mode = 'edit';
      component.ngOnInit();
      component.isDirty = true;

      expect(component.canClearAll).toBe(false);
    });


  });

  describe('canCancel', () => {
    it('should always be true in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      expect(component.canCancel).toBe(true);
    });

    it('should always be true in edit mode when not dirty', () => {
      component.mode = 'edit';
      component.ngOnInit();

      expect(component.canCancel).toBe(true);
    });

    it('should always be true in edit mode when dirty', () => {
      component.mode = 'edit';
      component.ngOnInit();
      component.isDirty = true;

      expect(component.canCancel).toBe(true);
    });
  });

  describe('field disable/enable based on mode', () => {
    it('should disable all question fields except terminationDate in edit mode', () => {
      component.mode = 'edit';
      component.question = mockQuestion;
      component.ngOnInit();

      expect(component.form.get('questionCode')?.disabled).toBe(true);
      expect(component.form.get('questionText')?.disabled).toBe(true);
      expect(component.form.get('sex')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
      expect(component.form.get('responseType')?.disabled).toBe(true);
      // Termination date stays editable
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
    });

    it('should disable same fields regardless of isEditable flag in edit mode', () => {
      component.mode = 'edit';
      component.question = { ...mockQuestion, isEditable: false };
      component.ngOnInit();

      expect(component.form.get('questionCode')?.disabled).toBe(true);
      expect(component.form.get('questionText')?.disabled).toBe(true);
      expect(component.form.get('sex')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
      expect(component.form.get('responseType')?.disabled).toBe(true);
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
    });

    it('should enable all question fields in add mode', () => {
      component.mode = 'add';
      component.question = { ...mockQuestion };
      component.ngOnInit();

      expect(component.form.get('questionCode')?.enabled).toBe(true);
      expect(component.form.get('questionText')?.enabled).toBe(true);
      expect(component.form.get('sex')?.enabled).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
      expect(component.form.get('responseType')?.enabled).toBe(true);
    });
  });

  describe('comment field reset on question change', () => {
    it('should reset comment fields to defaults when switching from Comment to non-Comment question', () => {
      component.mode = 'add';
      component.question = mockCommentQuestion;
      component.ngOnInit();

      // Simulate switching to a different question via ngOnChanges
      component.question = { ...mockQuestion };
      component.ngOnChanges({
        question: {
          currentValue: mockQuestion,
          previousValue: mockCommentQuestion,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('commentBoxText')?.value).toBe('');
      expect(component.form.get('commentAnswerCode')?.value).toBe('');
      expect(component.form.get('commentEffectiveDate')?.value).toBeNull();
      expect(component.form.get('commentTerminationDate')?.value).toBeNull();
    });

    it('should reset commentBoxText to empty when switching questions', () => {
      component.mode = 'add';
      component.question = mockCommentQuestion;
      component.ngOnInit();

      // Manually set commentBoxText to simulate user input
      component.form.get('commentBoxText')?.setValue('Some user text');

      // Switch to a new question
      component.question = { ...mockQuestion };
      component.ngOnChanges({
        question: {
          currentValue: mockQuestion,
          previousValue: mockCommentQuestion,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('commentBoxText')?.value).toBe('');
    });

    it('should populate commentBoxText from commentConfig.answerDesc on GET', fakeAsync(() => {
      component.mode = 'edit';
      component.question = mockCommentQuestion;
      component.ngOnInit();
      tick();

      expect(component.form.get('commentBoxText')?.value).toBe('Enter your comments here');
    }));
  });

  describe('hasAnswersChanged for Comment type', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.question = mockCommentQuestion;
      component.ngOnInit();
    });

    it('should return false when comment fields are unchanged', () => {
      // originalQuestion.commentConfig has answerCode='C001', effectiveDate=2024-01-01, terminationDate=null
      // Form was populated with the same values in ngOnInit
      expect((component as any).hasAnswersChanged()).toBe(false);
    });

    it('should return true when commentAnswerCode changes', () => {
      component.form.patchValue({ commentAnswerCode: 'C999' });

      expect((component as any).hasAnswersChanged()).toBe(true);
    });

    it('should return true when commentEffectiveDate changes', () => {
      component.form.patchValue({ commentEffectiveDate: new Date('2025-06-01') });

      expect((component as any).hasAnswersChanged()).toBe(true);
    });



    it('should return true when commentBoxText changes', () => {
      component.form.patchValue({ commentBoxText: 'Updated comment text' });

      expect((component as any).hasAnswersChanged()).toBe(true);
    });

    it('should return true when response type changed from Single to Comment', () => {
      // Simulate original question being Single type
      component.question = { ...mockQuestion };
      (component as any).originalQuestion = { ...mockQuestion };
      component.form.patchValue({ responseType: 'Comment' });

      expect((component as any).hasAnswersChanged()).toBe(true);
    });
  });

  describe('canSave in edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.question = mockQuestion;
      component.ngOnInit();
    });

    it('should be false when not dirty', () => {
      component.isDirty = false;

      expect(component.canSave).toBe(false);
    });

    it('should be false when dirty but answer options have blank new rows', () => {
      component.isDirty = true;
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 1, isEditable: true, errors: {}
        },
        {
          sequence: 2, answerCode: '', answerCodeDescription: '',
          effectiveDate: null, terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(false);
    });

    it('should be true when termination date actually changed and all answer options are valid', () => {
      // Simulate an actual termination date change so hasQuestionChanged() returns true
      component.form.patchValue({ terminationDate: new Date('2025-12-31') });
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 1, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(true);
    });

    it('should be false when dirty but a new row has missing required fields', () => {
      component.isDirty = true;
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 1, isEditable: true, errors: {}
        },
        {
          sequence: 2, answerCode: 'A002', answerCodeDescription: '',
          effectiveDate: new Date('2025-06-01'), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(false);
    });

    it('should be false when dirty but a row has validation errors', () => {
      component.isDirty = true;
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 1, isEditable: true,
          errors: { terminationDate: 'Termination Date cannot be before Effective Date' }
        }
      ];

      expect(component.canSave).toBe(false);
    });
  });

  describe('canSave in add mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should be false when base fields are empty', () => {
      expect(component.canSave).toBe(false);
    });

    it('should be true when base fields valid and answer options valid', () => {
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2027-01-01'),
        questionText: 'Test',
        responseType: 'Single'
      });
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(true);
    });

    it('should be false when answer options have blank new rows', () => {
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2024-01-01'),
        questionText: 'Test',
        responseType: 'Single'
      });
      component.answerOptions = [
        {
          sequence: 1, answerCode: '', answerCodeDescription: '',
          effectiveDate: null, terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(false);
    });

    it('should be true for Comment type when comment fields are valid', () => {
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2027-01-01'),
        questionText: 'Test',
        responseType: 'Comment',
        commentAnswerCode: 'C001',
        commentEffectiveDate: new Date('2027-06-01')
      });

      expect(component.canSave).toBe(true);
    });

    it('should be false for Comment type when comment fields are missing', fakeAsync(() => {
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2024-01-01'),
        questionText: 'Test',
        responseType: 'Comment'
      });
      tick(0); // Run setTimeout in setupResponseTypeListener to set comment validators

      component.form.patchValue({
        commentAnswerCode: '',
        commentEffectiveDate: null
      });
      component.form.get('commentAnswerCode')?.updateValueAndValidity();
      component.form.get('commentEffectiveDate')?.updateValueAndValidity();

      expect(component.canSave).toBe(false);
    }));
  });

  describe('areAnswerOptionsValidForSave (via canSave)', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        questionCode: 'Q001',
        sex: 'ALL',
        effectiveDate: new Date('2027-01-01'),
        questionText: 'Test',
        responseType: 'Single'
      });
    });

    it('should return false when no answer options exist', () => {
      component.answerOptions = [];

      expect(component.canSave).toBe(false);
    });

    it('should return false when only blank new rows exist', () => {
      component.answerOptions = [
        {
          sequence: 1, answerCode: '', answerCodeDescription: '',
          effectiveDate: null, terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(false);
    });

    it('should return false when a new row is partially filled (missing description)', () => {
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: '',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(false);
    });

    it('should return false when a new row is partially filled (missing effectiveDate)', () => {
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Desc',
          effectiveDate: null, terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(false);
    });

    it('should return true when existing rows have all required fields', () => {
      component.answerOptions = [
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'), terminationDate: null,
          auditKey: 1, isEditable: true, errors: {}
        }
      ];

      expect(component.canSave).toBe(true);
    });

    it('should return true for Comment response type with no answer options', () => {
      component.form.patchValue({
        responseType: 'Comment',
        commentAnswerCode: 'C001',
        commentEffectiveDate: new Date('2027-01-01')
      });
      component.answerOptions = [];

      expect(component.canSave).toBe(true);
    });
  });

  describe('hasQuestionChanged', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.question = mockQuestion;
      component.ngOnInit();
    });

    it('should return false when terminationDate has not changed', () => {
      expect((component as any).hasQuestionChanged()).toBe(false);
    });

    it('should return true when terminationDate changes', () => {
      component.form.patchValue({ terminationDate: new Date('2025-12-31') });

      expect((component as any).hasQuestionChanged()).toBe(true);
    });

    it('should return true when terminationDate is cleared', () => {
      component.form.patchValue({ terminationDate: null });

      // Original had a termination date, now null — changed
      expect((component as any).hasQuestionChanged()).toBe(true);
    });

    it('should return false when originalQuestion is null', () => {
      (component as any).originalQuestion = null;

      expect((component as any).hasQuestionChanged()).toBe(false);
    });
  });

  describe('hasAnswersChanged for Single/Multiple/Ranking', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.question = mockQuestion;
      component.ngOnInit();
    });

    it('should return false when no answer changes', () => {
      // No new rows, no deleted rows, no dirty rows
      component.answerOptions = [...(mockQuestion.answerOptions || [])];

      expect((component as any).hasAnswersChanged()).toBe(false);
    });

    it('should return true when new rows with data are added', () => {
      component.answerOptions = [
        ...(mockQuestion.answerOptions || []),
        {
          sequence: 2, answerCode: 'A002', answerCodeDescription: 'New answer',
          effectiveDate: new Date(), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect((component as any).hasAnswersChanged()).toBe(true);
    });

    it('should return false when new row is blank (auto-scaffold)', () => {
      component.answerOptions = [
        ...(mockQuestion.answerOptions || []),
        {
          sequence: 2, answerCode: '', answerCodeDescription: '',
          effectiveDate: new Date(), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      expect((component as any).hasAnswersChanged()).toBe(false);
    });

    it('should return true when rows are deleted', () => {
      component.answerOptions = [];
      (component as any).originalAnswerCount = 1;

      expect((component as any).hasAnswersChanged()).toBe(true);
    });

    it('should return true when existing rows are edited (dirty)', () => {
      component.answerOptions = [...(mockQuestion.answerOptions || [])];
      component.answerOptionsTable = { dirtyRows: new Set([0]) } as any;

      expect((component as any).hasAnswersChanged()).toBe(true);
    });
  });

  describe('onAnswerOptionsChange dirty tracking', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.question = mockQuestion;
      component.ngOnInit();
    });

    it('should set isDirty to true when options change', () => {
      component.isDirty = false;

      component.onAnswerOptionsChange([
        {
          sequence: 1, answerCode: 'A001', answerCodeDescription: 'Answer 1',
          effectiveDate: new Date(), terminationDate: null,
          auditKey: 1, isEditable: true, errors: {}
        }
      ]);

      expect(component.isDirty).toBe(true);
    });

    it('should update answerOptions array', () => {
      const newOptions: Answer[] = [
        {
          sequence: 1, answerCode: 'NEW', answerCodeDescription: 'New answer',
          effectiveDate: new Date(), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      component.onAnswerOptionsChange(newOptions);

      expect(component.answerOptions).toBe(newOptions);
    });
  });

  describe('saveButtonLabel', () => {
    it('should return ADD in add mode', () => {
      component.mode = 'add';
      component.isSaving = false;

      expect(component.saveButtonLabel).toBe('ADD');
    });

    it('should return ADDING... in add mode while saving', () => {
      component.mode = 'add';
      component.isSaving = true;

      expect(component.saveButtonLabel).toBe('ADDING...');
    });

    it('should return SAVE in edit mode', () => {
      component.mode = 'edit';
      component.isSaving = false;

      expect(component.saveButtonLabel).toBe('SAVE');
    });

    it('should return SAVING... in edit mode while saving', () => {
      component.mode = 'edit';
      component.isSaving = true;

      expect(component.saveButtonLabel).toBe('SAVING...');
    });

    it('should render saveButtonLabel in the template', () => {
      component.mode = 'add';
      component.isSaving = false;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[color="primary"] span span');
      expect(button.textContent.trim()).toBe('ADD');
    });
  });

  describe('uppercase conversion', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should convert question code to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'abc123';
      const event = { target: input } as unknown as Event;

      component.onQuestionCodeInput(event);

      expect(input.value).toBe('ABC123');
      expect(component.form.get('questionCode')?.value).toBe('ABC123');
    });

    it('should convert comment answer code to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'xyz789';
      const event = { target: input } as unknown as Event;

      component.onCommentAnswerCodeInput(event);

      expect(input.value).toBe('XYZ789');
      expect(component.form.get('commentAnswerCode')?.value).toBe('XYZ789');
    });

    it('should strip special characters and uppercase question code simultaneously', () => {
      const input = document.createElement('input');
      input.value = 'ab@c1#2';
      const event = { target: input } as unknown as Event;

      component.onQuestionCodeInput(event);

      expect(input.value).toBe('ABC12');
    });
  });
});
