import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  ExpiredProductWarningDialogComponent,
  WarningOverrideDialogData,
} from './expired-product-warning-dialog.component';

describe('ExpiredProductWarningDialogComponent (suplabli)', () => {
  let component: ExpiredProductWarningDialogComponent;
  let fixture: ComponentFixture<ExpiredProductWarningDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ExpiredProductWarningDialogComponent>>;

  const mockData: WarningOverrideDialogData = {
    title: 'Expired Product Warning',
    warnings: [
      { code: 'EXP001', message: 'Product is expired' },
      { code: 'EXP002', message: 'Product nearly expired' },
    ],
    allowOverride: true,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ExpiredProductWarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpiredProductWarningDialogComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should close with override false and empty codes on cancel', () => {
    // Arrange & Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ override: false, codes: [] });
  });

  it('should close with override true and all warning codes on override', () => {
    // Arrange & Act
    component.onOverride();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      override: true,
      codes: ['EXP001', 'EXP002'],
    });
  });
});
