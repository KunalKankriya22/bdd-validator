import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveSuppliesPanel } from './drive-supplies-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { DriveSuppliesResponse, CampaignItem, DriveBagItem } from '../../models/drive-details-query.model';

describe('DriveSuppliesPanel', () => {
  let spy: any;
  let component: DriveSuppliesPanel;
  let fixture: ComponentFixture<DriveSuppliesPanel>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;

  const mockSuppliesData: DriveSuppliesResponse = {
    campaignId: 'CAMP001',
    campaignName: 'Summer Blood Drive',
    campaignItems: [
      { item: 'ITEM001', description: 'T-Shirt', qty: 100 },
      { item: 'ITEM002', description: 'Water Bottle', qty: 200 },
      { item: 'ITEM003', description: 'Sticker', qty: 500 }
    ],
    bags: [
      { bag: 'BAG001', description: 'Single Unit', qty: 50, aboDesc: 'O+' },
      { bag: 'BAG002', description: 'Double Unit', qty: 30, aboDesc: 'A+' },
      { bag: 'BAG003', description: 'Platelet', qty: 20, aboDesc: 'B+' }
    ]
  };

  beforeEach(() => {

    spy = jasmine.createSpyObj('DriveDetailsQueryService', ['getDriveSupplies']);



      TestBed.configureTestingModule({
      imports: [
        DriveSuppliesPanel,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DriveDetailsQueryService, useValue: spy }
      ]
    });


    


      spy.getDriveSupplies.calls.reset();


    fixture = TestBed.createComponent(DriveSuppliesPanel);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;


    });


  describe('Input properties', () => {






    it('should have default active tab as campaign', () => {
      expect(component.activeTab).toBe('campaign');
    });
  });

  describe('Tabs configuration', () => {
    it('should have two tabs', () => {
      expect(component.tabs.length).toBe(2);
    });




  });

  describe('ngOnInit', () => {
    it('should initialize campaign table columns', () => {
      serviceSpy.getDriveSupplies.and.returnValue(of(mockSuppliesData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(component.campaignTableConfig.columns.length).toBe(3);
      expect(component.campaignTableConfig.columns[0].key).toBe('item');
      expect(component.campaignTableConfig.columns[1].key).toBe('description');
      expect(component.campaignTableConfig.columns[2].key).toBe('qty');
    });

    it('should initialize bags table columns', () => {
      serviceSpy.getDriveSupplies.and.returnValue(of(mockSuppliesData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(component.bagsTableConfig.columns.length).toBe(4);
      expect(component.bagsTableConfig.columns[0].key).toBe('bag');
      expect(component.bagsTableConfig.columns[1].key).toBe('description');
      expect(component.bagsTableConfig.columns[2].key).toBe('qty');
      expect(component.bagsTableConfig.columns[3].key).toBe('aboDesc');
    });

    it('should load supplies data', () => {
      serviceSpy.getDriveSupplies.and.returnValue(of(mockSuppliesData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(serviceSpy.getDriveSupplies).toHaveBeenCalledWith('DRIVE001');
      expect(component.campaignData.length).toBe(3);
      expect(component.bagsData.length).toBe(3);
    });




  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      serviceSpy.getDriveSupplies.and.returnValue(of(mockSuppliesData));
    });

    it('should reload supplies when driveId changes', () => {
      component.driveId = 'DRIVE001';
      component.ngOnInit();
      serviceSpy.getDriveSupplies.calls.reset();

      component.driveId = 'DRIVE002';
      component.ngOnChanges({
        driveId: new SimpleChange('DRIVE001', 'DRIVE002', false)
      });

      expect(serviceSpy.getDriveSupplies).toHaveBeenCalledWith('DRIVE002');
    });


  });
  describe('onTabChange', () => {
    it('should update activeTab to bags', () => {
      component.activeTab = 'campaign';

      component.onTabChange('bags');

      expect(component.activeTab).toBe('bags');
    });

    it('should switch back to campaign', () => {
      component.activeTab = 'bags';

      component.onTabChange('campaign');

      expect(component.activeTab).toBe('campaign');
    });
  });

});
