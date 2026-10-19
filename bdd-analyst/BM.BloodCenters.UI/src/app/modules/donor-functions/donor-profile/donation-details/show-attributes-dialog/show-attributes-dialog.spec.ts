import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { ShowAttributesDialogComponent } from './show-attributes-dialog';
import { DonationDetailsApiService } from '../services/donation-details-api.service';

describe('ShowAttributesDialogComponent', () => {
  let component: ShowAttributesDialogComponent;
  let fixture: ComponentFixture<ShowAttributesDialogComponent>;
  let dialogRefSpy: { close: jest.Mock };

  const mockAttributes = [
    { attribCode: 'ABO', attribValue: 'A+', attribDesc: 'ABO Blood Type', insertUser: 'admin', insertDate: '2025-01-10' },
    { attribCode: 'RH', attribValue: 'POS', attribDesc: 'Rh Factor', insertUser: 'admin', insertDate: '2025-01-10' },
  ];

  const mockApiService = {
    getAttributes: jest.fn().mockReturnValue(of({ success: true, data: mockAttributes })),
  };

  beforeEach(async () => {
    dialogRefSpy = { close: jest.fn() };
    mockApiService.getAttributes.mockReturnValue(of({ success: true, data: mockAttributes }));

    await TestBed.configureTestingModule({
      imports: [ShowAttributesDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            transactionId: 'TXN001',
            unitId: 'U001',
            donorInfo: { name: 'TEST DONOR', dateOfBirth: '1990-01-15', sex: 'Male', abo: 'O+' },
            totalDonationCredits: 5,
          },
        },
        { provide: DonationDetailsApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowAttributesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load attributes on init', () => {
    expect(mockApiService.getAttributes).toHaveBeenCalledWith('TXN001');
    expect(component.attributes().length).toBe(2);
  });

  it('should include attribDesc in displayed columns (Fix 3.5)', () => {
    expect(component.displayedColumns).toContain('attribDesc');
    expect(component.displayedColumns).toEqual(['attribCode', 'attribValue', 'attribDesc', 'insertUser', 'insertDate']);
  });

  it('should render Description column header', () => {
    const headers = fixture.nativeElement.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
    expect(headerTexts).toContain('Description');
  });

  it('should render attribDesc values in rows', () => {
    const cells = fixture.nativeElement.querySelectorAll('td');
    const cellTexts = Array.from(cells).map((c: any) => c.textContent.trim());
    expect(cellTexts).toContain('ABO Blood Type');
    expect(cellTexts).toContain('Rh Factor');
  });

  it('should format dates correctly', () => {
    expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    expect(component.formatDate(null)).toBe('-');
  });

  it('should set loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('should handle API error', () => {
    mockApiService.getAttributes.mockReturnValue(throwError(() => new Error('fail')));
    const errorFixture = TestBed.createComponent(ShowAttributesDialogComponent);
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
    expect(labelTexts).toContain('Unit ID');
  });

  it('should show empty state when no attributes', () => {
    mockApiService.getAttributes.mockReturnValue(of({ success: true, data: [] }));
    const emptyFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    emptyFixture.detectChanges();
    const emptyState = emptyFixture.nativeElement.querySelector('.empty-state');
    expect(emptyState?.textContent?.trim()).toBe('No attributes found');
    emptyFixture.destroy();
  });

  // --- Branch coverage: response.data ?? [] when data is null ---
  it('should default to empty array when response.data is null', () => {
    mockApiService.getAttributes.mockReturnValue(of({ success: true, data: null }));
    const nullFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    nullFixture.detectChanges();
    expect(nullFixture.componentInstance.attributes()).toEqual([]);
    expect(nullFixture.componentInstance.loading()).toBe(false);
    nullFixture.destroy();
  });

  // --- Branch coverage: response.data ?? [] when data is undefined ---
  it('should default to empty array when response.data is undefined', () => {
    mockApiService.getAttributes.mockReturnValue(of({ success: true }));
    const undefinedFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    undefinedFixture.detectChanges();
    expect(undefinedFixture.componentInstance.attributes()).toEqual([]);
    expect(undefinedFixture.componentInstance.loading()).toBe(false);
    undefinedFixture.destroy();
  });

  // --- Branch coverage: formatDate with empty string (falsy but not null) ---
  it('should return dash for empty string dateStr', () => {
    expect(component.formatDate('')).toBe('-');
  });

  // --- Function coverage: ngOnDestroy cleans up subscriptions ---
  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySub = (component as any).destroy$ as Subject<void>;
    const nextSpy = jest.spyOn(destroySub, 'next');
    const completeSpy = jest.spyOn(destroySub, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // --- Edge case: takeUntil cancels in-flight request on destroy ---
  it('should cancel pending API call when component is destroyed before response', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAttributes.mockReturnValue(apiSubject.asObservable());

    const destroyFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    const destroyComponent = destroyFixture.componentInstance;
    destroyFixture.detectChanges();

    // loading should still be true since subject has not emitted
    expect(destroyComponent.loading()).toBe(true);

    // destroy before emitting
    destroyFixture.destroy();

    // emit after destroy - should NOT update the component
    apiSubject.next({ success: true, data: mockAttributes });
    apiSubject.complete();

    // loading should still be true since the subscription was cancelled
    expect(destroyComponent.loading()).toBe(true);
    expect(destroyComponent.attributes()).toEqual([]);
  });

  // --- Loading spinner shown while loading ---
  it('should show spinner while loading and hide table', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAttributes.mockReturnValue(apiSubject.asObservable());

    const loadingFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    loadingFixture.detectChanges();

    const spinner = loadingFixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();

    const table = loadingFixture.nativeElement.querySelector('table');
    expect(table).toBeFalsy();

    // Now resolve the API call
    apiSubject.next({ success: true, data: mockAttributes });
    apiSubject.complete();
    loadingFixture.detectChanges();

    const spinnerAfter = loadingFixture.nativeElement.querySelector('mat-spinner');
    expect(spinnerAfter).toBeFalsy();

    const tableAfter = loadingFixture.nativeElement.querySelector('table');
    expect(tableAfter).toBeTruthy();

    loadingFixture.destroy();
  });

  // --- formatDate: cover all 12 months ---
  it('should format dates for all months correctly', () => {
    const expectedMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    expectedMonths.forEach((month, index) => {
      const monthStr = String(index + 1).padStart(2, '0');
      const result = component.formatDate(`2025-${monthStr}-15`);
      expect(result).toBe(`15-${month}-2025`);
    });
  });

  // --- formatDate: single-digit day padding ---
  it('should pad single-digit days with leading zero', () => {
    expect(component.formatDate('2025-03-05')).toBe('05-MAR-2025');
  });

  // --- Injected data is accessible ---
  it('should have injected dialog data accessible', () => {
    expect(component.data.transactionId).toBe('TXN001');
    expect(component.data.unitId).toBe('U001');
    expect(component.data.donorInfo?.name).toBe('TEST DONOR');
    expect(component.data.totalDonationCredits).toBe(5);
  });

  // --- Error path: attributes remain empty after error ---
  it('should keep attributes as empty array on API error', () => {
    mockApiService.getAttributes.mockReturnValue(throwError(() => new Error('network error')));
    const errorFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    errorFixture.detectChanges();
    expect(errorFixture.componentInstance.attributes()).toEqual([]);
    expect(errorFixture.componentInstance.loading()).toBe(false);
    errorFixture.destroy();
  });

  // --- Template: donor info values rendered ---
  it('should render donor info values in the template', () => {
    const values = fixture.nativeElement.querySelectorAll('.value');
    const valueTexts = Array.from(values).map((v: any) => v.textContent.trim());
    expect(valueTexts).toContain('TEST DONOR');
    expect(valueTexts).toContain('U001');
    expect(valueTexts).toContain('TXN001');
    expect(valueTexts).toContain('Male');
    expect(valueTexts).toContain('O+');
    expect(valueTexts).toContain('5');
  });

  // --- Template: all column headers rendered ---
  it('should render all expected column headers', () => {
    const headers = fixture.nativeElement.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
    expect(headerTexts).toContain('Attribute');
    expect(headerTexts).toContain('Value');
    expect(headerTexts).toContain('Description');
    expect(headerTexts).toContain('Ins User');
    expect(headerTexts).toContain('Ins Date');
  });

  // --- Template: table rows match attribute count ---
  it('should render a table row for each attribute', () => {
    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(2);
  });

  // --- onBack is callable multiple times ---
  it('should allow multiple calls to onBack', () => {
    component.onBack();
    component.onBack();
    expect(dialogRefSpy.close).toHaveBeenCalledTimes(2);
  });

  // --- Dialog header title ---
  it('should display dialog title "Show Attributes"', () => {
    const title = fixture.nativeElement.querySelector('.dialog-title');
    expect(title?.textContent?.trim()).toBe('Show Attributes');
  });

  // --- Footer close button ---
  it('should have a CLOSE button in the footer', () => {
    const footer = fixture.nativeElement.querySelector('.dialog-footer');
    const button = footer?.querySelector('button');
    expect(button?.textContent?.trim()).toBe('CLOSE');
  });

  // --- Date of birth formatting in template ---
  it('should format donor date of birth using formatDate in template', () => {
    const values = fixture.nativeElement.querySelectorAll('.value');
    const valueTexts = Array.from(values).map((v: any) => v.textContent.trim());
    // dateOfBirth is '1990-01-15', formatDate should produce '15-JAN-1990'
    expect(valueTexts).toContain('15-JAN-1990');
  });

  // --- displayedColumns has correct length ---
  it('should have exactly 5 displayed columns', () => {
    expect(component.displayedColumns.length).toBe(5);
  });

  // --- Loading signal initial state (before detectChanges) ---
  it('should start with loading as true before API responds', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAttributes.mockReturnValue(apiSubject.asObservable());

    const freshFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    // Before detectChanges (ngOnInit hasn't been called yet), loading should still be true (initial signal value)
    expect(freshFixture.componentInstance.loading()).toBe(true);

    freshFixture.detectChanges();
    // After detectChanges, still loading because Subject hasn't emitted
    expect(freshFixture.componentInstance.loading()).toBe(true);

    apiSubject.next({ success: true, data: [] });
    apiSubject.complete();

    expect(freshFixture.componentInstance.loading()).toBe(false);
    freshFixture.destroy();
  });

  // --- Attributes signal initial state ---
  it('should start with empty attributes array', () => {
    const apiSubject = new Subject<any>();
    mockApiService.getAttributes.mockReturnValue(apiSubject.asObservable());

    const freshFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    expect(freshFixture.componentInstance.attributes()).toEqual([]);

    freshFixture.destroy();
  });

  // --- Error path does not modify attributes ---
  it('should not change attributes signal when API errors', () => {
    mockApiService.getAttributes.mockReturnValue(throwError(() => new Error('server error')));
    const errorFixture = TestBed.createComponent(ShowAttributesDialogComponent);
    errorFixture.detectChanges();

    // attributes should remain as the initial empty array
    expect(errorFixture.componentInstance.attributes()).toEqual([]);
    errorFixture.destroy();
  });

  // --- onClose returns specific string ---
  it('should pass the exact string "closeAll" when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    expect(dialogRefSpy.close).not.toHaveBeenCalledWith('close');
  });

  // --- onBack passes no arguments ---
  it('should call dialogRef.close with no arguments when onBack is called', () => {
    component.onBack();
    const closeCall = dialogRefSpy.close.mock.calls[dialogRefSpy.close.mock.calls.length - 1];
    expect(closeCall.length).toBe(0);
  });
});
