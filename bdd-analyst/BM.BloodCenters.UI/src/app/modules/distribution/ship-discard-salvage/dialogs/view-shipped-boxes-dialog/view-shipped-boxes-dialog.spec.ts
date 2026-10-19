import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ViewShippedBoxesDialogComponent } from './view-shipped-boxes-dialog';
import { ViewShippedBoxesDialogData, ShipDiscardSalvageBox } from '../../models/ship-discard-salvage.model';

describe('ViewShippedBoxesDialogComponent', () => {
  let component: ViewShippedBoxesDialogComponent;
  let fixture: ComponentFixture<ViewShippedBoxesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewShippedBoxesDialogComponent>>;

  const mockBoxes: ShipDiscardSalvageBox[] = [
    {
      boxId: 'BOX0001234',
      boxStatus: 'CL',
      boxType: 'STD',
      boxTypeDescription: 'Standard Box',
      packedByUserId: 'USER01',
      packedByUserName: 'Smith, John',
      packedDate: new Date('2026-05-30T10:30:00Z'),
    },
    {
      boxId: 'BOX0001235',
      boxStatus: 'CL',
      boxType: 'STD',
      boxTypeDescription: 'Standard Box',
      packedByUserId: 'USER01',
      packedByUserName: 'Smith, John',
      packedDate: new Date('2026-05-30T11:00:00Z'),
    },
  ];

  const mockDialogData: ViewShippedBoxesDialogData = {
    shipmentNo: 'DI20260530120000',
    boxes: mockBoxes,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewShippedBoxesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewShippedBoxesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('should have boxId column sortable', () => {
    const columns = (component as any).tableConfig.columns;
    const boxIdCol = columns.find((c: any) => c.key === 'boxId');
    expect(boxIdCol.sortable).toBeTrue();
  });
});
