import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LabUserAccessService } from './lab-user-access.service';
import { LoginService } from '@shared/services/login.service';
import {
  AddAccessClassRequest,
  UpdateAccessClassRequest
} from '../models/lab-user-access.model';

describe('LabUserAccessService', () => {
  let service: LabUserAccessService;
  let httpMock: HttpTestingController;
  let loginService: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LabUserAccessService,
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });
    service = TestBed.inject(LabUserAccessService);
    httpMock = TestBed.inject(HttpTestingController);
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get lab user access details', () => {
    const userId = 'TEST001';
    const mockApiResponse = {
      userName: 'Test User',
      department: 'Lab Services',
      data: [
        {
          accessClass: 'LAB01',
          code: 'LAB01',
          description: 'Lab Access 1',
          accessLevel: 5,
          effectiveDate: '2024-01-01',
          terminationDate: null
        }
      ]
    };

    service.getLabUserAccessDetails(userId).subscribe(response => {
      expect(response.userName).toBe('Test User');
      expect(response.department).toBe('Lab Services');
      expect(response.data.length).toBe(1);
      expect(response.data[0].accessClass).toBe('LAB01');
    });

    const req = httpMock.expectOne(req => req.url === '/api/v1/lab-user-access/details');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('userId')).toBe(userId);
    req.flush(mockApiResponse);
  });

  it('should get access class options', () => {
    const chapterId = 'CHAPTER1';
    const mockResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [
        { code: 'LAB01', codeDesc: 'Lab Access 1' },
        { code: 'LAB02', codeDesc: 'Lab Access 2' }
      ]
    };

    service.getAccessClassOptions(chapterId).subscribe(options => {
      expect(options.length).toBe(2);
      expect(options).toEqual([
        { code: 'LAB01', description: 'Lab Access 1' },
        { code: 'LAB02', description: 'Lab Access 2' }
      ]);
    });

    const req = httpMock.expectOne(req =>
      req.url === '/api/v1/lab-user-access/access-classes-dropdown' &&
      req.params.get('chapterId') === chapterId
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should add user access class', () => {
    const chapterId = 'ALL';
    const loggedInUserName = 'SYSTEM';
    const payload: AddAccessClassRequest = {
      userId: 'TEST001',
      accessClass: 'LAB01',
      description: 'Lab Access 1',
      accessLevel: 5,
      effectiveDate: '2024-01-01'
    };

    const mockResponse = {
      success: true,
      message: 'Access class added successfully',
      statusCode: 200,
      data: null
    };

    loginService.getStoredUsername.and.returnValue(loggedInUserName);

    service.addUserAccessClass(payload, chapterId).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(req =>
      req.url === '/api/v1/lab-user-access/insertlabaccessdetails' &&
      req.params.get('loggedInUserName') === loggedInUserName &&
      req.params.get('chapterId') === chapterId
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should update user access class', () => {
    const accessClass = 'LAB01';
    const chapterId = 'CHAPTER1';
    const loggedInUserName = 'SYSTEM';
    const payload: UpdateAccessClassRequest = {
      userId: 'TEST001',
      description: 'Lab Access 1',
      accessLevel: 3,
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31'
    };

    const mockResponse = {
      success: true,
      message: 'Access class updated successfully',
      statusCode: 200,
      data: null
    };

    loginService.getStoredUsername.and.returnValue(loggedInUserName);

    service.updateUserAccessClass(accessClass, payload, chapterId).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(req =>
      req.url === `/api/v1/lab-user-access/updatelabaccessdetails/${accessClass}` &&
      req.params.get('loggedInUserName') === loggedInUserName &&
      req.params.get('chapterId') === chapterId
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should get access level options', () => {
    const chapterId = 'CHAPTER1';
    const mockResponse = {
      success: true,
      message: 'Successfully fetched access level values.',
      statusCode: 200,
      data: [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' }
      ]
    };

    service.getAccessLevelOptions(chapterId).subscribe(options => {
      expect(options.length).toBe(3);
      expect(options).toEqual(mockResponse.data);
    });

    const req = httpMock.expectOne(req =>
      req.url === '/api/v1/lab-user-access/access-level-dropdown' &&
      req.params.get('chapterId') === chapterId
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get attached users', () => {
    const accessClass = 'LAB01';
    const mockResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [
        { userId: 'USER001', name: 'User 1', level: 5 },
        { userId: 'USER002', name: 'User 2', level: 3 }
      ]
    };

    service.getAttachedUsers(accessClass).subscribe(users => {
      expect(users.length).toBe(2);
      expect(users).toEqual(mockResponse.data);
    });

    const req = httpMock.expectOne(`/api/v1/lab-user-access/attached-users/${accessClass}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
