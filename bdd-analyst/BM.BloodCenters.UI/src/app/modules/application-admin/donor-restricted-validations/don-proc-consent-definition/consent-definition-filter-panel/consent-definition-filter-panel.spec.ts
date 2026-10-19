import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ConsentDefinitionFilterPanel } from './consent-definition-filter-panel';
import { DonProcConsentDefinitionService } from '../services/don-proc-consent-definition.service';
import { DonProcConsentDefinitionFilterValue } from '../models/don-proc-consent-definition.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ConsentDefinitionFilterPanel', () => {
  let component: ConsentDefinitionFilterPanel;
  let fixture: ComponentFixture<ConsentDefinitionFilterPanel>;
  let mockService: jasmine.SpyObj<DonProcConsentDefinitionService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockFilterLov = {
    item: {
      donationType: ['AL', 'AU', 'DI'],
      procedureCode: ['DP', 'WB', 'PP'],
      consentCode: ['DCONGEN', 'DCONTST', 'DCONPP']
    }
  };

  const mockCreateData: any = {
    data: {
      donationTypes: [
        { donationType: 'AL', description: 'Allogeneic' },
        { donationType: 'AU', description: 'Autologous' },
        { donationType: 'DI', description: 'Directed' }
      ],
      consentCodes: [
        { consentCode: 'DCONGEN', consentDescription: 'General Consent', versionNo: '1' },
        { consentCode: 'DCONTST', consentDescription: 'Test Consent', versionNo: '1' },
        { consentCode: 'DCONPP', consentDescription: 'PP Consent', versionNo: '1' }
      ]
    }
  };

  const mockProcedureCodeResponse: any = {
    data: [
      { procedureCode: 'DP', description: 'Double Platelets' },
      { procedureCode: 'WB', description: 'Whole Blood' },
      { procedureCode: 'PP', description: 'Packed Platelets' }
    ]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonProcConsentDefinitionService', [
      'getConsentDefinitionFilters',
      'getCreateData',
      'getProcedureCodesByDonationType'
    ]);
    mockHeaderService = createMockHeaderService();
    mockService.getConsentDefinitionFilters.and.returnValue(of(mockFilterLov));
    mockService.getCreateData.and.returnValue(of(mockCreateData));
    mockService.getProcedureCodesByDonationType.and.returnValue(of(mockProcedureCodeResponse));



      TestBed.configureTestingModule({
imports: [
        ConsentDefinitionFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DonProcConsentDefinitionService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getConsentDefinitionFilters.calls.reset();


      mockService.getCreateData.calls.reset();


      mockService.getProcedureCodesByDonationType.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();
      mockService.getConsentDefinitionFilters.and.returnValue(of(mockFilterLov));


      mockService.getCreateData.and.returnValue(of(mockCreateData));


      mockService.getProcedureCodesByDonationType.and.returnValue(of(mockProcedureCodeResponse));


    fixture = TestBed.createComponent(ConsentDefinitionFilterPanel);
    component = fixture.componentInstance;


    });
  describe('loadFilterOptions', () => {
    it('should load filter options from service', (done) => {
      mockService.getConsentDefinitionFilters.and.returnValue(of(mockFilterLov));
      mockService.getCreateData.and.returnValue(of(mockCreateData));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.donationTypeOptions).toEqual([
          { code: 'AL', description: 'Allogeneic' },
          { code: 'AU', description: 'Autologous' },
          { code: 'DI', description: 'Directed' }
        ]);
        expect(component.procedureCodeOptions).toEqual([
          { code: 'DP', description: 'Double Platelets' },
          { code: 'WB', description: 'Whole Blood' },
          { code: 'PP', description: 'Packed Platelets' }
        ]);
        expect(component.consentCodeOptions).toEqual([
          { code: 'DCONGEN', description: 'General Consent' },
          { code: 'DCONTST', description: 'Test Consent' },
          { code: 'DCONPP', description: 'PP Consent' }
        ]);
        done();
      });
    });

    it('should handle response with data array', (done) => {
      const responseWithData = {
        data: [{
          donationType: ['AL', 'AU'],
          procedureCode: ['DP', 'WB'],
          consentCode: ['DCONGEN', 'DCONTST']
        }]
      };

      mockService.getConsentDefinitionFilters.and.returnValue(of(responseWithData));
      mockService.getCreateData.and.returnValue(of(mockCreateData));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.donationTypeOptions).toEqual([
          { code: 'AL', description: 'Allogeneic' },
          { code: 'AU', description: 'Autologous' }
        ]);
        expect(component.procedureCodeOptions).toEqual([
          { code: 'DP', description: 'Double Platelets' },
          { code: 'WB', description: 'Whole Blood' }
        ]);
        expect(component.consentCodeOptions).toEqual([
          { code: 'DCONGEN', description: 'General Consent' },
          { code: 'DCONTST', description: 'Test Consent' }
        ]);
        done();
      });
    });

    it('should handle direct response', (done) => {
      const directResponse: any = {
        donationType: ['AL'],
        procedureCode: ['DP'],
        consentCode: ['DCONGEN']
      };

      mockService.getConsentDefinitionFilters.and.returnValue(of(directResponse));
      mockService.getCreateData.and.returnValue(of(mockCreateData));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.donationTypeOptions).toEqual([
          { code: 'AL', description: 'Allogeneic' }
        ]);
        expect(component.procedureCodeOptions).toEqual([
          { code: 'DP', description: 'Double Platelets' }
        ]);
        expect(component.consentCodeOptions).toEqual([
          { code: 'DCONGEN', description: 'General Consent' }
        ]);
        done();
      });
    });

    it('should handle empty filter response', (done) => {
      mockService.getConsentDefinitionFilters.and.returnValue(of({}));
      mockService.getCreateData.and.returnValue(of(mockCreateData));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.donationTypeOptions).toEqual([]);
        expect(component.procedureCodeOptions).toEqual([]);
        expect(component.consentCodeOptions).toEqual([]);
        done();
      });
    });

  });



});
