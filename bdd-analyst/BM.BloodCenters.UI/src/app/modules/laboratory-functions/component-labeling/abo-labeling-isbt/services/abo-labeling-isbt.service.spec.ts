import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AboLabelingIsbtService } from './abo-labeling-isbt.service';

describe('AboLabelingIsbtService', () => {
  let service: AboLabelingIsbtService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        AboLabelingIsbtService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(AboLabelingIsbtService);
  });

  [
    { name: 'validateAccess', verb: 'get', args: [] },
    { name: 'validateUnit', verb: 'post', args: [{}] },
    { name: 'processLabel', verb: 'post', args: [{}] },
    { name: 'confirmVerification', verb: 'post', args: [{}] },
    { name: 'reprint', verb: 'post', args: [{}] },
    { name: 'getLovAboValues', verb: 'get', args: [] },
    { name: 'getLovSpecialTestCodes', verb: 'get', args: [] },
    { name: 'logAbandonedLabel', verb: 'post', args: [{}] },
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
