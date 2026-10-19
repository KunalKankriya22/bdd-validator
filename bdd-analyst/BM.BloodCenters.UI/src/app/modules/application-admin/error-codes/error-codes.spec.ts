import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { ErrorCodes } from './error-codes';
import { ErrorCodeDialogService } from './services/error-code-dialog.service';
import { ErrorCodeFacadeService } from './services/error-code-facade.service';
import { TabType } from './models/error-code.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

// Mock component for routing
@Component({
  standalone: true,
  template: ''
})
class MockComponent { }

describe('ErrorCodes', () => {
  let component: ErrorCodes;
  let fixture: ComponentFixture<ErrorCodes>;
  let router: Router;
  let mockDialogService: jasmine.SpyObj<ErrorCodeDialogService>;
  let mockFacadeService: jasmine.SpyObj<ErrorCodeFacadeService>;
  let mockActivatedRoute: any;

  beforeEach(() => {

    // Create spy objects
    mockDialogService = jasmine.createSpyObj('ErrorCodeDialogService', ['openNewCodeDialog']);
    mockDialogService.openNewCodeDialog.and.returnValue(of(undefined));

    mockFacadeService = jasmine.createSpyObj('ErrorCodeFacadeService', [
      'createErrorCode',
      'changeTab',
      'loadErrorCodes'
    ]);
    mockFacadeService.createErrorCode.and.returnValue(of(undefined));

    // Add currentTab$ as a getter that returns a signal (function returning TabType)
    Object.defineProperty(mockFacadeService, 'currentTab$', {
      get: () => jasmine.createSpy('currentTab$').and.returnValue(TabType.DONOR),
      configurable: true
    });

    mockActivatedRoute = {
      children: [],
      snapshot: {}
    };



      TestBed.configureTestingModule({
      imports: [
        ErrorCodes,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([
          { path: 'donor', component: MockComponent },
          { path: 'lab', component: MockComponent },
          { path: 'distribution', component: MockComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideLocationMocks(),
        { provide: ErrorCodeDialogService, useValue: mockDialogService },
        { provide: ErrorCodeFacadeService, useValue: mockFacadeService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: MatSnackBar,
          useValue: createMockMatSnackBar()
        }
      ]
    });


    


      mockDialogService.openNewCodeDialog.calls.reset();


      mockFacadeService.createErrorCode.calls.reset();


      mockFacadeService.changeTab.calls.reset();


      mockFacadeService.loadErrorCodes.calls.reset();


      mockDialogService.openNewCodeDialog.and.returnValue(of(undefined));


      mockFacadeService.createErrorCode.and.returnValue(of(undefined));


    fixture = TestBed.createComponent(ErrorCodes);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();


    });


  it('should initialize with selectedTabIndex as 0', () => {
    expect(component.selectedTabIndex).toBe(0);
  });

  describe('ngOnInit', () => {


    it('should call changeTab if child route is already active', () => {
      spyOn(router, 'navigate');
      mockActivatedRoute.firstChild = {
        snapshot: {
          routeConfig: { path: 'donor' }
        }
      };
      
      component.ngOnInit();
      
      expect(router.navigate).not.toHaveBeenCalled();
      expect(mockFacadeService.changeTab).toHaveBeenCalledWith(TabType.DONOR);
    });
  });

  describe('openNewCodeDialog', () => {






    it('should handle dialog when user cancels', (done) => {
      // Dialog returns false/undefined when cancelled or on error
      mockDialogService.openNewCodeDialog.and.returnValue(of(undefined));

      component.openNewCodeDialog();

      setTimeout(() => {
        // Parent component doesn't handle errors - dialog handles them internally
        expect(mockFacadeService.createErrorCode).not.toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('onTabChange', () => {
    it('should update selectedTabIndex when tab changes', () => {
      const mockEvent = { index: 2 } as any;
      component.onTabChange(mockEvent);
      expect(component.selectedTabIndex).toBe(2);
    });

    it('should navigate to donor route when tab index is 0', () => {
      const mockEvent = { index: 0 } as any;
      spyOn(router, 'navigate');
      
      component.onTabChange(mockEvent);
      
      expect(router.navigate).toHaveBeenCalledWith([TabType.DONOR], { relativeTo: mockActivatedRoute });
      expect(mockFacadeService.changeTab).toHaveBeenCalledWith(TabType.DONOR);
    });

    it('should navigate to lab route when tab index is 1', () => {
      const mockEvent = { index: 1 } as any;
      spyOn(router, 'navigate');
      
      component.onTabChange(mockEvent);
      
      expect(router.navigate).toHaveBeenCalledWith([TabType.LAB], { relativeTo: mockActivatedRoute });
      expect(mockFacadeService.changeTab).toHaveBeenCalledWith(TabType.LAB);
    });

    it('should navigate to distribution route when tab index is 2', () => {
      const mockEvent = { index: 2 } as any;
      spyOn(router, 'navigate');
      
      component.onTabChange(mockEvent);
      
      expect(router.navigate).toHaveBeenCalledWith([TabType.DISTRIBUTION], { relativeTo: mockActivatedRoute });
      expect(mockFacadeService.changeTab).toHaveBeenCalledWith(TabType.DISTRIBUTION);
    });

    it('should handle tab index out of bounds gracefully', () => {
      // Reset spy calls from ngOnInit
      mockFacadeService.changeTab.calls.reset();
      
      const mockEvent = { index: 5 } as any;
      spyOn(router, 'navigate');
      
      component.onTabChange(mockEvent);
      
      // Should not crash, should not navigate, and should not change tab with invalid index
      expect(router.navigate).not.toHaveBeenCalled();
      expect(mockFacadeService.changeTab).not.toHaveBeenCalled();
    });

    it('should handle negative tab index gracefully', () => {
      // Reset spy calls from ngOnInit
      mockFacadeService.changeTab.calls.reset();
      
      const mockEvent = { index: -1 } as any;
      spyOn(router, 'navigate');
      
      component.onTabChange(mockEvent);
      
      // Should not crash, should not navigate, and should not change tab with invalid index
      expect(router.navigate).not.toHaveBeenCalled();
      expect(mockFacadeService.changeTab).not.toHaveBeenCalled();
    });
  });

  describe('getTabIcon', () => {
    describe('when tab is active', () => {
      it('should return error-codes icon path for donor tab when selectedTabIndex is 0', () => {
        component.selectedTabIndex = 0;
        const iconPath = component.getTabIcon('donor');
        expect(iconPath).toBe('assets/images/error-codes/donor.svg');
      });

      it('should return error-codes icon path for lab tab when selectedTabIndex is 1', () => {
        component.selectedTabIndex = 1;
        const iconPath = component.getTabIcon('lab');
        expect(iconPath).toBe('assets/images/error-codes/lab.svg');
      });

      it('should return error-codes icon path for distribution tab when selectedTabIndex is 2', () => {
        component.selectedTabIndex = 2;
        const iconPath = component.getTabIcon('distribution');
        expect(iconPath).toBe('assets/images/error-codes/distribution.svg');
      });
    });

    describe('when tab is inactive', () => {
      it('should return filled navigation icon for donor when not selected', () => {
        component.selectedTabIndex = 1; // lab is selected
        const iconPath = component.getTabIcon('donor');
        expect(iconPath).toBe('assets/images/navigation/filled-donor-functions.svg');
      });

      it('should return filled navigation icon for lab when not selected', () => {
        component.selectedTabIndex = 0; // donor is selected
        const iconPath = component.getTabIcon('lab');
        expect(iconPath).toBe('assets/images/navigation/filled-lab.svg');
      });

      it('should return filled navigation icon for distribution when not selected', () => {
        component.selectedTabIndex = 0; // donor is selected
        const iconPath = component.getTabIcon('distribution');
        expect(iconPath).toBe('assets/images/navigation/filled-distributions.svg');
      });
    });

    describe('filled image mapping', () => {
      it('should correctly map donor to filled-donor-functions', () => {
        component.selectedTabIndex = 2;
        expect(component.getTabIcon('donor')).toContain('filled-donor-functions');
      });

      it('should correctly map lab to filled-lab', () => {
        component.selectedTabIndex = 0;
        expect(component.getTabIcon('lab')).toContain('filled-lab');
      });

      it('should correctly map distribution to filled-distributions', () => {
        component.selectedTabIndex = 1;
        expect(component.getTabIcon('distribution')).toContain('filled-distributions');
      });
    });
  });

});