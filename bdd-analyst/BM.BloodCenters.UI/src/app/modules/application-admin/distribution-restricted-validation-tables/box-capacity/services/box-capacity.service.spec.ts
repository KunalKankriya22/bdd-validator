import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BoxCapacityService } from './box-capacity.service';
import { ApiService } from '@shared/services/api.service';
import {
  BoxCapacityModel,
  BoxCapacityParamsDto,
  BoxCapacityFilterLov,
  BoxCapacityDto,
  UpdateBoxCapacityDto
} from '../models/box-capacity.model';
import { API } from 'src/app/core/constants/api.constants';

describe('BoxCapacityService', () => {
  let service: BoxCapacityService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockBoxCapacityData: BoxCapacityModel[] = [
    {
      boxType: '26',
      boxDescription: '26 Qt Igloo',
      inventoryProdType: 'CRYO',
      prodDescription: 'Cryoprecipitate',
      capacity: 20,
      effectiveDate: new Date('2004-08-27T00:00:00'),
      terminationDate: null,
      lastModificationDate: new Date('2025-09-10T00:00:00')
    },
    {
      boxType: 'CA',
      boxDescription: 'Cardboard Box',
      inventoryProdType: 'FFP',
      prodDescription: 'Fresh Frozen Plasma',
      capacity: 30,
      effectiveDate: new Date('2005-01-15T00:00:00'),
      terminationDate: null,
      lastModificationDate: new Date('2025-09-11T00:00:00')
    }
  ];

  const mockFilterLov: BoxCapacityFilterLov = {
    boxTypes: ['26', 'CA', 'FB', 'PC'],
    inventoryProdTypes: ['CRYO', 'FFP', 'PLTS', 'RBC']
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        BoxCapacityService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(BoxCapacityService);
  });

  describe('getBoxCapacity', () => {
    it('should fetch box capacity data with pagination', (done) => {
      const take = 10;
      const skip = 0;
      const params: BoxCapacityParamsDto = {};
      const mockResponse = {
        data: mockBoxCapacityData,
        total: 2
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getBoxCapacity(take, skip, params).subscribe(result => {
        expect(result.data).toEqual(mockBoxCapacityData);
        expect(result.totalRecords).toBe(2);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY(take, skip),
          params
        );
        done();
      });
    });


    it('should handle search keyword parameter', (done) => {
      const take = 10;
      const skip = 0;
      const params: BoxCapacityParamsDto = { searchKeyword: 'CRYO' };
      const mockResponse = {
        data: [mockBoxCapacityData[0]],
        total: 1
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getBoxCapacity(take, skip, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY(take, skip),
          params
        );
        done();
      });
    });

    it('should handle filter parameters', (done) => {
      const take = 10;
      const skip = 0;
      const params: BoxCapacityParamsDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 15
      };
      const mockResponse = {
        data: [mockBoxCapacityData[0]],
        total: 1
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getBoxCapacity(take, skip, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY(take, skip),
          params
        );
        done();
      });
    });

    it('should handle sorting parameters', (done) => {
      const take = 10;
      const skip = 0;
      const params: BoxCapacityParamsDto = { sort: 'A' };
      const mockResponse = {
        data: mockBoxCapacityData,
        total: 2
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getBoxCapacity(take, skip, params).subscribe(result => {
        expect(result.data).toEqual(mockBoxCapacityData);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY(take, skip),
          params
        );
        done();
      });
    });

    it('should handle errors from API', (done) => {
      const take = 10;
      const skip = 0;
      const params: BoxCapacityParamsDto = {};
      const error = { status: 500, message: 'Server error' };

      spyOn(console, 'error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getBoxCapacity(take, skip, params).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching box capacity data:', error);
          done();
        }
      });
    });

  });

  describe('getBoxCapacityFilters', () => {
    it('should fetch box capacity filter options', (done) => {
      const mockResponse = {
        data: [mockFilterLov]
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getBoxCapacityFilters().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(mockApiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.BOX_CAPACITY_FILTERS);
        done();
      });
    });

    it('should handle errors when fetching filters', (done) => {
      const error = { status: 404, message: 'Not found' };

      spyOn(console, 'error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getBoxCapacityFilters().subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching box capacity filters:', error);
          done();
        }
      });
    });

    it('should use correct API endpoint for filters', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getBoxCapacityFilters().subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.BOX_CAPACITY_FILTERS);
    });
  });

  describe('getBoxCapacityLookups', () => {
    it('should fetch box capacity lookup options', (done) => {
      const mockResponse = {
        data: [mockFilterLov]
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getBoxCapacityLookups().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(mockApiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.BOX_CAPACITY_LOOKUPS);
        done();
      });
    });

    it('should handle errors when fetching lookups', (done) => {
      const error = { status: 500, message: 'Internal server error' };

      spyOn(console, 'error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getBoxCapacityLookups().subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error fetching box capacity lookups:', error);
          done();
        }
      });
    });

    it('should use correct API endpoint for lookups', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getBoxCapacityLookups().subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.BOX_CAPACITY_LOOKUPS);
    });
  });

  describe('addBoxCapacity', () => {
    it('should add new box capacity record', (done) => {
      const addData: BoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 20,
        effectiveDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        message: 'Box capacity added successfully',
        data: [mockBoxCapacityData[0]]
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.addBoxCapacity(addData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT,
          addData
        );
        done();
      });
    });

    it('should add box capacity with termination date', (done) => {
      const addData: BoxCapacityDto = {
        boxType: 'CA',
        productType: 'FFP',
        capacity: 30,
        effectiveDate: '2024-01-15',
        terminationDate: '2025-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Box capacity added successfully'
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.addBoxCapacity(addData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT,
          addData
        );
        done();
      });
    });

    it('should handle conflict error (409) when adding duplicate', (done) => {
      const addData: BoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 20,
        effectiveDate: '2024-01-15'
      };

      const error = {
        status: 409,
        error: { message: 'Box capacity already exists' }
      };

      spyOn(console, 'error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addBoxCapacity(addData).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error adding box capacity:', error);
          done();
        }
      });
    });

    it('should handle validation error (400)', (done) => {
      const addData: BoxCapacityDto = {
        boxType: '',
        productType: '',
        capacity: -1,
        effectiveDate: ''
      };

      const error = {
        status: 400,
        error: { message: 'Invalid data' }
      };

      spyOn(console, 'error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addBoxCapacity(addData).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error adding box capacity:', error);
          done();
        }
      });
    });

    it('should use correct API endpoint for adding', () => {
      const addData: BoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 20,
        effectiveDate: '2024-01-15'
      };

      mockApiService.post.and.returnValue(of({ success: true }));

      service.addBoxCapacity(addData).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT,
        addData
      );
    });
  });

  describe('updateBoxCapacity', () => {
    it('should update existing box capacity record', (done) => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 25,
        effectiveDate: '2004-08-27'
      };

      const mockResponse = {
        success: true,
        message: 'Box capacity updated successfully',
        data: [{ ...mockBoxCapacityData[0], capacity: 25 }]
      };

      mockApiService.put.and.returnValue(of(mockResponse));

      service.updateBoxCapacity(updateData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT,
          updateData
        );
        done();
      });
    });

    it('should update box capacity with termination date', (done) => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 25,
        effectiveDate: '2004-08-27',
        terminationDate: '2025-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Box capacity updated successfully'
      };

      mockApiService.put.and.returnValue(of(mockResponse));

      service.updateBoxCapacity(updateData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT,
          updateData
        );
        done();
      });
    });

    it('should handle not found error (404) when updating', (done) => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: 'INVALID',
        productType: 'INVALID',
        capacity: 25,
        effectiveDate: '2004-08-27'
      };

      const error = {
        status: 404,
        error: { message: 'Box capacity not found' }
      };

      spyOn(console, 'error');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateBoxCapacity(updateData).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error updating box capacity:', error);
          done();
        }
      });
    });

    it('should handle server error (500) when updating', (done) => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 25,
        effectiveDate: '2004-08-27'
      };

      const error = {
        status: 500,
        error: { message: 'Internal server error' }
      };

      spyOn(console, 'error');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateBoxCapacity(updateData).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          expect(console.error).toHaveBeenCalledWith('Error updating box capacity:', error);
          done();
        }
      });
    });

    it('should use correct API endpoint for updating', () => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 25,
        effectiveDate: '2004-08-27'
      };

      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateBoxCapacity(updateData).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT,
        updateData
      );
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console for getBoxCapacity', (done) => {
      const error = new Error('Test error');
      spyOn(console, 'error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getBoxCapacity(10, 0, {}).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error fetching box capacity data:', error);
          done();
        }
      });
    });

    it('should log errors to console for getBoxCapacityFilters', (done) => {
      const error = new Error('Test error');
      spyOn(console, 'error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getBoxCapacityFilters().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error fetching box capacity filters:', error);
          done();
        }
      });
    });

    it('should log errors to console for addBoxCapacity', (done) => {
      const addData: BoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 20,
        effectiveDate: new Date().toISOString()
      };
      const error = new Error('Test error');
      spyOn(console, 'error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addBoxCapacity(addData).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error adding box capacity:', error);
          done();
        }
      });
    });

    it('should log errors to console for updateBoxCapacity', (done) => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 25,
        effectiveDate: new Date().toISOString()
      };
      const error = new Error('Test error');
      spyOn(console, 'error');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateBoxCapacity(updateData).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error updating box capacity:', error);
          done();
        }
      });
    });
  });

  describe('API Integration', () => {
    it('should use POST method for getBoxCapacity', () => {
      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getBoxCapacity(10, 0, {}).subscribe();

      expect(mockApiService.post).toHaveBeenCalled();
      expect(mockApiService.get).not.toHaveBeenCalled();
    });

    it('should use GET method for getBoxCapacityFilters', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getBoxCapacityFilters().subscribe();

      expect(mockApiService.get).toHaveBeenCalled();
      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it('should use GET method for getBoxCapacityLookups', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getBoxCapacityLookups().subscribe();

      expect(mockApiService.get).toHaveBeenCalled();
      expect(mockApiService.post).not.toHaveBeenCalled();
    });


    it('should use PUT method for updateBoxCapacity', () => {
      const updateData: UpdateBoxCapacityDto = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 25,
        effectiveDate: new Date().toISOString()
      };

      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateBoxCapacity(updateData).subscribe();

      expect(mockApiService.put).toHaveBeenCalled();
      expect(mockApiService.post).not.toHaveBeenCalled();
    });
  });
});
