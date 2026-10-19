import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SpAntigenRarityService } from './sp-antigen-rarity.service';
import { ApiService } from '@shared/services/api.service';
import {
  SpAntigenRarity,
  CreateSpAntigenRarityDto,
  UpdateSpAntigenRarityDto,
  SpAntigenRarityParamsDto,
  ApiResponse
} from '../models/sp-antigen-rarity.model';

describe('SpAntigenRarityService', () => {
  let service: SpAntigenRarityService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockAntigenRarity: SpAntigenRarity = {
    rarityCode: 'R1',
    rarityDescription: 'Rarity Level 1',
    effDate: new Date('2020-01-01'),
    termDate: null,
    lastModifiedDate: new Date('2024-03-15'),
    auditKey: 123
  };

  const mockApiResponse: ApiResponse<SpAntigenRarity[]> = {
    success: true,
    data: [mockAntigenRarity],
    total: 1,
    statusCode: 200,
    message: 'Success'
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SpAntigenRarityService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(SpAntigenRarityService);
  });

  describe('getAntigenRarities', () => {
    it('should fetch antigen rarities with pagination and params', (done) => {
      // Arrange
      const take = 10;
      const skip = 0;
      const params: SpAntigenRarityParamsDto = {
        rarityCode: 'R1',
        searchKeyword: 'Rarity'
      };

      mockApiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.getAntigenRarities(take, skip, params).subscribe(result => {
        // Assert
        expect(result).toEqual(mockApiResponse);
        expect(result.data.length).toBe(1);
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/sp-antigen-rarities/10/0',
          params
        );
        done();
      });
    });

    it('should handle error when fetching antigen rarities', (done) => {
      // Arrange
      const take = 10;
      const skip = 0;
      const params: SpAntigenRarityParamsDto = {};
      const error = { message: 'Error fetching data' };

      mockApiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.getAntigenRarities(take, skip, params).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching antigen rarities:', error);
          done();
        }
      });
    });
  });

  describe('getAntigenRarityById', () => {
    it('should fetch a single antigen rarity by rarityCode', (done) => {
      // Arrange
      const rarityCode = 'R1';
      const singleResponse: ApiResponse<SpAntigenRarity> = {
        success: true,
        data: mockAntigenRarity,
        statusCode: 200,
        message: 'Success'
      };

      mockApiService.get.and.returnValue(of(singleResponse));

      // Act
      service.getAntigenRarityById(rarityCode).subscribe(result => {
        // Assert
        expect(result).toEqual(singleResponse);
        expect(result.data.rarityCode).toBe('R1');
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/sp-antigen-rarities/R1');
        done();
      });
    });

    it('should encode special characters in rarityCode', (done) => {
      // Arrange
      const rarityCode = 'R+1';
      const singleResponse: ApiResponse<SpAntigenRarity> = {
        success: true,
        data: mockAntigenRarity,
        statusCode: 200,
        message: 'Success'
      };

      mockApiService.get.and.returnValue(of(singleResponse));

      // Act
      service.getAntigenRarityById(rarityCode).subscribe(result => {
        // Assert
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/sp-antigen-rarities/R%2B1');
        done();
      });
    });

    it('should handle error when fetching antigen rarity by ID', (done) => {
      // Arrange
      const rarityCode = 'R1';
      const error = { message: 'Not found' };

      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.getAntigenRarityById(rarityCode).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching antigen rarity by ID:', error);
          done();
        }
      });
    });
  });

  describe('createAntigenRarity', () => {
    it('should create a new antigen rarity', (done) => {
      // Arrange
      const createDto: CreateSpAntigenRarityDto = {
        rarityCode: 'R2',
        rarityDescription: 'Rarity Level 2',
        effDate: '2025-01-01',
        termDate: null
      };

      const response: ApiResponse<unknown> = {
        success: true,
        data: {},
        statusCode: 201,
        message: 'Created successfully'
      };

      mockApiService.post.and.returnValue(of(response));

      // Act
      service.createAntigenRarity(createDto).subscribe(result => {
        // Assert
        expect(result).toEqual(response);
        expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/sp-antigen-rarities', createDto);
        done();
      });
    });

    it('should handle error when creating antigen rarity', (done) => {
      // Arrange
      const createDto: CreateSpAntigenRarityDto = {
        rarityCode: 'R2',
        rarityDescription: 'Rarity Level 2',
        effDate: '2025-01-01',
        termDate: null
      };
      const error = { message: 'Validation error' };

      mockApiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.createAntigenRarity(createDto).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error creating antigen rarity:', error);
          done();
        }
      });
    });
  });

  describe('updateAntigenRarity', () => {
    it('should update an existing antigen rarity', (done) => {
      // Arrange
      const rarityCode = 'R1';
      const updateDto: UpdateSpAntigenRarityDto = {
        rarityDescription: 'Updated Rarity Description',
        effDate: '2025-06-01'
      };

      const response: ApiResponse<unknown> = {
        success: true,
        data: {},
        statusCode: 200,
        message: 'Updated successfully'
      };

      mockApiService.put.and.returnValue(of(response));

      // Act
      service.updateAntigenRarity(rarityCode, updateDto).subscribe(result => {
        // Assert
        expect(result).toEqual(response);
        expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/sp-antigen-rarities/R1', updateDto);
        done();
      });
    });

    it('should handle error when updating antigen rarity', (done) => {
      // Arrange
      const rarityCode = 'R1';
      const updateDto: UpdateSpAntigenRarityDto = { rarityDescription: 'Updated' };
      const error = { message: 'Update failed' };

      mockApiService.put.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.updateAntigenRarity(rarityCode, updateDto).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error updating antigen rarity:', error);
          done();
        }
      });
    });
  });

  describe('deleteAntigenRarity', () => {
    it('should delete an antigen rarity', (done) => {
      // Arrange
      const rarityCode = 'R1';
      const response: ApiResponse<boolean> = {
        success: true,
        data: true,
        statusCode: 200,
        message: 'Deleted successfully'
      };

      mockApiService.delete.and.returnValue(of(response));

      // Act
      service.deleteAntigenRarity(rarityCode).subscribe(result => {
        // Assert
        expect(result).toEqual(response);
        expect(mockApiService.delete).toHaveBeenCalledWith('/api/v1/sp-antigen-rarities/R1');
        done();
      });
    });

    it('should handle error when deleting antigen rarity', (done) => {
      // Arrange
      const rarityCode = 'R1';
      const error = { message: 'Delete failed' };

      mockApiService.delete.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.deleteAntigenRarity(rarityCode).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error deleting antigen rarity:', error);
          done();
        }
      });
    });
  });
});
