import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AddInterdictionService } from './add-interdiction.service';

describe('AddInterdictionService', () => {
  let service: AddInterdictionService;
  let mockHttp: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttp = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        AddInterdictionService,
        { provide: HttpClient, useValue: mockHttp }
      ]
    });

    service = TestBed.inject(AddInterdictionService);
  });

  it('should checkUnitExists and return data on success', (done) => {
    mockHttp.get.and.returnValue(of({ success: true, data: { exists: true } }));

    service.checkUnitExists('UNIT1').subscribe(result => {
      expect(result.exists).toBe(true);
      expect(mockHttp.get).toHaveBeenCalled();
      done();
    });
  });

  it('should getValidInterdictions and return array', (done) => {
    mockHttp.get.and.returnValue(of({ success: true, data: [{ code: 'I1' }] }));

    service.getValidInterdictions('UNIT1').subscribe(result => {
      expect(result.length).toBe(1);
      done();
    });
  });

  it('should addInterdiction via POST', (done) => {
    const mockResponse = { success: true, data: { id: 1 } };
    mockHttp.post.and.returnValue(of(mockResponse));

    service.addInterdiction({ unitId: 'U1', interCode: 'I1' } as any).subscribe(result => {
      expect(result.success).toBe(true);
      expect(mockHttp.post).toHaveBeenCalled();
      done();
    });
  });
});
