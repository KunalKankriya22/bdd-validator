import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of } from 'rxjs';

import { CustomerProfileDetailsComponent } from './customer-profile-details';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { CustomerProfileListStateService } from '../services/customer-profile-list-state.service';
import { CustomerProfileDto } from '../models/customer-profile.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { CustomerContractDetailsComponent } from '../../customer-contract-details/customer-contract-details.component';
import { CustomerPayeeDetailsComponent } from '../../customer-payee-details/customer-payee-details.component';
import { ConsigneeDetailsTabComponent } from '../../consignee-details/consignee-details-tab';
import { CustomerContactDetailsComponent } from '../../customer-contact-details/customer-contact-details.component';
import { createMockSnackbarService, createMockMatSnackBar, createMockPageHeaderService } from '@shared/testing/common-mocks';

// ── Stubs ─────────────────────────────────────────────────────────────────────

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub { @Input() config: any; }

@Component({ selector: 'app-customer-contract-details', template: '', standalone: true })
class CustomerContractDetailsStub { @Input() customerId = ''; }

@Component({ selector: 'app-customer-payee-details', template: '', standalone: true })
class CustomerPayeeDetailsStub {
  @Input() customerId = '';
  @Input() payeeId: any = null;
}

@Component({ selector: 'app-consignee-details-tab', template: '', standalone: true })
class ConsigneeDetailsStub {
  @Input() customerId = '';
  @Input() customerData: any = null;
}

@Component({ selector: 'app-customer-contact-details', template: '', standalone: true })
class CustomerContactDetailsStub { @Input() customerId = ''; }

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockProfile: CustomerProfileDto = {
  customerId: 'CUST-001',
  chapterId: '0001',
  name: 'Test Hospital',
  customerType: 'HO',
  customerTypeDesc: 'Hospital',
  shortName: 'TEST',
  alphaKey: 'TEST',
  intFlag: 'N',
  address1: '123 Main St',
  address2: null,
  address3: null,
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
  country: 'USA',
  phoneNo: '214-555-0100',
  phoneExt: null,
  faxNo: null,
  intPhone: null,
  telexNo: null,
  codFlag: 'N',
  returnAcceptedFlag: 'Y',
  arAccount: 'AR001',
  fiPriceSchNo: '01',
  priceChangeFlag: null,
  ednGenFlag: null,
  plasmaFileType: null,
  phApprFlag: null,
  insApprFlag: null,
  effDate: '2024-01-01',
  termDate: null,
  lastModifiedDate: null,
  payeeId: null
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CustomerProfileDetailsComponent', () => {
  let component: CustomerProfileDetailsComponent;
  let fixture: ComponentFixture<CustomerProfileDetailsComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let apiServiceSpy: jasmine.SpyObj<CustomerProfileApiService>;
  let listStateServiceSpy: jasmine.SpyObj<CustomerProfileListStateService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  const paramMapSubject = new Subject<any>();

  beforeEach(() => {

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    apiServiceSpy = jasmine.createSpyObj('CustomerProfileApiService', ['getCustomerProfileById']);
    apiServiceSpy.getCustomerProfileById.and.returnValue(of(mockProfile));
    listStateServiceSpy = jasmine.createSpyObj('CustomerProfileListStateService', ['clear', 'save', 'restore', 'hasSavedState']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    snackBarSpy = createMockMatSnackBar();
    chapterChanged$ = new Subject<void>();

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable()
    };

    const pageHeaderServiceMock = createMockPageHeaderService();
    const snackbarServiceMock = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [CustomerProfileDetailsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: CustomerProfileApiService, useValue: apiServiceSpy },
        { provide: CustomerProfileListStateService, useValue: listStateServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: SnackbarService, useValue: snackbarServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
            snapshot: { paramMap: { get: () => 'CUST-001' } }
          }
        },
      ],
    })
      .overrideComponent(CustomerProfileDetailsComponent, {
        remove: {
          imports: [
            MatDialogModule,
            PageHeaderWithBreadcrumb,
            CustomerContractDetailsComponent,
            CustomerPayeeDetailsComponent,
            ConsigneeDetailsTabComponent,
            CustomerContactDetailsComponent,
          ]
        },
        add: {
          imports: [
            PageHeaderStub,
            CustomerContractDetailsStub,
            CustomerPayeeDetailsStub,
            ConsigneeDetailsStub,
            CustomerContactDetailsStub,
          ]
        },
      });


    


      routerSpy.navigate.calls.reset();


      apiServiceSpy.getCustomerProfileById.calls.reset();


      listStateServiceSpy.clear.calls.reset();


      listStateServiceSpy.save.calls.reset();


      listStateServiceSpy.restore.calls.reset();


      listStateServiceSpy.hasSavedState.calls.reset();


      dialogSpy.open.calls.reset();


      dialogSpy.closeAll.calls.reset();


      apiServiceSpy.getCustomerProfileById.and.returnValue(of(mockProfile));


    fixture = TestBed.createComponent(CustomerProfileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    paramMapSubject.next({ get: (key: string) => key === 'customerId' ? 'CUST-001' : null });


    });

  // ── Initialisation ────────────────────────────────────────────────────────


  // ── navigateToList ────────────────────────────────────────────────────────
  // ── Chapter change ────────────────────────────────────────────────────────
  // ── formatDate ───────────────────────────────────────────────────────────

  describe('formatDate', () => {


    it('should format a valid ISO date to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2024-01-15')).toBe('15-JAN-2024');
    });
  });

  // ── formatYesNo ──────────────────────────────────────────────────────────

  describe('formatYesNo', () => {


    it('should return Yes for Y', () => {
      expect(component.formatYesNo('Y')).toBe('Yes');
    });

    it('should return No for N', () => {
      expect(component.formatYesNo('N')).toBe('No');
    });
  });

  // ── formatReturnAccepted ─────────────────────────────────────────────────

  describe('formatReturnAccepted', () => {


    it('should return Yes for Y', () => {
      expect(component.formatReturnAccepted('Y')).toBe('Yes');
    });

    it('should return No for N', () => {
      expect(component.formatReturnAccepted('N')).toBe('No');
    });

    it('should return Quarantine for other value', () => {
      expect(component.formatReturnAccepted('Q')).toBe('Quarantine');
    });
  });
});
