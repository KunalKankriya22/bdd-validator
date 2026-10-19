import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChkOffPage } from './chkoff-page';
import { CheckInSuccessEvent } from './chkoff-form/chkoff-form';
import { ChkOffService } from './services/chkoff.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ChkOffPage', () => {
  let component: ChkOffPage;
  let fixture: ComponentFixture<ChkOffPage>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockEvent = (unitId = 'TEST-001'): CheckInSuccessEvent => ({
    unitId,
    displayUnitId: `${unitId}-X`,
    collDate: null,
    productCode: 'RBC',
    bloodType: 'O+',
    bloodTypeDescription: null,
    expirationDate: new Date().toISOString(),
    inventoryClass: 'RE'
  });

  beforeEach(async () => {
    snackbarSpy = createMockSnackbarService();

    const serviceSpy = jasmine.createSpyObj('ChkOffService', [
      'getInventoryClasses', 'validateUnit', 'checkInProduct',
      'getProductCodes', 'getAboTypes',
      'getWarehouses', 'getDevices', 'getRacks', 'getTrays'
    ]);
    serviceSpy.getInventoryClasses.and.returnValue(of([]));
    serviceSpy.getWarehouses.and.returnValue(of([]));
    serviceSpy.getDevices.and.returnValue(of([]));
    serviceSpy.getRacks.and.returnValue(of([]));
    serviceSpy.getTrays.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ChkOffPage, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ChkOffService, useValue: serviceSpy },
        { provide: DonorLibLabelScanService, useValue: jasmine.createSpyObj('DonorLibLabelScanService', ['validateProductScan', 'validateAboScan', 'validateExpdateScan']) },
        { provide: HeaderService, useValue: { chapterTimeZone: signal(''), chapterChanged$: of() } },
        { provide: ChapterTimezoneService, useValue: { isChapterLocalDateAvailable: () => false, getChapterLocalDate: () => ({ clone: () => ({ hour: () => ({ minute: () => ({}) }) }) }) } },
        { provide: MatDialog, useValue: createMockMatDialog() }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChkOffPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should use ABORh as header for bloodType column', () => {
    const config = component.tableConfig();
    const bloodTypeCol = config.columns.find((c: any) => c.key === 'bloodType');
    expect(bloodTypeCol?.header).toBe('ABORh');
  });

  it('should add product to table on check-in success', () => {
    component.onCheckInSuccess(mockEvent());

    expect((component as any).products().length).toBe(1);
    expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Entry saved');
  });

  it('should increment count on multiple check-ins', () => {
    component.onCheckInSuccess(mockEvent('TEST-001'));
    component.onCheckInSuccess(mockEvent('TEST-002'));

    expect((component as any).products().length).toBe(2);
    expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Entry saved');
  });

  it('should update Unit ID header count', () => {
    component.onCheckInSuccess(mockEvent('TEST-001'));
    const config1 = component.tableConfig();
    const unitCol1 = config1.columns.find((c: any) => c.key === 'displayUnitId');
    expect(unitCol1?.header).toBe('Unit ID (1)');

    component.onCheckInSuccess(mockEvent('TEST-002'));
    const config2 = component.tableConfig();
    const unitCol2 = config2.columns.find((c: any) => c.key === 'displayUnitId');
    expect(unitCol2?.header).toBe('Unit ID (2)');
  });

  it('should clear products on clearAll', () => {
    component.onCheckInSuccess(mockEvent());
    expect((component as any).products().length).toBe(1);

    component.onProductsCleared();
    expect((component as any).products().length).toBe(0);
  });
});
