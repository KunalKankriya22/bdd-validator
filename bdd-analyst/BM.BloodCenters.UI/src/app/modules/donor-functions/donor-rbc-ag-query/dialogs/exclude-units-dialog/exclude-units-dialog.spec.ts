import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ExcludeUnitsDialog,
  ExcludeUnitsDialogData,
} from './exclude-units-dialog';

describe('ExcludeUnitsDialog', () => {
  let component: ExcludeUnitsDialog;
  let fixture: ComponentFixture<ExcludeUnitsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ExcludeUnitsDialog>>;

  const mockData: ExcludeUnitsDialogData = {
    antigenCode: 'Fya',
    resultCode: '-',
    confirmDate: '2025-06-26T00:00:00Z',
    serologicalTests: [],
    molecularTests: []
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ExcludeUnitsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExcludeUnitsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should close dialog on save', () => {
    component.onSave();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });



  it('should get result badge class', () => {
    const result = component.getResultBadgeClass('+');
    expect(result).toContain('badge');
  });
});
