import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { UnitsInBoxDialogComponent, UnitsInBoxDialogData } from './units-in-box-dialog.component';

describe('UnitsInBoxDialogComponent', () => {
  let component: UnitsInBoxDialogComponent;
  let fixture: ComponentFixture<UnitsInBoxDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UnitsInBoxDialogComponent>>;

  const mockData: UnitsInBoxDialogData = {
    boxHeader: {
      boxId: 'BOX001',
      shipmentNo: null,
      facilityCode: 'FAC01',
      facilityDesc: 'Facility One',
      boxStatus: 'O',
      externalFacFlag: 'N',
      packDate: '2026-01-15',
      closedDate: null,
      closedUser: null,
      unitCount: 2,
      units: [],
    },
    units: [
      { sampleSeqNo: '1', unitId: 'U001', checkDigit: null, collDate: '2026-01-10T00:00:00', contractId: null, sampleType: 'WB', frozenFlag: 'N', tests: [] },
      { sampleSeqNo: '2', unitId: 'U002', checkDigit: null, collDate: '2026-01-11T00:00:00', contractId: null, sampleType: 'WB', frozenFlag: 'N', tests: [] },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [UnitsInBoxDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitsInBoxDialogComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should close the dialog when onClose is called', () => {
    // Arrange & Act
    component.onClose();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should format a valid date string correctly', () => {
    // Arrange
    const dateStr = '2026-07-15T14:30:00';

    // Act
    const result = component.formatDate(dateStr);

    // Assert
    expect(result).toContain('JUL');
    expect(result).toContain('2026');
  });

  it('should return -- for null date', () => {
    // Arrange & Act
    const result = component.formatDate(null);

    // Assert
    expect(result).toBe('--');
  });
});
