import { TestBed } from '@angular/core/testing';
import { DonorStateService, SelectedDonorContext } from './donor-state.service';

describe('DonorStateService', () => {
  let service: DonorStateService;
  const mockDonor: SelectedDonorContext = {
    donorId: '12345',
    donorName: 'Smith, John',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DonorStateService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('setSelectedDonor', () => {
    it('should set the selected donor', () => {
      // Act
      service.setSelectedDonor(mockDonor);

      // Assert
      const result = service.getSelectedDonor();
      expect(result).toBeTruthy();
      expect(result?.donorId).toBe(mockDonor.donorId);
      expect(result?.donorName).toBe(mockDonor.donorName);
    });

    it('should emit the selected donor through observable', (done) => {
      // Arrange
      const subscription = service.getSelectedDonor$().subscribe((donor) => {
        if (donor) {
          // Assert
          expect(donor.donorId).toBe(mockDonor.donorId);
          expect(donor.donorName).toBe(mockDonor.donorName);
          subscription.unsubscribe();
          done();
        }
      });

      // Act
      service.setSelectedDonor(mockDonor);
    });

    it('should persist to sessionStorage', () => {
      // Act
      service.setSelectedDonor(mockDonor);

      // Assert
      const stored = sessionStorage.getItem('selectedDonor');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.donorId).toBe(mockDonor.donorId);
    });

    it('should add timestamp when setting donor', () => {
      // Arrange
      const donorWithoutTimestamp = {
        donorId: '12345',
        donorName: 'Smith, John',
      };

      // Act
      service.setSelectedDonor(donorWithoutTimestamp as SelectedDonorContext);

      // Assert
      const result = service.getSelectedDonor();
      expect(result?.timestamp).toBeDefined();
      expect(typeof result?.timestamp).toBe('number');
    });
  });

  describe('getSelectedDonor', () => {

    it('should return the selected donor', () => {
      // Arrange
      service.setSelectedDonor(mockDonor);

      // Act
      const result = service.getSelectedDonor();

      // Assert
      expect(result).toBeTruthy();
      expect(result?.donorId).toBe(mockDonor.donorId);
    });

    it('should return null and clear if donor has expired', () => {
      // Arrange - Set donor and manipulate timestamp to be expired
      const donorData: SelectedDonorContext = {
        donorId: '12345',
        donorName: 'Smith, John',
        timestamp: Date.now(),
      };
      service.setSelectedDonor(donorData);

      // Manually set expired timestamp in storage
      const expiredDonor = {
        ...donorData,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      sessionStorage.setItem('selectedDonor', JSON.stringify(expiredDonor));

      // Recreate service to load expired donor from storage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(DonorStateService);

      // Act
      const result = newService.getSelectedDonor();

      // Assert
      expect(result).toBeNull();
      expect(sessionStorage.getItem('selectedDonor')).toBeNull();
    });
  });

  describe('clearSelectedDonor', () => {
    it('should clear the selected donor', () => {
      // Arrange
      service.setSelectedDonor(mockDonor);
      expect(service.getSelectedDonor()).toBeTruthy();

      // Act
      service.clearSelectedDonor();

      // Assert
      expect(service.getSelectedDonor()).toBeNull();
    });


    it('should remove from sessionStorage', () => {
      // Arrange
      service.setSelectedDonor(mockDonor);
      expect(sessionStorage.getItem('selectedDonor')).toBeTruthy();

      // Act
      service.clearSelectedDonor();

      // Assert
      expect(sessionStorage.getItem('selectedDonor')).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    it('should load donor from sessionStorage on service initialization', () => {
      // Arrange
      const storedDonor: SelectedDonorContext = {
        donorId: '67890',
        donorName: 'Doe, Jane',
        timestamp: Date.now(),
      };
      sessionStorage.setItem('selectedDonor', JSON.stringify(storedDonor));

      // Act - Create new instance
      const newService = new DonorStateService();

      // Assert
      const result = newService.getSelectedDonor();
      expect(result).toBeTruthy();
      expect(result?.donorId).toBe(storedDonor.donorId);
    });

    it('should return null if stored data is invalid JSON', () => {
      // Arrange
      sessionStorage.setItem('selectedDonor', 'invalid json{');

      // Act
      const newService = new DonorStateService();

      // Assert
      expect(newService.getSelectedDonor()).toBeNull();
    });

    it('should return null and clear storage if stored donor is expired', () => {
      // Arrange
      const expiredDonor: SelectedDonorContext = {
        donorId: '12345',
        donorName: 'Smith, John',
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      sessionStorage.setItem('selectedDonor', JSON.stringify(expiredDonor));

      // Act
      const newService = new DonorStateService();

      // Assert
      expect(newService.getSelectedDonor()).toBeNull();
      expect(sessionStorage.getItem('selectedDonor')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle sessionStorage errors gracefully', () => {
      // Arrange
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      spyOn(console, 'error');

      // Act
      service.setSelectedDonor(mockDonor);

      // Assert
      expect(console.error).toHaveBeenCalled();
      // Service should still work, just without persistence
      expect(service.getSelectedDonor()).toBeTruthy();

      setItemSpy.mockRestore();
    });

    it('should handle storage read errors gracefully', () => {
      // Arrange
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('StorageError');
      });
      spyOn(console, 'error');

      // Act
      const newService = new DonorStateService();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(newService.getSelectedDonor()).toBeNull();

      getItemSpy.mockRestore();
    });
  });
});
