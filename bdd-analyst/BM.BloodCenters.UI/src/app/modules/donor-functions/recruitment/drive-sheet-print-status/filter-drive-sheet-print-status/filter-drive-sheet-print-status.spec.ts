import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilterDriveSheetPrintStatusComponent } from './filter-drive-sheet-print-status';

describe('FilterDriveSheetPrintStatusComponent', () => {
  let component: FilterDriveSheetPrintStatusComponent;
  let fixture: ComponentFixture<FilterDriveSheetPrintStatusComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<FilterDriveSheetPrintStatusComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        FilterDriveSheetPrintStatusComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterDriveSheetPrintStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('should clear all filters on clear all click', () => {
    component.filterForm.patchValue({
      status: 'Confirm',
      driveDate: new Date()
    });

    component.onClearAll();

    expect(component.filterForm.get('status')?.value).toBe('');
    expect(component.filterForm.get('driveDate')?.value).toBeNull();
  });

  it('should close dialog with filters on apply', () => {
    component.filterForm.patchValue({
      status: 'Confirm'
    });

    component.onApply();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'Confirm' })
    );
  });
});
