import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestKitLookupDialogComponent } from './test-kit-lookup-dialog.component';
import { TestKitLookupDialogData, TestKitDto } from '../../wks.models';

describe('TestKitLookupDialogComponent', () => {
  let component: TestKitLookupDialogComponent;
  let fixture: ComponentFixture<TestKitLookupDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TestKitLookupDialogComponent>>;

  const mockTestKits: TestKitDto[] = [
    {
      kitId: '9012',
      reviewedBy: 'SIVA',
      labCode: 'RT',
      reagentType: 'C',
      name: 'Nhcv Positive',
      expiryDate: '12-DEC-2025',
    },
    {
      kitId: '9034',
      reviewedBy: 'CELESTE',
      labCode: 'RT',
      reagentType: 'R',
      name: 'Nhcv',
      expiryDate: '12-DEC-2025',
    },
    {
      kitId: '4056',
      reviewedBy: 'CYNTHIA',
      labCode: 'RT',
      reagentType: null,
      name: null,
      expiryDate: null,
    },
  ];

  const mockDialogData: TestKitLookupDialogData = {
    testId: 'HIV',
    availableKits: mockTestKits,
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [TestKitLookupDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(TestKitLookupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize with test kit data from dialog data', () => {
      expect(component.testKits().length).toBe(3);
      expect(component.testKits()[0].kitId).toBe('9012');
      expect(component.testKits()[1].kitId).toBe('9034');
      expect(component.testKits()[2].kitId).toBe('4056');
    });

    it('should have no selection initially', () => {
      expect(component.selectedKit()).toBeNull();
      expect(component.hasSelection()).toBe(false);
    });
  });

  describe('Search Functionality', () => {




    it('should filter test kits by lab code', () => {
      component.searchControl.setValue('RT');
      fixture.detectChanges();

      const filtered = component.filteredTestKits();
      expect(filtered.length).toBe(3);
    });



    it('should filter test kits by name', () => {
      component.searchControl.setValue('Positive');
      fixture.detectChanges();

      const filtered = component.filteredTestKits();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Positive');
    });

    it('should filter test kits by expiry date', () => {
      component.searchControl.setValue('12-DEC-2025');
      fixture.detectChanges();

      const filtered = component.filteredTestKits();
      expect(filtered.length).toBe(2);
    });






  });

  describe('Selection', () => {
    it('should select a test kit when onSelectKit is called', () => {
      const firstKit = component.testKits()[0];
      component.onSelectKit(firstKit);

      expect(component.selectedKit()).toEqual(firstKit);
      expect(component.hasSelection()).toBe(true);
    });




  });
  describe('Unique ID Generation', () => {
    it('should generate unique component ID', () => {
      expect(component.componentId).toMatch(/^test-kit-lookup-dialog-\d+$/);
    });




  });
});
