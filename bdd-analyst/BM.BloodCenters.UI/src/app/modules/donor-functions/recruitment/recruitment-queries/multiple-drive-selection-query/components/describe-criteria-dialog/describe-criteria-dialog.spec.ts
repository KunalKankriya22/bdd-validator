import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DescribeCriteriaDialog, DescribeCriteriaDialogData } from './describe-criteria-dialog';

describe('DescribeCriteriaDialog', () => {
  let component: DescribeCriteriaDialog;
  let fixture: ComponentFixture<DescribeCriteriaDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DescribeCriteriaDialog>>;
  const data: DescribeCriteriaDialogData = {
    criteriaList: ['Criterion A', 'Criterion B']
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DescribeCriteriaDialog, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DescribeCriteriaDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render criteria list items', () => {
    const items = fixture.nativeElement.querySelectorAll('.criteria-list li');
    expect(items.length).toBe(2);
    expect(items[0].textContent?.trim()).toBe('Criterion A');
    expect(items[1].textContent?.trim()).toBe('Criterion B');
  });


});
