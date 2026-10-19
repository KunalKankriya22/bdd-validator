import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { InstitutionPageComponent } from './institution-page';
import { InstitutionService } from '../../service/institution.service';
import { TranslateModule } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InstitutionApiResponseCamel } from '../../interfaces/institution-api.interface';
import { HeaderService } from '../../../../../shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('InstitutionPageComponent', () => {
  let activatedRoute: any;
  let sanitizerSpy: any;
  let headerServiceSpy: any;
  let routerSpy: any;
  let institutionServiceSpy: any;
    let component: InstitutionPageComponent;
    let fixture: ComponentFixture<InstitutionPageComponent>;
    let institutionService: jasmine.SpyObj<InstitutionService>;
    let router: jasmine.SpyObj<Router>;    let headerService: jasmine.SpyObj<HeaderService>;
    let snackBar: jasmine.SpyObj<MatSnackBar>;
    let sanitizer: jasmine.SpyObj<DomSanitizer>;

    // Helper function to get a past date (30 days ago)
    const getPastDate = (): Date => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
    };

    // Helper function to get a recent date (1 day ago)
    const getRecentDate = (): Date => {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date;
    };

    const mockInstitutionResponse: InstitutionApiResponseCamel = {
        instId: 'INST001',
        instName: 'Test Institution',
        instShortName: 'TI',
        printHdr: 'Test Header',
        systemName: 'Blood Centers',
        contractPrefix: 'TC',
        programId: 'BLOOD',
        codabarUnitScheme: 'SCHEME1',
        regNo: 'REG123',
        licNo: 'LIC456',

        addressId: 1,
        auditKey: 1001,

        effDate: getPastDate().toISOString(),
        addr1: '123 Main St',
        addr2: 'Suite 100',
        addr3: null,
        city: 'New York',
        stateCode: 'NY',
        zip: '10001',
        country: 'USA',
        phoneNumber: '1234567890',
        intPhoneNumber: '',
        faxNumber: '0987654321',
        telexNumber: '',
        intFlag: 'N',
        lastModifiedDate: getRecentDate().toISOString(),
    };


    const getValidFormData = () => ({
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
            effectiveDate: getPastDate()
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
    });

    beforeEach(() => {
        institutionServiceSpy = jasmine.createSpyObj('InstitutionService', [
            'createInstitution',
            'getInstitution',
            'updateInstitution',
            'downloadLogo',
            'uploadLogo',
            'getStatesLookup',
            'getCountriesLookup'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
            url: '/',
            events: of(new NavigationEnd(0, '/', '/'))
        });
        headerServiceSpy = createMockHeaderService();
        (headerServiceSpy as any).chapterChanged$ = new Subject<void>().asObservable();
        const snackBarSpy = createMockMatSnackBar();
        sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

        routerSpy.createUrlTree.and.returnValue({} as any);
        routerSpy.serializeUrl.and.returnValue('');
        sanitizerSpy.bypassSecurityTrustUrl.and.callFake((url: string) => url as any);

        // Mock downloadLogo to return a blob
        const mockBlob = new Blob(['test'], { type: 'image/png' });
        institutionServiceSpy.downloadLogo.and.returnValue(of(mockBlob));

        // Mock lookup methods
        institutionServiceSpy.getStatesLookup.and.returnValue(of([]));
        institutionServiceSpy.getCountriesLookup.and.returnValue(of([]));

        activatedRoute = {
            snapshot: {
                routeConfig: { path: 'create' }
            }
        };



        TestBed.configureTestingModule({
            imports: [
                InstitutionPageComponent,
                ReactiveFormsModule,
                TranslateModule.forRoot()
            ],
            providers: [
                provideHttpClient(),
                FormBuilder,
                { provide: InstitutionService, useValue: institutionServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRoute },
                { provide: HeaderService, useValue: headerServiceSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: DomSanitizer, useValue: sanitizerSpy }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        });
        routerSpy.createUrlTree.and.returnValue({} as any);


        routerSpy.serializeUrl.and.returnValue('');


        sanitizerSpy.bypassSecurityTrustUrl.and.callFake((url: string) => url as any);


        institutionServiceSpy.downloadLogo.and.returnValue(of(mockBlob));


        institutionServiceSpy.getStatesLookup.and.returnValue(of([]));


        institutionServiceSpy.getCountriesLookup.and.returnValue(of([]));


        institutionService = TestBed.inject(InstitutionService) as jasmine.SpyObj<InstitutionService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
        snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
        sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;

        fixture = TestBed.createComponent(InstitutionPageComponent);
        component = fixture.componentInstance;


      });


    describe('formatTimezone', () => {
        it('should return UTC for undefined timezone', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue(undefined);

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('UTC');
        });

        it('should return UTC for empty timezone', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('UTC');
        });

        it('should preserve IANA timezone format', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('America/Chicago');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('America/Chicago');
        });

        it('should preserve GMT offset format', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('GMT-06:00');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('GMT-06:00');
        });

        it('should uppercase timezone abbreviations', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('pst');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('PST');
        });

        it('should format valid raw positive offset', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('+5:30');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('GMT+05:30');
        });

        it('should format valid raw negative offset', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('-6:00');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('GMT-06:00');
        });

        it('should return UTC for invalid offset (out of range)', () => {
            spyOn(console, 'warn'); // Suppress warning in test output
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('-23:00');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('UTC');
            expect(console.warn).toHaveBeenCalledWith('Invalid timezone offset: -23:00. Using UTC.');
        });

        it('should return UTC for invalid offset (hours > 14)', () => {
            spyOn(console, 'warn');
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('+15:00');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('UTC');
        });

        it('should return UTC for unparseable timezone string', () => {
            spyOn(console, 'warn');
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('INVALID_TZ_123');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('UTC');
            expect(console.warn).toHaveBeenCalledWith('Unable to parse timezone: INVALID_TZ_123. Using UTC.');
        });

        it('should handle offset without colon', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('-600');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('GMT-06:00');
        });

        it('should pad single-digit hours', () => {
            activatedRoute.snapshot.routeConfig.path = 'edit';
            institutionService.getInstitution.and.returnValue(of(mockInstitutionResponse));
            headerServiceSpy.getCurrentChapterTimezone.and.returnValue('+5:30');

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.header?.timeZone).toBe('GMT+05:30');
        });
    });
});