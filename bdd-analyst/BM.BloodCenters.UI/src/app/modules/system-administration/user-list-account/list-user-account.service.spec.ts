import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserAccountService, UserAccountApiResponse } from './list-user-account.service';
import { ApiService } from '../../../shared/services/api.service';

describe('UserAccountService', () => {
  let service: UserAccountService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        UserAccountService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(UserAccountService);
  });

  describe('getUserAccounts', () => {
    it('should return mapped UI user accounts', (done) => {
      // Arrange
      const apiUser: UserAccountApiResponse = {
        useR_ID: 'U001',
        chapteR_ID: 'CH1',
        stafF_NO: '100',
        useR_FIRST_NAME: 'John',
        useR_LAST_NAME: 'Doe',
        efF_DATE: '2024-01-01T00:00:00Z',
        terM_DATE: null,
        prograM_ID: 'P1',
        useR_CLASS: 'ADMIN',
        testinG_LAB_CODE: 'LAB1',
        iS_PASSWORD_LOCKED: 'N',
        accountStatus: 'ACTIVE',
      };
      apiSpy.post.and.returnValue(of([apiUser]));

      // Act
      service.getUserAccounts({}).subscribe((result) => {
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].userId).toBe('U001');
        expect(result[0].name).toBe('John Doe');
        expect(result[0].isActive).toBe(true);
        done();
      });
    });
  });

  describe('toggleAccountLock', () => {
    it('should put toggle lock request', (done) => {
      // Arrange
      const mockResponse = { success: true, message: 'Locked' };
      apiSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.toggleAccountLock('U001', true).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
