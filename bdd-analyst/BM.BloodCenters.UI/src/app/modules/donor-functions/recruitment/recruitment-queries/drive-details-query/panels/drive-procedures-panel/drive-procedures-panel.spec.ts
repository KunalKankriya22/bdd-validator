import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveProceduresPanel } from './drive-procedures-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { DriveProceduresResponse, DriveProcedureItem } from '../../models/drive-details-query.model';

describe('DriveProceduresPanel', () => {
  let spy: any;
  let component: DriveProceduresPanel;
  let fixture: ComponentFixture<DriveProceduresPanel>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;

  const mockProceduresData: DriveProceduresResponse = {
    scheduled: [
      { procedure: 'PROC001', procedureDescription: 'Blood Draw', don: 'DON1', donDescription: 'Whole Blood', draw: 10 },
      { procedure: 'PROC002', procedureDescription: 'Platelet', don: 'DON2', donDescription: 'Platelet Donation', draw: 5 }
    ],
    actual: [
      { procedure: 'PROC001', procedureDescription: 'Blood Draw', don: 'DON1', donDescription: 'Whole Blood', draw: 8 },
      { procedure: 'PROC002', procedureDescription: 'Platelet', don: 'DON2', donDescription: 'Platelet Donation', draw: 4 }
    ]
  };

  beforeEach(() => {

    spy = jasmine.createSpyObj('DriveDetailsQueryService', ['getDriveProcedures']);



      TestBed.configureTestingModule({
      imports: [
        DriveProceduresPanel,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DriveDetailsQueryService, useValue: spy }
      ]
    });


    


      spy.getDriveProcedures.calls.reset();


    fixture = TestBed.createComponent(DriveProceduresPanel);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;


    });


  describe('Input properties', () => {






    it('should have default active tab as scheduled', () => {
      expect(component.activeTab).toBe('scheduled');
    });
  });

  describe('Tabs configuration', () => {
    it('should have two tabs', () => {
      expect(component.tabs.length).toBe(2);
    });




  });

  describe('ngOnInit', () => {


    it('should load procedures data', () => {
      serviceSpy.getDriveProcedures.and.returnValue(of(mockProceduresData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(serviceSpy.getDriveProcedures).toHaveBeenCalledWith('DRIVE001');
      expect(component.scheduledData.length).toBe(2);
      expect(component.actualData.length).toBe(2);
    });


  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      serviceSpy.getDriveProcedures.and.returnValue(of(mockProceduresData));
    });

    it('should reload procedures when driveId changes', () => {
      component.driveId = 'DRIVE001';
      component.ngOnInit();
      serviceSpy.getDriveProcedures.calls.reset();

      component.driveId = 'DRIVE002';
      component.ngOnChanges({
        driveId: new SimpleChange('DRIVE001', 'DRIVE002', false)
      });

      expect(serviceSpy.getDriveProcedures).toHaveBeenCalledWith('DRIVE002');
    });


  });
  describe('onTabChange', () => {
    it('should update activeTab', () => {
      component.activeTab = 'scheduled';

      component.onTabChange('actual');

      expect(component.activeTab).toBe('actual');
    });

    it('should switch back to scheduled', () => {
      component.activeTab = 'actual';

      component.onTabChange('scheduled');

      expect(component.activeTab).toBe('scheduled');
    });
  });

});
