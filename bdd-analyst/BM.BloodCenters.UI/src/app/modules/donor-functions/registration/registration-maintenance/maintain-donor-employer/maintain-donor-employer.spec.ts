import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MaintainDonorEmployerComponent } from './maintain-donor-employer';
import { DonorEmployerService } from './services/donor-employer.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  DonorEmployer,
  DonorEmployerSearchResponse
} from './models/donor-employer.model';

describe('MaintainDonorEmployerComponent', () => {
  let component: MaintainDonorEmployerComponent;
  let fixture: ComponentFixture<MaintainDonorEmployerComponent>;
  let donorEmployerService: jasmine.SpyObj<DonorEmployerService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let menuService: jasmine.SpyObj<MenuService>;

  const mockEmployers: DonorEmployer[] = [
    {
      employerId: 'DNEMP001',
      employerName: 'Test Employer',
      effDate: '2025-01-01',
      termDate: null,
      chapterId: 'CH01',
      uspsId: 12345,
      intlAddrFlag: 'N',
      intlCity: null,
      intlState: null,
      intlPostalCode: null,
      intlCountryName: null,
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      address: 'Dallas, TX, 75001',
      internationalAddress: '',
      status: 'Active'
    },
    {
      employerId: 'DNEMP002',
      employerName: 'Another Employer',
      effDate: '2025-01-15',
      termDate: '2025-12-31',
      chapterId: 'CH01',
      uspsId: null,
      intlAddrFlag: 'Y',
      intlCity: 'Toronto',
      intlState: 'ON',
      intlPostalCode: 'M5V 2T6',
      intlCountryName: 'Canada',
      city: null,
      state: null,
      zip: null,
      address: '',
      internationalAddress: 'Toronto, ON, Canada, M5V 2T6',
      status: 'Inactive'
    }
  ];

  const mockSearchResponse: DonorEmployerSearchResponse = {
    data: mockEmployers,
    totalRecords: 2
  };

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    donorEmployerService = jasmine.createSpyObj('DonorEmployerService', [
      'search',
      'create',
      'update'
    ]);
    donorEmployerService.search.and.returnValue(of(mockSearchResponse));

    const mockHeaderService = {
      chapterChanged$: chapterChangedSubject.asObservable(),
      chapterId: signal('CH01'),
      warehouseId: signal('WH01'),
      chapterTimeZone: signal('UTC'),
      chapterName: signal('Test Chapter'),
      warehouseName: signal('Test Warehouse')
    };

    menuService = jasmine.createSpyObj('MenuService', [
      'getMenuItemsSignal',
      'findMenuItemByPath'
    ]);
    menuService.getMenuItemsSignal.and.returnValue(signal([]));
    menuService.findMenuItemByPath.and.returnValue(undefined);

    const mockSnackBar = createMockMatSnackBar();



      TestBed.configureTestingModule({
      imports: [
        MaintainDonorEmployerComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        { provide: DonorEmployerService, useValue: donorEmployerService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: menuService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        Overlay
      ]
    });


    


      donorEmployerService.search.calls.reset();


      donorEmployerService.create.calls.reset();


      donorEmployerService.update.calls.reset();


      menuService.getMenuItemsSignal.calls.reset();


      menuService.findMenuItemByPath.calls.reset();


      donorEmployerService.search.and.returnValue(of(mockSearchResponse));


      menuService.getMenuItemsSignal.and.returnValue(signal([]));


      menuService.findMenuItemByPath.and.returnValue(undefined);


    fixture = TestBed.createComponent(MaintainDonorEmployerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize with no search option selected', () => {
    expect(component.selectedSearchOption).toBe('');
  });

  it('should initialize with empty search text', () => {
    expect(component.employerSearchControl.value).toBe('');
  });

  it('should have retrieve button disabled when no option selected', () => {
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should enable retrieve button when option and search text are entered', () => {
    component.selectedSearchOption = 'L';
    component.employerSearchControl.setValue('Acme');
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  it('should disable retrieve button when only option is selected without search text', () => {
    component.selectedSearchOption = 'L';
    component.employerSearchControl.setValue('');
    expect(component.isRetrieveDisabled).toBeTrue();
  });



  it('should have correct table columns configured', () => {
    const columns = component.tableConfig.columns;
    expect(columns.length).toBe(7);
    expect(columns[0].key).toBe('employerId');
    expect(columns[1].key).toBe('employerName');
    expect(columns[2].key).toBe('address');
    expect(columns[3].key).toBe('internationalAddress');
    expect(columns[4].key).toBe('effDate');
    expect(columns[5].key).toBe('termDate');
    expect(columns[6].key).toBe('status');
  });



  it('should call search service on retrieve', () => {
    component.selectedSearchOption = 'L';
    component.employerSearchControl.setValue('Test');
    component.onRetrieve();

    expect(donorEmployerService.search).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({
      SearchType: 'L',
      SearchName: 'Test'
    }));
  });





  it('should compute address from city, state, zip', fakeAsync(() => {
    component.selectedSearchOption = 'L';
    component.onRetrieve();
    tick();

    expect(component.dataSource[0].address).toBe('Dallas, TX, 75001');
  }));

  it('should compute international address from intl fields', fakeAsync(() => {
    component.selectedSearchOption = 'L';
    component.onRetrieve();
    tick();

    expect(component.dataSource[1].internationalAddress).toBe('Toronto, ON, Canada, M5V 2T6');
  }));

  it('should update totalRecords from API response', fakeAsync(() => {
    component.selectedSearchOption = 'L';
    component.onRetrieve();
    tick();

    expect(component.tableConfig.pagination?.totalRecords).toBe(2);
  }));

  it('should handle search error gracefully', fakeAsync(() => {
    donorEmployerService.search.and.returnValue(
      throwError(() => ({ status: 500, error: { message: 'Server error' } }))
    );

    component.selectedSearchOption = 'L';
    component.onRetrieve();
    tick();

    expect(component.dataSource.length).toBe(0);
    expect(component.isLoading).toBeFalse();
  }));

  it('should open add panel when addNewEmployer is called', () => {
    component.addNewEmployer();

    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
    expect(component.employerToEdit).toBeNull();
  });

  it('should open edit panel with employer data when editRecord is called', () => {
    const employer = mockEmployers[0];
    component.editRecord(employer);

    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.employerToEdit).toEqual(employer);
  });

  it('should close side panel when closeSidePanel is called', () => {
    component.sidePanelOpen = true;
    component.employerToEdit = mockEmployers[0];
    component.closeSidePanel();

    expect(component.sidePanelOpen).toBeFalse();
    expect(component.employerToEdit).toBeNull();
  });









  it('should handle row action for edit', () => {
    spyOn(component, 'editRecord');
    const employer = mockEmployers[0];

    component.onRowAction({ action: 'edit', row: employer });

    expect(component.editRecord).toHaveBeenCalledWith(employer);
  });

  it('should reload data after save success when search was performed', fakeAsync(() => {
    component.hasSearched = true;
    component.selectedSearchOption = 'L';
    donorEmployerService.search.calls.reset();

    component.onSaveSuccess({ message: 'Success' });
    tick();

    expect(component.sidePanelOpen).toBeFalse();
    expect(donorEmployerService.search).toHaveBeenCalled();
  }));



  it('should compute status as Active when termDate is null', () => {
    const status = (component as any).computeStatus(null);
    expect(status).toBe('Active');
  });

  it('should compute status as Inactive when termDate is in the past', () => {
    const status = (component as any).computeStatus('2020-01-01');
    expect(status).toBe('Inactive');
  });

  it('should compute status as Active when termDate is in the future', () => {
    const status = (component as any).computeStatus('2099-12-31');
    expect(status).toBe('Active');
  });

  it('should build domestic address from city, state, zip', () => {
    const address = (component as any).buildDomesticAddress({
      city: 'Dallas', state: 'TX', zip: '75001'
    });
    expect(address).toBe('Dallas, TX, 75001');
  });



  it('should build international address from intl fields', () => {
    const address = (component as any).buildInternationalAddress({
      intlCity: 'Toronto', intlState: 'ON', intlCountryName: 'Canada', intlPostalCode: 'M5V'
    });
    expect(address).toBe('Toronto, ON, Canada, M5V');
  });

  it('should clear search on chapter change', fakeAsync(() => {
    component.employerSearchControl.setValue('Test');
    component.hasSearched = true;
    component.dataSource = [...mockEmployers];

    chapterChangedSubject.next();
    tick();

    expect(component.employerSearchControl.value).toBe('');
    expect(component.dataSource.length).toBe(0);
    expect(component.hasSearched).toBeFalse();
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(component.tableConfig.pagination?.totalRecords).toBe(0);
  }));
});
