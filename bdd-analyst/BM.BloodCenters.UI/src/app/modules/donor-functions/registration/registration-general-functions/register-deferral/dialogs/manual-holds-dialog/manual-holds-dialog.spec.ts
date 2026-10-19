import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ManualHoldsDialog } from './manual-holds-dialog';
import {
  InterdictionCodeLookupDto,
  ManualHoldsDialogData,
  ManualHoldsDialogResult,
} from '../../models/register-deferral.model';

describe('ManualHoldsDialog', () => {
  let component: ManualHoldsDialog;
  let fixture: ComponentFixture<ManualHoldsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ManualHoldsDialog>>;

  const mockCodes: InterdictionCodeLookupDto[] = [
    { interCode: 'NOPLM', interDesc: 'Phlebotomist not properly recorded', interType: 'HOLDS' },
    { interCode: 'ARUSD', interDesc: 'Arm used not recorded', interType: 'HOLDS' },
    { interCode: 'BLTMN', interDesc: 'Bleed times not recorded', interType: 'HOLDS' },
    { interCode: 'ILBTM', interDesc: 'Illogical bleed time', interType: 'HOLDS' },
    { interCode: 'DNRSG', interDesc: 'Donor signature not recorded', interType: 'HOLDS' },
  ];

  function createComponent(data: ManualHoldsDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ManualHoldsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualHoldsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('initialization without existing holds', () => {
    beforeEach(() => {
      createComponent({ interdictionCodes: mockCodes });
    });

    it('should load all interdiction codes', () => {
      expect(component.allCodes().length).toBe(5);
    });

    it('should show all codes as filtered codes initially', () => {
      expect(component.filteredCodes().length).toBe(5);
    });

    it('should have no selected codes', () => {
      expect(component.selectedCodes().length).toBe(0);
    });

    it('should initialize search control as empty', () => {
      expect(component.searchControl.value).toBe('');
    });

    it('should define correct displayed columns', () => {
      expect(component.displayedColumns).toEqual(['code', 'description', 'interType']);
    });
  });

  describe('initialization with existing holds', () => {
    const existingHolds = [mockCodes[0], mockCodes[2]];

    beforeEach(() => {
      createComponent({ interdictionCodes: mockCodes, existingHolds });
    });

    it('should pre-select existing holds', () => {
      expect(component.selectedCodes().length).toBe(2);
      expect(component.selectedCodes()[0].interCode).toBe('NOPLM');
      expect(component.selectedCodes()[1].interCode).toBe('BLTMN');
    });

    it('should report existing holds as selected', () => {
      expect(component.isSelected(mockCodes[0])).toBeTrue();
      expect(component.isSelected(mockCodes[2])).toBeTrue();
    });

    it('should report non-existing holds as not selected', () => {
      expect(component.isSelected(mockCodes[1])).toBeFalse();
      expect(component.isSelected(mockCodes[3])).toBeFalse();
    });
  });


  describe('onFind filtering', () => {
    beforeEach(() => {
      createComponent({ interdictionCodes: mockCodes });
    });


    it('should show all codes when find is clicked with empty selection', () => {
      component.searchControl.setValue('');
      component.onFind();

      expect(component.filteredCodes().length).toBe(5);
    });


  });

  describe('toggleRow selection', () => {
    beforeEach(() => {
      createComponent({ interdictionCodes: mockCodes });
    });

    it('should select a row when toggled', () => {
      component.toggleRow(mockCodes[0]);

      expect(component.selectedCodes().length).toBe(1);
      expect(component.isSelected(mockCodes[0])).toBeTrue();
    });

    it('should deselect a row when toggled again', () => {
      component.toggleRow(mockCodes[0]);
      expect(component.isSelected(mockCodes[0])).toBeTrue();

      component.toggleRow(mockCodes[0]);
      expect(component.isSelected(mockCodes[0])).toBeFalse();
      expect(component.selectedCodes().length).toBe(0);
    });

    it('should allow multiple selections', () => {
      component.toggleRow(mockCodes[0]);
      component.toggleRow(mockCodes[2]);
      component.toggleRow(mockCodes[4]);

      expect(component.selectedCodes().length).toBe(3);
      expect(component.isSelected(mockCodes[0])).toBeTrue();
      expect(component.isSelected(mockCodes[2])).toBeTrue();
      expect(component.isSelected(mockCodes[4])).toBeTrue();
    });

    it('should deselect only the toggled row', () => {
      component.toggleRow(mockCodes[0]);
      component.toggleRow(mockCodes[1]);
      component.toggleRow(mockCodes[2]);

      component.toggleRow(mockCodes[1]);

      expect(component.selectedCodes().length).toBe(2);
      expect(component.isSelected(mockCodes[0])).toBeTrue();
      expect(component.isSelected(mockCodes[1])).toBeFalse();
      expect(component.isSelected(mockCodes[2])).toBeTrue();
    });
  });


  describe('onCancel', () => {
    beforeEach(() => {
      createComponent({ interdictionCodes: mockCodes });
    });


    it('should discard selections on cancel', () => {
      component.toggleRow(mockCodes[0]);
      component.toggleRow(mockCodes[1]);

      component.onCancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        action: 'cancel',
      } as ManualHoldsDialogResult);
    });
  });
});
