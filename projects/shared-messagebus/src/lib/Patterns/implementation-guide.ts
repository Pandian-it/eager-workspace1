/**
 * Step-by-Step Implementation Guide
 * How to implement store communication pattern in your specific MFEs
 */

// ============================================================================
// STEP 1: Update shared-messagebus exports
// ============================================================================

// First, update the public-api.ts to export all the new patterns
// File: projects/shared-messagebus/src/index.ts

/*
// Add these exports to your shared-messagebus index.ts:
export * from './lib/store-communication.pattern';
export * from './lib/Patterns/mfe-store-handlers.pattern';
export * from './lib/Patterns/ngrx-migration-examples';
*/

// ============================================================================
// STEP 2: CART MFE Implementation
// ============================================================================

/**
 * File: projects/cart/src/app/services/cart-store-handler.service.ts
 */
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { MessageBusService } from 'shared-messagebus';
import { BaseMfeStoreHandler } from 'shared-messagebus';

// Import your actual cart selectors
import * as cartSelectors from '../store/cart.selectors';
import { CartState } from '../store/cart.state';

@Injectable({ providedIn: 'root' })
export class CartStoreHandlerService extends BaseMfeStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<CartState>
  ) {
    super(messageBus, store);
  }

  protected getMfeName(): string {
    return 'cart';
  }

  protected canHandleStoreSlice(storeSlice: string): boolean {
    const cartStoreSlices = [
      'cart',
      'cart-items',
      'cart-summary', 
      'cart-totals',
      'cart-discounts',
      'cart-count'
    ];
    return cartStoreSlices.includes(storeSlice);
  }

  protected handleStoreRequest(storeSlice: string): any {
    switch (storeSlice) {
      case 'cart':
        return this.store.select(cartSelectors.getCartState);
        
      case 'cart-items':
        return this.store.select(cartSelectors.getCartItems);
        
      case 'cart-summary':
        return this.store.select(cartSelectors.getCartSummary);
        
      case 'cart-totals':
        return this.store.select(cartSelectors.getCartTotals);
        
      case 'cart-discounts':
        return this.store.select(cartSelectors.getCartDiscounts);

      case 'cart-count':
        return this.store.select(cartSelectors.getCartItemCount);
        
      default:
        return null;
    }
  }
}

/**
 * File: projects/cart/src/app/app.module.ts
 * Add the service to your Cart MFE module providers
 */
/*
import { CartStoreHandlerService } from './services/cart-store-handler.service';

@NgModule({
  // ... other module config
  providers: [
    // ... other providers
    CartStoreHandlerService, // This will auto-start the store handler
  ]
})
export class AppModule { 
  constructor(
    // Inject to ensure it starts up
    private cartStoreHandler: CartStoreHandlerService
  ) {}
}
*/

// ============================================================================
// STEP 3: CHECKOUT MFE Implementation  
// ============================================================================

/**
 * File: projects/checkout/src/app/services/checkout-store-handler.service.ts
 */
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { MessageBusService } from 'shared-messagebus';
import { BaseMfeStoreHandler } from 'shared-messagebus';

// Import your actual checkout selectors
import * as checkoutSelectors from '../store/checkout.selectors';
import { CheckoutState } from '../store/checkout.state';

@Injectable({ providedIn: 'root' })
export class CheckoutStoreHandlerService extends BaseMfeStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<CheckoutState>
  ) {
    super(messageBus, store);
  }

  protected getMfeName(): string {
    return 'checkout';
  }

  protected canHandleStoreSlice(storeSlice: string): boolean {
    const checkoutStoreSlices = [
      'checkout',
      'checkout-payment',
      'checkout-shipping', 
      'checkout-billing',
      'payment-methods',
      'shipping-methods'
    ];
    return checkoutStoreSlices.includes(storeSlice);
  }

  protected handleStoreRequest(storeSlice: string): any {
    switch (storeSlice) {
      case 'checkout':
        return this.store.select(checkoutSelectors.getCheckoutState);
        
      case 'checkout-payment':
        return this.store.select(checkoutSelectors.getPaymentInfo);
        
      case 'checkout-shipping':
        return this.store.select(checkoutSelectors.getShippingInfo);
        
      case 'checkout-billing':
        return this.store.select(checkoutSelectors.getBillingInfo);
        
      case 'payment-methods':
        return this.store.select(checkoutSelectors.getPaymentMethods);

      case 'shipping-methods':
        return this.store.select(checkoutSelectors.getShippingMethods);
        
      default:
        return null;
    }
  }
}

