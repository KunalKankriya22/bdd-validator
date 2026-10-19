import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { accessLevelGuard, accessLevelChildGuard } from './access-level.guard';
import { AccessLevelService } from '../shared/services/access-level.service';

describe('accessLevelGuard', () => {
  let accessLevelService: AccessLevelService;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    router = { navigate: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        AccessLevelService,
        { provide: Router, useValue: router },
      ],
    });

    accessLevelService = TestBed.inject(AccessLevelService);
  });

  function runGuard(requiredLevel?: number): boolean {
    const route = {
      data: requiredLevel !== undefined ? { requiredAccessLevel: requiredLevel } : {},
    } as unknown as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() => accessLevelGuard(route, {} as RouterStateSnapshot)) as boolean;
  }

  it('should allow access when no required level is specified', () => {
    expect(runGuard()).toBe(true);
  });

  it('should allow access when user has sufficient level', () => {
    accessLevelService.setAccessInfo('user1', 'group1', 5);
    expect(runGuard(3)).toBe(true);
  });

  it('should allow access when user has exact required level', () => {
    accessLevelService.setAccessInfo('user1', 'group1', 5);
    expect(runGuard(5)).toBe(true);
  });

  it('should deny access and redirect to /home when level is insufficient', () => {
    accessLevelService.setAccessInfo('user1', 'group1', 2);
    expect(runGuard(5)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});

describe('accessLevelChildGuard', () => {
  let accessLevelService: AccessLevelService;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    router = { navigate: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        AccessLevelService,
        { provide: Router, useValue: router },
      ],
    });

    accessLevelService = TestBed.inject(AccessLevelService);
  });

  function runChildGuard(url: string): boolean {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => accessLevelChildGuard(route, state)) as boolean;
  }

  it('should allow access when service is not loaded', () => {
    expect(runChildGuard('/admin')).toBe(true);
  });

  it('should allow access when route is accessible', () => {
    accessLevelService.setAccessInfo('user1', 'group1', 5);
    expect(runChildGuard('/home')).toBe(true);
  });

  it('should deny access and redirect when route is not accessible', () => {
    accessLevelService.setAccessInfo('user1', 'group1', 2);
    const map = new Map<string, number>();
    map.set('/admin', 5);
    accessLevelService.setRouteAccessMap(map);

    expect(runChildGuard('/admin')).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
