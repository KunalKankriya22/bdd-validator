import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignChapterDialogComponent } from './assignChapter';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AssignChapterDialogComponent', () => {
  let component: AssignChapterDialogComponent;
  let fixture: ComponentFixture<AssignChapterDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AssignChapterDialogComponent>>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockChapters = [
    { chapterId: 'C1', chapterName: 'Chapter One' }
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBarSpy = createMockMatSnackBar();

    await TestBed.configureTestingModule({
      imports: [AssignChapterDialogComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { chapters: mockChapters } },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssignChapterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /* 1. Component creation */

  /* 2. Form validation (required fields) */
  it('should invalidate form when required fields are empty', () => {
    component.form.setValue({ chapterId: '', chapterName: '', effectiveDate: '', terminationDate: '' });
    expect(component.form.invalid).toBeTrue();
  });

  /* 3. Add chapter */
  it('should add chapter to table', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.form.setValue({
      chapterId: 'C1',
      chapterName: 'Chapter One',
      effectiveDate: tomorrow,
      terminationDate: null
    });

    component.onAdd();
    expect(component.dataSource.data.length).toBe(1);
  });

  /* 4. Remove chapter */
  it('should remove chapter from table', () => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    component.dataSource.data = [{
      chapterId: 'C1',
      chapterName: 'Chapter One',
      effectiveDate: formattedDate
    }];

    component.removeAssignment(0);
    expect(component.dataSource.data.length).toBe(0);
  });

/* 5. Edit mode initialization */
  it('should load chapter in edit mode', () => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    component.data = {
      editMode: true,
      chapter: {
        chapterId: 'C1',
        chapterName: 'Chapter One',
        effectiveDate: formattedDate
      }
    } as any;

    component.ngOnInit();
    expect(component.isEditMode).toBeTrue();
  });

  /* 6. Save and assign */

  /* 7. Cancel dialog */
});
