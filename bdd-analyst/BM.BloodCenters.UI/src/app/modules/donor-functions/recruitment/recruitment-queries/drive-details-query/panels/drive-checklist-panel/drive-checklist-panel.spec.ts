import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveChecklistPanel } from './drive-checklist-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { DriveChecklistItem } from '../../models/drive-details-query.model';

describe('DriveChecklistPanel', () => {
  let spy: any;
  let component: DriveChecklistPanel;
  let fixture: ComponentFixture<DriveChecklistPanel>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;

  const mockChecklistData: DriveChecklistItem[] = [
    { action: 'ACTION1', description: 'Confirm venue', targetDate: '2024-01-15T00:00:00', user: 'John Doe', actionDate: '2024-01-14T00:00:00', actionBy: 'Admin' },
    { action: 'ACTION2', description: 'Order supplies', targetDate: '2024-01-16T00:00:00', user: 'Jane Smith', actionDate: null, actionBy: null },
    { action: 'ACTION3', description: 'Schedule staff', targetDate: '2024-01-17T00:00:00', user: 'Bob Johnson', actionDate: '2024-01-16T00:00:00', actionBy: 'Manager' }
  ];

  beforeEach(() => {

    spy = jasmine.createSpyObj('DriveDetailsQueryService', ['getDriveChecklist']);



      TestBed.configureTestingModule({
imports: [
        DriveChecklistPanel,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DriveDetailsQueryService, useValue: spy }
      ]
    });


    });



  beforeEach(() => {


      spy.getDriveChecklist.calls.reset();


    fixture = TestBed.createComponent(DriveChecklistPanel);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;


    });
  describe('ngOnInit', () => {
    it('should initialize table columns', () => {
      serviceSpy.getDriveChecklist.and.returnValue(of([]));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('action');
      expect(component.tableConfig.columns[1].key).toBe('description');
      expect(component.tableConfig.columns[2].key).toBe('targetDate');
      expect(component.tableConfig.columns[3].key).toBe('user');
      expect(component.tableConfig.columns[4].key).toBe('actionDate');
      expect(component.tableConfig.columns[5].key).toBe('actionBy');
    });

    it('should load checklist data', () => {
      serviceSpy.getDriveChecklist.and.returnValue(of(mockChecklistData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(serviceSpy.getDriveChecklist).toHaveBeenCalledWith('DRIVE001');
      expect(component.checklistData.length).toBe(3);
    });

  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      serviceSpy.getDriveChecklist.and.returnValue(of(mockChecklistData));
    });

    it('should reload checklist when driveId changes', () => {
      component.driveId = 'DRIVE001';
      component.ngOnInit();
      serviceSpy.getDriveChecklist.calls.reset();

      component.driveId = 'DRIVE002';
      component.ngOnChanges({
        driveId: new SimpleChange('DRIVE001', 'DRIVE002', false)
      });

      expect(serviceSpy.getDriveChecklist).toHaveBeenCalledWith('DRIVE002');
    });

  });
  describe('formatDate', () => {
    const mockRow = mockChecklistData[0];

    beforeEach(() => {
      serviceSpy.getDriveChecklist.and.returnValue(of(mockChecklistData));
      component.driveId = 'DRIVE001';
      component.ngOnInit();
    });

    it('should format date column with valueFormatter', () => {
      const targetDateColumn = component.tableConfig.columns.find(c => c.key === 'targetDate');
      expect(targetDateColumn?.valueFormatter).toBeDefined();

      const formatted = targetDateColumn?.valueFormatter?.('2024-01-15T00:00:00', mockRow);
      expect(formatted).toBe('15-JAN-2024');
    });


  });
});
