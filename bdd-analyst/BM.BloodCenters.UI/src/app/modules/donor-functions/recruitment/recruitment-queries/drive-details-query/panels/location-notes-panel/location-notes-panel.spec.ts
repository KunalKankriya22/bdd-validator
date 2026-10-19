import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationNotesPanel } from './location-notes-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { LocationNote } from '../../models/drive-details-query.model';

describe('LocationNotesPanel', () => {
  let spy: any;
  let component: LocationNotesPanel;
  let fixture: ComponentFixture<LocationNotesPanel>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;

  const mockNotesData: LocationNote[] = [
    { locationId: 'LOC001', locationName: 'Main Hospital', userId: 'U001', userName: 'Doe, John', notes: 'First note content', noteSequence: 1, insertDate: '2024-01-15T10:30:00' },
    { locationId: 'LOC001', locationName: 'Main Hospital', userId: 'U002', userName: 'Smith, Jane', notes: 'Second note content', noteSequence: 2, insertDate: '2024-01-16T14:45:00' },
    { locationId: 'LOC001', locationName: 'Main Hospital', userId: 'U003', userName: null, notes: 'Third note', noteSequence: 3, insertDate: '2024-01-17T09:00:00' }
  ];

  beforeEach(() => {

    spy = jasmine.createSpyObj('DriveDetailsQueryService', ['getLocationNotes']);



      TestBed.configureTestingModule({
      imports: [
        LocationNotesPanel],
      providers: [
        { provide: DriveDetailsQueryService, useValue: spy }
      ]
    });


    


      spy.getLocationNotes.calls.reset();


    fixture = TestBed.createComponent(LocationNotesPanel);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;


    });


  describe('Input properties', () => {


    it('should have default locationId as empty string', () => {
      expect(component.locationId).toBe('');
    });

    it('should have default locationName as empty string', () => {
      expect(component.locationName).toBe('');
    });




  });

  describe('ngOnInit', () => {
    it('should initialize header fields', () => {
      serviceSpy.getLocationNotes.and.returnValue(of([]));
      component.driveId = 'DRIVE001';
      component.locationId = 'LOC001';
      component.locationName = 'Test Location';

      component.ngOnInit();

      expect(component.headerFields.length).toBe(2);
      expect(component.headerFields[0].label).toBe('Location ID');
      expect(component.headerFields[0].value).toBe('LOC001');
      expect(component.headerFields[1].label).toBe('Location Name');
      expect(component.headerFields[1].value).toBe('Test Location');
    });

    it('should load location notes', () => {
      serviceSpy.getLocationNotes.and.returnValue(of(mockNotesData));
      component.driveId = 'DRIVE001';

      component.ngOnInit();

      expect(serviceSpy.getLocationNotes).toHaveBeenCalledWith('DRIVE001');
      expect(component.notes.length).toBe(3);
    });




  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      serviceSpy.getLocationNotes.and.returnValue(of(mockNotesData));
    });

    it('should reload notes when driveId changes', () => {
      component.driveId = 'DRIVE001';
      component.ngOnInit();
      serviceSpy.getLocationNotes.calls.reset();

      component.driveId = 'DRIVE002';
      component.ngOnChanges({
        driveId: new SimpleChange('DRIVE001', 'DRIVE002', false)
      });

      expect(serviceSpy.getLocationNotes).toHaveBeenCalledWith('DRIVE002');
    });



    it('should update header fields when locationId changes', () => {
      serviceSpy.getLocationNotes.and.returnValue(of([]));
      component.driveId = 'DRIVE001';
      component.locationId = 'LOC001';
      component.ngOnInit();

      component.locationId = 'LOC002';
      component.ngOnChanges({
        locationId: new SimpleChange('LOC001', 'LOC002', false)
      });

      expect(component.headerFields[0].value).toBe('LOC002');
    });

    it('should update header fields when locationName changes', () => {
      serviceSpy.getLocationNotes.and.returnValue(of([]));
      component.driveId = 'DRIVE001';
      component.locationName = 'Old Name';
      component.ngOnInit();

      component.locationName = 'New Name';
      component.ngOnChanges({
        locationName: new SimpleChange('Old Name', 'New Name', false)
      });

      expect(component.headerFields[1].value).toBe('New Name');
    });
  });
  describe('formatUserName', () => {
    it('should convert "Last, First" to "First Last"', () => {
      const result = component.formatUserName('Doe, John', 'U001');
      expect(result).toBe('John Doe');
    });

    it('should handle name with multiple commas', () => {
      const result = component.formatUserName('Doe, John, Jr', 'U001');
      // Only splits on first comma
      expect(result).toBe('Doe, John, Jr');
    });

    it('should return name as-is if no comma', () => {
      const result = component.formatUserName('John Doe', 'U001');
      expect(result).toBe('John Doe');
    });

    it('should return userId if userName is null', () => {
      const result = component.formatUserName(null, 'U001');
      expect(result).toBe('U001');
    });

    it('should return -- if both userName and userId are null', () => {
      const result = component.formatUserName(null, null);
      expect(result).toBe('--');
    });

    it('should handle userName with extra spaces', () => {
      const result = component.formatUserName('  Doe  ,  John  ', 'U001');
      expect(result).toBe('John Doe');
    });
  });

  describe('formatVersion', () => {
    it('should format number with one decimal place', () => {
      expect(component.formatVersion(1)).toBe('1.0');
      expect(component.formatVersion(2.5)).toBe('2.5');
      expect(component.formatVersion(10.123)).toBe('10.1');
    });



    it('should return -- for undefined', () => {
      expect(component.formatVersion(undefined as any)).toBe('--');
    });

    it('should handle zero', () => {
      expect(component.formatVersion(0)).toBe('0.0');
    });
  });

  describe('formatNoteDate', () => {






    it('should handle single digit days', () => {
      const result = component.formatNoteDate('2024-01-05T00:00:00');
      expect(result).toBe('5-JAN-2024');
    });
  });
});
