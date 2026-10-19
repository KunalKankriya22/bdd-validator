import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AssociateLetterService } from './associate-letter.service';
import { ApiService } from '@shared/services/api.service';

describe('AssociateLetterService', () => {
  let service: AssociateLetterService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AssociateLetterService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(AssociateLetterService);
  });

  describe('getAssociations', () => {
    it('should post filter criteria and return mapped response', (done) => {
      // Arrange
      const mockResponse = { data: [{ interdictionCode: 'IC1' }], total: 1 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.getAssociations(25, 0, { interdictionCode: 'IC1', donationType: null as any, letterId: null as any }).subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getDropdownData', () => {
    it('should fetch interdiction codes, donation types, and letter codes via forkJoin', (done) => {
      // Arrange
      apiSpy.get.and.returnValues(
        of({ data: [{ code: 'IC1' }] }),
        of({ data: [{ type: 'WB' }] }),
        of({ data: [{ letterId: 'L1' }] })
      );

      // Act
      service.getDropdownData().subscribe((result) => {
        // Assert
        expect(result.interdictionCodes.length).toBe(1);
        expect(result.donationTypes.length).toBe(1);
        expect(result.letterCodes.length).toBe(1);
        expect(apiSpy.get).toHaveBeenCalledTimes(3);
        done();
      });
    });
  });

  describe('getAssociationById', () => {
    it('should return first association or null', (done) => {
      // Arrange
      const mockResponse = { data: [{ interdictionCode: 'IC1' }], total: 1 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.getAssociationById('IC1', 'WB', 'L1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ interdictionCode: 'IC1' } as any);
        done();
      });
    });
  });

  describe('createAssociation', () => {
    it('should post the create request', (done) => {
      // Arrange
      const request = { interdictionCode: 'IC1' } as any;
      apiSpy.post.and.returnValue(of({ success: true }));

      // Act
      service.createAssociation(request).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('updateAssociation', () => {
    it('should put the update request', (done) => {
      // Arrange
      const data = { interdictionCode: 'IC1' } as any;
      apiSpy.put.and.returnValue(of({ success: true }));

      // Act
      service.updateAssociation(data).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('deleteAssociation', () => {
    it('should delete by composite key query params', (done) => {
      // Arrange
      apiSpy.delete.and.returnValue(of({ success: true }));

      // Act
      service.deleteAssociation('IC1', 'WB', 'L1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.delete).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
