import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessListComponent } from './process-list.component';
import { Process } from '../../models/sp-processes-stages.model';

describe('ProcessListComponent', () => {
  let component: ProcessListComponent;
  let fixture: ComponentFixture<ProcessListComponent>;

  const mockProcesses: Process[] = [
    { code: 'DEGLY', description: 'Deglycerolization' },
    { code: 'FROZ', description: 'Freezing' },
    { code: 'WASH', description: 'Washing' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessListComponent);
    component = fixture.componentInstance;
  });
  describe('isSelected', () => {
    it('should return true when process code matches selectedProcessCode', () => {
      // Arrange
      component.selectedProcessCode = 'DEGLY';
      const process = mockProcesses[0];

      // Act
      const result = component.isSelected(process);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when process code does not match selectedProcessCode', () => {
      // Arrange
      component.selectedProcessCode = 'FROZ';
      const process = mockProcesses[0];

      // Act
      const result = component.isSelected(process);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when selectedProcessCode is null', () => {
      // Arrange
      component.selectedProcessCode = null;
      const process = mockProcesses[0];

      // Act
      const result = component.isSelected(process);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('template rendering', () => {

    it('should display empty message when no processes available', () => {
      // Arrange
      component.processes = [];
      component.isLoading = false;
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const emptyElement = compiled.querySelector('.process-empty');

      // Assert
      expect(emptyElement).toBeTruthy();
      expect(emptyElement.textContent).toContain('No processes available');
    });

    it('should display processes when available', () => {
      // Arrange
      component.processes = mockProcesses;
      component.isLoading = false;
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const listItems = compiled.querySelectorAll('.process-item');

      // Assert
      expect(listItems.length).toBe(3);
    });
  });
});
