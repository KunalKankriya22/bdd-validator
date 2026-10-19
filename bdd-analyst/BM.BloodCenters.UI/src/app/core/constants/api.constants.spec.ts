import { API } from './api.constants';

describe('API Constants - Modify Component Weight', () => {
  describe('MODIFY_COMPONENT_WEIGHT', () => {
    it('should have BASE endpoint', () => {
      expect(API.MODIFY_COMPONENT_WEIGHT.BASE).toBe('/api/v1/component-weight');
    });

    it('should generate GET_UNIT_DETAILS endpoint with unitId and chapterId', () => {
      const unitId = 'W1234-18-031311-Z';
      const chapterId = '0001';
      const endpoint = API.MODIFY_COMPONENT_WEIGHT.GET_UNIT_DETAILS(unitId, chapterId);

      expect(endpoint).toContain(`/api/v1/component-weight/units/${encodeURIComponent(unitId)}`);
      expect(endpoint).toContain(`chapterId=${encodeURIComponent(chapterId)}`);
    });

    it('should properly encode special characters in GET_UNIT_DETAILS', () => {
      const unitId = 'W1234-18-031311-Z';
      const chapterId = '0001';
      const endpoint = API.MODIFY_COMPONENT_WEIGHT.GET_UNIT_DETAILS(unitId, chapterId);

      expect(endpoint).toBe('/api/v1/component-weight/units/W1234-18-031311-Z?chapterId=0001');
    });

    it('should generate GET_VALID_PRODUCTS endpoint with all parameters', () => {
      const unitId = 'W1234-18-031311-Z';
      const collDate = '2024-01-15';
      const chapterId = '0001';
      const codeScheme = 'I';

      const endpoint = API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS(unitId, collDate, chapterId, codeScheme);

      expect(endpoint).toContain(`/api/v1/component-weight/components/${encodeURIComponent(unitId)}/products`);
      expect(endpoint).toContain(`collDate=${encodeURIComponent(collDate)}`);
      expect(endpoint).toContain(`chapterId=${encodeURIComponent(chapterId)}`);
      expect(endpoint).toContain(`codeScheme=${encodeURIComponent(codeScheme)}`);
    });

    it('should use default codeScheme "I" in GET_VALID_PRODUCTS when not provided', () => {
      const unitId = 'W1234-18-031311-Z';
      const collDate = '2024-01-15';
      const chapterId = '0001';

      const endpoint = API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS(unitId, collDate, chapterId);

      expect(endpoint).toContain('codeScheme=I');
    });

    it('should properly encode special characters in GET_VALID_PRODUCTS', () => {
      const unitId = 'W1234+18/031311';
      const collDate = '2024-01-15';
      const chapterId = '0001';

      const endpoint = API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS(unitId, collDate, chapterId);

      expect(endpoint).toContain(encodeURIComponent(unitId));
    });

    it('should have UPDATE endpoint', () => {
      expect(API.MODIFY_COMPONENT_WEIGHT.UPDATE).toBe('/api/v1/component-weight/update');
    });
  });
});
