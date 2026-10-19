import { of, throwError } from 'rxjs';

import { MaintainSpecialInstructionsService } from './maintain-special-instructions.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('MaintainSpecialInstructionsService', () => {
  let service: MaintainSpecialInstructionsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDropdown = [
    { specialInstruction: 'A0031', description: 'Autologous Donation' },
  ];

  const mockResponse = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: [{ lineNumber: 1, lineText: ' - Draw 2 Red top tubes' }],
    total: 1,
    errorResponse: { errorCode: '', error: '' },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

        service = new MaintainSpecialInstructionsService(apiServiceSpy as any);
  });

  describe('getDropdownValues()', () => {
    it('should call GET with dropdown endpoint and return items', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDropdown));
      service.getDropdownValues().subscribe((items) => {
        expect(items).toEqual(mockDropdown);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.DROPDOWN_VALUES,
        );
        done();
      });
    });

    it('should return [] when API returns null', (done) => {
      apiServiceSpy.get.and.returnValue(of(null as any));
      service.getDropdownValues().subscribe((items) => {
        expect(items).toEqual([]);
        done();
      });
    });

    it('should rethrow error on failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));
      service.getDropdownValues().subscribe({
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });

  describe('getLinesByLabelCode()', () => {
    it('should call GET with label code and return lines', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockResponse));
      service.getLinesByLabelCode('A0031').subscribe((lines) => {
        expect(lines.length).toBe(1);
        expect(lines[0].lineText).toBe(' - Draw 2 Red top tubes');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.GET_BY_LABEL_CODE('A0031'),
        );
        done();
      });
    });

    it('should return [] when response data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ ...mockResponse, data: null } as any));
      service.getLinesByLabelCode('A0031').subscribe((lines) => {
        expect(lines).toEqual([]);
        done();
      });
    });

    it('should rethrow error on failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('network')));
      service.getLinesByLabelCode('A0031').subscribe({
        error: (err) => {
          expect(err.message).toBe('network');
          done();
        },
      });
    });
  });

  describe('saveLines()', () => {
    it('should call PUT with correct request body', (done) => {
      apiServiceSpy.put.and.returnValue(of(undefined));
      const req = { labelCode: 'A0031', lines: [{ lineNumber: 1, lineText: 'Line 1' }] };
      service.saveLines(req).subscribe(() => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.SAVE,
          req,
        );
        done();
      });
    });

    it('should rethrow error on failure', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('save failed')));
      service.saveLines({ labelCode: 'A0031', lines: [] }).subscribe({
        error: (err) => {
          expect(err.message).toBe('save failed');
          done();
        },
      });
    });
  });

  describe('saveAll()', () => {
    it('should call POST with SAVE_ALL endpoint and correct request body', (done) => {
      apiServiceSpy.post.and.returnValue(of(undefined));
      const req = {
        labelCode: 'A0031',
        lines: [{ lineNumber: 1, lineText: 'First line' }],
      };
      service.saveAll(req).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.SAVE_ALL,
          req,
        );
        done();
      });
    });

    it('should rethrow error on failure', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('saveAll failed')));
      service.saveAll({ labelCode: 'A0031', lines: [] }).subscribe({
        error: (err) => {
          expect(err.message).toBe('saveAll failed');
          done();
        },
      });
    });
  });

  describe('deleteLine()', () => {
    it('should call DELETE with correct path parameters', (done) => {
      apiServiceSpy.delete.and.returnValue(of(undefined));
      service.deleteLine('A0031', 1, ' - Draw 2 Red top tubes').subscribe(() => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.DELETE(
            'A0031',
            1,
            ' - Draw 2 Red top tubes',
          ),
        );
        done();
      });
    });

    it('should rethrow error on failure', (done) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => new Error('delete failed')));
      service.deleteLine('A0031', 1, 'text').subscribe({
        error: (err) => {
          expect(err.message).toBe('delete failed');
          done();
        },
      });
    });
  });
});
