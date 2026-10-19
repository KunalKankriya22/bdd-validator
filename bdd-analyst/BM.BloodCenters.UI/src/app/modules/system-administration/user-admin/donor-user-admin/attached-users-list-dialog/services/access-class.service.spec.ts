import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccessClassService } from './access-class.service';
import { API } from '../../../../../../core/constants/api.constants';
import { AttachedUser, AccessClass } from '../models/access-class.model';

describe('AccessClassService', () => {
    let service: AccessClassService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AccessClassService]
        });
        service = TestBed.inject(AccessClassService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    /* ===============================
       BASIC
    ================================ */

    /* ===============================
       GET ACCESS CLASSES
    ================================ */
    it('should return access classes', (done) => {
        service.getAccessClasses().subscribe(classes => {
            expect(classes).toBeDefined();
            expect(classes.length).toBeGreaterThan(0);
            expect(classes[0].type).toBeDefined();
            expect(classes[0].code).toBeDefined();
            expect(classes[0].description).toBeDefined();
            done();
        });
    });

    it('should return access classes with correct structure', (done) => {
        service.getAccessClasses().subscribe(classes => {
            const firstClass = classes[0];
            expect(firstClass.type).toBeDefined();
            expect(firstClass.code).toBeDefined();
            expect(firstClass.description).toBeDefined();
            expect(firstClass.effectiveDate).toBeDefined();
            expect(firstClass.terminationDate).toBeDefined();
            expect(firstClass.status).toBeDefined();
            done();
        });
    });

    /* ===============================
       GET ATTACHED USERS
    ================================ */
    it('should fetch attached users for an access class', (done) => {
        const mockResponse = {
            success: true,
            message: 'Successfully fetched attached users',
            statusCode: 200,
            data: [
                { userId: 'USER01', name: 'John Doe', level: 9 },
                { userId: 'USER02', name: 'Jane Smith', level: 5 },
                { userId: 'USER03', level: 7 }
            ]
        };

        const accessClass = 'TVIEW';

        service.getAttachedUsers(accessClass).subscribe(users => {
            expect(users).toBeDefined();
            expect(users.length).toBe(3);
            expect(users[0].userId).toBe('USER01');
            expect(users[0].name).toBe('John Doe');
            expect(users[0].level).toBe(9);
            expect(users[2].name).toBeUndefined(); // Optional field
            done();
        });

        const req = httpMock.expectOne(
            API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ATTACHED_USERS(accessClass)
        );
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should handle attached users with missing name field', (done) => {
        const mockResponse = {
            success: true,
            message: 'Success',
            statusCode: 200,
            data: [
                { userId: 'USER01', level: 9 },
                { userId: 'USER02', name: 'Test User', level: 5 }
            ]
        };

        service.getAttachedUsers('CAUTN').subscribe(users => {
            expect(users[0].name).toBeUndefined();
            expect(users[1].name).toBe('Test User');
            done();
        });

        const req = httpMock.expectOne(
            API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ATTACHED_USERS('CAUTN')
        );
        req.flush(mockResponse);
    });

    it('should extract data from API response wrapper', (done) => {
        const mockUsers: AttachedUser[] = [
            { userId: 'TEST01', name: 'Test', level: 1 }
        ];

        const mockResponse = {
            success: true,
            message: 'Success',
            statusCode: 200,
            data: mockUsers
        };

        service.getAttachedUsers('TEST').subscribe(users => {
            expect(users).toEqual(mockUsers);
            done();
        });

        const req = httpMock.expectOne(
            API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ATTACHED_USERS('TEST')
        );
        req.flush(mockResponse);
    });

    it('should handle error when fetching attached users', (done) => {
        const errorMessage = 'Not Found';
        spyOn(console, 'error');

        service.getAttachedUsers('INVALID').subscribe({
            next: () => fail('should have failed'),
            error: () => {
                expect(console.error).toHaveBeenCalledWith(
                    'Error fetching attached users:',
                    jasmine.any(Object)
                );
                done();
            }
        });

        const req = httpMock.expectOne(
            API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ATTACHED_USERS('INVALID')
        );
        req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('should call correct API endpoint for attached users', () => {
        const accessClass = 'TVIEW';
        const expectedUrl = `/api/v1/define-user-access/attached-users/${accessClass}`;

        service.getAttachedUsers(accessClass).subscribe();

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');
        req.flush({
            success: true,
            message: 'Success',
            statusCode: 200,
            data: []
        });
    });

    /* ===============================
       SEARCH ACCESS CLASSES
    ================================ */
    it('should search access classes', (done) => {
        service.searchAccessClasses('TVIEW').subscribe(classes => {
            expect(classes).toBeDefined();
            expect(Array.isArray(classes)).toBeTrue();
            done();
        });
    });

    it('should return same data for search as getAccessClasses', (done) => {
        let accessClasses: AccessClass[];
        let searchResults: AccessClass[];

        service.getAccessClasses().subscribe(classes => {
            accessClasses = classes;

            service.searchAccessClasses('test').subscribe(results => {
                searchResults = results;
                expect(searchResults).toEqual(accessClasses);
                done();
            });
        });
    });
});
