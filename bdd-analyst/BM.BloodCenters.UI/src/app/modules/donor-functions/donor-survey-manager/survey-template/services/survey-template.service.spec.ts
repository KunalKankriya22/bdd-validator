import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { SurveyTemplateService } from './survey-template.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import {
  SurveyTemplateDto,
  UpdateSurveyTemplateDto,
} from '../models/survey-template.model';

describe('SurveyTemplateService', () => {
  let service: SurveyTemplateService;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put', 'delete']);
    headerSpy = jasmine.createSpyObj<HeaderService>('HeaderService', ['chapterId']);
    headerSpy.chapterId.and.returnValue('CH1');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        SurveyTemplateService,
        { provide: ApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy },
      ],
    });

    service = TestBed.inject(SurveyTemplateService);
  });

  it('should map getSurveyTemplates response and normalize status', (done) => {
    apiSpy.get.and.returnValue(
      of({
        data: [
          {
            templateId: 'TPL-1',
            chapterId: 'CH1',
            typeOfSurvey: 'D',
            effDate: '2026-01-01',
            status: 'Active',
          },
          {
            templateId: 'TPL-2',
            chapterId: 'CH1',
            typeOfSurvey: 'D',
            surveyTypeDescription: 'Donor',
            effDate: '2025-01-01',
            termDate: '2025-12-31',
            templateStatus: 'Inactive',
          },
        ],
      } as any)
    );

    service.getSurveyTemplates().subscribe((rows) => {
      expect(rows.length).toBe(2);
      expect(rows[0].templateStatus).toBe('Active');
      expect(rows[0].surveyTypeDescription).toBe('D');
      expect(rows[1].templateStatus).toBe('Inactive');
      expect(rows[1].surveyTypeDescription).toBe('Donor');
      done();
    });
  });

  it('should return empty array when API data is missing', (done) => {
    apiSpy.get.and.returnValue(of({} as any));

    service.getSurveyTemplates().subscribe((rows) => {
      expect(rows).toEqual([]);
      done();
    });
  });

  it('should map add dropdown defaults when response is empty', (done) => {
    apiSpy.get.and.returnValue(of(null as any));

    service.getSurveyTemplateAddDropdowns().subscribe((res) => {
      expect(res).toEqual({ surveyTypes: [], nextTemplateId: '' });
      done();
    });
  });

  it('should return fallback object when add dropdown API errors', (done) => {
    apiSpy.get.and.returnValue(throwError(() => new Error('x')));

    service.getSurveyTemplateAddDropdowns().subscribe({
      next: () => fail('expected error path'),
      error: (err) => {
        expect(err).toEqual({ surveyTypes: [], nextTemplateId: '' });
        done();
      },
    });
  });

  it('should map addSurveyTemplate response', (done) => {
    apiSpy.post.and.returnValue(of({ success: true, message: 'Created' } as any));

    const payload: SurveyTemplateDto = {
      typeOfSurvey: 'D',
      effDate: '2026-01-01',
      chapterId: 'CH1',
    };
    service.addSurveyTemplate(payload).subscribe((res) => {
      expect(res).toEqual({ success: true, message: 'Created' });
      done();
    });
  });

  it('should map updateSurveyTemplate response', (done) => {
    apiSpy.put.and.returnValue(of({ success: true, message: 'Updated' } as any));

    const payload: UpdateSurveyTemplateDto = {
      templateId: 'TPL-1',
      typeOfSurvey: 'D',
      effDate: '2026-01-01',
      chapterId: 'CH1',
    };
    service.updateSurveyTemplate(payload).subscribe((res) => {
      expect(res).toEqual({ success: true, message: 'Updated' });
      done();
    });
  });

  it('should call delete with chapter id and map response', (done) => {
    apiSpy.delete.and.returnValue(of({ success: true, message: 'Deleted' } as any));

    service.deleteSurveyTemplate('TPL-9').subscribe((res) => {
      expect(headerSpy.chapterId).toHaveBeenCalled();
      expect(apiSpy.delete).toHaveBeenCalled();
      expect(res).toEqual({ success: true, message: 'Deleted' });
      done();
    });
  });
});
