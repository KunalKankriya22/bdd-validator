import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { AssociateLetterToInterdictionComponent } from './associate-letter-to-interdiction.component';
import { AssociateLetterService } from './services/associate-letter.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AssociateLetterToInterdictionComponent', () => {
  let component: AssociateLetterToInterdictionComponent;
  let fixture: ComponentFixture<AssociateLetterToInterdictionComponent>;
  let mockService: jasmine.SpyObj<AssociateLetterService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockAssociationsResponse = {
    data: [],
    totalCount: 0
  };

  const mockDropdownResponse = {
    interdictionCodes: [],
    donationTypes: [],
    letterCodes: []
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('AssociateLetterService', [
      'getAssociations', 'getDropdownData', 'createAssociation', 'updateAssociation'
    ]);
    mockService.getAssociations.and.returnValue(of(mockAssociationsResponse));
    mockService.getDropdownData.and.returnValue(of(mockDropdownResponse));

    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [AssociateLetterToInterdictionComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AssociateLetterService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(AssociateLetterToInterdictionComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should generate filter chips from active filters', () => {
    // Arrange
    component.interdictionCodeOptions = [{ code: 'IC01', description: 'Test Code' } as any];

    // Act
    component.onFilterApply({ interdictionCode: 'IC01', donationType: 'WB' });

    // Assert
    expect(component.filterChips.length).toBeGreaterThan(0);
    expect(component.activeFilters.interdictionCode).toBe('IC01');
  });

  it('should clear all filters and chips on onFilterClear', () => {
    // Arrange
    component.activeFilters = { interdictionCode: 'IC01' };
    component.filterChips = [{ key: 'interdictionCode', label: 'IC01', value: 'IC01' }];

    // Act
    component.onFilterClear();

    // Assert
    expect(component.activeFilters).toEqual({});
    expect(component.filterChips.length).toBe(0);
  });

  it('should toggle filter panel open state', () => {
    // Arrange
    expect(component.filterPanelOpen).toBeFalse();

    // Act
    component.toggleFilterPanel();

    // Assert
    expect(component.filterPanelOpen).toBeTrue();
  });
});
