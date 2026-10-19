import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CommunicationLettersService } from './communication-letters.service';
import { ApiService } from '@shared/services/api.service';

describe('CommunicationLettersService', () => {
  let service: CommunicationLettersService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        CommunicationLettersService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(CommunicationLettersService);
  });

  [
    { name: 'getLetterCodes', verb: 'get', args: [] },
    { name: 'getLetters', verb: 'post', args: [{ letterCode: 'A', showTerminated: 'No' }] },
    { name: 'getLetterContent', verb: 'get', args: ['L1'] },
    { name: 'createLetter', verb: 'post', args: [{}] },
    { name: 'reviseLetter', verb: 'post', args: ['L1', {}] },
  ].forEach(({ name, verb, args }) => {
    it(`${name} should delegate to apiService.${verb} and unwrap data`, (done) => {
      (apiSpy as any)[verb].and.returnValue(of({ data: [{ id: '1' }] }));

      (service as any)[name](...args).subscribe((result: any) => {
        expect((apiSpy as any)[verb]).toHaveBeenCalled();
        done();
      });
    });
  });
});
