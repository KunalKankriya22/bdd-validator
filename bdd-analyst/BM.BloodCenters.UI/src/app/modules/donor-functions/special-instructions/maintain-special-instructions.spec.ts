import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { MaintainSpecialInstructionsComponent } from './maintain-special-instructions';
import { MaintainSpecialInstructionsService } from './services/maintain-special-instructions.service';
import { SpecialInstructionDropdownItem } from './models/maintain-special-instructions.models';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

class MenuServiceMock {
  private _signal = signal<any[]>([]);
  getMenuItemsSignal = () => this._signal;
  findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(null);
}

class HeaderServiceMock {
  chapterChanged$ = new Subject<void>().asObservable();
}

describe('MaintainSpecialInstructionsComponent', () => {
  let component: MaintainSpecialInstructionsComponent;
  let fixture: ComponentFixture<MaintainSpecialInstructionsComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainSpecialInstructionsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockDropdownOptions: SpecialInstructionDropdownItem[] = [
    { specialInstruction: 'A0031', description: 'Autologous Donation' },
    { specialInstruction: 'A0032', description: 'Test' },
    { specialInstruction: 'EXTRA', description: 'Draw Extra Tube for Testing Donor Under 19' },
  ];

  const mockLines = [
    { lineNumber: 1, lineText: ' - Draw 2 Red top tubes' },
    { lineNumber: 2, lineText: ' - Draw 2 Purple tubes' },
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainSpecialInstructionsService', [
      'getDropdownValues',
      'getLinesByLabelCode',
      'saveLines',
      'saveAll',
      'deleteLine',
    ]);
    snackBarSpy = createMockMatSnackBar();

    serviceSpy.getDropdownValues.and.returnValue(of(mockDropdownOptions));



      TestBed.configureTestingModule({
      imports: [MaintainSpecialInstructionsComponent, NoopAnimationsModule],
      providers: [
        { provide: MaintainSpecialInstructionsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MenuService, useClass: MenuServiceMock },
        { provide: HeaderService, useClass: HeaderServiceMock },
      ],
    });


    


      serviceSpy.getDropdownValues.calls.reset();


      serviceSpy.getLinesByLabelCode.calls.reset();


      serviceSpy.saveLines.calls.reset();


      serviceSpy.saveAll.calls.reset();


      serviceSpy.deleteLine.calls.reset();


      serviceSpy.getDropdownValues.and.returnValue(of(mockDropdownOptions));


    fixture = TestBed.createComponent(MaintainSpecialInstructionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ── Initialization ──────────────────────────────────────────────────────
  describe('Initialization', () => {






    it('should not show the table initially', () => {
      expect(component.hasRetrieved()).toBeFalse();
      expect(component.rows().length).toBe(0);
    });
  });

  // ── Dropdown ────────────────────────────────────────────────────────────
  describe('Dropdown', () => {
    it('canRetrieve should be false when no instruction is selected', () => {
      expect(component.canRetrieve()).toBeFalse();
    });

    it('canRetrieve should be true after instruction is selected', () => {
      component.onSelectionChange(mockDropdownOptions[0]);
      expect(component.canRetrieve()).toBeTrue();
    });

    it('should update description when an instruction is selected', () => {
      component.onSelectionChange(mockDropdownOptions[0]);
      expect(component.getDescription()).toBe('Autologous Donation');
    });

    it('should show "-" as description when nothing selected', () => {
      expect(component.getDescription()).toBe('-');
    });






  });

  // ── Retrieve ────────────────────────────────────────────────────────────
  describe('onRetrieve()', () => {
    beforeEach(() => {
      component.onSelectionChange(mockDropdownOptions[0]);
    });



    it('should call API with selected label code', () => {
      serviceSpy.getLinesByLabelCode.and.returnValue(of(mockLines));
      component.onRetrieve();
      expect(serviceSpy.getLinesByLabelCode).toHaveBeenCalledWith('A0031');
    });

    it('should populate rows and set hasRetrieved on success', () => {
      serviceSpy.getLinesByLabelCode.and.returnValue(of(mockLines));
      component.onRetrieve();
      expect(component.hasRetrieved()).toBeTrue();
      expect(component.rows().length).toBe(2);
      expect(component.rows()[0].lineText).toBe(' - Draw 2 Red top tubes');
    });

    it('should assign sequential line numbers', () => {
      serviceSpy.getLinesByLabelCode.and.returnValue(of(mockLines));
      component.onRetrieve();
      component.rows().forEach((row, i) => {
        expect(row.lineNumber).toBe(i + 1);
      });
    });



    it('should reset loading to false after error', () => {
      serviceSpy.getLinesByLabelCode.and.returnValue(throwError(() => new Error('fail')));
      component.onRetrieve();
      expect(component.loading()).toBeFalse();
    });
  });

  // ── Table operations ────────────────────────────────────────────────────
  describe('Table operations', () => {
    beforeEach(() => {
      component.onSelectionChange(mockDropdownOptions[0]);
      serviceSpy.getLinesByLabelCode.and.returnValue(of(mockLines));
      component.onRetrieve();
    });

    describe('onDeleteRow()', () => {
      it('should call deleteLine API immediately for existing row', () => {
        serviceSpy.deleteLine.and.returnValue(of(undefined));
        serviceSpy.getLinesByLabelCode.and.returnValue(of([mockLines[1]]));
        component.onDeleteRow(0);
        expect(serviceSpy.deleteLine).toHaveBeenCalledWith(
          'A0031',
          1,
          ' - Draw 2 Red top tubes',
        );
      });



      it('should remove new row locally without calling API', () => {
        component.onAddNew();
        const newRowIndex = component.rows().length - 1;
        component.onDeleteRow(newRowIndex);
        expect(serviceSpy.deleteLine).not.toHaveBeenCalled();
        expect(component.rows().length).toBe(2);
      });

      it('should renumber rows after local removal of new row', () => {
        component.onAddNew();
        component.onDeleteRow(component.rows().length - 1);
        component.rows().forEach((row, i) => {
          expect(row.lineNumber).toBe(i + 1);
        });
      });




    });



    it('should not add more than 9 rows', () => {
      for (let i = 0; i < 10; i++) component.onAddNew();
      expect(component.rows().length).toBeLessThanOrEqual(9);
    });

    it('canAddNew should be false at max lines', () => {
      for (let i = 0; i < 7; i++) component.onAddNew();
      expect(component.canAddNew()).toBeFalse();
    });

    it('should update line text on change', () => {
      component.onLineTextChange(0, 'Updated text');
      expect(component.rows()[0].lineText).toBe('Updated text');
    });

    it('should mark existing row as dirty when text differs from original', () => {
      component.onLineTextChange(0, 'Changed text');
      expect(component.rows()[0].isDirty).toBeTrue();
    });

    it('should not mark row as dirty when text matches original', () => {
      component.onLineTextChange(0, ' - Draw 2 Red top tubes');
      expect(component.rows()[0].isDirty).toBeFalse();
    });

    it('hasChanges should be true when a row is dirty', () => {
      component.onLineTextChange(0, 'Changed');
      expect(component.hasChanges()).toBeTrue();
    });

    it('hasChanges should be true when a new row is added', () => {
      component.onAddNew();
      expect(component.hasChanges()).toBeTrue();
    });

    it('hasChanges should be false when no rows are new or dirty', () => {
      expect(component.hasChanges()).toBeFalse();
    });
  });

  // ── Save ────────────────────────────────────────────────────────────────
  describe('onSave()', () => {
    beforeEach(() => {
      component.onSelectionChange(mockDropdownOptions[0]);
      serviceSpy.getLinesByLabelCode.and.returnValue(of(mockLines));
      component.onRetrieve();
    });





    it('should exclude blank rows from payload', () => {
      serviceSpy.saveAll.and.returnValue(of(undefined));
      serviceSpy.getLinesByLabelCode.and.returnValue(of([]));
      component.onAddNew();
      component.onLineTextChange(0, 'Updated');
      component.onSave();
      const call = serviceSpy.saveAll.calls.mostRecent().args[0];
      expect(call.lines.every((l: any) => l.lineText.trim().length > 0)).toBeTrue();
    });



    it('should trim line text before saving', () => {
      serviceSpy.saveAll.and.returnValue(of(undefined));
      serviceSpy.getLinesByLabelCode.and.returnValue(of([]));
      component.onLineTextChange(0, '  padded  ');
      component.onSave();
      const call = serviceSpy.saveAll.calls.mostRecent().args[0];
      expect(call.lines[0].lineText).toBe('padded');
    });



    it('should re-fetch rows after successful save', () => {
      serviceSpy.saveAll.and.returnValue(of(undefined));
      serviceSpy.getLinesByLabelCode.and.returnValue(of([]));
      component.onLineTextChange(0, 'Updated');
      component.onSave();
      expect(serviceSpy.getLinesByLabelCode).toHaveBeenCalledTimes(2);
    });



    it('should reset saving flag after error', () => {
      serviceSpy.saveAll.and.returnValue(throwError(() => new Error('fail')));
      component.onLineTextChange(0, 'Updated');
      component.onSave();
      expect(component.saving()).toBeFalse();
    });
  });

  // ── Alert ────────────────────────────────────────────────────────────────
  describe('Alert', () => {
    it('should dismiss alert', () => {
      component.onDismissAlert();
      expect(component.alertDismissed()).toBeTrue();
    });
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
});
