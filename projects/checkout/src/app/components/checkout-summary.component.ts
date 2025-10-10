import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageBusHelper } from 'shared-messagebus';
import { StoreRequestHandlerService } from '../services/store-request-handler.service';

@Component({
  selector: 'app-checkout-summary',
  template: `
    <div class="checkout-summary">
      <h2>Checkout Summary</h2>
      
      <div class="current-checkout-data">
        <h3>Current Checkout State</h3>
        <pre>{{ currentCheckoutData | json }}</pre>
      </div>

      <div class="actions">
        <button (click)="requestCartData()">Get Cart Data from Cart MFE</button>
        <button (click)="requestUserData()">Get User Data from Shell MFE</button>
        <button (click)="updateCheckoutStep(2)">Update Checkout Step</button>
        <button (click)="updatePaymentMethod('paypal')">Set PayPal Payment</button>
      </div>

      <div class="external-data" *ngIf="cartData">
        <h3>Cart Data (from Cart MFE)</h3>
        <pre>{{ cartData | json }}</pre>
      </div>

      <div class="external-data" *ngIf="userData">
        <h3>User Data (from Shell MFE)</h3>
        <pre>{{ userData | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .checkout-summary {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .current-checkout-data, .external-data {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    
    .actions {
      margin: 20px 0;
    }
    
    .actions button {
      margin: 5px 10px 5px 0;
      padding: 10px 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    
    .actions button:hover {
      background-color: #0056b3;
    }
    
    pre {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
      font-size: 12px;
    }
    
    h2 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    
    h3 {
      color: #555;
      margin-top: 0;
    }
  `]
})
export class CheckoutSummaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentCheckoutData: any = {};
  cartData: any = null;
  userData: any = null;

  constructor(
    private messageBusHelper: MessageBusHelper,
    private storeRequestHandler: StoreRequestHandlerService
  ) {}

  ngOnInit(): void {
    this.loadCurrentCheckoutData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentCheckoutData(): void {
    this.currentCheckoutData = this.storeRequestHandler.getCurrentCheckoutData();
  }

  requestCartData(): void {
    console.log('[Checkout] Requesting cart data from Cart MFE...');
    
    this.messageBusHelper.getCartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('[Checkout] Received cart data:', data);
          this.cartData = data;
        },
        error: (error) => {
          console.error('[Checkout] Error getting cart data:', error);
          alert('Failed to get cart data: ' + error.message);
        }
      });
  }

  requestUserData(): void {
    console.log('[Checkout] Requesting user data from Shell MFE...');
    
    this.messageBusHelper.getUserData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('[Checkout] Received user data:', data);
          this.userData = data;
        },
        error: (error) => {
          console.error('[Checkout] Error getting user data:', error);
          alert('Failed to get user data: ' + error.message);
        }
      });
  }

  updateCheckoutStep(step: number): void {
    console.log(`[Checkout] Updating checkout step to ${step}`);
    this.storeRequestHandler.updateCheckoutStep(step);
    this.loadCurrentCheckoutData(); // Refresh display
  }

  updatePaymentMethod(method: string): void {
    console.log(`[Checkout] Updating payment method to ${method}`);
    this.storeRequestHandler.updatePaymentMethod(method);
    this.loadCurrentCheckoutData(); // Refresh display
  }

  // Example of using MessageBusHelper to communicate checkout updates to other MFEs
  notifyCheckoutProgress(): void {
    this.messageBusHelper.notifyCheckoutStarted({
      checkoutId: 'checkout-123',
      step: this.currentCheckoutData.checkout.currentStep,
      items: this.currentCheckoutData['checkout-summary'].items,
      total: this.currentCheckoutData['checkout-summary'].total
    });
  }
}
