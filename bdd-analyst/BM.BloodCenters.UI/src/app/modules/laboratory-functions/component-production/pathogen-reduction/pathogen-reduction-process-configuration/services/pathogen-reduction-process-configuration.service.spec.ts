import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PathogenReductionProcessConfigurationService } from './pathogen-reduction-process-configuration.service';
import { ApiService } from '@shared/services/api.service';
import {
  PathogenReductionProcessConfiguration,
  CreatePathogenReductionProcessConfiguration,
  UpdatePathogenReductionProcessConfiguration
} from '../models/pathogen-reduction-process-configuration.model';

describe('PathogenReductionProcessConfigurationService', () => {
  let service: PathogenReductionProcessConfigurationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockConfiguration: PathogenReductionProcessConfiguration = {
    volumeTypeSet: 'VST001',
    suspensionType: 'Plasma',
    equipType: 'EQ001',
    minVol: 50,
    maxVol: 100,
    minPltCount: 1000,
    maxPltCount: 5000,
    minCadTime: 1,
    maxCadTime: 24,
    finalMinVolume: 40,
    finalMaxVolume: 90,
    finalMinPltCount: 800,
    finalMaxPltCount: 4500,
    finalMaxNoBags: 5,
    maxStorageDays: 7,
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    insertDate: '2024-01-01T10:00:00Z',
    chapterId: 'WAD',
    insertUser: 'testuser',
    programId: 'PROG001'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PathogenReductionProcessConfigurationService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(PathogenReductionProcessConfigurationService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getConfigurations', () => {
    it('should fetch configurations with pagination', (done) => {
      const mockResponse = {
        data: [mockConfiguration],
        total: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getConfigurations(25, 0, {}).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalled();
        done();
      });
    });

  });

  describe('createConfiguration', () => {
    it('should create a new configuration', (done) => {
      const createData: CreatePathogenReductionProcessConfiguration = {
        volumeTypeSet: 'VST001',
        suspensionType: 'Plasma',
        equipType: 'EQ001',
        finalMaxNoBags: 5,
        effDate: '2024-01-01T00:00:00Z'
      };

      const mockResponse = {
        success: true,
        item: mockConfiguration
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createConfiguration(createData).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(apiServiceSpy.post).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateConfiguration', () => {
    it('should update an existing configuration', (done) => {
      const updateData: UpdatePathogenReductionProcessConfiguration = {
        finalMaxNoBags: 10,
        effDate: '2024-01-01T00:00:00Z'
      };

      const mockResponse = {
        success: true,
        item: mockConfiguration
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateConfiguration('VST001', updateData).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(apiServiceSpy.put).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Lookup methods', () => {

    it('should fetch suspension types', (done) => {
      const mockLookups = {
        data: [{ code: 'PLASMA', description: 'Plasma' }]
      };

      apiServiceSpy.get.and.returnValue(of(mockLookups));

      service.getSuspensionTypes().subscribe(data => {
        expect(data.length).toBe(1);
        done();
      });
    });

    it('should fetch equipment types', (done) => {
      const mockLookups = {
        data: [{ code: 'EQ001', description: 'Equipment 1' }]
      };

      apiServiceSpy.get.and.returnValue(of(mockLookups));

      service.getEquipmentTypes().subscribe(data => {
        expect(data.length).toBe(1);
        done();
      });
    });
  });
});
