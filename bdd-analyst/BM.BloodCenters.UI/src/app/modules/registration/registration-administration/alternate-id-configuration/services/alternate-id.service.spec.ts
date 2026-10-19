import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlternateIdService } from './alternate-id.service';
import { AlternateIdApiService } from './alternate-id-api.service';

describe('AlternateIdService', () => {
  let service: AlternateIdService;
  let apiSpy: jasmine.SpyObj<AlternateIdApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AlternateIdApiService', ['getAll', 'getByAuditKey', 'create', 'update', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AlternateIdService,
        { provide: AlternateIdApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(AlternateIdService);
    apiSpy = TestBed.inject(AlternateIdApiService) as jasmine.SpyObj<AlternateIdApiService>;
  });

  describe('getAll', () => {
    it('should delegate to apiService.getAll', (done) => {
      const mockData = [{ auditKey: 1, donorGradeCode: 'A' }] as any[];
      apiSpy.getAll.and.returnValue(of(mockData));

      service.getAll().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(apiSpy.getAll).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should delegate to apiService.create', (done) => {
      const mockRecord = { auditKey: 2 } as any;
      apiSpy.create.and.returnValue(of(mockRecord));

      service.create({ donorGradeCode: 'B' } as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockRecord);
          expect(apiSpy.create).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delegate to apiService.delete', (done) => {
      apiSpy.delete.and.returnValue(of(undefined));

      service.delete(99).subscribe({
        next: () => {
          expect(apiSpy.delete).toHaveBeenCalledWith(99);
          done();
        },
      });
    });
  });
});
