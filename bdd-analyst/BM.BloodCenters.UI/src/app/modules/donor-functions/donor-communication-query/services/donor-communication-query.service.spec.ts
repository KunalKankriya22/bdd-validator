import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonorCommunicationQueryService } from './donor-communication-query.service';
import { ApiService } from '@shared/services/api.service';
import {
  DonorCommunicationQueryRequest,
  CommunicationRecord,
  ActionCodeOption,
  UpdateCommunicationRequest,
  UpdateCommunicationResponse,
  CommunicationCompositeId,
  CommunicationTypeOption,
  CommunicationCodeOption,
  UserListItem,
} from '../models/donor-communication-query.model';
import { API } from 'src/app/core/constants/api.constants';
import { of, throwError } from 'rxjs';

describe('DonorCommunicationQueryService', () => {
  let service: DonorCommunicationQueryService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockCommunicationRecord: CommunicationRecord = {
    donorId: 'DN00014473',
    comType: 'DCOMT',
    comCode: 'COMPL',
    insertUser: 'NITOR1',
    insertDate: '04-30-2026',
    actionCode: 'CALLD',
    name: 'Doe, John M',
    dob: '01-15-1985',
    sex: 'M',
    abo: 'A Positive',
    targetDate: '05-01-2026',
    actionDate: '04-27-2026',
    comDesc: 'Test letter, THANKS',
    chapterId: 'CH001',
  };

  const mockActionCodes: ActionCodeOption[] = [
    { code: 'CALLD', description: 'Called' },
    { code: 'FCARD', description: 'Follow-up Card' },
  ];

  const mockCommTypes: CommunicationTypeOption[] = [
    { code: 'DCOMT', description: 'Donor Communication' },
    { code: 'EMAIL', description: 'Email Communication' },
  ];

  const mockCommCodes: CommunicationCodeOption[] = [
    { code: 'COMPL', description: 'Complaint' },
    { code: 'THANK', description: 'Thank You' },
  ];

  const mockUsers: UserListItem[] = [
    { userId: 'NITOR1', userName: 'Doe, John' },
    { userId: 'USER02', userName: 'Smith, Jane' },
  ];

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DonorCommunicationQueryService,
        { provide: ApiService, useValue: apiService },
      ],
    });

    service = TestBed.inject(DonorCommunicationQueryService);
  });

  // ==================== Initialization ====================

  // ==================== query() ====================

  describe('query()', () => {
    it('should query communications with default pagination', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
      };

      const mockResponse = {
        Data: [
          {
            DonorId: 'DN00014473',
            ComType: 'DCOMT',
            ComCode: 'COMPL',
            InsertUser: 'NITOR1',
            InsertDate: '04-30-2026',
            ActionCode: 'CALLD',
            Name: 'Doe, John M',
            Dob: '01-15-1985',
            Sex: 'M',
            Abo: 'A Positive',
            TargetDate: '05-01-2026',
            ActionDate: '04-27-2026',
            ComDesc: 'Test letter, THANKS',
            ChapterId: 'CH001',
          },
        ],
        Total: 1,
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.query(request).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          expect(result.data[0].donorId).toBe('DN00014473');
          expect(result.data[0].comType).toBe('DCOMT');
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.QUERY(25, 0),
        jasmine.objectContaining({
          fromDate: '2026-05-01T00:00:00Z',
          toDate: '2026-05-16T23:59:59Z'
        })
      );
    });

    it('should query with custom pagination parameters', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
      };

      apiService.post.and.returnValue(of({ Data: [], Total: 0 }));

      service.query(request, 50, 25).subscribe({
        next: () => {
          done();
        },
      });

      expect(apiService.post).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.QUERY(50, 25),
        jasmine.objectContaining({
          fromDate: '2026-05-01T00:00:00Z',
          toDate: '2026-05-16T23:59:59Z'
        })
      );
    });

    it('should map PascalCase response to camelCase', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
      };

      const pascalResponse = {
        Data: [
          {
            DonorId: 'DN00014473',
            Name: 'Doe, John',
            Dob: '01-15-1985',
            Sex: 'M',
            Abo: 'A Positive',
            ComType: 'DCOMT',
            ComCode: 'COMPL',
            InsertUser: 'NITOR1',
            InsertDate: '04-30-2026',
            ActionCode: 'CALLD',
            TargetDate: '05-01-2026',
            ActionDate: '04-27-2026',
            ComDesc: 'Test',
            ChapterId: 'CH001',
          },
        ],
        Total: 1,
      };

      apiService.post.and.returnValue(of(pascalResponse));

      service.query(request).subscribe({
        next: (result) => {
          const record = result.data[0];
          expect(record.donorId).toBe('DN00014473');
          expect(record.comType).toBe('DCOMT');
          expect(record.comCode).toBe('COMPL');
          expect(record.insertUser).toBe('NITOR1');
          expect(record.insertDate).toBe('04-30-2026');
          expect(record.name).toBe('Doe, John');
          expect(record.dob).toBe('01-15-1985');
          expect(record.sex).toBe('M');
          expect(record.abo).toBe('A Positive');
          expect(record.actionCode).toBe('CALLD');
          expect(record.targetDate).toBe('05-01-2026');
          expect(record.actionDate).toBe('04-27-2026');
          expect(record.comDesc).toBe('Test');
          expect(record.chapterId).toBe('CH001');
          done();
        },
      });
    });


    it('should handle nullable fields properly', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
      };

      const response = {
        Data: [
          {
            DonorId: 'DN00014473',
            Name: 'Doe, John',
            Dob: '01-15-1985',
            Sex: 'M',
            Abo: 'A Positive',
            ComType: 'DCOMT',
            ComCode: 'COMPL',
            InsertUser: 'NITOR1',
            InsertDate: '04-30-2026',
            ChapterId: 'CH001',
            // Nullable fields not present
          },
        ],
        Total: 1,
      };

      apiService.post.and.returnValue(of(response));

      service.query(request).subscribe({
        next: (result) => {
          const record = result.data[0];
          expect(record.actionCode).toBeNull();
          expect(record.targetDate).toBeNull();
          expect(record.actionDate).toBeNull();
          expect(record.comDesc).toBeNull();
          done();
        },
      });
    });

    it('should handle nullable fields with explicit null values', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
      };

      const response = {
        Data: [
          {
            DonorId: 'DN00014473',
            Name: 'Doe, John',
            Dob: '01-15-1985',
            Sex: 'M',
            Abo: 'A Positive',
            ComType: 'DCOMT',
            ComCode: 'COMPL',
            InsertUser: 'NITOR1',
            InsertDate: '04-30-2026',
            ChapterId: 'CH001',
            ActionCode: null,
            TargetDate: null,
            ActionDate: null,
            ComDesc: null,
          },
        ],
        Total: 1,
      };

      apiService.post.and.returnValue(of(response));

      service.query(request).subscribe({
        next: (result) => {
          const record = result.data[0];
          expect(record.actionCode).toBeNull();
          expect(record.targetDate).toBeNull();
          expect(record.actionDate).toBeNull();
          expect(record.comDesc).toBeNull();
          done();
        },
      });
    });


    it('should transform pendingActionsOnly from true to "T"', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
        pendingActionsOnly: true,
      };

      apiService.post.and.returnValue(of({ Data: [], Total: 0 }));

      service.query(request, 25, 0).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          expect(callArgs[1].pendingActionsOnly).toBe('T');
          done();
        },
      });
    });

    it('should transform pendingActionsOnly from false to "F"', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
        pendingActionsOnly: false,
      };

      apiService.post.and.returnValue(of({ Data: [], Total: 0 }));

      service.query(request, 25, 0).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          expect(callArgs[1].pendingActionsOnly).toBe('F');
          done();
        },
      });
    });





    it('should pass all optional request parameters to API', (done) => {
      const request: DonorCommunicationQueryRequest = {
        fromDate: '2026-05-01T00:00:00Z',
        toDate: '2026-05-16T23:59:59Z',
        userId: 'USER01',
        commType: 'DCOMT',
        commCode: 'COMPL',
        pendingActionsOnly: true,
      };

      apiService.post.and.returnValue(of({ Data: [], Total: 0 }));

      service.query(request).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          const apiRequest = callArgs[1];
          expect(apiRequest.fromDate).toBe('2026-05-01T00:00:00Z');
          expect(apiRequest.toDate).toBe('2026-05-16T23:59:59Z');
          expect(apiRequest.userId).toBe('USER01');
          expect(apiRequest.commType).toBe('DCOMT');
          expect(apiRequest.commCode).toBe('COMPL');
          expect(apiRequest.pendingActionsOnly).toBe('T');
          done();
        },
      });
    });
  });

  // ==================== getById() ====================

  describe('getById()', () => {
    it('should get communication by composite ID', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const mockResponse = {
        Data: [
          {
            DonorId: 'DN00014473',
            ComType: 'DCOMT',
            ComCode: 'COMPL',
            InsertUser: 'NITOR1',
            InsertDate: '04-30-2026',
            ActionCode: 'CALLD',
            Name: 'Doe, John M',
            Dob: '01-15-1985',
            Sex: 'M',
            Abo: 'A Positive',
            TargetDate: '05-01-2026',
            ActionDate: '04-27-2026',
            ComDesc: 'Test',
            ChapterId: 'CH001',
          },
        ],
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getById(id).subscribe({
        next: (result) => {
          expect(result.donorId).toBe('DN00014473');
          expect(result.comType).toBe('DCOMT');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.GET_BY_ID(
          id.donorId,
          id.comType,
          id.comCode,
          id.insertUser,
          id.insertDate
        )
      );
    });

    it('should map PascalCase response to camelCase', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const mockResponse = {
        Data: [
          {
            DonorId: 'DN00014473',
            Name: 'Doe, John',
            Dob: '01-15-1985',
            Sex: 'M',
            Abo: 'A+',
            ComType: 'DCOMT',
            ComCode: 'COMPL',
            InsertUser: 'NITOR1',
            InsertDate: '04-30-2026',
            ActionCode: 'CALLD',
            TargetDate: '05-01-2026',
            ActionDate: '04-27-2026',
            ComDesc: 'Test',
            ChapterId: 'CH001',
          },
        ],
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getById(id).subscribe({
        next: (result) => {
          expect(result.donorId).toBe('DN00014473');
          expect(result.name).toBe('Doe, John');
          expect(result.dob).toBe('01-15-1985');
          expect(result.sex).toBe('M');
          expect(result.abo).toBe('A+');
          expect(result.comType).toBe('DCOMT');
          expect(result.comCode).toBe('COMPL');
          expect(result.insertUser).toBe('NITOR1');
          expect(result.insertDate).toBe('04-30-2026');
          expect(result.actionCode).toBe('CALLD');
          expect(result.targetDate).toBe('05-01-2026');
          expect(result.actionDate).toBe('04-27-2026');
          expect(result.comDesc).toBe('Test');
          expect(result.chapterId).toBe('CH001');
          done();
        },
      });
    });


    it('should throw error when record not found (empty Data array)', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      apiService.get.and.returnValue(of({ Data: [] }));

      service.getById(id).subscribe({
        error: (error) => {
          expect(error.message).toBe('Record not found');
          done();
        },
      });
    });

    it('should throw error when record not found (null Data)', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      apiService.get.and.returnValue(of({ Data: null }));

      service.getById(id).subscribe({
        error: (error) => {
          expect(error.message).toBe('Record not found');
          done();
        },
      });
    });

    it('should throw error when record not found (no Data field)', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      apiService.get.and.returnValue(of({}));

      service.getById(id).subscribe({
        error: (error) => {
          expect(error.message).toBe('Record not found');
          done();
        },
      });
    });

  });

  // ==================== update() ====================

  describe('update()', () => {
    it('should update communication successfully', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'FCARD',
        targetDate: '2026-05-20T00:00:00',
        actionDate: '2026-05-18T00:00:00',
        comDesc: 'Updated description',
      };

      const mockResponse = {
        Success: true,
        Message: 'Communication updated successfully',
        StatusCode: 200,
        Data: { ...mockCommunicationRecord },
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Communication updated successfully');
          expect(result.statusCode).toBe(200);
          expect(result.data).toEqual(mockCommunicationRecord);
          done();
        },
      });

      expect(apiService.put).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.UPDATE(
          id.donorId,
          id.comType,
          id.comCode,
          id.insertUser,
          id.insertDate
        ),
        updateRequest
      );
    });


    it('should handle successful update without data field', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'FCARD',
      };

      const mockResponse = {
        Success: true,
        Message: 'Success',
        StatusCode: 200,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.data).toBeUndefined();
          done();
        },
      });
    });

    it('should throw error when update fails with ErrorResponse.Error (PascalCase)', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'INVALID',
      };

      const mockResponse = {
        Success: false,
        Message: 'Update failed',
        ErrorResponse: {
          errorCode: '18017',
          Error: 'Invalid action code',
        },
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid action code');
          done();
        },
      });
    });

    it('should throw error when update fails with ErrorResponse.error (camelCase)', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'INVALID',
      };

      const mockResponse = {
        Success: false,
        Message: 'Update failed',
        ErrorResponse: {
          errorCode: '18017',
          error: 'Invalid action code',
        },
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid action code');
          done();
        },
      });
    });

    it('should throw error with Message when ErrorResponse is not present', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'INVALID',
      };

      const mockResponse = {
        Success: false,
        Message: 'Validation error',
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Validation error');
          done();
        },
      });
    });

    it('should throw default error message when no error details provided', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'INVALID',
      };

      const mockResponse = {
        Success: false,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should handle update with null values', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: null,
        targetDate: null,
        actionDate: null,
        comDesc: null,
      };

      const mockResponse = {
        Success: true,
        Message: 'Success',
        StatusCode: 200,
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          done();
        },
      });
    });


    it('should handle errorResponse with different casing', (done) => {
      const id: CommunicationCompositeId = {
        donorId: 'DN00014473',
        comType: 'DCOMT',
        comCode: 'COMPL',
        insertUser: 'NITOR1',
        insertDate: '2026-04-30',
      };

      const updateRequest: UpdateCommunicationRequest = {
        actionCode: 'INVALID',
      };

      const mockResponse = {
        success: false,
        errorResponse: {
          errorCode: '18017',
          error: 'Validation failed',
        },
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update(id, updateRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Validation failed');
          done();
        },
      });
    });

  });

  // ==================== getActionCodes() ====================

  describe('getActionCodes()', () => {
    it('should get action codes list from array response', (done) => {
      const response = [
        { CommCode: 'CALLD', Description: 'Called' },
        { CommCode: 'FCARD', Description: 'Follow-up Card' },
      ];

      apiService.get.and.returnValue(of(response));

      service.getActionCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('CALLD');
          expect(result[0].description).toBe('Called');
          expect(result[1].code).toBe('FCARD');
          expect(result[1].description).toBe('Follow-up Card');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.ACTION_CODES
      );
    });


    it('should handle wrapped camelCase response format', (done) => {
      const response = {
        data: [
          { commCode: 'CALLD', description: 'Called' },
          { commCode: 'FCARD', description: 'Follow-up Card' },
        ],
      };

      apiService.get.and.returnValue(of(response));

      service.getActionCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('CALLD');
          expect(result[0].description).toBe('Called');
          done();
        },
      });
    });



    it('should handle null Data field in wrapped response', (done) => {
      const response = {
        Data: null,
      };

      apiService.get.and.returnValue(of(response));

      service.getActionCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(0);
          done();
        },
      });
    });

    it('should handle response without Data field', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getActionCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(0);
          done();
        },
      });
    });

  });

  // ==================== getCommunicationTypes() ====================

  describe('getCommunicationTypes()', () => {
    it('should get communication types', (done) => {
      const response = {
        Success: true,
        Data: [
          { Code: 'DCOMT', Description: 'Donor Communication' },
          { Code: 'EMAIL', Description: 'Email Communication' },
        ],
      };

      apiService.get.and.returnValue(of(response));

      service.getCommunicationTypes().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('DCOMT');
          expect(result[0].description).toBe('Donor Communication');
          expect(result[1].code).toBe('EMAIL');
          expect(result[1].description).toBe('Email Communication');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(API.COMMON_LETTER.COMMUNICATION_TYPES);
    });






  });

  // ==================== getCommunicationCodes() ====================

  describe('getCommunicationCodes()', () => {
    it('should get communication codes for a type', (done) => {
      const commType = 'DCOMT';
      const response = {
        Success: true,
        Data: [
          { Code: 'COMPL', Description: 'Complaint' },
          { Code: 'THANK', Description: 'Thank You' },
        ],
      };

      apiService.get.and.returnValue(of(response));

      service.getCommunicationCodes(commType).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('COMPL');
          expect(result[0].description).toBe('Complaint');
          expect(result[1].code).toBe('THANK');
          expect(result[1].description).toBe('Thank You');
          done();
        },
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.COMMON_LETTER.COMMUNICATION_CODES(commType)
      );
    });






  });

  // ==================== getUsers() ====================

  describe('getUsers()', () => {
    it('should get users without date parameters', (done) => {
      const response = [
        { UserId: 'NITOR1', UserName: 'Doe, John' },
        { UserId: 'USER02', UserName: 'Smith, Jane' },
      ];

      apiService.get.and.returnValue(of(response));

      service.getUsers().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].userId).toBe('NITOR1');
          expect(result[0].userName).toBe('Doe, John');
          expect(result[1].userId).toBe('USER02');
          expect(result[1].userName).toBe('Smith, Jane');
          done();
        },
      });

      const callArgs = apiService.get.calls.mostRecent().args;
      expect(callArgs[0]).toBe(API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.USERS);
      expect(callArgs[1]).toBeDefined();
      expect(callArgs[1]?.params).toBeDefined();
    });

    it('should get users with date parameters', (done) => {
      const response = [
        { UserId: 'NITOR1', UserName: 'Doe, John' },
      ];

      apiService.get.and.returnValue(of(response));

      service.getUsers('2026-05-01', '2026-05-16').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });

      const callArgs = apiService.get.calls.mostRecent().args;
      const params = callArgs[1]?.params;
      expect(params?.get('fromDate')).toBe('2026-05-01');
      expect(params?.get('toDate')).toBe('2026-05-16');
    });

    it('should pass only fromDate when toDate is not provided', (done) => {
      const response = [
        { UserId: 'NITOR1', UserName: 'Doe, John' },
      ];

      apiService.get.and.returnValue(of(response));

      service.getUsers('2026-05-01').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });

      const callArgs = apiService.get.calls.mostRecent().args;
      const params = callArgs[1]?.params;
      expect(params?.get('fromDate')).toBe('2026-05-01');
      expect(params?.get('toDate')).toBeNull();
    });

    it('should handle wrapped PascalCase response', (done) => {
      const response = {
        Data: [
          { UserId: 'NITOR1', UserName: 'Doe, John' },
        ],
      };

      apiService.get.and.returnValue(of(response));

      service.getUsers().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].userId).toBe('NITOR1');
          expect(result[0].userName).toBe('Doe, John');
          done();
        },
      });
    });

    it('should handle wrapped camelCase response', (done) => {
      const response = {
        data: [
          { userId: 'NITOR1', userName: 'Doe, John' },
        ],
      };

      apiService.get.and.returnValue(of(response));

      service.getUsers().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].userId).toBe('NITOR1');
          expect(result[0].userName).toBe('Doe, John');
          done();
        },
      });
    });


    it('should handle null Data field in wrapped response', (done) => {
      const response = {
        Data: null,
      };

      apiService.get.and.returnValue(of(response));

      service.getUsers().subscribe({
        next: (result) => {
          expect(result.length).toBe(0);
          done();
        },
      });
    });

    it('should handle response without Data field', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getUsers().subscribe({
        next: (result) => {
          expect(result.length).toBe(0);
          done();
        },
      });
    });

  });
});
