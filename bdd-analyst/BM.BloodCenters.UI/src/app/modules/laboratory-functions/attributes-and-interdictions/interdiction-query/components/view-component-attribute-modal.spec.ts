import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import { ViewComponentAttributeModal } from './view-component-attribute-modal';
import { ComponentAttribute } from '../models/interdiction-query.model';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ViewComponentAttributeModal', () => {
  let component: ViewComponentAttributeModal;
  let fixture: ComponentFixture<ViewComponentAttributeModal>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewComponentAttributeModal>>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockComponentAttributes: ComponentAttribute[] = [
    {
      productCode: 'RBC01',
      attribCode: 'ATTR1',
      attribDesc: 'First Attribute',
      attribGroup: 'GRP1',
      insertDats: '2026-06-12T21:30:00.000Z',
      insertUserId: 'USER01'
    },
    {
      productCode: 'PLT01',
      attribCode: 'ATTR2',
      attribDesc: 'Second Attribute',
      attribGroup: 'GRP2',
      insertDats: '2026-06-11T18:15:00.000Z',
      insertUserId: 'USER02'
    },
    {
      productCode: 'AAA99',
      attribCode: 'ATTR3',
      attribDesc: 'Third Attribute',
      attribGroup: 'GRP3',
      insertDats: '2026-06-10T12:00:00.000Z',
      insertUserId: 'USER03'
    }
  ];

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockTranslateService = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [
        ViewComponentAttributeModal,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { componentAttributes: mockComponentAttributes }
        }
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(ViewComponentAttributeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {




    it('should map component attributes to table rows', () => {
      expect(component.tableData.length).toBe(3);
      expect(component.tableData[0].productCode).toBe('RBC01');
      expect(component.tableData[1].productCode).toBe('PLT01');
      expect(component.tableData[2].productCode).toBe('AAA99');
    });






  });

  describe('Table Column Configuration', () => {




    it('should have only productCode column sortable', () => {
      const columns = component.tableConfig.columns;

      expect(columns.find(c => c.key === 'productCode')?.sortable).toBeTrue();
      expect(columns.find(c => c.key === 'attributeCode')?.sortable).toBeFalse();
      expect(columns.find(c => c.key === 'group')?.sortable).toBeFalse();
      expect(columns.find(c => c.key === 'timeStamp')?.sortable).toBeFalse();
      expect(columns.find(c => c.key === 'user')?.sortable).toBeFalse();
    });
  });

  describe('Sorting Functionality', () => {






    it('should reset to original order when direction is default', () => {
      // First sort the data
      component.onSortChange({ column: 'productCode', direction: 'A' });

      // Then reset to default
      component.onSortChange({ column: 'productCode', direction: 'default' });

      // Should be back to original order
      expect(component.tableData[0].productCode).toBe('RBC01');
      expect(component.tableData[1].productCode).toBe('PLT01');
      expect(component.tableData[2].productCode).toBe('AAA99');
    });

    it('should create a new array when sorting to trigger change detection', () => {
      const originalArray = component.tableData;

      component.onSortChange({ column: 'productCode', direction: 'D' });

      // Should be a different array reference
      expect(component.tableData).not.toBe(originalArray);
    });


  });

  describe('Data Transformation', () => {
    it('should format timestamps correctly', () => {
      const firstRow = component.tableData[0];

      expect(firstRow.timeStamp).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });



    it('should handle empty attribute group', () => {
      const dataWithEmptyGroup: ComponentAttribute[] = [
        {
          productCode: 'TEST1',
          attribCode: 'ATTR1',
          attribDesc: 'Test',
          attribGroup: '',
          insertDats: '2026-06-12T00:00:00.000Z',
          insertUserId: 'USER01'
        }
      ];

      component.data.componentAttributes = dataWithEmptyGroup;
      component['initializeTable']();

      expect(component.tableData[0].group).toBe('');
    });
  });
  describe('Edge Cases', () => {




    it('should map attributeCode correctly from attribCode', () => {
      expect(component.tableData[0].attributeCode).toBe('ATTR1');
      expect(component.tableData[1].attributeCode).toBe('ATTR2');
      expect(component.tableData[2].attributeCode).toBe('ATTR3');
    });
  });
});
