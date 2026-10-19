import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PickupSchedulePanel } from './pickup-schedule-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { PickupScheduleItem } from '../../models/drive-details-query.model';

describe('PickupSchedulePanel', () => {
  let spy: any;
  let component: PickupSchedulePanel;
  let fixture: ComponentFixture<PickupSchedulePanel>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;

  const mockPickupData: PickupScheduleItem[] = [
    { courier: 'FedEx', time: '2024-01-15T10:00:00', driver: 'John Smith' },
    { courier: 'UPS', time: '2024-01-15T14:30:00', driver: 'Jane Doe' },
    { courier: 'DHL', time: null, driver: 'Bob Johnson' }
  ];

  beforeEach(() => {

    spy = jasmine.createSpyObj('DriveDetailsQueryService', ['getPickupSchedule']);



      TestBed.configureTestingModule({
imports: [
        PickupSchedulePanel,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DriveDetailsQueryService, useValue: spy }
      ]
    });


    });



  beforeEach(() => {


      spy.getPickupSchedule.calls.reset();


    fixture = TestBed.createComponent(PickupSchedulePanel);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;


    });
  describe('ngOnInit', () => {
    it('should initialize table columns', () => {
      serviceSpy.getPickupSchedule.and.returnValue(of([]));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(component.tableConfig.columns.length).toBe(3);
      expect(component.tableConfig.columns[0].key).toBe('courier');
      expect(component.tableConfig.columns[1].key).toBe('time');
      expect(component.tableConfig.columns[2].key).toBe('driver');
    });

    it('should load pickup schedule data', () => {
      serviceSpy.getPickupSchedule.and.returnValue(of(mockPickupData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(serviceSpy.getPickupSchedule).toHaveBeenCalledWith('DRIVE001');
      expect(component.pickupData.length).toBe(3);
    });

  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      serviceSpy.getPickupSchedule.and.returnValue(of(mockPickupData));
    });

    it('should reload pickup schedule when driveId changes', () => {
      component.driveId = 'DRIVE001';
      component.ngOnInit();
      serviceSpy.getPickupSchedule.calls.reset();

      component.driveId = 'DRIVE002';
      component.ngOnChanges({
        driveId: new SimpleChange('DRIVE001', 'DRIVE002', false)
      });

      expect(serviceSpy.getPickupSchedule).toHaveBeenCalledWith('DRIVE002');
    });

  });
  describe('formatTime (via valueFormatter)', () => {
    const mockRow = mockPickupData[0];

    beforeEach(() => {
      serviceSpy.getPickupSchedule.and.returnValue(of(mockPickupData));
      component.driveId = 'DRIVE001';
      component.ngOnInit();
    });

    it('should format time to HH:MM', () => {
      const timeColumn = component.tableConfig.columns.find(c => c.key === 'time');
      expect(timeColumn?.valueFormatter).toBeDefined();

      const formatted = timeColumn?.valueFormatter?.('2024-01-15T10:00:00', mockRow);
      expect(formatted).toBe('10:00');
    });

    it('should format time with leading zeros', () => {
      const timeColumn = component.tableConfig.columns.find(c => c.key === 'time');
      const formatted = timeColumn?.valueFormatter?.('2024-01-15T09:05:00', mockRow);
      expect(formatted).toBe('09:05');
    });

    it('should return -- for null time', () => {
      const timeColumn = component.tableConfig.columns.find(c => c.key === 'time');
      const formatted = timeColumn?.valueFormatter?.(null, mockRow);
      expect(formatted).toBe('--');
    });

    it('should handle afternoon times', () => {
      const timeColumn = component.tableConfig.columns.find(c => c.key === 'time');
      const formatted = timeColumn?.valueFormatter?.('2024-01-15T14:30:00', mockRow);
      expect(formatted).toBe('14:30');
    });

    it('should handle midnight', () => {
      const timeColumn = component.tableConfig.columns.find(c => c.key === 'time');
      const formatted = timeColumn?.valueFormatter?.('2024-01-15T00:00:00', mockRow);
      expect(formatted).toBe('00:00');
    });
  });

  describe('Data handling', () => {
    it('should store pickup data correctly', () => {
      serviceSpy.getPickupSchedule.and.returnValue(of(mockPickupData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(component.pickupData.length).toBe(3);
      expect(component.pickupData[0].courier).toBe('FedEx');
      expect(component.pickupData[1].driver).toBe('Jane Doe');
      expect(component.pickupData[2].time).toBeNull();
    });
  });
});
