import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SpAntigenGroupService } from './sp-antigen-group.service';
import { ApiService } from '@shared/services/api.service';
import {
  SpAntigenGroup,
  CreateSpAntigenGroupDto,
  UpdateSpAntigenGroupDto,
  SpAntigenGroupParamsDto,
  ApiResponse,
  AntigenGroupDropdown,
  AntigenRarityDropdown
} from '../models/sp-antigen-group.model';

describe('SpAntigenGroupService', () => {
  let service: SpAntigenGroupService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockAntigenGroup: SpAntigenGroup = {
    testId: 'K',
    description: 'KELL TYPING',
    result: 'NEG',
    effDate: new Date('2020-01-01'),
    termDate: null,
    modificationDate: new Date('2024-03-15'),
    antigenGroupCode: 'Ce*'
  };

  const mockApiResponse: ApiResponse<SpAntigenGroup[]> = {
    success: true,
    data: [mockAntigenGroup],
    total: 1,
    statusCode: 200,
    message: 'Success'
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SpAntigenGroupService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(SpAntigenGroupService);
  });

  describe('getAntigenGroups', () => {
    it('should fetch antigen groups with pagination and params', (done) => {
      // Arrange
      const take = 10;
      const skip = 0;
      const params: SpAntigenGroupParamsDto = {
        antigenGroup: 'Ce*',
        searchKeyword: 'KELL'
      };

      mockApiService.post.and.returnValue(of(mockApiResponse));

      // Act
      service.getAntigenGroups(take, skip, params).subscribe(result => {
        // Assert
        expect(result).toEqual(mockApiResponse);
        expect(result.data.length).toBe(1);
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/sp-antigen-groups/10/0',
          params
        );
        done();
      });
    });

    it('should handle error when fetching antigen groups', (done) => {
      // Arrange
      const take = 10;
      const skip = 0;
      const params: SpAntigenGroupParamsDto = {};
      const error = { message: 'Error fetching data' };

      mockApiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.getAntigenGroups(take, skip, params).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching antigen groups:', error);
          done();
        }
      });
    });
  });

  describe('getAntigenGroupById', () => {
    it('should fetch a single antigen group by testId', (done) => {
      // Arrange
      const testId = 'K';
      const singleResponse: ApiResponse<SpAntigenGroup> = {
        success: true,
        data: mockAntigenGroup,
        statusCode: 200,
        message: 'Success'
      };

      mockApiService.get.and.returnValue(of(singleResponse));

      // Act
      service.getAntigenGroupById(testId).subscribe(result => {
        // Assert
        expect(result).toEqual(singleResponse);
        expect(result.data.testId).toBe('K');
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/sp-antigen-groups/K');
        done();
      });
    });

    it('should encode special characters in testId', (done) => {
      // Arrange
      const testId = 'e+';
      const singleResponse: ApiResponse<SpAntigenGroup> = {
        success: true,
        data: mockAntigenGroup,
        statusCode: 200,
        message: 'Success'
      };

      mockApiService.get.and.returnValue(of(singleResponse));

      // Act
      service.getAntigenGroupById(testId).subscribe(result => {
        // Assert
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/sp-antigen-groups/e%2B');
        done();
      });
    });

    it('should handle error when fetching antigen group by ID', (done) => {
      // Arrange
      const testId = 'K';
      const error = { message: 'Not found' };

      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.getAntigenGroupById(testId).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching antigen group by ID:', error);
          done();
        }
      });
    });
  });

  describe('createAntigenGroup', () => {
    it('should create a new antigen group', (done) => {
      // Arrange
      const createDto: CreateSpAntigenGroupDto = {
        antigenGroup: 'Ce*',
        antigenRarity: 'R1',
        testId: 'K',
        responsible: 'Admin',
        result: 'NEG',
        effDate: '2025-01-01',
        termDate: null,
        verificationDate: null
      };

      const response: ApiResponse<unknown> = {
        success: true,
        data: {},
        statusCode: 201,
        message: 'Created successfully'
      };

      mockApiService.post.and.returnValue(of(response));

      // Act
      service.createAntigenGroup(createDto).subscribe(result => {
        // Assert
        expect(result).toEqual(response);
        expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/sp-antigen-groups', createDto);
        done();
      });
    });

    it('should handle error when creating antigen group', (done) => {
      // Arrange
      const createDto: CreateSpAntigenGroupDto = {
        antigenGroup: 'Ce*',
        antigenRarity: 'R1',
        testId: 'K',
        responsible: 'Admin',
        result: 'NEG',
        effDate: '2025-01-01',
        termDate: null,
        verificationDate: null
      };
      const error = { message: 'Validation error' };

      mockApiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.createAntigenGroup(createDto).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error creating antigen group:', error);
          done();
        }
      });
    });
  });

  describe('updateAntigenGroup', () => {
    it('should update an existing antigen group', (done) => {
      // Arrange
      const testId = 'K';
      const updateDto: UpdateSpAntigenGroupDto = {
        result: 'POS',
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
      service.updateAntigenGroup(testId, updateDto).subscribe(result => {
        // Assert
        expect(result).toEqual(response);
        expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/sp-antigen-groups/K', updateDto);
        done();
      });
    });

    it('should handle error when updating antigen group', (done) => {
      // Arrange
      const testId = 'K';
      const updateDto: UpdateSpAntigenGroupDto = { result: 'POS' };
      const error = { message: 'Update failed' };

      mockApiService.put.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.updateAntigenGroup(testId, updateDto).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error updating antigen group:', error);
          done();
        }
      });
    });
  });

  describe('deleteAntigenGroup', () => {
    it('should delete an antigen group', (done) => {
      // Arrange
      const testId = 'K';
      const response: ApiResponse<boolean> = {
        success: true,
        data: true,
        statusCode: 200,
        message: 'Deleted successfully'
      };

      mockApiService.delete.and.returnValue(of(response));

      // Act
      service.deleteAntigenGroup(testId).subscribe(result => {
        // Assert
        expect(result).toEqual(response);
        expect(mockApiService.delete).toHaveBeenCalledWith('/api/v1/sp-antigen-groups/K');
        done();
      });
    });

    it('should handle error when deleting antigen group', (done) => {
      // Arrange
      const testId = 'K';
      const error = { message: 'Delete failed' };

      mockApiService.delete.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.deleteAntigenGroup(testId).subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error deleting antigen group:', error);
          done();
        }
      });
    });
  });

  describe('getAntigenGroupsDropdown', () => {
    it('should fetch antigen groups dropdown options', (done) => {
      // Arrange
      const dropdownData: AntigenGroupDropdown[] = [
        { code: 'Ce*', description: 'C-e-' },
        { code: 'C-e', description: 'C-e-' }
      ];

      mockApiService.get.and.returnValue(of(dropdownData));

      // Act
      service.getAntigenGroupsDropdown().subscribe(result => {
        // Assert
        expect(result).toEqual(dropdownData);
        expect(result.length).toBe(2);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/sp-antigen-groups/dropdowns/antigen-groups');
        done();
      });
    });

    it('should handle error when fetching antigen groups dropdown', (done) => {
      // Arrange
      const error = { message: 'Failed to fetch dropdown' };

      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.getAntigenGroupsDropdown().subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching antigen groups dropdown:', error);
          done();
        }
      });
    });
  });

  describe('getAntigenRaritiesDropdown', () => {
    it('should fetch antigen rarities dropdown options', (done) => {
      // Arrange
      const dropdownData: AntigenRarityDropdown[] = [
        { code: 'R1', description: 'Rarity 1' },
        { code: 'R2', description: 'Rarity 2' }
      ];

      mockApiService.get.and.returnValue(of(dropdownData));

      // Act
      service.getAntigenRaritiesDropdown().subscribe(result => {
        // Assert
        expect(result).toEqual(dropdownData);
        expect(result.length).toBe(2);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/sp-antigen-groups/dropdowns/antigen-rarities');
        done();
      });
    });

    it('should handle error when fetching antigen rarities dropdown', (done) => {
      // Arrange
      const error = { message: 'Failed to fetch dropdown' };

      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      // Act
      service.getAntigenRaritiesDropdown().subscribe({
        error: (err) => {
          // Assert
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching antigen rarities dropdown:', error);
          done();
        }
      });
    });
  });
});
