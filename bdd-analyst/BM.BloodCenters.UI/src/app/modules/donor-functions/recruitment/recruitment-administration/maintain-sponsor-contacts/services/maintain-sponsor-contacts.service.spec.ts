import { TestBed } from '@angular/core/testing';
import { MaintainSponsorContactsService } from './maintain-sponsor-contacts.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { of, throwError } from 'rxjs';
import {
  SponsorContactParamsDto,
  SponsorContactCreateDto
} from '../models/maintain-sponsor-contacts.model';

describe('MaintainSponsorContactsService', () => {
  let service: MaintainSponsorContactsService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        MaintainSponsorContactsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(MaintainSponsorContactsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getSponsorContacts', () => {
    it('should get sponsor contacts with pagination', (done) => {
      const mockParams: SponsorContactParamsDto = {
        sponsorId: 'SPONSOR123',
        contactName: '',
        chapterId: 'CHAPTER1'
      };

      const mockResponse = {
        data: [
          { sponsorId: 'SPONSOR123', lastName: 'Doe', firstName: 'John' }
        ],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getSponsorContacts(10, 0, mockParams).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(apiService.post).toHaveBeenCalledWith(
          API.SPONSOR_CONTACTS.GET_ALL(10, 0),
          mockParams
        );
        done();
      });
    });

    it('should handle PascalCase response (Data/Total)', (done) => {
      const mockParams: SponsorContactParamsDto = {
        sponsorId: 'S1',
        contactName: '',
        chapterId: 'C1'
      };

      const mockResponse = {
        Data: [{ sponsorId: 'S1', lastName: 'Doe', firstName: 'Jane' }],
        Total: 5
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getSponsorContacts(10, 0, mockParams).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].sponsorId).toBe('S1');
        expect(result.totalRecords).toBe(5);
        done();
      });
    });

    it('should default to empty array and zero when response has no data/total keys', (done) => {
      const mockParams: SponsorContactParamsDto = {
        sponsorId: 'S1',
        contactName: '',
        chapterId: 'C1'
      };

      apiService.post.and.returnValue(of({}));

      service.getSponsorContacts(10, 0, mockParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockParams: SponsorContactParamsDto = {
        sponsorId: 'S1',
        contactName: '',
        chapterId: 'C1'
      };
      const mockError = { status: 500, message: 'Server error' };

      apiService.post.and.returnValue(throwError(() => mockError));

      service.getSponsorContacts(10, 0, mockParams).subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getSponsorIds', () => {
    it('should get sponsor IDs for a chapter', (done) => {
      const mockResponse = {
        data: [
          { sponsorId: 'SPONSOR1', name: 'Sponsor One' },
          { sponsorId: 'SPONSOR2', name: 'Sponsor Two' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSponsorIds('CHAPTER1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].sponsorId).toBe('SPONSOR1');
        expect(result[0].name).toBe('Sponsor One');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.SPONSOR_IDS('CHAPTER1'));
        done();
      });
    });

    it('should handle empty sponsor IDs', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getSponsorIds('CHAPTER1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle PascalCase response (Data)', (done) => {
      const mockResponse = {
        Data: [{ sponsorId: 'SP1', name: 'Sponsor PascalCase' }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSponsorIds('CHAPTER1').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].sponsorId).toBe('SP1');
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 404, message: 'Not found' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getSponsorIds('CHAPTER1').subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getContactNames', () => {
    it('should get contact names for a chapter', (done) => {
      const mockResponse = {
        data: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactNames('CHAPTER1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].firstName).toBe('John');
        expect(result[0].lastName).toBe('Doe');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.CONTACT_NAMES('CHAPTER1'));
        done();
      });
    });

    it('should handle missing first name', (done) => {
      const mockResponse = {
        data: [
          { lastName: 'Doe' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactNames('CHAPTER1').subscribe(result => {
        expect(result[0].firstName).toBe('');
        done();
      });
    });

    it('should handle missing last name', (done) => {
      const mockResponse = {
        data: [{ firstName: 'John' }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactNames('CHAPTER1').subscribe(result => {
        expect(result[0].lastName).toBe('');
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getContactNames('CHAPTER1').subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('createContact', () => {
    it('should create a new contact', (done) => {
      const mockPayload: SponsorContactCreateDto = {
        sponsorId: 'SPONSOR123',
        contactType: 'PRIMARY',
        lastName: 'Doe',
        effDate: '2026-06-15',
        chapterId: 'CHAPTER1'
      };

      const mockResponse = { message: 'Contact created successfully' };

      apiService.post.and.returnValue(of(mockResponse));

      service.createContact(mockPayload).subscribe(result => {
        expect(result.message).toBe('Contact created successfully');
        expect(apiService.post).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.CREATE, mockPayload);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockPayload: SponsorContactCreateDto = {
        sponsorId: 'S1',
        contactType: 'PRIMARY',
        lastName: 'Doe',
        effDate: '2026-06-15',
        chapterId: 'C1'
      };
      const mockError = { status: 400, message: 'Validation error' };

      apiService.post.and.returnValue(throwError(() => mockError));

      service.createContact(mockPayload).subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getContactDetail', () => {
    it('should get contact detail', (done) => {
      const mockResponse = {
        item: {
          sponsorId: 'SPONSOR123',
          addressId: 'ADDR456',
          lastName: 'Doe',
          firstName: 'John'
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactDetail('SPONSOR123', 'ADDR456').subscribe(result => {
        expect(result.sponsorId).toBe('SPONSOR123');
        expect(result.lastName).toBe('Doe');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.GET_DETAIL('SPONSOR123', 'ADDR456'));
        done();
      });
    });

    it('should handle PascalCase response (Item)', (done) => {
      const mockResponse = {
        Item: {
          sponsorId: 'S1',
          addressId: 'A1',
          lastName: 'Pascal',
          firstName: 'Case'
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactDetail('S1', 'A1').subscribe(result => {
        expect(result.sponsorId).toBe('S1');
        expect(result.lastName).toBe('Pascal');
        done();
      });
    });

    it('should return null when detail is not found', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getContactDetail('S1', 'A1').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should map notes array using camelCase fields', (done) => {
      const mockResponse = {
        item: {
          sponsorId: 'S1',
          addressId: 'A1',
          contactId: 'C1',
          lastName: 'Doe',
          notes: [
            {
              noteId: 'N1',
              noteText: 'Test note',
              createdBy: 'user1',
              createdDate: '2026-01-01',
              version: 'v1',
              auditKey: 10
            }
          ]
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactDetail('S1', 'A1').subscribe(result => {
        expect(result.notes).toBeDefined();
        expect(result.notes!.length).toBe(1);
        expect(result.notes![0].noteId).toBe('N1');
        expect(result.notes![0].contactId).toBe('C1');
        expect(result.notes![0].notes).toBe('Test note');
        expect(result.notes![0].createdBy).toBe('user1');
        expect(result.notes![0].createdDate).toBe('2026-01-01');
        expect(result.notes![0].version).toBe('v1');
        expect(result.notes![0].auditKey).toBe(10);
        done();
      });
    });

    it('should map notes array using PascalCase fields (NoteId, Notes)', (done) => {
      const mockResponse = {
        item: {
          sponsorId: 'S1',
          addressId: 'A1',
          contactId: 'C1',
          lastName: 'Doe',
          Notes: [
            {
              NoteId: 'N2',
              notes: 'Pascal note text',
              insertUser: 'admin',
              insertDate: '2026-02-01',
              version: 'v2',
              auditKey: 20
            }
          ]
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactDetail('S1', 'A1').subscribe(result => {
        expect(result.notes).toBeDefined();
        expect(result.notes![0].noteId).toBe('N2');
        expect(result.notes![0].notes).toBe('Pascal note text');
        expect(result.notes![0].createdBy).toBe('admin');
        expect(result.notes![0].createdDate).toBe('2026-02-01');
        done();
      });
    });

    it('should handle detail without notes', (done) => {
      const mockResponse = {
        item: {
          sponsorId: 'S1',
          addressId: 'A1',
          lastName: 'NoNotes'
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactDetail('S1', 'A1').subscribe(result => {
        expect(result.sponsorId).toBe('S1');
        expect((result as any).notes).toBeUndefined();
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getContactDetail('S1', 'A1').subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('updateContact', () => {
    it('should update a contact', (done) => {
      const mockPayload = {
        contactType: 'PRIMARY',
        lastName: 'Smith',
        effDate: '2026-06-15'
      };

      const mockResponse = { message: 'Contact updated successfully' };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateContact('SPONSOR123', 'ADDR456', 'CHAPTER1', mockPayload).subscribe(result => {
        expect(result.message).toBe('Contact updated successfully');
        expect(apiService.put).toHaveBeenCalledWith(
          API.SPONSOR_CONTACTS.UPDATE('SPONSOR123', 'ADDR456', 'CHAPTER1'),
          mockPayload
        );
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 400, message: 'Bad request' };
      apiService.put.and.returnValue(throwError(() => mockError));

      service.updateContact('S1', 'A1', 'C1', {}).subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getContactTypes', () => {
    it('should get contact types', (done) => {
      const mockResponse = {
        data: [
          { code: 'PRIMARY', description: 'Primary Contact' },
          { code: 'SECONDARY', description: 'Secondary Contact' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getContactTypes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('PRIMARY');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.CONTACT_TYPES);
        done();
      });
    });

    it('should handle empty contact types', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getContactTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getContactTypes().subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getSalutations', () => {
    it('should get salutations', (done) => {
      const mockResponse = {
        data: [
          { code: 'MR', description: 'Mr.' },
          { code: 'MRS', description: 'Mrs.' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSalutations().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('MR');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.SALUTATIONS);
        done();
      });
    });

    it('should handle empty salutations', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getSalutations().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getSalutations().subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getTitles', () => {
    it('should get titles', (done) => {
      const mockResponse = {
        data: [
          { code: 'MGR', description: 'Manager' },
          { code: 'DIR', description: 'Director' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTitles().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('MGR');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.TITLES);
        done();
      });
    });

    it('should handle empty titles', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getTitles().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getTitles().subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getCountries', () => {
    it('should get countries', (done) => {
      const mockResponse = {
        data: [
          { code: 'US', description: 'United States' },
          { code: 'UK', description: 'United Kingdom' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCountries().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('US');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.COUNTRIES);
        done();
      });
    });

    it('should handle empty countries', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getCountries().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getCountries().subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getZipCodes', () => {
    it('should get zip codes', (done) => {
      const mockResponse = {
        data: [
          { uspsId: '123', city: 'New York', state: 'NY', zip: '10001' },
          { uspsId: '124', city: 'Brooklyn', state: 'NY', zip: '10001' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getZipCodes('10001').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].city).toBe('New York');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.ZIP_CODES('10001'));
        done();
      });
    });

    it('should handle empty zip codes', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getZipCodes('99999').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getZipCodes('10001').subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('addContactNote', () => {
    it('should add a contact note', (done) => {
      const mockPayload = { noteText: 'New note', insertUser: 'testuser' };
      const mockResponse = { message: 'Note added successfully' };

      apiService.post.and.returnValue(of(mockResponse));

      service.addContactNote('SPONSOR123', 'ADDR456', 'CHAPTER1', mockPayload).subscribe((result: any) => {
        expect(result.message).toBe('Note added successfully');
        expect(apiService.post).toHaveBeenCalledWith(
          API.SPONSOR_CONTACTS.ADD_NOTE('SPONSOR123', 'ADDR456', 'CHAPTER1'),
          mockPayload
        );
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockPayload = { noteText: 'Note', insertUser: 'user' };
      const mockError = { status: 500, message: 'Server error' };

      apiService.post.and.returnValue(throwError(() => mockError));

      service.addContactNote('S1', 'A1', 'C1', mockPayload).subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('updateContactNote', () => {
    it('should update a contact note', (done) => {
      const mockPayload = { noteText: 'Updated note', insertUser: 'testuser' };
      const mockResponse = { message: 'Note updated successfully' };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateContactNote('NOTE123', 1, mockPayload).subscribe((result: any) => {
        expect(result.message).toBe('Note updated successfully');
        expect(apiService.put).toHaveBeenCalledWith(
          API.SPONSOR_CONTACTS.UPDATE_NOTE('NOTE123', 1),
          mockPayload
        );
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockPayload = { noteText: 'Note' };
      const mockError = { status: 500, message: 'Server error' };

      apiService.put.and.returnValue(throwError(() => mockError));

      service.updateContactNote('N1', 1, mockPayload).subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('deleteContactNote', () => {
    it('should delete a contact note', (done) => {
      const mockResponse = { message: 'Note deleted successfully' };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteContactNote('SPONSOR123', 'ADDR456', 1).subscribe(result => {
        expect(result.message).toBe('Note deleted successfully');
        expect(apiService.delete).toHaveBeenCalledWith(
          API.SPONSOR_CONTACTS.DELETE_NOTE('SPONSOR123', 'ADDR456', 1)
        );
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };

      apiService.delete.and.returnValue(throwError(() => mockError));

      service.deleteContactNote('S1', 'A1', 1).subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getLookupValues', () => {
    it('should get lookup values', (done) => {
      const mockResponse = {
        Data: ['Value1', 'Value2', 'Value3']
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLookupValues('CONTACT_TYPE').subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0]).toBe('Value1');
        expect(apiService.get).toHaveBeenCalledWith(API.SPONSOR_CONTACTS.LOOKUPS('CONTACT_TYPE'));
        done();
      });
    });

    it('should handle empty lookup values', (done) => {
      apiService.get.and.returnValue(of({ Data: [] }));

      service.getLookupValues('CONTACT_TYPE').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle camelCase data key', (done) => {
      const mockResponse = {
        data: ['A', 'B']
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLookupValues('SOME_TYPE').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result).toEqual(['A', 'B']);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getLookupValues('CONTACT_TYPE').subscribe({
        error: err => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });
});
