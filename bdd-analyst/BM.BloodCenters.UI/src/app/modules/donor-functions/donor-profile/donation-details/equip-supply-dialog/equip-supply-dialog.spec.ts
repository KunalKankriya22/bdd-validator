import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { EquipSupplyDialogComponent } from './equip-supply-dialog';
import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { EquipSupplyItem } from '../models/donation-details.model';

describe('EquipSupplyDialogComponent', () => {
  let component: EquipSupplyDialogComponent;
  let fixture: ComponentFixture<EquipSupplyDialogComponent>;
  let dialogRefSpy: { close: jest.Mock };

  const mockItems: EquipSupplyItem[] = [
    {
      equipOrSupply: 'Equipment',
      equipSupplyCode: 'EQ001',
      equipReference: 'REF-100',
      catalogNo: 'CAT-200',
      lotNo: 'LOT-300',
      phyCode: 'PHY-A',
      tempQcStatus: 'Passed',
    },
    {
      equipOrSupply: 'Supply',
      equipSupplyCode: 'SP002',
      equipReference: 'REF-101',
      catalogNo: 'CAT-201',
      lotNo: 'LOT-301',
      phyCode: null,
      tempQcStatus: 'Pending',
    },
  ];

  const mockApiService = {
    getEquipSupply: jest.fn(),
  };

  const dialogData = { transactionId: 'TXN001', chapterId: 'CH001' };

  beforeEach(() => {
    dialogRefSpy = { close: jest.fn() };
    mockApiService.getEquipSupply.mockReturnValue(of({ success: true, data: mockItems }));

    TestBed.configureTestingModule({
      imports: [EquipSupplyDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: DonationDetailsApiService, useValue: mockApiService },
      ],
    });

    fixture = TestBed.createComponent(EquipSupplyDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have correct displayedColumns', () => {
    expect(component.displayedColumns).toEqual([
      'equipOrSupply',
      'equipSupplyCode',
      'equipReference',
      'catalogNo',
      'lotNo',
      'tempQcStatus',
    ]);
  });

  describe('ngOnInit / loadData', () => {
    it('should call getEquipSupply with transactionId on init', () => {
      fixture.detectChanges();
      expect(mockApiService.getEquipSupply).toHaveBeenCalledWith('TXN001');
    });

    it('should populate items from response data', () => {
      fixture.detectChanges();
      expect(component.items().length).toBe(2);
      expect(component.items()).toEqual(mockItems);
    });

    it('should set selectedItem to the first item when data has items', () => {
      fixture.detectChanges();
      expect(component.selectedItem()).toEqual(mockItems[0]);
    });

    it('should set loading to false after successful load', () => {
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('should set items to empty array when response data is null', () => {
      mockApiService.getEquipSupply.mockReturnValue(of({ success: true, data: null }));
      fixture.detectChanges();
      expect(component.items()).toEqual([]);
    });

    it('should not set selectedItem when response data is null', () => {
      mockApiService.getEquipSupply.mockReturnValue(of({ success: true, data: null }));
      fixture.detectChanges();
      expect(component.selectedItem()).toBeNull();
    });

    it('should set items to empty array when response data is undefined', () => {
      mockApiService.getEquipSupply.mockReturnValue(of({ success: true, data: undefined }));
      fixture.detectChanges();
      expect(component.items()).toEqual([]);
      expect(component.selectedItem()).toBeNull();
    });

    it('should not set selectedItem when response data is empty array', () => {
      mockApiService.getEquipSupply.mockReturnValue(of({ success: true, data: [] }));
      fixture.detectChanges();
      expect(component.items()).toEqual([]);
      expect(component.selectedItem()).toBeNull();
    });

    it('should set loading to false on API error', () => {
      mockApiService.getEquipSupply.mockReturnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('should not populate items on API error', () => {
      mockApiService.getEquipSupply.mockReturnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();
      expect(component.items()).toEqual([]);
      expect(component.selectedItem()).toBeNull();
    });
  });

  describe('selectRow', () => {
    it('should set the selectedItem to the provided item', () => {
      fixture.detectChanges();
      component.selectRow(mockItems[1]);
      expect(component.selectedItem()).toEqual(mockItems[1]);
    });

    it('should update selectedItem when selecting a different row', () => {
      fixture.detectChanges();
      expect(component.selectedItem()).toEqual(mockItems[0]);
      component.selectRow(mockItems[1]);
      expect(component.selectedItem()).toEqual(mockItems[1]);
      component.selectRow(mockItems[0]);
      expect(component.selectedItem()).toEqual(mockItems[0]);
    });
  });

  describe('onBack', () => {
    it('should close dialog without arguments', () => {
      fixture.detectChanges();
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onClose', () => {
    it('should close dialog with closeAll', () => {
      fixture.detectChanges();
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from API call when destroyed before response', () => {
      const subject = new Subject<any>();
      mockApiService.getEquipSupply.mockReturnValue(subject.asObservable());
      fixture.detectChanges();
      expect(component.loading()).toBe(true);
      fixture.destroy();
      subject.next({ success: true, data: mockItems });
      expect(component.loading()).toBe(true);
      expect(component.items()).toEqual([]);
    });
  });

  describe('initial signal values', () => {
    it('should have loading set to true before init', () => {
      expect(component.loading()).toBe(true);
    });

    it('should have items as empty array before init', () => {
      expect(component.items()).toEqual([]);
    });

    it('should have selectedItem as null before init', () => {
      expect(component.selectedItem()).toBeNull();
    });
  });
});