// ============================================================================
// STEP 4: ORDERS MFE Implementation
// ============================================================================

/**
 * File: projects/orders/src/app/services/orders-store-handler.service.ts
 */
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { MessageBusService } from 'shared-messagebus';
import { BaseMfeStoreHandler } from 'shared-messagebus';

// Import your actual orders selectors
import * as ordersSelectors from '../store/orders.selectors';
import { OrdersState } from '../store/orders.state';

@Injectable({ providedIn: 'root' })
export class OrdersStoreHandlerService extends BaseMfeStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<OrdersState>
  ) {
    super(messageBus, store);
  }

  protected getMfeName(): string {
    return 'orders';
  }

  protected canHandleStoreSlice(storeSlice: string): boolean {
    const ordersStoreSlices = [
      'orders',
      'order-history',
      'current-order',
      'order-status'
    ];
    return ordersStoreSlices.includes(storeSlice);
  }

  protected handleStoreRequest(storeSlice: string): any {
    switch (storeSlice) {
      case 'orders':
        return this.store.select(ordersSelectors.getOrdersState);
        
      case 'order-history':
        return this.store.select(ordersSelectors.getOrderHistory);
        
      case 'current-order':
        return this.store.select(ordersSelectors.getCurrentOrder);
        
      case 'order-status':
        return this.store.select(ordersSelectors.getOrderStatus);
        
      default:
        return null;
    }
  }
}

// ============================================================================
// STEP 5: SHELL MFE - Consumer Example
// ============================================================================

/**
 * File: projects/shell/src/app/components/cart-widget.component.ts
 * Example of using the message bus pattern in the shell to access cart data
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TypedStoreAccessService } from 'shared-messagebus';

@Component({
  selector: 'app-cart-widget',
  template: `
    <div class="cart-widget">
      <button class="cart-button" [routerLink]="['/cart']">
        <span class="cart-icon">🛒</span>
        <span class="cart-count" *ngIf="cartCount$ | async as count">
          {{ count }}
        </span>
      </button>
      <div class="cart-total" *ngIf="cartTotal$ | async as total">
        {{ total | currency }}
      </div>
    </div>
  `,
  styles: [`
    .cart-widget {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cart-button {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
    }
    .cart-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: red;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 12px;
    }
  `]
})
export class CartWidgetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  cartCount$: Observable<number>;
  cartTotal$: Observable<number>;

  constructor(
    private storeAccess: TypedStoreAccessService
  ) {}

  ngOnInit() {
    // ✅ Access cart data through message bus instead of direct store access
    this.cartCount$ = this.storeAccess.getCartCount()
      .pipe(takeUntil(this.destroy$));
      
    this.cartTotal$ = this.storeAccess.getCartTotal()
      .pipe(takeUntil(this.destroy$));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ============================================================================
// STEP 6: Update TypedStoreAccessService with your specific methods
// ============================================================================

/**
 * File: projects/shared-messagebus/src/lib/store-communication.pattern.ts
 * Add these methods to the TypedStoreAccessService class:
 */

/*
// Add these methods to TypedStoreAccessService:

// Cart-specific methods
getCartCount(): Observable<number> {
  return this.mfeStoreAccess.requestStoreData('cart', 'cart-count');
}

getCartItems(): Observable<any[]> {
  return this.mfeStoreAccess.requestStoreData('cart', 'cart-items');
}

getCartTotal(): Observable<number> {
  return this.mfeStoreAccess.requestStoreData('cart', 'cart-totals');
}

getCartSummary(): Observable<any> {
  return this.mfeStoreAccess.requestStoreData('cart', 'cart-summary');
}

// Checkout-specific methods
getPaymentMethods(): Observable<any[]> {
  return this.mfeStoreAccess.requestStoreData('checkout', 'payment-methods');
}

getShippingInfo(): Observable<any> {
  return this.mfeStoreAccess.requestStoreData('checkout', 'checkout-shipping');
}

getBillingInfo(): Observable<any> {
  return this.mfeStoreAccess.requestStoreData('checkout', 'checkout-billing');
}

// Orders-specific methods
getOrderHistory(): Observable<any[]> {
  return this.mfeStoreAccess.requestStoreData('orders', 'order-history');
}

getCurrentOrder(): Observable<any> {
  return this.mfeStoreAccess.requestStoreData('orders', 'current-order');
}
*/

