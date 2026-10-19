import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { YtdLossDialog } from './ytd-loss-dialog';
import { YtdLossDialogData } from '../models/donor-detail-query.model';

describe('YtdLossDialog', () => {
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<YtdLossDialog>>;

  function createComponent(data: YtdLossDialogData | null): ComponentFixture<YtdLossDialog> {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    const providers: any[] = [
      { provide: MatDialogRef, useValue: mockDialogRef },
    ];

    if (data !== null) {
      providers.push({ provide: MAT_DIALOG_DATA, useValue: data });
    }

    TestBed.configureTestingModule({
      imports: [YtdLossDialog],
      providers,
    }).overrideComponent(YtdLossDialog, {
      set: { template: '' },
    });

    const fixture = TestBed.createComponent(YtdLossDialog);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create with valid data', () => {
    const fixture = createComponent({ rbcLoss: 200, plasmaLoss: 450 });
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.rbcLoss).toBe('200');
    expect(component.plasmaLoss).toBe('450');
  });

  it('should display dash for null rbcLoss', () => {
    const fixture = createComponent({ rbcLoss: null, plasmaLoss: 450 });
    const component = fixture.componentInstance;

    expect(component.rbcLoss).toBe('—');
    expect(component.plasmaLoss).toBe('450');
  });

  it('should display dash for null plasmaLoss', () => {
    const fixture = createComponent({ rbcLoss: 200, plasmaLoss: null });
    const component = fixture.componentInstance;

    expect(component.rbcLoss).toBe('200');
    expect(component.plasmaLoss).toBe('—');
  });

  it('should handle zero values correctly (not treated as null)', () => {
    const fixture = createComponent({ rbcLoss: 0, plasmaLoss: 0 });
    const component = fixture.componentInstance;

    expect(component.rbcLoss).toBe('0');
    expect(component.plasmaLoss).toBe('0');
  });

  it('should handle no data when optional inject returns undefined', () => {
    const fixture = createComponent(null);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.rbcLoss).toBe('—');
    expect(component.plasmaLoss).toBe('—');
  });

  it('should close dialog when onClose is called', () => {
    const fixture = createComponent({ rbcLoss: 200, plasmaLoss: 450 });
    const component = fixture.componentInstance;

    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
  });
});
