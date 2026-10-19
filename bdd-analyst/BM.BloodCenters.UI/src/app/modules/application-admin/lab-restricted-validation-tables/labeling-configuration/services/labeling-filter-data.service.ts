import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LabelingFilterDataService {
  private dataMap = new Map<string, any[]>();

  setData(key: string, data: any[]): void {
    this.dataMap.set(key, [...data]);
  }

  getData(key: string): any[] {
    return this.dataMap.get(key) || [];
  }

  clearData(key: string): void {
    this.dataMap.delete(key);
  }

  clearAll(): void {
    this.dataMap.clear();
  }
}
