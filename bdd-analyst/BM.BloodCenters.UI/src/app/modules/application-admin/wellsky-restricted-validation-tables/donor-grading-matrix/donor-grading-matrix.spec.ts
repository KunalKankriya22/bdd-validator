import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DonorGradingMatrixComponent } from './donor-grading-matrix';
import { DonorGradingMatrixService } from './services/donor-grading-matrix.service';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { DonorGradingMatrix } from './models/donor-grading-matrix.model';

describe('DonorGradingMatrixComponent', () => {
  let component: DonorGradingMatrixComponent;
  let fixture: ComponentFixture<DonorGradingMatrixComponent>;
  let mockService: jasmine.SpyObj<DonorGradingMatrixService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;

  const mockData: DonorGradingMatrix[] = [
    { dgmId: 1, lastnameMatch: 'SAME', firstnameMatch: 'SAME', dobMatch: 'SAME', genderMatch: 'M', grade: 1 },
    { dgmId: 2, lastnameMatch: 'DIFF', firstnameMatch: 'SIMM', dobMatch: 'DIFF', genderMatch: 'F', grade: 2 }
  ];

  const mockListResponse = { data: mockData, totalRecords: 2 };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorGradingMatrixService', ['getDonorGradingMatrix']);
    mockService.getDonorGradingMatrix.and.returnValue(of(mockListResponse));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/', events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    const backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = { block: jasmine.createSpy('block').and.returnValue({}) } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);



      TestBed.configureTestingModule({
      imports: [DonorGradingMatrixComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: DonorGradingMatrixService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


      mockService.getDonorGradingMatrix.and.returnValue(of(mockListResponse));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(DonorGradingMatrixComponent);
    component = fixture.componentInstance;


    });










  it('should handle load error', fakeAsync(() => {
    mockService.getDonorGradingMatrix.and.returnValue(throwError(() => new Error('fail')));
    component.loadData();
    tick();
    expect(component.hasError).toBe(true);
  }));

  it('should format lastnameMatch SAME as Same', () => {
    fixture.detectChanges();
    const col = component.tableConfig.columns.find(c => c.key === 'lastnameMatch');
    expect(col?.valueFormatter!('SAME', {} as any)).toBe('Same');
  });

  it('should format genderMatch M as Male', () => {
    fixture.detectChanges();
    const col = component.tableConfig.columns.find(c => c.key === 'genderMatch');
    expect(col?.valueFormatter!('M', {} as any)).toBe('Male');
  });



  it('should open side panel in edit mode', () => {
    component.onRowAction({ action: 'edit', row: mockData[0] });
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(mockData[0]);
  });



  it('should compose sort string correctly', () => {
    fixture.detectChanges();
    component.onSortChange({ column: 'dgmId', direction: 'A' });
    expect(component.requestState.sort).toBe('dgmId_asc');
    component.onSortChange({ column: 'dgmId', direction: 'default' });
    expect(component.requestState.sort).toBeUndefined();
  });



  it('should apply filters', fakeAsync(() => {
    fixture.detectChanges();
    component.applyFilters({ firstnameMatch: 'SAME', lastnameMatch: null, dobMatch: null, genderMatch: null, grade: null });
    tick();
    expect(component.requestState.firstnameMatch).toBe('SAME');
  }));



  it('should handle mode change', () => {
    component.onModeChange('add');
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });


});
