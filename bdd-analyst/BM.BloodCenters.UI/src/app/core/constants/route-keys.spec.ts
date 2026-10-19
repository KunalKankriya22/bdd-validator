import { RouteKey } from './route-keys';

describe('RouteKeys - Modify Component Weight', () => {
  it('should have ModifyComponentWeight route key', () => {
    expect(RouteKey.ModifyComponentWeight).toBe('MODIFY_COMPONENT_WEIGHT');
  });

  it('should have unique value for ModifyComponentWeight', () => {
    const allValues = Object.values(RouteKey);
    const modifyComponentWeightCount = allValues.filter(v => v === RouteKey.ModifyComponentWeight).length;

    expect(modifyComponentWeightCount).toBe(1);
  });

  it('should be accessible from RouteKey object', () => {
    expect(RouteKey.ModifyComponentWeight).toBeDefined();
    expect('ModifyComponentWeight' in RouteKey).toBe(true);
  });

  it('should have correct type', () => {
    const key: typeof RouteKey[keyof typeof RouteKey] = RouteKey.ModifyComponentWeight;
    expect(typeof key).toBe('string');
  });
});
