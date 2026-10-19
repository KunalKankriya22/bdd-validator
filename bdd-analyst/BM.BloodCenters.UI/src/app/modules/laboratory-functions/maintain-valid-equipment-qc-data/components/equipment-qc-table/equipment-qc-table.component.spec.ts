import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import moment from 'moment';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

import { EquipmentQcTableComponent } from './equipment-qc-table.component';
import { EquipmentQcDataService } from '../../services/equipment-qc-data.service';
import { EquipmentQcRow, Units } from '../../models/equipment-qc-data.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

describe('EquipmentQcTableComponent', () => {
  let chapterTimezoneSpy: any;
  let component: EquipmentQcTableComponent;
  let fixture: ComponentFixture<EquipmentQcTableComponent>;
  let equipmentQcDataServiceSpy: jasmine.SpyObj<EquipmentQcDataService>;

  const mockData: EquipmentQcRow[] = [
    {
      seqNo: '100',
      description: 'Test QC 1',
      units: 'CHAR',
      targetValue: '100',
      minAccept: '90',
      maxAccept: '110',
      effectiveDate: '2025-01-01',
      terminationDate: null
    },
    {
      seqNo: '200',
      description: 'Test QC 2',
      units: 'NUM',
      targetValue: '50',
      minAccept: '45',
      maxAccept: '55',
      effectiveDate: '2025-02-01',
      terminationDate: '2025-12-31'
    }
  ];

  const mockUnits: Units[] = [
    { code: 'CHAR', description: 'Character' },
    { code: 'NUM', description: 'Numeric' }
  ];

  beforeEach(() => {

    equipmentQcDataServiceSpy = jasmine.createSpyObj('EquipmentQcDataService', ['getUnits']);
    equipmentQcDataServiceSpy.getUnits.and.returnValue(of(mockUnits));

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment('2025-01-01'));



      TestBed.configureTestingModule({
      imports: [EquipmentQcTableComponent, NoopAnimationsModule],
      providers: [
        { provide: EquipmentQcDataService, useValue: equipmentQcDataServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        provideMomentDateAdapter()
      ]
    });


    


      equipmentQcDataServiceSpy.getUnits.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.calls.reset();


      equipmentQcDataServiceSpy.getUnits.and.returnValue(of(mockUnits));


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment('2025-01-01'));


    fixture = TestBed.createComponent(EquipmentQcTableComponent);
    component = fixture.componentInstance;
    component.pagination = {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    };


    });

  describe('Initialization', () => {




    it('should load units on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(equipmentQcDataServiceSpy.getUnits).toHaveBeenCalled();
      expect(component['unitsOptions']().length).toBe(2);
    }));

    it('should start in view mode', () => {
      fixture.detectChanges();
      expect(component['editMode']()).toBe(false);
    });
  });
  describe('Empty State', () => {


    it('should display correct empty message', () => {
      component.data = [];
      fixture.detectChanges();

      const emptyMessage = fixture.debugElement.query(By.css('.empty-message'));
      expect(emptyMessage.nativeElement.textContent).toContain('No Results to Display');
    });

    it('should display correct empty hint', () => {
      component.data = [];
      fixture.detectChanges();

      const emptyHint = fixture.debugElement.query(By.css('.empty-hint'));
      expect(emptyHint.nativeElement.textContent).toContain('Scan or enter a Unit ID to begin.');
    });

    it('should use search icon for empty state', () => {
      component.data = [];
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('.empty-state mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('search');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.data = mockData;
      fixture.detectChanges();
    });



    it('should show ADD/EDIT button in view mode', () => {
      const editBtn = fixture.debugElement.query(By.css(`#${component['elementId']('edit-mode-btn')}`));
      expect(editBtn).toBeTruthy();
      expect(editBtn.nativeElement.textContent).toContain('ADD / EDIT');
    });

    it('should show ADD NEW ROW, CANCEL, SAVE in edit mode', () => {
      component.onToggleEditMode();
      fixture.detectChanges();

      const addRowBtn = fixture.debugElement.query(By.css(`#${component['elementId']('add-row-btn')}`));
      const cancelBtn = fixture.debugElement.query(By.css(`#${component['elementId']('cancel-edit-btn')}`));
      const saveBtn = fixture.debugElement.query(By.css(`#${component['elementId']('save-btn')}`));

      expect(addRowBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();
      expect(saveBtn).toBeTruthy();
    });

    it('should show delete buttons in edit mode', () => {
      component.onToggleEditMode();
      fixture.detectChanges();

      const deleteButtons = fixture.debugElement.queryAll(By.css('button[aria-label*="Delete row"]'));
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe('Add New Row', () => {
    beforeEach(() => {
      component.createWorksheet = 'Y';
      component.data = mockData;
      fixture.detectChanges();
    });





    it('should add row with NEW seq number', () => {
      component.onToggleEditMode();
      component.onAddNewRow();

      const lastRow = component.rows.at(component.rows.length - 1) as any;
      expect(lastRow.get('seqNo')?.value).toBe('300');
    });

    it('should mark new row with isNew flag', () => {
      component.onToggleEditMode();
      component.onAddNewRow();

      const lastRow = component.rows.at(component.rows.length - 1) as any;
      expect(lastRow.get('isNew')?.value).toBe(true);
    });
  });



  describe('Save Functionality', () => {
    beforeEach(() => {
      component.data = mockData;
      fixture.detectChanges();
    });



    it('should emit rows with isModified flag for dirty rows', () => {
      spyOn(component.save, 'emit');

      component.onToggleEditMode();
      const row = component.rows.at(0) as any;
      row.get('description')?.setValue('Updated');
      row.markAsDirty();

      component.onSave();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData[0].isModified).toBe(true);
    });
  });

  describe('Cancel Edit', () => {
    beforeEach(() => {
      component.data = mockData;
      fixture.detectChanges();
    });



    it('should mark form as pristine', () => {
      component.onToggleEditMode();
      (component.rows.at(0) as any).markAsDirty();

      component.onCancelEdit();

      expect(component.tableForm.pristine).toBe(true);
    });
  });
  describe('Date Formatting', () => {




    it('should handle invalid dates gracefully', () => {
      const formatted = component.formatDate('invalid-date');
      expect(formatted).toBe('invalid-date');
    });
  });
  describe('Detail Date Range Validation', () => {
    beforeEach(() => {
      component.headerEffectiveDate = moment('2025-01-01');
      component.headerTerminationDate = moment('2025-12-31');
      component.data = mockData;
      fixture.detectChanges();
    });





    it('should pass when detail dates are within header date range', () => {
      component.onToggleEditMode();
      component.onAddNewRow();

      const newRow = component.rows.at(component.rows.length - 1) as any;
      newRow.get('effectiveDate')?.setValue(moment('2025-03-01'));
      newRow.get('terminationDate')?.setValue(moment('2025-06-01'));
      newRow.updateValueAndValidity();

      expect(newRow.errors?.['detailEffBeforeHeader']).toBeFalsy();
      expect(newRow.errors?.['detailTermAfterHeader']).toBeFalsy();
    });
  });

  describe('Term Date Past Validation', () => {
    beforeEach(() => {
      component.data = mockData;
      fixture.detectChanges();
    });

    it('should invalidate term date in past for new rows', () => {
      component.createWorksheet = 'Y';
      component.onToggleEditMode();
      component.onAddNewRow();

      const newRow = component.rows.at(component.rows.length - 1) as any;
      newRow.get('terminationDate')?.setValue(moment('2024-01-01'));
      newRow.get('terminationDate')?.updateValueAndValidity();

      expect(newRow.get('terminationDate')?.errors?.['termDateInPast']).toBeTruthy();
    });
  });
});
