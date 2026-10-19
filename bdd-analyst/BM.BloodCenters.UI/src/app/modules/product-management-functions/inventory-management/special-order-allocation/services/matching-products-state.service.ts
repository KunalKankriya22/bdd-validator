import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import {
  MatchingProductsDialogData,
  OrderItem,
  OrderItemTableRow,
  OrderTypeItem
} from '../models/special-order-allocation.model';

export interface MatchingProductsResult {
  allocated: boolean;
  count?: number;
  backOrdered?: boolean;
  pickSlipId?: string | null;
}

export interface ParentFormState {
  typeCode: string;
  orderNo: string;
  pickSlipId: string | null;
  selectedOrder: OrderItem | null;
  orders: OrderItem[];
  orderTypes: OrderTypeItem[];
  orderItems: OrderItemTableRow[];
  totalRecords: number;
  pageSize: number;
  pageIndex: number;
  hasRetrieved: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MatchingProductsStateService {
  private readonly router = inject(Router);
  private inputData: MatchingProductsDialogData | null = null;
  private parentState: ParentFormState | null = null;
  private result: MatchingProductsResult | null = null;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      if (this.inputData && !e.urlAfterRedirects.includes('/special-order-allocation')) {
        this.clear();
      }
    });
  }

  saveState(data: MatchingProductsDialogData, parentFormState: ParentFormState): void {
    this.inputData = data;
    this.parentState = parentFormState;
  }

  restoreInputData(): MatchingProductsDialogData | null {
    return this.inputData;
  }

  getParentFormState(): ParentFormState | null {
    return this.parentState;
  }

  setResult(result: MatchingProductsResult): void {
    this.result = result;
  }

  consumeResult(): MatchingProductsResult | null {
    const r = this.result;
    this.result = null;
    return r;
  }

  clear(): void {
    this.inputData = null;
    this.parentState = null;
    this.result = null;
  }
}
