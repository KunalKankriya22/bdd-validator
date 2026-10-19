import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InstitutionService } from './institution.service';
import { ApiService } from '../../../../shared/services/api.service';
import { of } from 'rxjs';
import { keysToCamelCase } from '@shared/utils/case-converter.util';

describe('InstitutionService', () => {
    let service: InstitutionService;
    let apiService: jasmine.SpyObj<ApiService>;

    // Helper to create dynamic past date
    const getPastDate = (daysAgo: number = 90): Date => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    };

    const mockInstitutionForm = {
        institutionId: 'INST001',
        programId: 'BLOOD',
        institutionName: 'Test Institution',
        contractPrefix: 'TC',
        facilityShortName: 'TI',
        printHeader: 'Test Header',
        systemName: 'Blood Centers',
        registrationInfo: {
            registrationNumber: 'REG123',
            licenseNumber: 'LIC456',
            codabarScheme: 'SCHEME1',
            effectiveDate: getPastDate(90)
        },
        contactInfo: {
            isInternational: false,
            addr_1: '123 Main St',
            addr_2: 'Suite 100',
            addr_3: '',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
            phoneNumber: '1234567890',
            internationalPhoneNumber: '',
            fax: '0987654321',
            internationalFax: ''
        }
    };

    const mockApiResponse = {
        INST_ID: 'INST001',
        INST_NAME: 'Test Institution',
        INST_SHORT_NAME: 'TI',
        PRINT_HDR: 'Test Header',
        SYSTEM_NAME: 'Blood Centers',
        CONTRACT_PREFIX: 'TC',
        PROGRAM_ID: 'BLOOD',
        CODABAR_UNIT_SCHEME: 'SCHEME1',
        REG_NO: 'REG123',
        LIC_NO: 'LIC456',
        EFF_DATE: '2024-01-01T00:00:00.000Z',
        ADDR_1: '123 Main St',
        ADDR_2: 'Suite 100',
        ADDR_3: null,
        CITY: 'New York',
        STATE_CODE: 'NY',
        ZIP: '10001',
        COUNTRY: 'USA',
        PHONE_NUMBER: '1234567890',
        INT_PHONE_NUMBER: '',
        FAX_NUMBER: '0987654321',
        INTL_FAX_NO: '',
        INT_FLAG: 'N',
        instId: '12345',
        LAST_MODIFIED_DATE: '2024-01-15T10:30:00.000Z'
    };

    beforeEach(() => {
        const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                InstitutionService,
                { provide: ApiService, useValue: apiServiceSpy }
            ]
        });

        service = TestBed.inject(InstitutionService);
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    describe('createInstitution', () => {
        it('should create an institution successfully with all fields mapped correctly', (done) => {
            const mockResponse = { success: true, id: 'INST001' };
            apiService.post.and.returnValue(of(mockResponse));

            service.createInstitution(mockInstitutionForm).subscribe(response => {
                expect(response).toEqual(mockResponse);
                
                // Verify the mapper correctly transforms all fields
                const callArgs = apiService.post.calls.mostRecent().args;
                const payload = callArgs[1];
                
                // Basic institution fields
                expect(payload.INST_ID).toBe('INST001');
                expect(payload.INST_NAME).toBe('Test Institution');
                expect(payload.INST_SHORT_NAME).toBe('TI');
                expect(payload.PRINT_HDR).toBe('Test Header');
                expect(payload.SYSTEM_NAME).toBe('Blood Centers');
                expect(payload.CONTRACT_PREFIX).toBe('TC');
                expect(payload.PROGRAM_ID).toBe('BLOOD');
                
                // Registration info fields
                expect(payload.CODABAR_UNIT_SCHEME).toBe('SCHEME1');
                expect(payload.REG_NO).toBe('REG123');
                expect(payload.LIC_NO).toBe('LIC456');
                // Verify date is formatted as YYYY-MM-DD
                expect(payload.EFF_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                
                // Contact info fields
                expect(payload.ADDR_1).toBe('123 Main St');
                expect(payload.ADDR_2).toBe('Suite 100');
                expect(payload.ADDR_3).toBeNull();
                expect(payload.CITY).toBe('New York');
                expect(payload.STATE_CODE).toBe('NY');
                expect(payload.ZIP).toBe('10001');
                expect(payload.COUNTRY).toBe('USA');
                expect(payload.PHONE_NUMBER).toBe('1234567890');
                expect(payload.FAX_NUMBER).toBe('0987654321');
                
                // INT_FLAG boolean to string conversion
                expect(payload.INT_FLAG).toBe('N');
                
                done();
            });
        });

        it('should handle null/undefined values correctly in mapper', (done) => {
            const formWithNulls = {
                ...mockInstitutionForm,
                registrationInfo: {
                    ...mockInstitutionForm.registrationInfo,
                    licenseNumber: '',
                    effectiveDate: null as any
                },
                contactInfo: {
                    ...mockInstitutionForm.contactInfo,
                    addr_2: '',
                    addr_3: null as any,
                    phoneNumber: '',
                    fax: '',
                    internationalPhoneNumber: '',
                    internationalFax: ''
                }
            };

            const mockResponse = { success: true };
            apiService.post.and.returnValue(of(mockResponse));

            service.createInstitution(formWithNulls).subscribe(() => {
                const payload = apiService.post.calls.mostRecent().args[1];

                // Empty strings should become null based on mapper logic
                expect(payload.LIC_NO).toBeNull();
                expect(payload.EFF_DATE).toBeNull();
                expect(payload.ADDR_2).toBeNull();
                expect(payload.ADDR_3).toBeNull();
                expect(payload.PHONE_NUMBER).toBeNull();
                expect(payload.FAX_NUMBER).toBeNull();

                done();
            });
        });

        it('should convert isInternational true to INT_FLAG Y', (done) => {
            const internationalForm = {
                ...mockInstitutionForm,
                contactInfo: {
                    ...mockInstitutionForm.contactInfo,
                    isInternational: true,
                    state: 'NY'
                }
            };

            const mockResponse = { success: true };
            apiService.post.and.returnValue(of(mockResponse));

            service.createInstitution(internationalForm).subscribe(() => {
                const payload = apiService.post.calls.mostRecent().args[1];

                // INT_FLAG should be 'Y' for international
                expect(payload.INT_FLAG).toBe('Y');
                // STATE_CODE should still be sent (as per current mapper implementation)
                expect(payload.STATE_CODE).toBe('NY');

                done();
            });
        });

        it('should handle date conversion correctly', (done) => {
            const dateForm = {
                ...mockInstitutionForm,
                registrationInfo: {
                    ...mockInstitutionForm.registrationInfo,
                    effectiveDate: new Date('2024-06-15T14:30:00.000Z')
                }
            };

            const mockResponse = { success: true };
            apiService.post.and.returnValue(of(mockResponse));

            service.createInstitution(dateForm).subscribe(() => {
                const payload = apiService.post.calls.mostRecent().args[1];

                // Date should be converted to YYYY-MM-DD format
                expect(payload.EFF_DATE).toBe('2024-06-15');

                done();
            });
        });
    });

    describe('getInstitution', () => {
        it('should get institution details when array has data', (done) => {
            apiService.get.and.returnValue(of([mockApiResponse]));

            service.getInstitution().subscribe(response => {
                const expectedResponse = keysToCamelCase(mockApiResponse);

                expect(response).toEqual(expectedResponse);
                expect(apiService.get).toHaveBeenCalled();
                done();
            });
        });


    });

    describe('updateInstitution', () => {
        it('should update an institution successfully with all fields mapped', (done) => {
            const institutionId = '12345';
            const mockResponse = { success: true };
            apiService.put.and.returnValue(of(mockResponse));

            service.updateInstitution(institutionId, mockInstitutionForm).subscribe(response => {
                expect(response).toEqual(mockResponse);
                
                const callArgs = apiService.put.calls.mostRecent().args;
                const payload = callArgs[1];
                
                // Verify mapper correctly transforms fields for update
                expect(payload.INST_ID).toBe('INST001');
                expect(payload.INST_NAME).toBe('Test Institution');
                expect(payload.INT_FLAG).toBe('N');
                
                done();
            });
        });

        it('should handle international flag in update', (done) => {
            const institutionId = '12345';
            const internationalForm = {
                ...mockInstitutionForm,
                contactInfo: {
                    ...mockInstitutionForm.contactInfo,
                    isInternational: true
                }
            };
            
            const mockResponse = { success: true };
            apiService.put.and.returnValue(of(mockResponse));

            service.updateInstitution(institutionId, internationalForm).subscribe(() => {
                const payload = apiService.put.calls.mostRecent().args[1];
                expect(payload.INT_FLAG).toBe('Y');
                done();
            });
        });

        it('should replace instId in URL correctly', (done) => {
            const institutionId = '12345';
            const mockResponse = { success: true };
            apiService.put.and.returnValue(of(mockResponse));

            service.updateInstitution(institutionId, mockInstitutionForm).subscribe(() => {
                const url = apiService.put.calls.mostRecent().args[0];
                expect(url).toContain('12345');
                done();
            });
        });
    });
});