import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { DefineMaxDonationsComponent } from './define-max-donations';
import { DefineMaxDonationsService } from './services/define-max-donations.service';
import { DefineMaxDonationsModel } from './models/define-max-donations.model';
import { OverlayModule } from '@angular/cdk/overlay';

describe('DefineMaxDonationsComponent', () => {
  let serviceSpy: any;
  let component: DefineMaxDonationsComponent;
  let fixture: ComponentFixture<DefineMaxDonationsComponent>;
  let service: jasmine.SpyObj<DefineMaxDonationsService>;

  const mockData: DefineMaxDonationsModel[] = [
    {
      donationType: 'AL',
      donationDescription: 'Allogeneic',
      procedureGroup: 'PLATE',
      procedureDescription: 'Platelets',
      maxDonations: 2,
      interval: 7,
      effDate: '2024-01-01T00:00:00',
      termDate: null,
      programId: 'VDIEGPRD',
      chapterId: 'ALL'
    },
    {
      donationType: 'AU',
      donationDescription: 'Autologous',
      procedureGroup: 'PLASM',
      procedureDescription: 'Plasma',
      maxDonations: 1,
      interval: 14,
      effDate: '2024-01-01T00:00:00',
      termDate: '2024-12-31T00:00:00',
      programId: 'VDIEGPRD',
      chapterId: 'ALL'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineMaxDonationsService', [
      'getDefineMaxDonations',
      'addMaxDonation',
      'updateMaxDonation',
      'getDonationTypes',
      'getProcedureGroups'
    ]);



      TestBed.configureTestingModule({
      imports: [
        DefineMaxDonationsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        OverlayModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DefineMaxDonationsService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      serviceSpy.getDefineMaxDonations.calls.reset();


      serviceSpy.addMaxDonation.calls.reset();


      serviceSpy.updateMaxDonation.calls.reset();


      serviceSpy.getDonationTypes.calls.reset();


      serviceSpy.getProcedureGroups.calls.reset();


    service = TestBed.inject(DefineMaxDonationsService) as jasmine.SpyObj<DefineMaxDonationsService>;
    fixture = TestBed.createComponent(DefineMaxDonationsComponent);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {


    it('should handle error on initialization', () => {
      service.getDefineMaxDonations.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.errorMessage).toBeTruthy();
      expect(component.hasError).toBe(true);
    });
  });

  describe('loadData', () => {
    beforeEach(() => {
      service.getDefineMaxDonations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
    });

    it('should load data with correct pagination parameters', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageSize = 10;
        component.tableConfig.pagination.pageIndex = 0;
      }

      component.loadData();

      expect(service.getDefineMaxDonations).toHaveBeenCalledWith(
        10,
        0,
        jasmine.any(Object)
      );
    });




  });

  describe('search', () => {
    beforeEach(() => {
      service.getDefineMaxDonations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
    });

    it('should search with any query', () => {
      component.onSearch('AB');

      expect(service.getDefineMaxDonations).toHaveBeenCalled();
      expect(component.requestState.searchKeyword).toBe('AB');
    });

    it('should search when query is 3 or more characters', () => {
      component.onSearch('ABC');

      expect(service.getDefineMaxDonations).toHaveBeenCalled();
      expect(component.requestState.searchKeyword).toBe('ABC');
    });



    it('should clear search when query is empty', () => {
      component.requestState.searchKeyword = 'ABC';

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(service.getDefineMaxDonations).toHaveBeenCalled();
    });
  });



  describe('sorting', () => {
    beforeEach(() => {
      service.getDefineMaxDonations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
    });

    it('should handle sort on donation type column', () => {
      component.onSortChange({ column: 'donationType', direction: 'A' });

      expect(component.tableConfig.sortConfig?.column).toBe('donationType');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(service.getDefineMaxDonations).toHaveBeenCalled();
    });


  });



  describe('add/edit operations', () => {
    beforeEach(() => {
      service.getDefineMaxDonations.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
    });



    it('should open edit panel with selected record', () => {
      component.editRecord(mockData[0]);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });




  });

  describe('keyboard shortcuts', () => {
    it('should handle Alt+C to open add panel', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
    });




  });
  describe('row actions', () => {
    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });
  });
});
