import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    service = new LoadingService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit true when loading starts', (done) => {
    service.loading$.subscribe(loading => {
      expect(loading).toBe(true);
      done();
    });
    service.setLoading(true);
  });

  it('should emit false when loading stops', (done) => {
    const values: boolean[] = [];
    service.loading$.subscribe(loading => {
      values.push(loading);
      if (values.length === 2) {
        expect(values[0]).toBe(true);
        expect(values[1]).toBe(false);
        done();
      }
    });
    service.setLoading(true);
    service.setLoading(false);
  });

  it('should track multiple concurrent requests', (done) => {
    const values: boolean[] = [];
    service.loading$.subscribe(loading => {
      values.push(loading);
    });

    service.setLoading(true);
    service.setLoading(true);
    service.setLoading(false);

    expect(values).toEqual([true, true, true]);

    service.setLoading(false);
    expect(values).toEqual([true, true, true, false]);
    done();
  });

  it('should not go below zero active requests', (done) => {
    const values: boolean[] = [];
    service.loading$.subscribe(loading => {
      values.push(loading);
    });

    service.setLoading(false);
    service.setLoading(false);

    expect(values).toEqual([false, false]);
    done();
  });

  it('isLoading should return the loading$ observable', () => {
    expect(service.isLoading()).toBe(service.loading$);
  });
});
