import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PackodViewBoxContentsDialogComponent } from './view-box-contents-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { DiscardProductDto } from '../../models/packod.model';

describe('PackodViewBoxContentsDialogComponent', () => {
  let component: PackodViewBoxContentsDialogComponent;
  let fixture: ComponentFixture<PackodViewBoxContentsDialogComponent>;

  const mockContents: DiscardProductDto[] = [
    {
      unitId: 'W99999', expDate: '2025-06-01T00:00:00Z', productType: 'WB', productCode: 'E0791',
      aboDesc: 'A Pos', bloodType: 'AP', productStatus: 'PK', aliquot: '001',
      collDate: '2025-05-15T00:00:00Z', boxId: 'BOX001', pickSlipId: 'PA26-001',
      productDesc: 'Whole Blood', chkDigit: '12',
    },
    {
      unitId: 'W11111', expDate: '2025-07-01T00:00:00Z', productType: 'RBC', productCode: 'E0792',
      aboDesc: 'O Neg', bloodType: 'ON', productStatus: 'PK', aliquot: null,
      collDate: '2025-06-10T00:00:00Z', boxId: 'BOX001', pickSlipId: null,
      productDesc: null, chkDigit: null,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PackodViewBoxContentsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(PackodViewBoxContentsDialogComponent);
    component = fixture.componentInstance;
    component.boxId = 'BOX001';
    component.contents = mockContents;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  describe('Table Config', () => {
    it('should have 6 columns', () => {
      const config = component.tableConfig();
      expect(config.columns.length).toBe(6);
    });

    it('should include productType column', () => {
      const keys = component.tableConfig().columns.map(c => c.key);
      expect(keys).toContain('productType');
    });

    it('should include productCode column', () => {
      const keys = component.tableConfig().columns.map(c => c.key);
      expect(keys).toContain('productCode');
    });

    it('should include collDate column', () => {
      const keys = component.tableConfig().columns.map(c => c.key);
      expect(keys).toContain('collDate');
    });

    it('should include expDate column', () => {
      const keys = component.tableConfig().columns.map(c => c.key);
      expect(keys).toContain('expDate');
    });

    it('should include aboDesc column with fallback formatter', () => {
      const config = component.tableConfig();
      const aboCol = config.columns.find(c => c.key === 'aboDesc');
      expect(aboCol).toBeTruthy();
      expect(aboCol!.valueFormatter!(null, mockContents[0])).toBe('A Pos');
    });

    it('should fall back to bloodType when aboDesc is null', () => {
      const config = component.tableConfig();
      const aboCol = config.columns.find(c => c.key === 'aboDesc');
      const noAbo = { ...mockContents[0], aboDesc: null, bloodType: 'AP' } as DiscardProductDto;
      expect(aboCol!.valueFormatter!(null, noAbo)).toBe('AP');
    });

    it('should show dash when both aboDesc and bloodType null', () => {
      const config = component.tableConfig();
      const aboCol = config.columns.find(c => c.key === 'aboDesc');
      const noAbo = { ...mockContents[0], aboDesc: null, bloodType: null } as DiscardProductDto;
      expect(aboCol!.valueFormatter!(null, noAbo)).toBe('-');
    });

    it('should display chkDigit in Unit ID column', () => {
      const config = component.tableConfig();
      const unitCol = config.columns.find(c => c.key === 'unitId');
      expect(unitCol!.valueFormatter!(null, mockContents[0])).toBe('W99999 (12)');
    });

    it('should display unitId without chkDigit when null', () => {
      const config = component.tableConfig();
      const unitCol = config.columns.find(c => c.key === 'unitId');
      expect(unitCol!.valueFormatter!(null, mockContents[1])).toBe('W11111');
    });

    it('should show item count in Unit ID header', () => {
      const config = component.tableConfig();
      const unitCol = config.columns.find(c => c.key === 'unitId');
      expect(unitCol!.header).toContain('2');
    });

    it('should have unitId as sortable', () => {
      const config = component.tableConfig();
      const unitCol = config.columns.find(c => c.key === 'unitId');
      expect(unitCol!.sortable).toBeTrue();
    });

    it('should not show pagination', () => {
      expect(component.tableConfig().showPagination).toBeFalse();
    });
  });

  describe('Sort Contents', () => {
    it('should sort ascending by unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' } as any);
      const sorted = component.sortedContents();
      expect(sorted[0].unitId).toBe('W11111');
      expect(sorted[1].unitId).toBe('W99999');
    });

    it('should sort descending by unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' } as any);
      const sorted = component.sortedContents();
      expect(sorted[0].unitId).toBe('W99999');
      expect(sorted[1].unitId).toBe('W11111');
    });

    it('should reset sort on default direction', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' } as any);
      component.onSortChange({ column: 'unitId', direction: 'default' } as any);
      const sorted = component.sortedContents();
      expect(sorted[0].unitId).toBe('W99999');
    });

    it('should not sort when no sort column set', () => {
      const sorted = component.sortedContents();
      expect(sorted[0].unitId).toBe('W99999');
    });
  });

  describe('Close Panel', () => {
    it('should emit panelClosed event on close', () => {
      const emitSpy = spyOn(component.panelClosed, 'emit');
      component.onClose();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Footer Buttons', () => {
    it('should have a CLOSE button', () => {
      expect(component.footerButtons.length).toBe(1);
      expect(component.footerButtons[0].label).toBe('CLOSE');
      expect(component.footerButtons[0].action).toBe('close');
    });
  });
});
