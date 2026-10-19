import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ViewResponsesComponent } from './view-responses';
import { ViewResponsesService } from './services/view-responses.service';
import { ResponseSummary } from './models/view-responses.model';

describe('ViewResponsesComponent', () => {
  let component: ViewResponsesComponent;
  let fixture: ComponentFixture<ViewResponsesComponent>;
  let mockService: jasmine.SpyObj<ViewResponsesService>;

  const mockSummaryData: ResponseSummary[] = [
    {
      questionCode: 'DS01',
      questionDesc: 'Do you like Cookies?',
      responseType: 'S',
      gender: 'M',
      totalRespondents: 57,
      answers: [
        { answerCode: 'Y', answerDesc: 'Yes', responseCount: 57 },
        { answerCode: 'N', answerDesc: 'No', responseCount: 9 }
      ]
    },
    {
      questionCode: 'DS02',
      questionDesc: 'Rank the cookies',
      responseType: 'R',
      gender: 'F',
      totalRespondents: 55,
      answers: [
        {
          answerCode: 'CHOCH', answerDesc: 'Chocolate Chip', responseCount: 55,
          rankDistribution: [
            { questionCode: 'DS02', answerCode: 'CHOCH', rankCode: '1', rankCount: 2 },
            { questionCode: 'DS02', answerCode: 'CHOCH', rankCode: '2', rankCount: 53 }
          ]
        }
      ]
    },
    {
      questionCode: 'DS23',
      questionDesc: 'Comments about donation',
      responseType: 'C',
      gender: 'A',
      totalRespondents: 3,
      answers: [
        { answerCode: 'C', answerDesc: 'Comment Type', responseCount: 3 }
      ]
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ViewResponsesService', [
      'getResponseSummary', 'getResponseDonors', 'getResponseComments'
    ]);
    mockService.getResponseSummary.and.returnValue(of({ data: mockSummaryData } as any));
    mockService.getResponseDonors.and.returnValue(of({ data: [] } as any));
    mockService.getResponseComments.and.returnValue(of({ data: [] } as any));



      TestBed.configureTestingModule({
      imports: [ViewResponsesComponent NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ViewResponsesService, useValue: mockService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ chapterId: 'OBK', templateId: 'SVT0000059' }) }
        }
      ]
    });


    


      mockService.getResponseSummary.calls.reset();


      mockService.getResponseDonors.calls.reset();


      mockService.getResponseComments.calls.reset();


      mockService.getResponseSummary.and.returnValue(of({ data: mockSummaryData } as any));


      mockService.getResponseDonors.and.returnValue(of({ data: [] } as any));


      mockService.getResponseComments.and.returnValue(of({ data: [] } as any));


    fixture = TestBed.createComponent(ViewResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // --- Component creation ---


  it('should load summary data on init', () => {
    expect(mockService.getResponseSummary).toHaveBeenCalledWith('OBK', 'SVT0000059');
    expect(component.summaryData.length).toBe(3);
    expect(component.filteredQuestions.length).toBe(3);
  });



  // --- Tabs ---

  it('should default to answers tab', () => {
    expect(component.activeTab).toBe('answers');
  });

  it('should switch to statistics tab', () => {
    component.setActiveTab('statistics');
    expect(component.activeTab).toBe('statistics');
    expect(component.selectedQuestion).toBeNull();
    expect(component.selectedAnswer).toBeNull();
  });

  it('should switch back to answers tab', () => {
    component.setActiveTab('statistics');
    component.setActiveTab('answers');
    expect(component.activeTab).toBe('answers');
  });

  // --- getTotalCount ---

  it('should return totalRespondents for Single type', () => {
    const count = component.getTotalCount(mockSummaryData[0]);
    expect(count).toBe(57);
  });

  it('should return totalRespondents for Ranking type (not sum of responseCounts)', () => {
    const count = component.getTotalCount(mockSummaryData[1]);
    expect(count).toBe(55); // NOT 275
  });

  it('should return totalRespondents for Comment type', () => {
    const count = component.getTotalCount(mockSummaryData[2]);
    expect(count).toBe(3);
  });

  // --- Bar chart helpers ---

  it('should calculate percentage correctly', () => {
    expect(component.getPercentage(57, 66)).toBe(86);
    expect(component.getPercentage(9, 66)).toBe(14);
    expect(component.getPercentage(0, 0)).toBe(0);
  });

  it('should calculate bar width correctly', () => {
    expect(component.getBarWidth(50, 100)).toBe(50);
    expect(component.getBarWidth(100, 100)).toBe(100);
    expect(component.getBarWidth(0, 0)).toBe(0);
  });

  // --- Ranking ---

  it('should generate ranked answers with weighted scores', () => {
    const ranked = component.getRankedAnswers(mockSummaryData[1]);
    expect(ranked.length).toBe(1);
    expect(ranked[0].answerCode).toBe('CHOCH');
    expect(ranked[0].weightedScore).toBeGreaterThan(0);
    expect(ranked[0].barWidth).toBeGreaterThanOrEqual(0);
  });

  // --- Question type helpers ---

  it('should return correct type labels', () => {
    expect(component.getQuestionTypeLabel('S')).toBe('Single Select');
    expect(component.getQuestionTypeLabel('M')).toBe('Multiple Select');
    expect(component.getQuestionTypeLabel('C')).toBe('Comment');
    expect(component.getQuestionTypeLabel('R')).toBe('Ranking');
    expect(component.getQuestionTypeLabel('Z')).toBe('Unknown');
  });

  it('should return correct gender labels', () => {
    expect(component.getGenderLabel('M')).toBe('Male');
    expect(component.getGenderLabel('F')).toBe('Female');
    expect(component.getGenderLabel('A')).toBe('All Genders');
  });

  // --- Sex filter (was a bug - leftFilterSex not applied) ---





  // --- Response type filter ---



  // --- Search ---

  it('should filter questions by search text', () => {
    component.questionSearchText = 'cookies';
    component['applyQuestionFilters']();
    expect(component.filteredQuestions.length).toBe(2); // DS01 desc has "Cookies", DS02 has "cookies"
  });





  // --- Answer click ---

  it('should set selected question and answer on click', () => {
    const question = mockSummaryData[0];
    const answer = question.answers[0];
    component.onAnswerClick(question, answer);
    expect(component.selectedQuestion).toBe(question);
    expect(component.selectedAnswer).toBe(answer);
  });

  it('should identify selected answer correctly', () => {
    const question = mockSummaryData[0];
    const answer = question.answers[0];
    component.onAnswerClick(question, answer);
    expect(component.isAnswerSelected(question, answer)).toBeTrue();
    expect(component.isAnswerSelected(question, question.answers[1])).toBeFalse();
  });

  // --- Statistics question click ---

  it('should set selected stat question on click', () => {
    component.onStatQuestionClick(mockSummaryData[0]);
    expect(component.selectedStatQuestion).toBe(mockSummaryData[0]);
  });

  it('should load comments for Comment type question', () => {
    component.onStatQuestionClick(mockSummaryData[2]); // DS23, type C
    expect(mockService.getResponseComments).toHaveBeenCalledWith('OBK', 'SVT0000059', 'DS23');
  });



  // --- Error handling ---

  it('should handle summary load error gracefully', () => {
    mockService.getResponseSummary.and.returnValue(throwError(() => new Error('fail')));
    component['loadSummaryData']();
    expect(component.summaryData.length).toBe(0);
    expect(component.isLoading).toBeFalse();
  });

  // --- Filter panel ---

  it('should toggle left filter panel', () => {
    expect(component.showLeftFilterPanel).toBeFalse();
    component.toggleLeftFilterPanel();
    expect(component.showLeftFilterPanel).toBeTrue();
    component.toggleLeftFilterPanel();
    expect(component.showLeftFilterPanel).toBeFalse();
  });

  it('should build left filter chips', () => {
    component.leftFilterSex = 'M';
    component.leftFilterResponseType = 'S';
    component.buildLeftFilterChips();
    expect(component.leftFilterChips.length).toBe(2);
  });



  it('should clear all left filter chips', () => {
    component.leftFilterSex = 'M';
    component.leftFilterResponseType = 'R';
    component.buildLeftFilterChips();
    component.onLeftClearAllChips();
    expect(component.leftFilterChips.length).toBe(0);
    expect(component.leftFilterSex).toBe('');
    expect(component.leftFilterResponseType).toBe('');
  });

  // --- Navigation ---



  // --- Cleanup ---


});
