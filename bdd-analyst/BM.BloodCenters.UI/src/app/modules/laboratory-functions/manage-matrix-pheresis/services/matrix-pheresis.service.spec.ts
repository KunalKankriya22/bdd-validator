/**
 * Unit tests for MatrixPheresisService
 * JIRA: MLT-12847
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatrixPheresisService } from './matrix-pheresis.service';
import { environment } from '../../../../../environments/environment';

describe('MatrixPheresisService', () => {
  let service: MatrixPheresisService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/proc-prod-matrix`;
  const attrEquipBaseUrl = `${environment.apiUrl}/api/v1/procedure-attribute-equipment`;
  const cgmpBaseUrl = `${environment.apiUrl}/api/v1/equipment-product-cgmp`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MatrixPheresisService]
    });
    service = TestBed.inject(MatrixPheresisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================
  // Tab 1: Product/Procedure Matrix
  // ============================================

  it('should fetch matrix records with pagination', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        {
          proc: 'PH',
          procDesc: 'Pheresis',
          productType: 'PLT',
          productDesc: 'Platelets',
          numberProducts: '2',
          effDate: '2025-01-01',
          termDate: undefined
        }
      ],
      total: 1
    };

    service.getMatrixRecords(25, 0).subscribe(response => {
      expect(response.data.length).toBe(1);
      expect(response.totalCount).toBe(1);
      expect(response.data[0].proc).toBe('PH');
    });

    const req = httpMock.expectOne(`${baseUrl}/25/0`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should create matrix record', () => {
    const createDto = {
      proc: 'PH',
      productType: 'PLT',
      numberProducts: '2',
      effDate: '2025-01-01'
    };

    const mockResponse = {
      success: true,
      statusCode: 201,
      message: 'Record created successfully'
    };

    service.createMatrix(createDto).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockResponse);
  });

  it('should fetch procedures dropdown', () => {
    const mockResponse = [
      { code: 'PH', codeDesc: 'Pheresis' },
      { code: 'WB', codeDesc: 'Whole Blood' }
    ];

    service.getProcedures().subscribe(procedures => {
      expect(procedures.length).toBe(2);
      expect(procedures[0].code).toBe('PH');
    });

    const req = httpMock.expectOne(`${baseUrl}/dropdowns/procedures`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch product types dropdown', () => {
    const mockResponse = [
      { productCode: 'PLT', productDesc: 'Platelets' },
      { productCode: 'RBC', productDesc: 'Red Blood Cells' }
    ];

    service.getProductTypes().subscribe(productTypes => {
      expect(productTypes.length).toBe(2);
      expect(productTypes[0].productCode).toBe('PLT');
    });

    const req = httpMock.expectOne(`${baseUrl}/dropdowns/product-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // --- Additional Tab 1 tests ---

  it('should send filters in the request body when provided to getMatrixRecords', () => {
    const filters = { proc: 'PH', sortColumn: 'proc', sortOrder: 'ASC' as const };
    const mockResponse = { success: true, statusCode: 200, data: [], total: 0 };

    service.getMatrixRecords(10, 5, filters).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${baseUrl}/10/5`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filters);
    req.flush(mockResponse);
  });

  it('should send empty object when no filters provided to getMatrixRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: null, total: undefined };

    service.getMatrixRecords(25, 0).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${baseUrl}/25/0`);
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('should handle null data and total in getMatrixRecords response', () => {
    const mockResponse = { success: true, statusCode: 200 };

    service.getMatrixRecords(25, 0).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${baseUrl}/25/0`);
    req.flush(mockResponse);
  });

  it('should get a single matrix record by composite key', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        {
          proc: 'PH',
          procDesc: 'Pheresis',
          productType: 'PLT',
          productDesc: 'Platelets',
          numberProducts: '2',
          effDate: '2025-01-01',
          termDate: undefined
        }
      ]
    };

    service.getMatrixRecord('PH', 'PLT').subscribe(record => {
      expect(record.proc).toBe('PH');
      expect(record.productType).toBe('PLT');
      expect(record.numberProducts).toBe('2');
    });

    const req = httpMock.expectOne(`${baseUrl}/PH/PLT`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return undefined when getMatrixRecord receives empty data', () => {
    const mockResponse = { success: true, statusCode: 200, data: [] };

    service.getMatrixRecord('XX', 'YY').subscribe(record => {
      expect(record).toBeUndefined();
    });

    const req = httpMock.expectOne(`${baseUrl}/XX/YY`);
    req.flush(mockResponse);
  });

  it('should return undefined when getMatrixRecord receives null data', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getMatrixRecord('XX', 'YY').subscribe(record => {
      expect(record).toBeUndefined();
    });

    const req = httpMock.expectOne(`${baseUrl}/XX/YY`);
    req.flush(mockResponse);
  });

  it('should update a matrix record', () => {
    const updateDto = {
      numberProducts: '3',
      effDate: '2025-06-01',
      termDate: '2026-12-31'
    };
    const mockResponse = { success: true, statusCode: 200, message: 'Updated' };

    service.updateMatrix('PH', 'PLT', updateDto).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/PH/PLT`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(mockResponse);
  });

  it('should delete a matrix record', () => {
    const mockResponse = { success: true, statusCode: 200, message: 'Deleted' };

    service.deleteMatrix('PH', 'PLT').subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.message).toBe('Deleted');
    });

    const req = httpMock.expectOne(`${baseUrl}/PH/PLT`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  // ============================================
  // Tab 2: Procedure Attribute/Equipment Matrix
  // ============================================

  it('should fetch attribute equipment records with pagination', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        {
          attribGroup: 'GRP1',
          attribGroupDesc: 'Group One',
          attribCode: 'CODE1',
          attribCodeDesc: 'Code One Desc',
          equipType: 'EQ1',
          equipDesc: 'Equipment One',
          parmCode: 'P1',
          parmDesc: 'Param One',
          effDate: '2025-01-01',
          termDate: null,
          lastModifiedDate: '2025-06-01'
        }
      ],
      totalCount: 1
    };

    service.getAttributeEquipmentRecords(25, 0).subscribe(response => {
      expect(response.data.length).toBe(1);
      expect(response.totalCount).toBe(1);
      // Verify the mapping from API fields to frontend fields
      const item = response.data[0];
      expect(item.attribGroup).toBe('GRP1');
      expect(item.attributeGroup).toBe('GRP1');
      expect(item.attribCode).toBe('CODE1');
      expect(item.attributeCode).toBe('CODE1');
      expect(item.attributeDesc).toBe('Code One Desc');
      expect(item.equipType).toBe('EQ1');
      expect(item.equipmentType).toBe('EQ1');
      expect(item.equipmentDesc).toBe('Equipment One');
      expect(item.parmCode).toBe('P1');
      expect(item.parameterCode).toBe('P1');
      expect(item.parameterDesc).toBe('Param One');
      expect(item.lastModifiedDate).toBe('2025-06-01');
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/25/0`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should send attribGroup filter when provided to getAttributeEquipmentRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

    service.getAttributeEquipmentRecords(10, 0, 'GRP1').subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/10/0`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.attribGroup).toBe('GRP1');
    req.flush(mockResponse);
  });

  it('should send sort parameters when provided to getAttributeEquipmentRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

    service.getAttributeEquipmentRecords(10, 0, 'GRP1', 'attribGroup', 'DESC').subscribe(response => {
      expect(response.data).toEqual([]);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/10/0`);
    expect(req.request.body.attribGroup).toBe('GRP1');
    expect(req.request.body.sortColumn).toBe('attribGroup');
    expect(req.request.body.sortOrder).toBe('DESC');
    req.flush(mockResponse);
  });

  it('should set undefined for missing optional params in getAttributeEquipmentRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

    service.getAttributeEquipmentRecords(25, 0).subscribe();

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/25/0`);
    expect(req.request.body.attribGroup).toBeUndefined();
    expect(req.request.body.sortColumn).toBeUndefined();
    expect(req.request.body.sortOrder).toBeUndefined();
    req.flush(mockResponse);
  });

  it('should use total field when totalCount is missing in getAttributeEquipmentRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: [], total: 42 };

    service.getAttributeEquipmentRecords(25, 0).subscribe(response => {
      expect(response.totalCount).toBe(42);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/25/0`);
    req.flush(mockResponse);
  });

  it('should handle null data in getAttributeEquipmentRecords response', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getAttributeEquipmentRecords(25, 0).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/25/0`);
    req.flush(mockResponse);
  });

  it('should create attribute equipment record', () => {
    const createDto = {
      attribGroup: 'GRP1',
      attribCode: 'CODE1',
      equipType: 'EQ1',
      parmCode: 'P1',
      effDate: '2025-01-01'
    };
    const mockResponse = { success: true, statusCode: 201, message: 'Created' };

    service.createAttributeEquipment(createDto).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
    });

    const req = httpMock.expectOne(attrEquipBaseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockResponse);
  });

  it('should update attribute equipment record with query params', () => {
    const updateDto = {
      attribCode: 'CODE2',
      equipType: 'EQ2',
      parmCode: 'P2',
      effDate: '2025-07-01',
      termDate: '2026-12-31'
    };
    const mockResponse = { success: true, statusCode: 200, message: 'Updated' };

    service.updateAttributeEquipment(
      'GRP1', 'CODE1', 'EQ1', 'P1', '2025-01-01', updateDto
    ).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(r =>
      r.url === attrEquipBaseUrl && r.method === 'PUT'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    expect(req.request.params.get('attribGroup')).toBe('GRP1');
    expect(req.request.params.get('attribCode')).toBe('CODE1');
    expect(req.request.params.get('equipType')).toBe('EQ1');
    expect(req.request.params.get('parmCode')).toBe('P1');
    expect(req.request.params.get('originalEffDate')).toBe('2025-01-01');
    req.flush(mockResponse);
  });

  it('should fetch attribute groups dropdown and map fields', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        { code: 'GRP1', codeDesc: 'Group One' },
        { code: 'GRP2', codeDesc: 'Group Two' }
      ]
    };

    service.getAttributeGroups().subscribe(groups => {
      expect(groups.length).toBe(2);
      expect(groups[0].attributeGroup).toBe('GRP1');
      expect(groups[0].description).toBe('Group One');
      expect(groups[1].attributeGroup).toBe('GRP2');
      expect(groups[1].description).toBe('Group Two');
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/attribute-groups`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return empty array when getAttributeGroups data is null', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getAttributeGroups().subscribe(groups => {
      expect(groups).toEqual([]);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/attribute-groups`);
    req.flush(mockResponse);
  });

  it('should fetch attribute codes dropdown for a given group and map fields', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        { attribCode: 'C1', attribDesc: 'Code One' },
        { attribCode: 'C2', attribDesc: 'Code Two' }
      ]
    };

    service.getAttributeCodes('GRP1').subscribe(codes => {
      expect(codes.length).toBe(2);
      expect(codes[0].attributeCode).toBe('C1');
      expect(codes[0].description).toBe('Code One');
      expect(codes[1].attributeCode).toBe('C2');
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/attribute-codes/GRP1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should encode special characters in attribute group for getAttributeCodes', () => {
    const mockResponse = { success: true, statusCode: 200, data: [] };

    service.getAttributeCodes('GRP/1').subscribe(codes => {
      expect(codes).toEqual([]);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/attribute-codes/GRP%2F1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return empty array when getAttributeCodes data is null', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getAttributeCodes('GRP1').subscribe(codes => {
      expect(codes).toEqual([]);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/attribute-codes/GRP1`);
    req.flush(mockResponse);
  });

  it('should fetch equipment types dropdown and map fields', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        { code: 'EQ1', codeDesc: 'Equipment One' },
        { code: 'EQ2', codeDesc: 'Equipment Two' }
      ]
    };

    service.getEquipmentTypes().subscribe(types => {
      expect(types.length).toBe(2);
      expect(types[0].equipmentType).toBe('EQ1');
      expect(types[0].description).toBe('Equipment One');
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/equipment-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return empty array when getEquipmentTypes data is null', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getEquipmentTypes().subscribe(types => {
      expect(types).toEqual([]);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/equipment-types`);
    req.flush(mockResponse);
  });

  it('should fetch parameter codes dropdown and map fields', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        { code: 'PC1', codeDesc: 'Param Code One' },
        { code: 'PC2', codeDesc: 'Param Code Two' }
      ]
    };

    service.getParameterCodes().subscribe(codes => {
      expect(codes.length).toBe(2);
      expect(codes[0].parameterCode).toBe('PC1');
      expect(codes[0].description).toBe('Param Code One');
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/parameter-codes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return empty array when getParameterCodes data is null', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getParameterCodes().subscribe(codes => {
      expect(codes).toEqual([]);
    });

    const req = httpMock.expectOne(`${attrEquipBaseUrl}/parameter-codes`);
    req.flush(mockResponse);
  });

  // ============================================
  // Tab 3: Equipment/Product cGMP Matrix
  // ============================================

  it('should fetch cGMP matrix records with pagination', () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: [
        {
          equipType: 'EQ1',
          proc: 'PH',
          productCode: 'PLT',
          parmCode: 'VOL',
          acceptMin: 100,
          acceptMax: 500,
          effDate: '2025-01-01',
          termDate: null
        }
      ],
      totalCount: 1
    };

    service.getEquipmentCgmpMatrixRecords(25, 0).subscribe(response => {
      expect(response.data.length).toBe(1);
      expect(response.totalCount).toBe(1);
      expect(response.data[0].equipType).toBe('EQ1');
      expect(response.data[0].acceptMin).toBe(100);
      expect(response.data[0].acceptMax).toBe(500);
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/25/0`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should send filters in body when provided to getEquipmentCgmpMatrixRecords', () => {
    const filters = { equipType: 'EQ1', proc: 'PH', sortColumn: 'equipType', sortOrder: 'ASC' as const };
    const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

    service.getEquipmentCgmpMatrixRecords(10, 5, filters).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/10/5`);
    expect(req.request.body).toEqual(filters);
    req.flush(mockResponse);
  });

  it('should send empty object when no filters provided to getEquipmentCgmpMatrixRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

    service.getEquipmentCgmpMatrixRecords(25, 0).subscribe();

    const req = httpMock.expectOne(`${cgmpBaseUrl}/25/0`);
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('should handle null data in getEquipmentCgmpMatrixRecords response', () => {
    const mockResponse = { success: true, statusCode: 200, data: null };

    service.getEquipmentCgmpMatrixRecords(25, 0).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/25/0`);
    req.flush(mockResponse);
  });

  it('should use total when totalCount is missing in getEquipmentCgmpMatrixRecords', () => {
    const mockResponse = { success: true, statusCode: 200, data: [], total: 15 };

    service.getEquipmentCgmpMatrixRecords(25, 0).subscribe(response => {
      expect(response.totalCount).toBe(15);
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/25/0`);
    req.flush(mockResponse);
  });

  it('should create cGMP matrix record', () => {
    const createDto = {
      equipType: 'EQ1',
      proc: 'PH',
      productCode: 'PLT',
      parmCode: 'VOL',
      acceptMin: 100,
      acceptMax: 500,
      effDate: '2025-01-01'
    };
    const mockResponse = { success: true, statusCode: 201, message: 'Created' };

    service.createEquipmentCgmpMatrix(createDto).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
    });

    const req = httpMock.expectOne(cgmpBaseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockResponse);
  });

  it('should update cGMP matrix record with encoded URL params', () => {
    const updateDto = {
      acceptMin: 150,
      acceptMax: 600,
      effDate: '2025-07-01',
      termDate: '2026-12-31'
    };
    const mockResponse = { success: true, statusCode: 200, message: 'Updated' };

    service.updateEquipmentCgmpMatrix('EQ1', 'PH', 'PLT', 'VOL', updateDto).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/EQ1/PH/PLT/VOL`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(mockResponse);
  });

  it('should encode special characters in updateEquipmentCgmpMatrix URL', () => {
    const updateDto = { effDate: '2025-01-01' };
    const mockResponse = { success: true, statusCode: 200 };

    service.updateEquipmentCgmpMatrix('EQ/1', 'P H', 'PLT+X', 'V&L', updateDto).subscribe();

    const req = httpMock.expectOne(
      `${cgmpBaseUrl}/${encodeURIComponent('EQ/1')}/${encodeURIComponent('P H')}/${encodeURIComponent('PLT+X')}/${encodeURIComponent('V&L')}`
    );
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should fetch equipment types cGMP dropdown', () => {
    const mockResponse = [
      { code: 'EQ1', codeDesc: 'Equipment One' },
      { code: 'EQ2', codeDesc: 'Equipment Two' }
    ];

    service.getEquipmentTypesCgmp().subscribe(types => {
      expect(types.length).toBe(2);
      expect(types[0].code).toBe('EQ1');
      expect(types[0].codeDesc).toBe('Equipment One');
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/equipment-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch procedures cGMP dropdown', () => {
    const mockResponse = [
      { code: 'PH', codeDesc: 'Pheresis' },
      { code: 'WB', codeDesc: 'Whole Blood' }
    ];

    service.getProceduresCgmp().subscribe(procedures => {
      expect(procedures.length).toBe(2);
      expect(procedures[0].code).toBe('PH');
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/procedures`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch product types cGMP dropdown and map fields', () => {
    const mockResponse = [
      { productType: 'PLT', productTypeDesc: 'Platelets' },
      { productType: 'RBC', productTypeDesc: 'Red Blood Cells' }
    ];

    service.getProductTypesCgmp().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0].productCode).toBe('PLT');
      expect(products[0].productDesc).toBe('Platelets');
      expect(products[1].productCode).toBe('RBC');
      expect(products[1].productDesc).toBe('Red Blood Cells');
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch parameter codes cGMP dropdown', () => {
    const mockResponse = [
      { code: 'VOL', codeDesc: 'Volume' },
      { code: 'WT', codeDesc: 'Weight' }
    ];

    service.getParameterCodesCgmp().subscribe(codes => {
      expect(codes.length).toBe(2);
      expect(codes[0].code).toBe('VOL');
      expect(codes[0].codeDesc).toBe('Volume');
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/parameters`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle empty array response for getProductTypesCgmp', () => {
    service.getProductTypesCgmp().subscribe(products => {
      expect(products).toEqual([]);
    });

    const req = httpMock.expectOne(`${cgmpBaseUrl}/products`);
    req.flush([]);
  });
});
