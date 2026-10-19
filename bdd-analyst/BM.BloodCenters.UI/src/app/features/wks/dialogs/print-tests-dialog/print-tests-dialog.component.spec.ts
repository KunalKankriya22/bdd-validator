import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrintTestsDialogComponent } from './print-tests-dialog.component';
import { PrintTestsDialogData, TestBatchDetailDto } from '../../wks.models';

describe('PrintTestsDialogComponent', () => {
  let component: PrintTestsDialogComponent;
  let fixture: ComponentFixture<PrintTestsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PrintTestsDialogComponent>>;

  const mockTests: TestBatchDetailDto[] = [
    {
      testId: 'HIV-1/2',
      testKitId: '3038-CMV',
      testDesc: 'HIV-1/2 COMBO TEST',
      testGroup: 'BLOOD',
    },
    {
      testId: 'E',
      testKitId: '3038-CMV',
      testDesc: 'E Antigen',
      testGroup: 'BLOOD',
    },
    {
      testId: 'HBC',
      testKitId: null,
      testDesc: 'HBC Antibody',
      testGroup: 'BLOOD',
    },
  ];

  const mockDialogData: PrintTestsDialogData = {
    tests: mockTests,
    tbId: '2026-1234-TB',
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [PrintTestsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(PrintTestsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize with test data from dialog data', () => {
      expect(component.tests().length).toBe(3);
      expect(component.tests()[0].testId).toBe('HIV-1/2');
      expect(component.tests()[1].testId).toBe('E');
      expect(component.tests()[2].testId).toBe('HBC');
    });

    it('should display "–" for missing test kits', () => {
      const hbcTest = component.tests()[2];
      expect(hbcTest.testKit).toBe('–');
    });


  });

  describe('Search Functionality', () => {




    it('should filter tests by test kit', () => {
      component.searchControl.setValue('3038-CMV');
      fixture.detectChanges();

      const filtered = component.filteredTests();
      expect(filtered.length).toBe(2);
    });






  });
  describe('Checkbox Labels', () => {
    it('should return select all label when no selection', () => {
      const label = component.checkboxLabel();
      expect(label).toContain('select all');
    });

    it('should return deselect all label when all selected', () => {
      component.toggleAllRows();
      const label = component.checkboxLabel();
      expect(label).toContain('deselect all');
    });

    it('should return row-specific label for individual checkbox', () => {
      const row = component.tests()[0];
      const label = component.checkboxLabel(row);
      expect(label).toContain('select row for HIV-1/2');
    });

    it('should return deselect label for selected row', () => {
      const row = component.tests()[0];
      component.selection.toggle(row);
      const label = component.checkboxLabel(row);
      expect(label).toContain('deselect row for HIV-1/2');
    });
  });
  describe('Unique ID Generation', () => {
    it('should generate unique component ID', () => {
      expect(component.componentId).toMatch(/^print-tests-dialog-\d+$/);
    });




  });
});
