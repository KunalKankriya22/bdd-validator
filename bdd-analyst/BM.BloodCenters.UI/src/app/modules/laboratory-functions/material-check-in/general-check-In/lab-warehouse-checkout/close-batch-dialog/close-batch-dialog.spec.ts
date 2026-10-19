import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CloseBatchDialogComponent, CloseBatchDialogData } from './close-batch-dialog';

describe('CloseBatchDialogComponent', () => {
  let component: CloseBatchDialogComponent;
  let fixture: ComponentFixture<CloseBatchDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CloseBatchDialogComponent>>;

  const mockDialogData: CloseBatchDialogData = {
    title: 'Test Title',
    message: 'Test Message',
    confirmText: 'CONFIRM',
    cancelText: 'CANCEL'
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        CloseBatchDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CloseBatchDialogComponent>>;
    fixture = TestBed.createComponent(CloseBatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should display message from data', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const message = compiled.querySelector('p');
    expect(message?.textContent).toContain('Test Message');
  });





  it('should set default button text if not provided', () => {
    const dataWithoutButtons: CloseBatchDialogData = {
      title: 'Test',
      message: 'Message'
    };

    // Reconfigure TestBed with data that doesn't have button text
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        CloseBatchDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: dataWithoutButtons }
      ]
    });

    const newFixture = TestBed.createComponent(CloseBatchDialogComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.data.confirmText).toBe('CONFIRM');
    expect(newComponent.data.cancelText).toBe('CANCEL');
  });

  it('should have proper accessibility attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button[aria-label]');
    expect(buttons.length).toBe(2);
  });

});
