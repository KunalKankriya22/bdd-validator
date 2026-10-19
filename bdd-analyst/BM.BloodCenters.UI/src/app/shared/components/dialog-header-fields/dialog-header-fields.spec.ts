import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogHeaderFields } from './dialog-header-fields';
import { TranslateModule } from '@ngx-translate/core';
import { DialogHeaderField } from '@shared/interfaces/dialog.interface';

describe('DialogHeaderFields', () => {
  let component: DialogHeaderFields;
  let fixture: ComponentFixture<DialogHeaderFields>;

  const mockFields: DialogHeaderField[] = [
    { label: 'Location ID', value: 'LOC001' },
    { label: 'Location Name', value: 'Main Hospital' },
    { label: 'Count', value: 42 },
    { label: 'Empty Field', value: null }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        DialogHeaderFields,
        TranslateModule.forRoot()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DialogHeaderFields);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Input properties', () => {


    it('should have default layout as row', () => {
      expect(component.layout).toBe('row');
    });


    it('should accept custom fields', () => {
      component.fields = mockFields;
      expect(component.fields).toEqual(mockFields);
    });

    it('should accept custom emptyValuePlaceholder', () => {
      component.emptyValuePlaceholder = 'N/A';
      expect(component.emptyValuePlaceholder).toBe('N/A');
    });

    it('should accept custom layout', () => {
      component.layout = 'grid';
      expect(component.layout).toBe('grid');
    });

    it('should accept custom columns', () => {
      component.columns = 3;
      expect(component.columns).toBe(3);
    });
  });

  describe('getDisplayValue', () => {
    beforeEach(() => {
      component.fields = mockFields;
    });

    it('should return string value for string field', () => {
      const result = component.getDisplayValue(mockFields[0]);
      expect(result).toBe('LOC001');
    });

    it('should return string value for string with spaces', () => {
      const result = component.getDisplayValue(mockFields[1]);
      expect(result).toBe('Main Hospital');
    });

    it('should convert number to string', () => {
      const result = component.getDisplayValue(mockFields[2]);
      expect(result).toBe('42');
    });

    it('should return placeholder for null value', () => {
      const result = component.getDisplayValue(mockFields[3]);
      expect(result).toBe('--');
    });

    it('should return placeholder for undefined value', () => {
      const field: DialogHeaderField = { label: 'Test', value: undefined };
      const result = component.getDisplayValue(field);
      expect(result).toBe('--');
    });


    it('should use custom placeholder when set', () => {
      component.emptyValuePlaceholder = 'N/A';
      const result = component.getDisplayValue(mockFields[3]);
      expect(result).toBe('N/A');
    });
  });

  describe('getGridStyle', () => {
    it('should return grid template for grid layout', () => {
      component.layout = 'grid';
      component.columns = 3;

      const result = component.getGridStyle();

      expect(result).toEqual({ 'grid-template-columns': 'repeat(3, 1fr)' });
    });

    it('should return grid template with 2 columns by default', () => {
      component.layout = 'grid';

      const result = component.getGridStyle();

      expect(result).toEqual({ 'grid-template-columns': 'repeat(2, 1fr)' });
    });

    it('should return empty object for row layout', () => {
      component.layout = 'row';

      const result = component.getGridStyle();

      expect(result).toEqual({});
    });
  });

  describe('trackByField', () => {
    it('should return label + index as tracking key', () => {
      const field: DialogHeaderField = { label: 'Test Label', value: 'value' };

      const result = component.trackByField(0, field);

      expect(result).toBe('Test Label0');
    });


  });

  describe('Template rendering', () => {
    it('should render fields', () => {
      component.fields = mockFields;
      fixture.detectChanges();

      const fieldElements = fixture.nativeElement.querySelectorAll('.dialog-header-fields__field');
      expect(fieldElements.length).toBe(4);
    });

    it('should display field labels', () => {
      component.fields = [mockFields[0]];
      fixture.detectChanges();

      const labelElement = fixture.nativeElement.querySelector('.dialog-header-fields__label');
      expect(labelElement?.textContent).toContain('Location ID');
    });

    it('should display field values', () => {
      component.fields = [mockFields[0]];
      fixture.detectChanges();

      const valueElement = fixture.nativeElement.querySelector('.dialog-header-fields__value');
      expect(valueElement?.textContent).toContain('LOC001');
    });

    it('should display placeholder for null values', () => {
      component.fields = [mockFields[3]];
      fixture.detectChanges();

      const valueElement = fixture.nativeElement.querySelector('.dialog-header-fields__value');
      expect(valueElement?.textContent).toContain('--');
    });
  });
});
