import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveResourcesPanel } from './drive-resources-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { DriveResourcesResponse, DriveEstimatedResource, DriveScheduledStaff, DriveActualStaff } from '../../models/drive-details-query.model';

describe('DriveResourcesPanel', () => {
  let spy: any;
  let component: DriveResourcesPanel;
  let fixture: ComponentFixture<DriveResourcesPanel>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;

  const mockResourcesData: DriveResourcesResponse = {
    estimatedResources: [
      { resource: 'Phlebotomist', estimate: 5, actual: 4 },
      { resource: 'Nurse', estimate: 2, actual: 2 },
      { resource: 'Driver', estimate: 1, actual: 1 }
    ],
    scheduledStaff: [
      { scheduledStaff: 'STAFF001', scheduledStaffName: 'John Doe', job: 'JOB1', jobDescription: 'Team Lead', teamLeaderPhone: '555-1234', teamLeaderPager: '555-9999' },
      { scheduledStaff: 'STAFF002', scheduledStaffName: 'Jane Smith', job: 'JOB2', jobDescription: 'Phlebotomist', teamLeaderPhone: null, teamLeaderPager: null }
    ],
    actualStaff: [
      { actualStaff: 'STAFF001', actualStaffName: 'John Doe', job: 'JOB1', jobDescription: 'Team Lead' },
      { actualStaff: 'STAFF003', actualStaffName: 'Bob Johnson', job: 'JOB2', jobDescription: 'Phlebotomist' }
    ]
  };

  beforeEach(() => {

    spy = jasmine.createSpyObj('DriveDetailsQueryService', ['getDriveResources']);



      TestBed.configureTestingModule({
      imports: [
        DriveResourcesPanel,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DriveDetailsQueryService, useValue: spy }
      ]
    });


    


      spy.getDriveResources.calls.reset();


    fixture = TestBed.createComponent(DriveResourcesPanel);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;


    });

  describe('ngOnInit', () => {
    it('should load resources data', () => {
      serviceSpy.getDriveResources.and.returnValue(of(mockResourcesData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(serviceSpy.getDriveResources).toHaveBeenCalledWith('DRIVE001', undefined);
      expect(component.estimatedData.length).toBe(3);
      expect(component.scheduledData.length).toBe(2);
      expect(component.actualData.length).toBe(2);
    });

    it('should include scheduleId when provided', () => {
      serviceSpy.getDriveResources.and.returnValue(of(mockResourcesData));
      component.driveId = 'DRIVE001';
      component.scheduleId = 'SCH001';

      component.ngOnInit();

      expect(serviceSpy.getDriveResources).toHaveBeenCalledWith('DRIVE001', 'SCH001');
    });




  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      serviceSpy.getDriveResources.and.returnValue(of(mockResourcesData));
    });

    it('should reload resources when driveId changes', () => {
      component.driveId = 'DRIVE001';
      component.ngOnInit();
      serviceSpy.getDriveResources.calls.reset();

      component.driveId = 'DRIVE002';
      component.ngOnChanges({
        driveId: new SimpleChange('DRIVE001', 'DRIVE002', false)
      });

      expect(serviceSpy.getDriveResources).toHaveBeenCalledWith('DRIVE002', undefined);
    });


  });
  describe('getFieldValue', () => {
    it('should return value when provided', () => {
      expect(component.getFieldValue('test')).toBe('test');
    });

    it('should return -- for null value', () => {
      expect(component.getFieldValue(null)).toBe('--');
    });

    it('should return -- for undefined value', () => {
      expect(component.getFieldValue(undefined)).toBe('--');
    });


  });
  describe('Data arrays', () => {
    beforeEach(() => {
      serviceSpy.getDriveResources.and.returnValue(of(mockResourcesData));
      component.driveId = 'DRIVE001';
      component.ngOnInit();
    });

    it('should populate estimatedData correctly', () => {
      expect(component.estimatedData.length).toBe(3);
      expect(component.estimatedData[0].resource).toBe('Phlebotomist');
      expect(component.estimatedData[0].estimate).toBe(5);
      expect(component.estimatedData[0].actual).toBe(4);
    });

    it('should populate scheduledData correctly', () => {
      expect(component.scheduledData.length).toBe(2);
      expect(component.scheduledData[0].scheduledStaffName).toBe('John Doe');
      expect(component.scheduledData[0].jobDescription).toBe('Team Lead');
    });

    it('should populate actualData correctly', () => {
      expect(component.actualData.length).toBe(2);
      expect(component.actualData[0].actualStaffName).toBe('John Doe');
      expect(component.actualData[1].actualStaffName).toBe('Bob Johnson');
    });
  });
});
