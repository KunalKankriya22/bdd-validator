import { DonorStateService, Donor } from './donor.state';

describe('DonorStateService', () => {
  let service: DonorStateService;

  const mockDonor: Donor = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    bloodType: 'O+',
    email: 'john@example.com',
    phone: '1234567890',
  };

  const mockDonor2: Donor = {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    bloodType: 'A-',
    email: 'jane@example.com',
    phone: '0987654321',
  };

  beforeEach(() => {
    service = new DonorStateService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty donors array', () => {
      expect(service.allDonors()).toEqual([]);
    });

    it('should have null selected donor', () => {
      expect(service.currentDonor()).toBeNull();
    });
  });

  describe('setDonors', () => {
    it('should set the donors list', () => {
      service.setDonors([mockDonor, mockDonor2]);
      expect(service.allDonors()).toEqual([mockDonor, mockDonor2]);
    });

    it('should replace existing donors', () => {
      service.setDonors([mockDonor]);
      service.setDonors([mockDonor2]);
      expect(service.allDonors()).toEqual([mockDonor2]);
    });
  });

  describe('addDonor', () => {
    it('should add a donor to the list', () => {
      service.addDonor(mockDonor);
      expect(service.allDonors()).toEqual([mockDonor]);
    });

    it('should append to existing donors', () => {
      service.addDonor(mockDonor);
      service.addDonor(mockDonor2);
      expect(service.allDonors()).toEqual([mockDonor, mockDonor2]);
    });
  });

  describe('updateDonor', () => {
    it('should update a donor by id', () => {
      service.setDonors([mockDonor, mockDonor2]);
      service.updateDonor('1', { firstName: 'Johnny' });
      expect(service.allDonors()[0].firstName).toBe('Johnny');
      expect(service.allDonors()[0].lastName).toBe('Doe');
    });

    it('should not modify other donors', () => {
      service.setDonors([mockDonor, mockDonor2]);
      service.updateDonor('1', { firstName: 'Johnny' });
      expect(service.allDonors()[1]).toEqual(mockDonor2);
    });

    it('should not change anything if id does not match', () => {
      service.setDonors([mockDonor]);
      service.updateDonor('999', { firstName: 'Changed' });
      expect(service.allDonors()[0].firstName).toBe('John');
    });
  });

  describe('deleteDonor', () => {
    it('should remove a donor by id', () => {
      service.setDonors([mockDonor, mockDonor2]);
      service.deleteDonor('1');
      expect(service.allDonors()).toEqual([mockDonor2]);
    });

    it('should not change anything if id does not match', () => {
      service.setDonors([mockDonor]);
      service.deleteDonor('999');
      expect(service.allDonors().length).toBe(1);
    });
  });

  describe('selectDonor', () => {
    it('should set the selected donor', () => {
      service.selectDonor(mockDonor);
      expect(service.currentDonor()).toEqual(mockDonor);
    });

    it('should clear selection when null is passed', () => {
      service.selectDonor(mockDonor);
      service.selectDonor(null);
      expect(service.currentDonor()).toBeNull();
    });
  });

  describe('clearDonors', () => {
    it('should clear all donors and selected donor', () => {
      service.setDonors([mockDonor, mockDonor2]);
      service.selectDonor(mockDonor);

      service.clearDonors();

      expect(service.allDonors()).toEqual([]);
      expect(service.currentDonor()).toBeNull();
    });
  });
});
