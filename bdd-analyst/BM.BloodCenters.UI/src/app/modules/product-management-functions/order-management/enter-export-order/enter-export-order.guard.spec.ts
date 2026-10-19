import { of } from 'rxjs';
import { enterExportOrderGuard } from './enter-export-order.guard';

describe('enterExportOrderGuard', () => {
  it('should call component canDeactivate', () => {
    const mockComponent = { canDeactivate: jest.fn().mockReturnValue(true) } as any;
    const result = enterExportOrderGuard(mockComponent, {} as any, {} as any, {} as any);
    expect(mockComponent.canDeactivate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return Observable when component returns Observable', () => {
    const mockObs = of(true);
    const mockComponent = { canDeactivate: jest.fn().mockReturnValue(mockObs) } as any;
    const result = enterExportOrderGuard(mockComponent, {} as any, {} as any, {} as any);
    expect(result).toBe(mockObs);
  });

  it('should return false when component returns false', () => {
    const mockComponent = { canDeactivate: jest.fn().mockReturnValue(false) } as any;
    const result = enterExportOrderGuard(mockComponent, {} as any, {} as any, {} as any);
    expect(result).toBe(false);
  });
});
