import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import { ViewUnitAttributeModal } from './view-unit-attribute-modal';
import { UnitAttribute } from '../models/interdiction-query.model';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ViewUnitAttributeModal', () => {
  let component: ViewUnitAttributeModal;
  let fixture: ComponentFixture<ViewUnitAttributeModal>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewUnitAttributeModal>>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockUnitAttributes: UnitAttribute[] = [
    {
      attribCode: 'ATTR1',
      attribDesc: 'First Attribute',
      attribGroup: 'GRP1',
      attribType: 'T',
      insertDats: '2026-06-12T21:30:00.000Z',
      insertUserId: 'USER01'
    },
    {
      attribCode: 'ATTR2',
      attribDesc: 'Second Attribute',
      attribGroup: 'GRP2',
      attribType: 'T',
      insertDats: '2026-06-11T18:15:00.000Z',
      insertUserId: 'USER02'
    },
    {
      attribCode: 'AAA99',
      attribDesc: 'First Code',
      attribGroup: 'GRP3',
      attribType: 'T',
      insertDats: '2026-06-10T12:00:00.000Z',
      insertUserId: 'USER03'
    }
  ];

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockTranslateService = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [
        ViewUnitAttributeModal,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { unitAttributes: mockUnitAttributes }
        }
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(ViewUnitAttributeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {




    it('should map unit attributes to table rows', () => {
      expect(component.tableData.length).toBe(3);
      expect(component.tableData[0].attributeCode).toBe('ATTR1');
      expect(component.tableData[1].attributeCode).toBe('ATTR2');
      expect(component.tableData[2].attributeCode).toBe('AAA99');
    });






  });
  describe('Sorting Functionality', () => {






    it('should reset to original order when direction is default', () => {
      // First sort the data
      component.onSortChange({ column: 'attributeCode', direction: 'A' });

      // Then reset to default
      component.onSortChange({ column: 'attributeCode', direction: 'default' });

      // Should be back to original order
      expect(component.tableData[0].attributeCode).toBe('ATTR1');
      expect(component.tableData[1].attributeCode).toBe('ATTR2');
      expect(component.tableData[2].attributeCode).toBe('AAA99');
    });

    it('should create a new array when sorting to trigger change detection', () => {
      const originalArray = component.tableData;

      component.onSortChange({ column: 'attributeCode', direction: 'D' });

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
      const dataWithEmptyGroup: UnitAttribute[] = [
        {
          attribCode: 'TEST1',
          attribDesc: 'Test',
          attribGroup: '',
          attribType: 'T',
          insertDats: '2026-06-12T00:00:00.000Z',
          insertUserId: 'USER01'
        }
      ];

      component.data.unitAttributes = dataWithEmptyGroup;
      component['initializeTable']();

      expect(component.tableData[0].group).toBe('');
    });
  });
});
