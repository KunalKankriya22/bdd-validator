import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { HealthHistoryTemplate, HHTemplateQuestion } from './health-history-template';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { provideRouter } from '@angular/router';

const MOCK_QUESTIONS: HHTemplateQuestion[] = [
  { questionCode: 'Q001', ask: 'Y', abbrFlag: 'N', abbrSeq: null, repeated: 'N', sequence: 1, questionNumber: '1', parentQuestion: '', responseFlag: 'Y', subFlag: '', goToNotes: '' },
  { questionCode: 'Q002', ask: 'Y', abbrFlag: 'Y', abbrSeq: 1,    repeated: 'N', sequence: 2, questionNumber: '2', parentQuestion: 'Q001', responseFlag: 'Y', subFlag: 'Y', goToNotes: 'See notes' },
  { questionCode: 'Q003', ask: 'Y', abbrFlag: 'N', abbrSeq: null, repeated: 'Y', sequence: 3, questionNumber: '3', parentQuestion: '', responseFlag: 'Y', subFlag: '', goToNotes: '' },
  { questionCode: 'Q004', ask: 'Y', abbrFlag: 'Y', abbrSeq: 2,    repeated: 'N', sequence: 4, questionNumber: '4', parentQuestion: 'Q003', responseFlag: 'Y', subFlag: 'N', goToNotes: '' },
  { questionCode: 'Q005', ask: 'Y', abbrFlag: 'N', abbrSeq: null, repeated: 'N', sequence: 5, questionNumber: '5', parentQuestion: '', responseFlag: 'Y', subFlag: '', goToNotes: 'Travel history' },
];

describe('HealthHistoryTemplate', () => {
  let component: HealthHistoryTemplate;
  let fixture: ComponentFixture<HealthHistoryTemplate>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  function makeDialogRef(result: boolean): jasmine.SpyObj<MatDialogRef<any>> {
    const ref = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(result));
    return ref;
  }

  beforeEach(() => {

    // Create spies first — they are passed into overrideComponent and also
    // kept as local references so tests can assert on them directly.
    mockSnackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    mockDialog   = jasmine.createSpyObj<MatDialog>('MatDialog', ['open', 'closeAll']);



      TestBed.configureTestingModule({
      imports: [HealthHistoryTemplate,
        FormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
      ],
    })
    // Inject spies at the component's own EnvironmentInjector level so they
    // override the real services provided by MatSnackBarModule / MatDialogModule
    // declared inside the standalone component's imports array.
    .overrideComponent(HealthHistoryTemplate, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MatDialog,   useValue: mockDialog   },
          { provide: HeaderService, useValue: { chapterChanged$: new Subject<void>() } },
        ],
      },
    });


    



    fixture   = TestBed.createComponent(HealthHistoryTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => fixture.destroy());


  // ---------------------------------------------------------------------------
  describe('Initialization', () => {


    it('should start with loading state true', () => {
      expect(component.isLoading()).toBe(true);
    });




  });

  // ---------------------------------------------------------------------------
  describe('filteredQuestions', () => {
    beforeEach(() => {
      component.templateQuestions.set(MOCK_QUESTIONS);
    });

    it('should return all questions when search term is empty', () => {
      component.searchTerm.set('');
      expect(component.filteredQuestions().length).toBe(5);
    });



    it('should filter by question number', () => {
      component.searchTerm.set('2');
      const results = component.filteredQuestions();
      expect(results.every(q => q.questionNumber.includes('2') || q.questionCode.includes('2'))).toBe(true);
    });

    it('should filter by parent question', () => {
      component.searchTerm.set('Q001');
      const results = component.filteredQuestions();
      expect(results.some(q => q.parentQuestion === 'Q001' || q.questionCode === 'Q001')).toBe(true);
    });




  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  describe('onDelete', () => {
    beforeEach(() => {
      component.templateQuestions.set([...MOCK_QUESTIONS]);
    });



    it('should remove question when confirmed', async () => {
      mockDialog.open.and.returnValue(makeDialogRef(true));
      const question = component.templateQuestions()[0];
      await component.onDelete(question);
      expect(component.templateQuestions().length).toBe(MOCK_QUESTIONS.length - 1);
      expect(component.templateQuestions().find(q => q.questionCode === question.questionCode)).toBeUndefined();
    });

    it('should not remove question when cancelled', fakeAsync(() => {
      mockDialog.open.and.returnValue(makeDialogRef(false));
      component.onDelete(MOCK_QUESTIONS[0]);
      flushMicrotasks();
      expect(component.templateQuestions().length).toBe(MOCK_QUESTIONS.length);
    }));


  });

  // ---------------------------------------------------------------------------
});
