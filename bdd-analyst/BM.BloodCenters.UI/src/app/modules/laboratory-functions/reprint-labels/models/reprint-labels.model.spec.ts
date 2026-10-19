import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  ProcessLabelRequest,
  ProcessLabelResponse,
  VerifyLabelRequest,
  VerifyLabelResponse,
  LabelTypeOption,
  UnitComponent,
  WarningDto,
  PrinterConfigResponse,
  ApiResponse,
  ScreenPhase,
} from './reprint-labels.model';

describe('Reprint Labels Models', () => {
  describe('ValidateUnitResponse', () => {
    it('should hold unit data from BE', () => {
      const res: ValidateUnitResponse = {
        unitId: 'W633319021203',
        collDate: '12-Feb-2019',
        donorDecisionCode: 'Y',
        systemLabelDecision: '73',
        contractId: 'INTERNAL',
        codeScheme: 'I',
        components: null,
      };
      expect(res.unitId).toBe('W633319021203');
      expect(res.donorDecisionCode).toBe('Y');
      expect(res.contractId).toBe('INTERNAL');
    });
  });

  describe('ProcessLabelRequest', () => {

    it('should create with override codes', () => {
      const req: ProcessLabelRequest = {
        unitId: 'W633319021203',
        labelType: 'PFF',
        productCode: 'E5078V00',
        overrides: ['9200', '4321'],
      };
      expect(req.overrides?.length).toBe(2);
      expect(req.overrides).toContain('9200');
    });
  });

  describe('ProcessLabelResponse', () => {

    it('should represent a success response', () => {
      const res: ProcessLabelResponse = {
        unitId: 'W633319021203', collDate: '12-Feb-2019',
        productCode: 'E5078V00', productDescription: 'Frozen RBC',
        productType: 'RBC', label: '73', expiryDate: '12-Feb-2034 23:59',
        rejectReasonCode: null, identifierCode: 'RG', codeScheme: 'I',
        lifeSpanInd: 'Y', specialTestingCode: 'N0107',
        requiresSpecialTesting: true, isMfProduct: false,
        isWarning: false, warningCode: null, warningMessage: null, warnings: null,
      };
      expect(res.isWarning).toBe(false);
      expect(res.label).toBe('73');
      expect(res.requiresSpecialTesting).toBe(true);
    });

  });

  describe('VerifyLabelResponse', () => {
    it('should be complete when all fields match', () => {
      const res: VerifyLabelResponse = {
        unitIdMatch: true, aboMatch: true, productCodeMatch: true,
        dateMatch: true, specialTestingMatch: true,
        verificationComplete: true, requiresSpecialTesting: false,
        dateFieldType: 'EXPIRY', mismatchErrorCode: null, mismatchField: null,
      };
      expect(res.verificationComplete).toBe(true);
      expect(res.mismatchErrorCode).toBeNull();
    });

    it('should report ABO mismatch with error 1509', () => {
      const res: VerifyLabelResponse = {
        unitIdMatch: true, aboMatch: false, productCodeMatch: true,
        dateMatch: true, specialTestingMatch: true,
        verificationComplete: false, requiresSpecialTesting: false,
        dateFieldType: null, mismatchErrorCode: '1509', mismatchField: 'ABO',
      };
      expect(res.verificationComplete).toBe(false);
      expect(res.mismatchErrorCode).toBe('1509');
      expect(res.mismatchField).toBe('ABO');
    });

    it('should report unit ID mismatch with error 1508', () => {
      const res: VerifyLabelResponse = {
        unitIdMatch: false, aboMatch: true, productCodeMatch: true,
        dateMatch: true, specialTestingMatch: true,
        verificationComplete: false, requiresSpecialTesting: false,
        dateFieldType: null, mismatchErrorCode: '1508', mismatchField: 'UnitId',
      };
      expect(res.mismatchErrorCode).toBe('1508');
    });
  });

  describe('LabelTypeOption', () => {
    it('should hold code and description', () => {
      const opt: LabelTypeOption = { code: 'PFF', description: 'Print Full Face Label - ISBT' };
      expect(opt.code).toBe('PFF');
      expect(opt.description).toContain('ISBT');
    });
  });
  describe('WarningDto', () => {
    it('should hold warning code and message', () => {
      const w: WarningDto = { code: '4321', message: 'Unit has Interdiction(s)' };
      expect(w.code).toBe('4321');
    });
  });

  describe('PrinterConfigResponse', () => {

    it('should indicate unconfigured printer', () => {
      const p: PrinterConfigResponse = { configured: false };
      expect(p.configured).toBe(false);
      expect(p.printerName).toBeUndefined();
    });
  });

  describe('ApiResponse', () => {
    it('should support item for single object responses', () => {
      const res: ApiResponse<ValidateUnitResponse> = {
        success: true, statusCode: 200,
        item: { unitId: 'X', collDate: null, donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: null, components: null },
      };
      expect(res.item?.unitId).toBe('X');
      expect(res.data).toBeUndefined();
    });

    it('should support data for list responses', () => {
      const res: ApiResponse<LabelTypeOption> = {
        success: true, statusCode: 200,
        data: [{ code: 'PFF', description: 'Test' }],
      };
      expect(res.data?.length).toBe(1);
      expect(res.item).toBeUndefined();
    });
  });

  describe('ScreenPhase', () => {
    it('should accept valid phase values', () => {
      const phases: ScreenPhase[] = ['ready', 'unit-validated', 'labeled', 'verifying'];
      expect(phases.length).toBe(4);
      expect(phases).toContain('ready');
      expect(phases).toContain('labeled');
    });
  });
});