// ============================================================================
// STEP 7: Testing the Implementation
// ============================================================================

/**
 * File: projects/shell/src/app/components/test-inter-mfe-communication.component.ts
 * Test component to verify the message bus communication is working
 */
import { Component, OnInit } from '@angular/core';
import { TypedStoreAccessService } from 'shared-messagebus';

@Component({
  selector: 'app-test-communication',
  template: `
    <div class="test-panel">
      <h3>Inter-MFE Communication Test</h3>
      
      <button (click)="testCartAccess()">Test Cart Access</button>
      <button (click)="testCheckoutAccess()">Test Checkout Access</button>
      <button (click)="testOrdersAccess()">Test Orders Access</button>
      
      <div class="results">
        <h4>Results:</h4>
        <pre>{{ testResults | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .test-panel {
      padding: 20px;
      border: 1px solid #ccc;
      margin: 20px;
    }
    .results {
      margin-top: 20px;
      max-height: 300px;
      overflow-y: auto;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
    }
  `]
})
export class TestCommunicationComponent implements OnInit {
  testResults: any = {};

  constructor(
    private storeAccess: TypedStoreAccessService
  ) {}

  ngOnInit() {
    this.testResults.initialized = new Date().toISOString();
  }

  testCartAccess() {
    console.log('Testing cart access...');
    
    this.storeAccess.getCartItems().subscribe({
      next: (items) => {
        this.testResults.cartItems = items;
        console.log('Cart items received:', items);
      },
      error: (error) => {
        this.testResults.cartError = error.message;
        console.error('Cart access error:', error);
      }
    });

    this.storeAccess.getCartTotal().subscribe({
      next: (total) => {
        this.testResults.cartTotal = total;
        console.log('Cart total received:', total);
      },
      error: (error) => {
        this.testResults.cartTotalError = error.message;
        console.error('Cart total error:', error);
      }
    });
  }

  testCheckoutAccess() {
    console.log('Testing checkout access...');
    
    this.storeAccess.getPaymentMethods().subscribe({
      next: (methods) => {
        this.testResults.paymentMethods = methods;
        console.log('Payment methods received:', methods);
      },
      error: (error) => {
        this.testResults.paymentMethodsError = error.message;
        console.error('Payment methods error:', error);
      }
    });
  }

  testOrdersAccess() {
    console.log('Testing orders access...');
    
    this.storeAccess.getOrderHistory().subscribe({
      next: (orders) => {
        this.testResults.orderHistory = orders;
        console.log('Order history received:', orders);
      },
      error: (error) => {
        this.testResults.orderHistoryError = error.message;
        console.error('Order history error:', error);
      }
    });
  }
}

// ============================================================================
// IMPLEMENTATION CHECKLIST
// ============================================================================

/*
📋 IMPLEMENTATION CHECKLIST:

□ STEP 1: Update shared-messagebus exports
  □ Add new pattern exports to index.ts
  □ Build shared-messagebus library

□ STEP 2: Implement Cart MFE Store Handler
  □ Create CartStoreHandlerService
  □ Import actual cart selectors and state
  □ Add to Cart module providers
  □ Test cart store responses

□ STEP 3: Implement Checkout MFE Store Handler  
  □ Create CheckoutStoreHandlerService
  □ Import actual checkout selectors and state
  □ Add to Checkout module providers
  □ Test checkout store responses

□ STEP 4: Implement Orders MFE Store Handler
  □ Create OrdersStoreHandlerService
  □ Import actual orders selectors and state
  □ Add to Orders module providers
  □ Test orders store responses

□ STEP 5: Update Shell MFE consumers
  □ Replace direct store access with TypedStoreAccessService
  □ Update cart widget component
  □ Update any other cross-MFE data access

□ STEP 6: Add typed methods to TypedStoreAccessService
  □ Add cart-specific methods
  □ Add checkout-specific methods  
  □ Add orders-specific methods

□ STEP 7: Test and validate
  □ Create test communication component
  □ Verify message bus communication works
  □ Check error handling and timeouts
  □ Validate caching behavior

□ STEP 8: Remove anti-patterns
  □ Remove direct NgRx selector imports between MFEs
  □ Remove direct store state type imports
  □ Update all components using cross-MFE data

TESTING COMMANDS:
npm run build:shared-messagebus
npm run serve:shell
npm run serve:cart  
npm run serve:checkout
npm run serve:orders

Navigate to test component in shell to verify communication.
*/
