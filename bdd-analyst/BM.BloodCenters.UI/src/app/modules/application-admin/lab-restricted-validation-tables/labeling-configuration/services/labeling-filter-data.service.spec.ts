import { LabelingFilterDataService } from './labeling-filter-data.service';

describe('LabelingFilterDataService', () => {
  let service: LabelingFilterDataService;

  beforeEach(() => {
    service = new LabelingFilterDataService();
  });

  describe('setData / getData', () => {
    it('should store data by key and return a defensive copy', () => {
      const items = [{ id: 1 }, { id: 2 }];
      service.setData('products', items);

      const result = service.getData('products');
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('getData', () => {
    it('should return empty array for unknown keys', () => {
      expect(service.getData('nonexistent')).toEqual([]);
    });
  });

  describe('clearData', () => {
    it('should remove a specific key so getData returns empty array', () => {
      service.setData('filters', [{ type: 'ABO' }]);
      service.clearData('filters');
      expect(service.getData('filters')).toEqual([]);
    });
  });

  describe('clearAll', () => {
    it('should remove all stored data', () => {
      service.setData('a', [1]);
      service.setData('b', [2]);
      service.clearAll();
      expect(service.getData('a')).toEqual([]);
      expect(service.getData('b')).toEqual([]);
    });
  });
});
