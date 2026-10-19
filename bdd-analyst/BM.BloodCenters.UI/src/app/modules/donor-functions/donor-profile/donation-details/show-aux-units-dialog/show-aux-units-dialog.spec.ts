import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject, NEVER } from 'rxjs';
import { ShowAuxUnitsDialogComponent } from './show-aux-units-dialog';
import { DonationDetailsApiService } from '../services/donation-details-api.service';

describe('ShowAuxUnitsDialogComponent', () => {
  let component: ShowAuxUnitsDialogComponent;
  let fixture: ComponentFixture<ShowAuxUnitsDialogComponent>;
  let dialogRefSpy: { close: jest.Mock };

  const mockAuxDonations = [
    {
      unitId: 'AUX001',
      displayUnitId: 'AUX001-CHECK',
      collDate: '2025-01-10',
      donorId: 'D001',
      locationId: 'LOC1',
      sponsorId: 'SP1',
      oldDonorId: null,
      bagType: 'WB',
      startTime: null,
      category: null,
    },
    {
      unitId: 'AUX002',
      displayUnitId: null,
      collDate: '2025-02-15',
      donorId: 'D001',
      locationId: null,
      sponsorId: null,
      oldDonorId: null,
      bagType: null,
      startTime: null,
      category: null,
    },
  ];

  const mockApiService = {
    getAuxDonations: jest.fn().mockReturnValue(of({ success: true, data: mockAuxDonations })),
  };

  beforeEach(async () => {
    dialogRefSpy = { close: jest.fn() };
    mockApiService.getAuxDonations.mockReturnValue(of({ success: true, data: mockAuxDonations }));

    await TestBed.configureTestingModule({
      imports: [ShowAuxUnitsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            donorId: 'D001',
            donorInfo: { name: 'TEST DONOR', dateOfBirth: '1990-01-15', sex: 'Male', abo: 'O+' },
            totalDonationCredits: 5,
          },
        },
        { provide: DonationDetailsApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load aux donations on init', () => {
    expect(mockApiService.getAuxDonations).toHaveBeenCalledWith('D001');
    expect(component.auxDonations().length).toBe(2);
  });

  it('should display displayUnitId when available (Fix 3.8)', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('td');
    const cellTexts = Array.from(rows).map((c: any) => c.textContent.trim());
    expect(cellTexts).toContain('AUX001-CHECK');
  });

  it('should fall back to unitId when displayUnitId is null (Fix 3.8)', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('td');
    const cellTexts = Array.from(rows).map((c: any) => c.textContent.trim());
    expect(cellTexts).toContain('AUX002');
  });

  it('should compute unit count', () => {
    expect(component.unitCount()).toBe(2);
  });

  it('should format dates correctly', () => {
    expect(component.formatDate('2025-01-10')).toBe('10-JAN-2025');
    expect(component.formatDate(null)).toBe('-');
  });

  it('should set loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('should handle API error', () => {
    mockApiService.getAuxDonations.mockReturnValue(throwError(() => new Error('fail')));
    const errorFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    errorFixture.detectChanges();
    expect(errorFixture.componentInstance.loading()).toBe(false);
    errorFixture.destroy();
  });

  it('should close dialog on back', () => {
    component.onBack();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close dialog with closeAll on close', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
  });

  it('should display donor info fields', () => {
    const labels = fixture.nativeElement.querySelectorAll('.label');
    const labelTexts = Array.from(labels).map((l: any) => l.textContent.trim());
    expect(labelTexts).toContain('Name');
    expect(labelTexts).toContain('Total Donation Credits');
  });

  it('should show empty state when no aux donations', () => {
    mockApiService.getAuxDonations.mockReturnValue(of({ success: true, data: [] }));
    const emptyFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    emptyFixture.detectChanges();
    const emptyState = emptyFixture.nativeElement.querySelector('.empty-state');
    expect(emptyState?.textContent?.trim()).toBe('No AUX units found');
    emptyFixture.destroy();
  });

  it('should have correct displayed columns', () => {
    expect(component.displayedColumns).toEqual(['unitId', 'collDate']);
  });

  it('should default auxDonations to empty array when response.data is null', () => {
    mockApiService.getAuxDonations.mockReturnValue(of({ success: true, data: null }));
    const nullFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    nullFixture.detectChanges();
    expect(nullFixture.componentInstance.auxDonations()).toEqual([]);
    expect(nullFixture.componentInstance.loading()).toBe(false);
    nullFixture.destroy();
  });

  it('should default auxDonations to empty array when response.data is undefined', () => {
    mockApiService.getAuxDonations.mockReturnValue(of({ success: true }));
    const undefFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    undefFixture.detectChanges();
    expect(undefFixture.componentInstance.auxDonations()).toEqual([]);
    expect(undefFixture.componentInstance.loading()).toBe(false);
    undefFixture.destroy();
  });

  it('should have loading as true before API responds', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAuxDonations.mockReturnValue(apiSubject.asObservable());
    const pendingFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    pendingFixture.detectChanges();
    expect(pendingFixture.componentInstance.loading()).toBe(true);
    apiSubject.next({ success: true, data: mockAuxDonations });
    expect(pendingFixture.componentInstance.loading()).toBe(false);
    pendingFixture.destroy();
  });

  it('should return unitCount of 0 when auxDonations is empty', () => {
    mockApiService.getAuxDonations.mockReturnValue(of({ success: true, data: [] }));
    const emptyFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    emptyFixture.detectChanges();
    expect(emptyFixture.componentInstance.unitCount()).toBe(0);
    emptyFixture.destroy();
  });

  it('should return dash for empty string in formatDate', () => {
    expect(component.formatDate('' as any)).toBe('-');
  });

  it('should format dates for all months', () => {
    expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    expect(component.formatDate('2025-02-10')).toBe('10-FEB-2025');
    expect(component.formatDate('2025-03-05')).toBe('05-MAR-2025');
    expect(component.formatDate('2025-04-20')).toBe('20-APR-2025');
    expect(component.formatDate('2025-05-01')).toBe('01-MAY-2025');
    expect(component.formatDate('2025-06-30')).toBe('30-JUN-2025');
    expect(component.formatDate('2025-07-04')).toBe('04-JUL-2025');
    expect(component.formatDate('2025-08-25')).toBe('25-AUG-2025');
    expect(component.formatDate('2025-09-12')).toBe('12-SEP-2025');
    expect(component.formatDate('2025-10-31')).toBe('31-OCT-2025');
    expect(component.formatDate('2025-11-11')).toBe('11-NOV-2025');
    expect(component.formatDate('2025-12-25')).toBe('25-DEC-2025');
  });

  it('should pad single-digit days with a leading zero', () => {
    expect(component.formatDate('2025-03-01')).toBe('01-MAR-2025');
    expect(component.formatDate('2025-07-09')).toBe('09-JUL-2025');
  });

  it('should unsubscribe from API call when component is destroyed before response', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAuxDonations.mockReturnValue(apiSubject.asObservable());
    const destroyFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    destroyFixture.detectChanges();
    expect(destroyFixture.componentInstance.loading()).toBe(true);
    destroyFixture.destroy();
    apiSubject.next({ success: true, data: mockAuxDonations });
    expect(destroyFixture.componentInstance.auxDonations()).toEqual([]);
    expect(destroyFixture.componentInstance.loading()).toBe(true);
  });

  it('should keep auxDonations empty on API error', () => {
    mockApiService.getAuxDonations.mockReturnValue(throwError(() => new Error('server error')));
    const errFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    errFixture.detectChanges();
    expect(errFixture.componentInstance.auxDonations()).toEqual([]);
    expect(errFixture.componentInstance.unitCount()).toBe(0);
    errFixture.destroy();
  });

  it('should call getAuxDonations with the donorId from dialog data', () => {
    mockApiService.getAuxDonations.mockClear();
    mockApiService.getAuxDonations.mockReturnValue(of({ success: true, data: [] }));
    const callFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    callFixture.detectChanges();
    expect(mockApiService.getAuxDonations).toHaveBeenCalledTimes(1);
    expect(mockApiService.getAuxDonations).toHaveBeenCalledWith('D001');
    callFixture.destroy();
  });

  it('should show spinner while loading and table after loaded', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAuxDonations.mockReturnValue(apiSubject.asObservable());
    const spinnerFixture = TestBed.createComponent(ShowAuxUnitsDialogComponent);
    spinnerFixture.detectChanges();

    expect(spinnerFixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
    expect(spinnerFixture.nativeElement.querySelector('table')).toBeFalsy();

    apiSubject.next({ success: true, data: mockAuxDonations });
    spinnerFixture.detectChanges();

    expect(spinnerFixture.nativeElement.querySelector('mat-spinner')).toBeFalsy();
    expect(spinnerFixture.nativeElement.querySelector('table')).toBeTruthy();
    spinnerFixture.destroy();
  });

  it('should expose dialog data', () => {
    expect(component.data.donorId).toBe('D001');
    expect(component.data.donorInfo?.name).toBe('TEST DONOR');
    expect(component.data.totalDonationCredits).toBe(5);
  });

  it('should render donor info values in the template', () => {
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelectorAll('.value');
    const valueTexts: string[] = Array.from(values).map((v: any) => v.textContent.trim());
    expect(valueTexts).toContain('TEST DONOR');
    expect(valueTexts).toContain('Male');
    expect(valueTexts).toContain('O+');
    expect(valueTexts).toContain('5');
  });

  it('should render date of birth formatted in donor info section', () => {
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelectorAll('.value');
    const valueTexts: string[] = Array.from(values).map((v: any) => v.textContent.trim());
    expect(valueTexts).toContain('15-JAN-1990');
  });

  it('should render collection dates in the table', () => {
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('td');
    const cellTexts: string[] = Array.from(cells).map((c: any) => c.textContent.trim());
    expect(cellTexts).toContain('10-JAN-2025');
    expect(cellTexts).toContain('15-FEB-2025');
  });

  it('should show unit count in the header', () => {
    fixture.detectChanges();
    const headerCells = fixture.nativeElement.querySelectorAll('th');
    const headerTexts: string[] = Array.from(headerCells).map((h: any) => h.textContent.trim());
    expect(headerTexts.some((t: string) => t.includes('2'))).toBe(true);
  });
});
