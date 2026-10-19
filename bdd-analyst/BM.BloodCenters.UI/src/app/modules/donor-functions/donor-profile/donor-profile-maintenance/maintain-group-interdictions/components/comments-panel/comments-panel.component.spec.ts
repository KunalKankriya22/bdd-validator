import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { CommentsPanelComponent } from './comments-panel.component';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonorGroupInterdictionComment } from '../../models/maintain-group-interdictions.model';

describe('CommentsPanelComponent', () => {
  let mockChapterDate: any;
  let component: CommentsPanelComponent;
  let fixture: ComponentFixture<CommentsPanelComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainGroupInterdictionsService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockInterdiction = {
    code: 'PHYTD',
    description: 'Physical Findings Temporary Deferral'
  };

  const mockComments: DonorGroupInterdictionComment[] = [
    {
      donorId: 'DN12345',
      interCode: 'PHYTD',
      interType: 'INTER',
      insertDate: '2024-01-15T00:00:00',
      insertUser: 'John Doe',
      comments: 'Test comment 1',
      centralNote: '',
      effDate: '2024-01-15',
      termDate: null,
      groupMode: 'DRIVE',
      groupValue: '12345'
    },
    {
      donorId: 'DN12345',
      interCode: 'PHYTD',
      interType: 'INTER',
      insertDate: '2024-01-16T00:00:00',
      insertUser: 'Jane Smith',
      comments: '',
      centralNote: 'Test note 1',
      effDate: '2024-01-16',
      termDate: null,
      groupMode: 'DRIVE',
      groupValue: '12345'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainGroupInterdictionsService', [
      'getDonorInterdictionComments',
      'addDonorInterdictionComment'
    ]);

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate'
    ]);

    serviceSpy.getDonorInterdictionComments.and.returnValue(of(mockComments));
    serviceSpy.addDonorInterdictionComment.and.returnValue(of({ success: true, message: '', data: null }));

    // Mock chapter local date as May 13, 2024
    mockChapterDate = moment('2024-05-13T00:00:00');
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(mockChapterDate);

    TestBed.configureTestingModule({
      imports: [CommentsPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MaintainGroupInterdictionsService, useValue: serviceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    });

  });

  beforeEach(() => {

    serviceSpy.getDonorInterdictionComments.calls.reset();
    serviceSpy.addDonorInterdictionComment.calls.reset();
    chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();

    serviceSpy.getDonorInterdictionComments.and.returnValue(of(mockComments));
    serviceSpy.addDonorInterdictionComment.and.returnValue(of({ success: true, message: '', data: null }));
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(mockChapterDate);

    fixture = TestBed.createComponent(CommentsPanelComponent);
    component = fixture.componentInstance;
    component.interdiction = mockInterdiction;
    component.groupMode = 'DRIVE';
    component.groupValue = '12345';
    fixture.detectChanges();

  });

  it('should load existing comments on init', () => {
    expect(serviceSpy.getDonorInterdictionComments).toHaveBeenCalled();
  });

  it('should have invalid form initially', () => {
    expect(component.commentForm.invalid).toBe(true);
  });

  it('should become valid when comment text is entered', () => {
    component.commentForm.get('commentText')?.setValue('New comment');
    expect(component.commentForm.valid).toBe(true);
  });

  it('should add comment with chapter local date when onSaveComment is called', () => {
    const mockChapterDate = moment('2024-05-13T00:00:00');
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(mockChapterDate);

    component.commentForm.get('commentText')?.setValue('New comment');
    component.onSaveComment();

    expect(chapterTimezoneServiceSpy.getChapterLocalDate).toHaveBeenCalled();
    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledWith({
      groupMode: 'DRIVE',
      groupValue: '12345',
      interCode: 'PHYTD',
      comment: 'New comment',
      insertDate: '2024-05-13'  // YYYY-MM-DD format to avoid timezone shifts
    });
  });

  it('should reload comments after successfully adding a comment', () => {
    component.commentForm.get('commentText')?.setValue('New comment');
    serviceSpy.getDonorInterdictionComments.calls.reset();

    component.onSaveComment();

    expect(serviceSpy.getDonorInterdictionComments).toHaveBeenCalledWith({
      groupMode: 'DRIVE',
      groupValue: '12345',
      interCode: 'PHYTD'
    });
  });

  it('should handle error when adding comment fails', () => {
    spyOn(console, 'error');
    serviceSpy.addDonorInterdictionComment.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.commentForm.get('commentText')?.setValue('New comment');
    component.onSaveComment();

    expect(console.error).toHaveBeenCalledWith('Error adding comment:', jasmine.any(Error));
  });

  it('should handle error when loading comments fails after save', () => {
    spyOn(console, 'error');
    serviceSpy.addDonorInterdictionComment.and.returnValue(of({ success: true, message: '', data: null }));
    serviceSpy.getDonorInterdictionComments.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.commentForm.get('commentText')?.setValue('New comment');
    component.onSaveComment();

    expect(console.error).toHaveBeenCalledWith('Error loading comments:', jasmine.any(Error));
    expect(component.isLoading).toBe(false);
  });

  it('should get initials correctly', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
    expect(component.getInitials('Alice')).toBe('AL');
    expect(component.getInitials('')).toBe('');
  });

  it('should add comment for all selected interdictions when multiple are selected', () => {
    const selectedInterdictions = [
      { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' },
      { code: 'DDI', description: 'Deferred Indefinitely' },
      { code: 'DDT', description: 'Temporarily Deferred' }
    ];
    component.selectedInterdictions = selectedInterdictions;

    component.commentForm.get('commentText')?.setValue('Bulk comment');
    component.onSaveComment();

    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledTimes(3);
    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledWith(jasmine.objectContaining({
      interCode: 'PHYTD',
      comment: 'Bulk comment'
    }));
    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledWith(jasmine.objectContaining({
      interCode: 'DDI',
      comment: 'Bulk comment'
    }));
    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledWith(jasmine.objectContaining({
      interCode: 'DDT',
      comment: 'Bulk comment'
    }));
  });

  it('should fall back to single interdiction when selectedInterdictions is empty', () => {
    component.selectedInterdictions = [];
    component.commentForm.get('commentText')?.setValue('Single comment');
    component.onSaveComment();

    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledTimes(1);
    expect(serviceSpy.addDonorInterdictionComment).toHaveBeenCalledWith(jasmine.objectContaining({
      interCode: 'PHYTD'
    }));
  });

});
