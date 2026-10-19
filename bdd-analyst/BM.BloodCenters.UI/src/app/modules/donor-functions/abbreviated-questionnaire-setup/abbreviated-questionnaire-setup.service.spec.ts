import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AbbreviatedQuestionnaireSetupService } from './abbreviated-questionnaire-setup.service';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';

describe('AbbreviatedQuestionnaireSetupService', () => {
  let service: AbbreviatedQuestionnaireSetupService;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let loggingSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);
    loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);

    TestBed.configureTestingModule({
      providers: [
        AbbreviatedQuestionnaireSetupService,
        { provide: ApiService, useValue: apiSpy },
        { provide: LoggingService, useValue: loggingSpy },
      ],
    });

    service = TestBed.inject(AbbreviatedQuestionnaireSetupService);
  });

  describe('getSetup', () => {
    it('should return the setup item from the response', (done) => {
      // Arrange
      const mockItem = { questionnaireId: 'Q1', enabled: true };
      apiSpy.get.and.returnValue(of({ item: mockItem }));

      // Act
      service.getSetup().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockItem as any);
        expect(loggingSpy.log).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getDonationTypes', () => {
    it('should return donation types array', (done) => {
      // Arrange
      const mockData = [{ donationType: 'WB' }, { donationType: 'PLT' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getDonationTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        expect(result.length).toBe(2);
        done();
      });
    });
  });

  describe('updateSetup', () => {
    it('should put the update payload and return response', (done) => {
      // Arrange
      const payload = { enabled: false } as any;
      const mockResponse = { success: true, message: 'Updated' };
      apiSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.updateSetup(payload).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        expect(loggingSpy.log).toHaveBeenCalled();
        done();
      });
    });
  });
});
