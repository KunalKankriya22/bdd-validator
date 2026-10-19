import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AboLabelingAntigensService } from './abo-labeling-antigens.service';

describe('AboLabelingAntigensService', () => {
  let service: AboLabelingAntigensService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        AboLabelingAntigensService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(AboLabelingAntigensService);
  });

  [
    { name: 'validateAccess', verb: 'get', args: [] },
    { name: 'validateUnit', verb: 'post', args: [{}] },
    { name: 'processLabel', verb: 'post', args: [{}] },
    { name: 'confirmVerification', verb: 'post', args: [{}] },
    { name: 'reprint', verb: 'post', args: [{}] },
    { name: 'getAntigens', verb: 'get', args: ['U1', '2024-01-01'] },
    { name: 'getLovAboValues', verb: 'get', args: [] },
    { name: 'getLovSpecialTestCodes', verb: 'get', args: [] },
  ].forEach(({ name, verb, args }) => {
    it(`${name} should delegate to http.${verb}`, (done) => {
      (httpSpy as any)[verb].and.returnValue(of({ success: true, data: [] }));

      (service as any)[name](...args).subscribe(() => {
        expect((httpSpy as any)[verb]).toHaveBeenCalled();
        done();
      });
    });
  });
});
