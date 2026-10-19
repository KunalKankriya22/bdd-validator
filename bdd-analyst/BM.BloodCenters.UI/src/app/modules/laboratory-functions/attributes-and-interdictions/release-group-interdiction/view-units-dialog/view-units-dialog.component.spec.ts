import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ViewUnitsDialogComponent, ViewUnitsDialogData } from './view-units-dialog.component';

describe('ViewUnitsDialogComponent', () => {
  let component: ViewUnitsDialogComponent;
  let fixture: ComponentFixture<ViewUnitsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewUnitsDialogComponent>>;

  const mockData: ViewUnitsDialogData = {
    units: [
      { unitId: 'W334826061101', chkDigit: null, collDate: '2026-01-10T00:00:00' },
      { unitId: 'W334826061102', chkDigit: null, collDate: '2026-01-10T00:00:00' },
    ],
    isLoading: false,
    formatDate: (v) => v ? '10-JAN-2026' : '-',
  };

  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      currentLang: 'en',
      onLangChange: of({ lang: 'en', translations: {} }),
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [ViewUnitsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewUnitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });


  it('should display units data', () => {
    expect(component.data.units.length).toBe(2);
  });


  it('should have selection disabled', () => {
    expect(component.tableConfig.enableSelection).toBe(false);
  });



});
