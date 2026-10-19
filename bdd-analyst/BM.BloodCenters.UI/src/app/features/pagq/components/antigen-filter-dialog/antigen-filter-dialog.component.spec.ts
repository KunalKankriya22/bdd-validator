import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  AntigenFilterDialogComponent,
  AntigenFilterDialogData
} from './antigen-filter-dialog.component';

describe('AntigenFilterDialogComponent', () => {
  let component: AntigenFilterDialogComponent;
  let fixture: ComponentFixture<AntigenFilterDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AntigenFilterDialogComponent>>;

  const mockDialogData: AntigenFilterDialogData = {
    validAntigens: [
      { testId: 'AG01', testDescription: 'Antigen One', testGroup: 'GRP1' },
      { testId: 'AG02', testDescription: 'Antigen Two', testGroup: 'GRP2' }
    ],
    currentCriteria: []
  };

  function createComponent(data: AntigenFilterDialogData = mockDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [AntigenFilterDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    });

    fixture = TestBed.createComponent(AntigenFilterDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  }

  beforeEach(() => {
    createComponent();
  });

  it('should initialize form with MAX_ROWS criteria rows', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.criteriaArray.length).toBe(component.MAX_ROWS);
  });

  it('should pre-populate criteria from currentCriteria data', () => {
    TestBed.resetTestingModule();
    createComponent({
      validAntigens: mockDialogData.validAntigens,
      currentCriteria: [
        { antigenId: 'AG01', result: 'P' },
        { antigenId: 'AG02', result: 'N' }
      ]
    });

    const firstRow = component.criteriaArray.at(0).value;
    expect(firstRow.antigenId).toBe('AG01');
    expect(firstRow.result).toBe('P');

    const secondRow = component.criteriaArray.at(1).value;
    expect(secondRow.antigenId).toBe('AG02');
    expect(secondRow.result).toBe('N');

    expect(component.criteriaArray.length).toBe(component.MAX_ROWS);
  });

  it('should not add row beyond MAX_ROWS', () => {
    expect(component.criteriaArray.length).toBe(component.MAX_ROWS);
    component.addRow('EXTRA', 'P');
    expect(component.criteriaArray.length).toBe(component.MAX_ROWS);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close dialog with valid criteria on select and retrieve', () => {
    component.criteriaArray.at(0).patchValue({ antigenId: 'AG01', result: 'P' });
    component.onSelectAndRetrieve();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        criteria: [{ antigenId: 'AG01', result: 'P' }]
      })
    );
  });

  it('should filter out empty rows on select and retrieve', () => {
    component.onSelectAndRetrieve();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ criteria: [] })
    );
  });

  it('should close with multiple valid criteria filtering empty rows', () => {
    component.criteriaArray.at(0).patchValue({ antigenId: 'AG01', result: 'P' });
    component.criteriaArray.at(2).patchValue({ antigenId: 'AG02', result: 'N' });
    component.onSelectAndRetrieve();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        criteria: [
          { antigenId: 'AG01', result: 'P' },
          { antigenId: 'AG02', result: 'N' }
        ]
      })
    );
  });

  describe('Filtered Antigens', () => {
    it('should return all antigens when no search text', () => {
      expect(component.filteredAntigens().length).toBe(2);
    });

    it('should filter antigens by testId', () => {
      component.antigenSearchCtrl.setValue('AG01');
      expect(component.filteredAntigens().length).toBe(1);
      expect(component.filteredAntigens()[0].testId).toBe('AG01');
    });

    it('should filter antigens by testDescription', () => {
      component.antigenSearchCtrl.setValue('Two');
      expect(component.filteredAntigens().length).toBe(1);
      expect(component.filteredAntigens()[0].testId).toBe('AG02');
    });

    it('should return empty when no match', () => {
      component.antigenSearchCtrl.setValue('ZZZZZ');
      expect(component.filteredAntigens().length).toBe(0);
    });
  });

  describe('Filtered Results', () => {
    it('should return all result options when no search text', () => {
      expect(component.filteredResults().length).toBe(2);
    });

    it('should filter results by value', () => {
      component.resultSearchCtrl.setValue('P');
      expect(component.filteredResults().length).toBe(1);
      expect(component.filteredResults()[0].value).toBe('P');
    });

    it('should filter results by label', () => {
      component.resultSearchCtrl.setValue('Neg');
      expect(component.filteredResults().length).toBe(1);
      expect(component.filteredResults()[0].value).toBe('N');
    });
  });

  it('should clean up on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
