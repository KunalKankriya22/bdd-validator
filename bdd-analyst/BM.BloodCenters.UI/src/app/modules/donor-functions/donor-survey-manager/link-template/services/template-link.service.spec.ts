import { of, throwError } from 'rxjs';

import { TemplateLinkService } from './template-link.service';
import { ApiService } from '@shared/services/api.service';
import { TemplateLinkSavePayload } from '../models/template-link.model';

describe('TemplateLinkService', () => {
  let service: TemplateLinkService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put']);
    service = new TemplateLinkService(apiSpy);
  });

  it('should map getTemplateLinks API rows to UI model', (done) => {
    apiSpy.get.and.returnValue(
      of({
        success: true,
        message: 'ok',
        data: [
          {
            surveyGroupId: 'G1',
            surveyCategoryCode: 'C1',
            surveyCategoryValues: 'A,B',
            linkedTemplateId: 'TPL-1',
            effDate: '2026-01-01',
            termDate: null,
            chapterId: 'CH1',
          },
        ],
      } as any)
    );

    service.getTemplateLinks('CH1', 'TPL-1').subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].groupId).toBe('G1');
      expect(rows[0].categoryCode).toBe('C1');
      expect(rows[0].templateId).toBe('TPL-1');
      expect(rows[0].categoryValuesArray?.length).toBe(2);
      done();
    });
  });


  it('should map category codes response', (done) => {
    apiSpy.get.and.returnValue(
      of({
        success: true,
        message: 'ok',
        data: [{ code: 'C1', description: 'Code 1' }],
      } as any)
    );

    service.getCategoryCodes().subscribe((rows) => {
      expect(rows).toEqual([{ code: 'C1', description: 'Code 1' }]);
      done();
    });
  });



  it('should proxy createTemplateLink and updateTemplateLink to api service', () => {
    const ok = { success: true, message: 'ok', data: [] as unknown[] };
    apiSpy.post.and.returnValue(of(ok));
    apiSpy.put.and.returnValue(of(ok));
    const payload = { surveyGroupId: 'G1', surveyCategoryCode: 'C1' } as TemplateLinkSavePayload;

    service.createTemplateLink('CH1', 'TPL-1', payload).subscribe();
    service.updateTemplateLink('CH1', 'TPL-1', payload).subscribe();

    expect(apiSpy.post).toHaveBeenCalled();
    expect(apiSpy.put).toHaveBeenCalled();
  });

  it('should format helper methods correctly', () => {
    expect(service.formatDate('2026-04-08')).toBe('08-APR-2026');
    expect(service.formatDate(null)).toBe('-');
    expect(service.formatDateTimeIso(null)).toBeNull();
    expect(service.categoryValuesToString(['A', '', 'B'])).toBe('A,B');
  });
});
