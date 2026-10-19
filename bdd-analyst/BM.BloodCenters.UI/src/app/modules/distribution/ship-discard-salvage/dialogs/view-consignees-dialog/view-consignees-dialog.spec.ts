import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ViewConsigneesDialogComponent } from './view-consignees-dialog';
import { ViewConsigneesDialogData } from '../../models/ship-discard-salvage.model';

describe('ViewConsigneesDialogComponent', () => {
  let component: ViewConsigneesDialogComponent;
  let fixture: ComponentFixture<ViewConsigneesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewConsigneesDialogComponent>>;

  const mockDialogData: ViewConsigneesDialogData = {
    shipmentNo: 'DI20260530120000',
    consigneeId: 'DISC001',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewConsigneesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewConsigneesDialogComponent);
    component = fixture.componentInstance;
  });



  it('should have consigneeId column sortable', () => {
    const columns = (component as any).tableConfig.columns;
    const consigneeCol = columns.find((c: any) => c.key === 'consigneeId');
    expect(consigneeCol.sortable).toBeTrue();
  });
});
