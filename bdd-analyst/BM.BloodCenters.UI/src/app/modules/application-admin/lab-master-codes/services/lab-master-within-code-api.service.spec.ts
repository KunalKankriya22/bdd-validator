import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LabMasterWithinCodeApiService } from './lab-master-within-code-api.service';
import { CreateLabMasterCodeDto, UpdateLabMasterCodeDto } from '../models/lab-master-within-code.models';
import { ApiService } from '@shared/services/api.service';
import { environment } from 'src/environments/environment';

describe('LabMasterWithinCodeApiService', () => {
    let service: LabMasterWithinCodeApiService;
    let httpMock: HttpTestingController;
    const baseUrl = `${environment.apiUrl}/api/v1/lab-master-codes`;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                LabMasterWithinCodeApiService,
                ApiService
            ]
        });
        service = TestBed.inject(LabMasterWithinCodeApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('createCode()', () => {
        it('should convert camelCase to PascalCase in request body', () => {
            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: new Date('2025-01-01'),
                terminationDate: null,
                numericalValue: 100
            };

            service.createCode(createDto).subscribe();

            const req = httpMock.expectOne(baseUrl);
            expect(req.request.body).toEqual(jasmine.objectContaining({
                CodeType: 'TEST',
                Code: 'CODE1',
                Description: 'Test Description',
                EffectiveDate: jasmine.any(String),
                TerminationDate: null,
                NumericalValue: 100
            }));

            req.flush(null);
        });

        it('should convert Date objects to ISO strings', () => {
            const effectiveDate = new Date('2025-01-15T10:00:00.000Z');
            const terminationDate = new Date('2025-12-31T10:00:00.000Z');

            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: effectiveDate,
                terminationDate: terminationDate
            };

            service.createCode(createDto).subscribe();

            const req = httpMock.expectOne(baseUrl);
            expect(req.request.body.EffectiveDate).toBe(effectiveDate.toISOString());
            expect(req.request.body.TerminationDate).toBe(terminationDate.toISOString());

            req.flush(null);
        });

        it('should handle 400 Bad Request error', (done) => {
            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: new Date('2025-01-01')
            };

            service.createCode(createDto).subscribe({
                next: () => fail('should have failed with 400 error'),
                error: (error) => {
                    expect(error.status).toBe(400);
                    expect(error.message).toContain('400');
                    done();
                }
            });

            const req = httpMock.expectOne(baseUrl);
            req.flush({ message: 'Invalid request' }, { status: 400, statusText: 'Bad Request' });
        });

        it('should handle 409 Conflict error (duplicate code)', (done) => {
            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: new Date('2025-01-01')
            };

            service.createCode(createDto).subscribe({
                next: () => fail('should have failed with 409 error'),
                error: (error) => {
                    expect(error.status).toBe(409);
                    expect(error.message).toContain('409');
                    done();
                }
            });

            const req = httpMock.expectOne(baseUrl);
            req.flush({ message: 'Code already exists' }, { status: 409, statusText: 'Conflict' });
        });

        it('should handle validation errors from ModelState', (done) => {
            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: new Date('2025-01-01')
            };

            service.createCode(createDto).subscribe({
                next: () => fail('should have failed with validation errors'),
                error: (error) => {
                    expect(error.status).toBe(400);
                    expect(error.error.errors).toBeDefined();
                    expect(error.error.errors.Code).toEqual(['Code is required']);
                    done();
                }
            });

            const req = httpMock.expectOne(baseUrl);
            req.flush(
                {
                    errors: {
                        Code: ['Code is required'],
                        Description: ['Description is required']
                    }
                },
                { status: 400, statusText: 'Bad Request' }
            );
        });
    });

    describe('updateCode()', () => {
        it('should URL encode codeType and code parameters', () => {
            const codeType = 'TEST TYPE';
            const code = 'CODE/1';
            const updateDto: UpdateLabMasterCodeDto = {
                description: 'Updated Description',
                effectiveDate: new Date('2025-02-01')
            };

            service.updateCode(codeType, code, updateDto).subscribe();

            const expectedUrl = `${baseUrl}/TEST%20TYPE/CODE%2F1`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('PUT');

            req.flush(null);
        });

        it('should handle 404 Not Found error', (done) => {
            const updateDto: UpdateLabMasterCodeDto = {
                description: 'Updated Description',
                effectiveDate: new Date('2025-02-01')
            };

            service.updateCode('TEST', 'NONEXISTENT', updateDto).subscribe({
                next: () => fail('should have failed with 404 error'),
                error: (error) => {
                    expect(error.status).toBe(404);
                    expect(error.message).toContain('404');
                    done();
                }
            });

            const req = httpMock.expectOne(`${baseUrl}/TEST/NONEXISTENT`);
            req.flush({ message: 'Code not found' }, { status: 404, statusText: 'Not Found' });
        });

    });

    describe('getCodeForEdit()', () => {
        it('should retrieve code details with GET request', () => {
            const codeType = 'TEST';
            const code = 'CODE1';
            const mockResponse = {
                CodeType: 'TEST',
                Code: 'CODE1',
                Description: 'Test Description',
                EffectiveDate: '2025-01-01T00:00:00.000Z',
                TerminationDate: null,
                Sequence1: 1,
                Sequence2: 2,
                Sequence3: 3,
                NumericalValue: 100,
                ModificationDate: '2025-01-20T00:00:00.000Z'
            };

            service.getCodeForEdit(codeType, code).subscribe({
                next: (response) => {
                    expect(response.codeType).toBe('TEST');
                    expect(response.code).toBe('CODE1');
                    expect(response.description).toBe('Test Description');
                    expect(response.effectiveDate).toEqual(new Date('2025-01-01T00:00:00.000Z'));
                    expect(response.terminationDate).toBeNull();
                    expect(response.sequence1).toBe(1);
                    expect(response.sequence2).toBe(2);
                    expect(response.sequence3).toBe(3);
                    expect(response.numericalValue).toBe(100);
                    expect(response.modificationDate).toEqual(new Date('2025-01-20T00:00:00.000Z'));
                },
                error: fail
            });

            const expectedUrl = `${baseUrl}/${codeType}/${code}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');

            req.flush(mockResponse);
        });

        it('should convert PascalCase to camelCase in response', () => {
            const mockResponse = {
                CodeType: 'TEST',
                Code: 'CODE1',
                Description: 'Test Description',
                EffectiveDate: '2025-01-01T00:00:00.000Z',
                NumericalValue: 100
            };

            service.getCodeForEdit('TEST', 'CODE1').subscribe({
                next: (response) => {
                    expect(response).toEqual(jasmine.objectContaining({
                        codeType: 'TEST',
                        code: 'CODE1',
                        description: 'Test Description',
                        effectiveDate: jasmine.any(Date),
                        numericalValue: 100
                    }));
                },
                error: fail
            });

            const req = httpMock.expectOne(`${baseUrl}/TEST/CODE1`);
            req.flush(mockResponse);
        });

        it('should parse date strings to Date objects', () => {
            const mockResponse = {
                CodeType: 'TEST',
                Code: 'CODE1',
                Description: 'Test Description',
                EffectiveDate: '2025-01-15T10:30:00.000Z',
                TerminationDate: '2025-12-31T23:59:59.000Z',
                ModificationDate: '2025-01-20T14:45:00.000Z'
            };

            service.getCodeForEdit('TEST', 'CODE1').subscribe({
                next: (response) => {
                    expect(response.effectiveDate instanceof Date).toBeTruthy();
                    expect(response.terminationDate instanceof Date).toBeTruthy();
                    expect(response.modificationDate instanceof Date).toBeTruthy();
                    expect(response.effectiveDate.toISOString()).toBe('2025-01-15T10:30:00.000Z');
                    expect(response.terminationDate!.toISOString()).toBe('2025-12-31T23:59:59.000Z');
                },
                error: fail
            });

            const req = httpMock.expectOne(`${baseUrl}/TEST/CODE1`);
            req.flush(mockResponse);
        });

        it('should handle null date values', () => {
            const mockResponse = {
                CodeType: 'TEST',
                Code: 'CODE1',
                Description: 'Test Description',
                EffectiveDate: '2025-01-01T00:00:00.000Z',
                TerminationDate: null,
                ModificationDate: null
            };

            service.getCodeForEdit('TEST', 'CODE1').subscribe({
                next: (response) => {
                    expect(response.effectiveDate instanceof Date).toBeTruthy();
                    expect(response.terminationDate).toBeNull();
                    expect(response.modificationDate).toBeNull();
                },
                error: fail
            });

            const req = httpMock.expectOne(`${baseUrl}/TEST/CODE1`);
            req.flush(mockResponse);
        });

        it('should handle 404 Not Found error', (done) => {
            service.getCodeForEdit('TEST', 'NONEXISTENT').subscribe({
                next: () => fail('should have failed with 404 error'),
                error: (error) => {
                    expect(error.status).toBe(404);
                    expect(error.message).toContain('404');
                    done();
                }
            });

            const req = httpMock.expectOne(`${baseUrl}/TEST/NONEXISTENT`);
            req.flush({ message: 'Code not found' }, { status: 404, statusText: 'Not Found' });
        });
    });

    describe('Error Handling', () => {
        it('should handle unknown status codes', (done) => {
            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: new Date('2025-01-01')
            };

            service.createCode(createDto).subscribe({
                next: () => fail('should have failed with 503 error'),
                error: (error) => {
                    expect(error.status).toBe(503);
                    expect(error.message).toContain('503');
                    done();
                }
            });

            const req = httpMock.expectOne(baseUrl);
            req.flush({ message: 'Service unavailable' }, { status: 503, statusText: 'Service Unavailable' });
        });

        it('should log errors to console', (done) => {
            const createDto: CreateLabMasterCodeDto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test Description',
                effectiveDate: new Date('2025-01-01')
            };

            service.createCode(createDto).subscribe({
                next: () => fail('should have failed'),
                error: (error) => {
                    expect(error.status).toBe(500);
                    expect(error.message).toContain('500');
                    done();
                }
            });

            const req = httpMock.expectOne(baseUrl);
            req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('Field Name Conversion', () => {
        it('should correctly convert all camelCase fields to PascalCase', () => {
            const dto = {
                codeType: 'TEST',
                code: 'CODE1',
                description: 'Test',
                effectiveDate: new Date(),
                terminationDate: new Date(),
                sequence1: 1,
                sequence2: 2,
                sequence3: 3,
                numericalValue: 100,
                codeBehavior: 'ACTIVE'
            };

            service.createCode(dto as CreateLabMasterCodeDto).subscribe();

            const req = httpMock.expectOne(baseUrl);
            const body = req.request.body;

            expect(body.CodeType).toBeDefined();
            expect(body.Code).toBeDefined();
            expect(body.Description).toBeDefined();
            expect(body.EffectiveDate).toBeDefined();
            expect(body.TerminationDate).toBeDefined();
            expect(body.Sequence1).toBeDefined();
            expect(body.Sequence2).toBeDefined();
            expect(body.Sequence3).toBeDefined();
            expect(body.NumericalValue).toBeDefined();
            expect(body.CodeBehavior).toBeDefined();

            req.flush(null);
        });

        it('should correctly convert all PascalCase fields to camelCase', () => {
            const mockResponse = {
                CodeType: 'TEST',
                Code: 'CODE1',
                Description: 'Test',
                EffectiveDate: '2025-01-01T00:00:00.000Z',
                TerminationDate: '2025-12-31T00:00:00.000Z',
                Sequence1: 1,
                Sequence2: 2,
                Sequence3: 3,
                NumericalValue: 100,
                CodeBehavior: 'ACTIVE',
                ModificationDate: '2025-01-20T00:00:00.000Z'
            };

            service.getCodeForEdit('TEST', 'CODE1').subscribe({
                next: (response) => {
                    expect(response.codeType).toBeDefined();
                    expect(response.code).toBeDefined();
                    expect(response.description).toBeDefined();
                    expect(response.effectiveDate).toBeDefined();
                    expect(response.terminationDate).toBeDefined();
                    expect(response.sequence1).toBeDefined();
                    expect(response.sequence2).toBeDefined();
                    expect(response.sequence3).toBeDefined();
                    expect(response.numericalValue).toBeDefined();
                    expect(response.codeBehavior).toBeDefined();
                    expect(response.modificationDate).toBeDefined();
                }
            });

            const req = httpMock.expectOne(`${baseUrl}/TEST/CODE1`);
            req.flush(mockResponse);
        });
    });
});