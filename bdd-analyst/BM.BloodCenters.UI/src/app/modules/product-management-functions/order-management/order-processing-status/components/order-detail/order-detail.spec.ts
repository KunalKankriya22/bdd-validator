import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { OrderDetailComponent } from './order-detail';
import { OrderStatusDto } from '../../models/order-processing-status.model';
import { OrderProcessingStatusService } from '../../services/order-processing-status.service';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;

  const mockOrder: OrderStatusDto = {
    orderNo: 'ORD001',
    orderClass: 'ST',
    orderStatus: 'OP',
    insertDate: '2024-06-01T08:30:00Z',
    chapterId: 'CH001',
    orderAge: 24
  };

  const mockService = jasmine.createSpyObj('OrderProcessingStatusService', [
    'getOrderDetail', 'getOrderNotes', 'getAuditTrail'
  ]);
  mockService.getOrderDetail.and.returnValue(of(null));
  mockService.getOrderNotes.and.returnValue(of(null));
  mockService.getAuditTrail.and.returnValue(of([]));

  const translateServiceSpy = createMockTranslateService();
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrderProcessingStatusService, useValue: mockService },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    component.order = mockOrder;
    component.statusColor = 'teal';
    fixture.detectChanges();
  });

  it('should display order number', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('ORD001');
  });




  it('should call getOrderDetail on order change', () => {
    mockService.getOrderDetail.calls.reset();
    component.order = { ...mockOrder, orderNo: 'ORD002' };
    component.ngOnChanges({ order: {} as any });
    expect(mockService.getOrderDetail).toHaveBeenCalledWith('ORD002');
  });
});
