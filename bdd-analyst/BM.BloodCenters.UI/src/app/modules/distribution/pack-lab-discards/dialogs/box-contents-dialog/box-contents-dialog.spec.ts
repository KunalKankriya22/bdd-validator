import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BoxContentsDialogComponent, BoxContentsDialogData } from './box-contents-dialog';
import { PackLabDiscardsService } from '../../services/pack-lab-discards.service';
import { BoxContent } from '../../models/pack-lab-discards.model';

const mockBoxContents: BoxContent[] = [
  { unitId: 'UNIT001', collDate: '2024-06-01', productType: 'PLT', productCode: 'PROD001', bloodType: 'O+' },
  { unitId: 'UNIT002', collDate: '2024-06-02', productType: 'RBC', productCode: 'PROD002', bloodType: 'A-' },
];

describe('BoxContentsDialogComponent', () => {
  let component: BoxContentsDialogComponent;
  let fixture: ComponentFixture<BoxContentsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoxContentsDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<PackLabDiscardsService>;

  const mockData: BoxContentsDialogData = { boxId: 'BX001' };

  function setup(contents: BoxContent[] | 'error' = mockBoxContents) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('PackLabDiscardsService', ['getBoxContents']);

    if (contents === 'error') {
      serviceSpy.getBoxContents.and.returnValue(throwError(() => new Error('load error')));
    } else {
      serviceSpy.getBoxContents.and.returnValue(of(contents));
    }

    TestBed.configureTestingModule({
      imports: [BoxContentsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: PackLabDiscardsService, useValue: serviceSpy },
      ],
    });

    fixture = TestBed.createComponent(BoxContentsDialogComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization', () => {
    it('should create the component', () => {
      setup();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load contents via service on ngOnInit', fakeAsync(() => {
      setup();
      expect(component['loading']()).toBeTrue();
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getBoxContents).toHaveBeenCalledWith('BX001');
      expect(component['contents']()).toEqual(mockBoxContents);
      expect(component['loading']()).toBeFalse();
    }));

    it('should set loading to false on error', fakeAsync(() => {
      setup('error');
      fixture.detectChanges();
      tick();
      expect(component['loading']()).toBeFalse();
      expect(component['contents']()).toEqual([]);
    }));

    it('should handle empty contents list', fakeAsync(() => {
      setup([]);
      fixture.detectChanges();
      tick();
      expect(component['contents']()).toEqual([]);
      expect(component['loading']()).toBeFalse();
    }));
  });

  describe('sortedContents computed', () => {
    it('should return unsorted contents when no sort is set', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component['sortedContents']()).toEqual(mockBoxContents);
    }));

    it('should return contents sorted ascending by unitId when direction is A', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      fixture.detectChanges();
      const sorted = component['sortedContents']();
      expect(sorted[0].unitId).toBe('UNIT001');
      expect(sorted[1].unitId).toBe('UNIT002');
    }));

    it('should return contents sorted descending by unitId when direction is D', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'D' });
      fixture.detectChanges();
      const sorted = component['sortedContents']();
      expect(sorted[0].unitId).toBe('UNIT002');
      expect(sorted[1].unitId).toBe('UNIT001');
    }));

    it('should return original order when sort direction is default', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'default' });
      fixture.detectChanges();
      expect(component['sortedContents']()).toEqual(mockBoxContents);
    }));

    it('should handle null unitId in sort comparison (first item null)', fakeAsync(() => {
      const contentsWithNull: BoxContent[] = [
        { unitId: null as any, collDate: '2024-06-01', productType: 'PLT', productCode: 'PROD001', bloodType: 'O+' },
        { unitId: 'UNIT002', collDate: '2024-06-02', productType: 'RBC', productCode: 'PROD002', bloodType: 'A-' },
      ];
      setup(contentsWithNull);
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      fixture.detectChanges();
      const sorted = component['sortedContents']();
      expect(sorted.length).toBe(2);
      expect(sorted[0].unitId).toBeNull();
      expect(sorted[1].unitId).toBe('UNIT002');
    }));

    it('should handle null unitId in sort comparison (second item null)', fakeAsync(() => {
      const contentsNullSecond: BoxContent[] = [
        { unitId: 'UNIT001', collDate: '2024-06-01', productType: 'PLT', productCode: 'PROD001', bloodType: 'O+' },
        { unitId: null as any, collDate: '2024-06-02', productType: 'RBC', productCode: 'PROD002', bloodType: 'A-' },
        { unitId: 'UNIT003', collDate: '2024-06-03', productType: 'RBC', productCode: 'PROD003', bloodType: 'B+' },
      ];
      setup(contentsNullSecond);
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      fixture.detectChanges();
      const sorted = component['sortedContents']();
      expect(sorted.length).toBe(3);
      expect(sorted[0].unitId).toBeNull();
    }));
  });

  describe('tableConfig computed', () => {
    it('should format null collDate to "-" via valueFormatter', fakeAsync(() => {
      const contentsWithNullDate: BoxContent[] = [
        { unitId: 'UNIT001', collDate: null as any, productType: 'PLT', productCode: 'PROD001', bloodType: 'O+' },
      ];
      setup(contentsWithNullDate);
      fixture.detectChanges();
      tick();
      const config = component['tableConfig']();
      const collDateCol = config.columns.find((c: any) => c.key === 'collDate') as any;
      expect(collDateCol.valueFormatter(null)).toBe('-');
    }));

    it('should include all expected columns', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      const config = component['tableConfig']();
      const keys = config.columns.map((c: any) => c.key);
      expect(keys).toContain('unitId');
      expect(keys).toContain('collDate');
      expect(keys).toContain('productType');
      expect(keys).toContain('productCode');
      expect(keys).toContain('bloodType');
    }));

    it('should include sortConfig when a sort is active', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      fixture.detectChanges();
      const config = component['tableConfig']();
      expect(config.sortConfig).toBeDefined();
      expect(config.sortConfig!.column).toBe('unitId');
      expect(config.sortConfig!.direction).toBe('A');
    }));

    it('should have sortConfig as undefined when no sort is set', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      const config = component['tableConfig']();
      expect(config.sortConfig).toBeUndefined();
    }));
  });

  describe('onSortChange', () => {
    it('should update currentSort signal', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      expect(component['currentSort']()).toEqual({ column: 'unitId', direction: 'A' });
    }));
  });

  describe('onClose', () => {
    it('should call dialogRef.close()', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onClose']();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    }));
  });
});
