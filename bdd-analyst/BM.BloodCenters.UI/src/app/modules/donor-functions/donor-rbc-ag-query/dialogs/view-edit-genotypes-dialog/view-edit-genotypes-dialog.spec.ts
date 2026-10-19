import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ViewEditGenotypesDialog,
  ViewEditGenotypesDialogData,
} from './view-edit-genotypes-dialog';

describe('ViewEditGenotypesDialog', () => {
  let component: ViewEditGenotypesDialog;
  let fixture: ComponentFixture<ViewEditGenotypesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewEditGenotypesDialog>>;

  const mockData: ViewEditGenotypesDialogData = {
    donorId: 'DN30120859',
    donorName: 'BOLTON, CALVIN',
    currentGenotype: 'C+c-E-e+',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewEditGenotypesDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewEditGenotypesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with current genotype', () => {
    expect(component.genotypeControl.value).toBe(mockData.currentGenotype);
  });



  it('should be valid with 500 characters', () => {
    component.genotypeControl.setValue('A'.repeat(500));
    expect(component.genotypeControl.valid).toBe(true);
  });


});
