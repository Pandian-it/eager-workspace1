/**
 * Before and After Examples: Replacing Direct NgRx Selector Access
 * 
 * This file demonstrates the anti-pattern of direct NgRx selector access
 * between MFEs and shows how to replace it with the message bus pattern.
 */

// ============================================================================
// ❌ ANTI-PATTERN: Direct NgRx Selector Access Between MFEs
// ============================================================================

/**
 * BAD: Orders MFE directly accessing Cart MFE's NgRx store
 * This creates tight coupling and breaks micro-frontend boundaries
 */

/*
// ❌ DON'T DO THIS - Direct access to another MFE's store
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

// ❌ PROBLEM: Importing selectors from another MFE
import { getCartItems, getCartTotal } from '../../../cart/src/app/store/cart.selectors';
import { CartState } from '../../../cart/src/app/store/cart.state';

@Component({
  selector: 'app-order-summary',
  template: `
    <div class="order-summary">
      <h3>Order Summary</h3>
      <div *ngFor="let item of cartItems$ | async">
        {{ item.name }} - {{ item.price }}
      </div>
      <div class="total">Total: {{ cartTotal$ | async }}</div>
    </div>
  `
})
export class OrderSummaryComponent implements OnInit {
  // ❌ PROBLEM: Directly accessing another MFE's store selectors
  cartItems$: Observable<any[]>;
  cartTotal$: Observable<number>;

  constructor(private store: Store<CartState>) {} // ❌ PROBLEM: Injecting CartState

  ngOnInit() {
    // ❌ PROBLEM: Direct selector access across MFE boundaries
    this.cartItems$ = this.store.select(getCartItems);
    this.cartTotal$ = this.store.select(getCartTotal);
  }
}
*/

// ============================================================================
// ✅ CORRECT PATTERN: Using Message Bus for Inter-MFE Store Access
// ============================================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TypedStoreAccessService } from '../store-communication.pattern';

/**
 * ✅ GOOD: Orders MFE accessing Cart data through message bus
 * This maintains micro-frontend boundaries and loose coupling
 */
@Component({
  selector: 'app-order-summary',
  template: `
    <div class="order-summary">
      <h3>Order Summary</h3>
      <div *ngFor="let item of cartItems$ | async">
        {{ item.name }} - {{ item.price }}
      </div>
      <div class="total">Total: {{ cartTotal$ | async }}</div>
      <div *ngIf="isLoading" class="loading">Loading cart data...</div>
    </div>
  `,
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // ✅ GOOD: Observable streams from message bus communication
  cartItems$: Observable<any[]>;
  cartTotal$: Observable<number>;
  isLoading = true;

  constructor(
    private storeAccess: TypedStoreAccessService
  ) {}

  ngOnInit() {
    // ✅ GOOD: Request cart data through message bus
    this.loadCartData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCartData(): void {
    // ✅ GOOD: Access cart items through message bus
    this.cartItems$ = this.storeAccess.getCartItems()
      .pipe(takeUntil(this.destroy$));

    // ✅ GOOD: Access cart total through message bus  
    this.cartTotal$ = this.storeAccess.getCartTotal()
      .pipe(takeUntil(this.destroy$));

    // Handle loading state
    this.cartItems$.subscribe(() => {
      this.isLoading = false;
    });
  }
}

// ============================================================================
// ✅ ADVANCED EXAMPLE: Component with Error Handling and Caching
// ============================================================================

import { Injectable, Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, EMPTY, of, combineLatest } from 'rxjs';
import { takeUntil, catchError, retry, tap, map } from 'rxjs/operators';
import { MfeStoreAccessService } from '../store-communication.pattern';

@Component({
  selector: 'app-advanced-order-summary',
  template: `
    <div class="order-summary">
      <h3>Advanced Order Summary</h3>
      
      <!-- Cart Items Section -->
      <div class="cart-section">
        <h4>Cart Items</h4>
        <div *ngIf="cartItemsLoading" class="loading">Loading cart items...</div>
        <div *ngIf="cartItemsError" class="error">
          Error loading cart items: {{ cartItemsError }}
          <button (click)="retryCartItems()">Retry</button>
        </div>
        <div *ngFor="let item of cartItems$ | async" class="cart-item">
          {{ item.name }} - {{ item.price | currency }}
        </div>
      </div>

      <!-- User Profile Section -->
      <div class="user-section">
        <h4>Customer Info</h4>
        <div *ngIf="userProfileLoading" class="loading">Loading user profile...</div>
        <div *ngIf="userProfileError" class="error">
          Error loading user profile: {{ userProfileError }}
          <button (click)="retryUserProfile()">Retry</button>
        </div>
        <div *ngIf="userProfile$ | async as profile" class="user-profile">
          <p>Name: {{ profile.name }}</p>
          <p>Email: {{ profile.email }}</p>
        </div>
      </div>

      <!-- Totals Section -->
      <div class="totals-section">
        <div class="subtotal">Subtotal: {{ cartTotal$ | async | currency }}</div>
        <div class="total">Total: {{ finalTotal$ | async | currency }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./advanced-order-summary.component.css']
})
export class AdvancedOrderSummaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data streams
  cartItems$: Observable<any[]>;
  cartTotal$: Observable<number>;
  userProfile$: Observable<any>;
  finalTotal$: Observable<number>;

  // Loading and error states
  cartItemsLoading = false;
  cartItemsError: string | null = null;
  userProfileLoading = false;
  userProfileError: string | null = null;

  constructor(
    private storeAccess: MfeStoreAccessService
  ) {}

  ngOnInit() {
    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllData(): void {
    this.loadCartItems();
    this.loadUserProfile();
    this.calculateTotals();
  }

  private loadCartItems(): void {
    this.cartItemsLoading = true;
    this.cartItemsError = null;

    this.cartItems$ = this.storeAccess.requestStoreData('cart', 'cart-items')
      .pipe(
        retry(2), // Retry failed requests twice
        tap(() => {
          this.cartItemsLoading = false;
        }),
        catchError((error) => {
          this.cartItemsLoading = false;
          this.cartItemsError = error.message || 'Failed to load cart items';
          console.error('Cart items loading error:', error);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      );
  }

  private loadUserProfile(): void {
    this.userProfileLoading = true;
    this.userProfileError = null;

    this.userProfile$ = this.storeAccess.requestStoreData('user', 'user-profile')
      .pipe(
        retry(2), // Retry failed requests twice
        tap(() => {
          this.userProfileLoading = false;
        }),
        catchError((error) => {
          this.userProfileLoading = false;
          this.userProfileError = error.message || 'Failed to load user profile';
          console.error('User profile loading error:', error);
          return of(null); // Return null profile instead of empty
        }),
        takeUntil(this.destroy$)
      );
  }

  private calculateTotals(): void {
    // Get cart total through message bus
    this.cartTotal$ = this.storeAccess.requestStoreData('cart', 'cart-totals')
      .pipe(
        catchError((error) => {
          console.error('Cart total loading error:', error);
          return of(0);
        }),
        takeUntil(this.destroy$)
      );

    // Calculate final total (could include tax, shipping, etc.)
    this.finalTotal$ = this.cartTotal$;
  }

  // Retry methods for error recovery
  retryCartItems(): void {
    this.loadCartItems();
  }

  retryUserProfile(): void {
    this.loadUserProfile();
  }
}

// ============================================================================
// ✅ SERVICE EXAMPLE: Business Logic Layer Using Message Bus
// ============================================================================

@Injectable({ providedIn: 'root' })
export class OrderBusinessService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private storeAccess: MfeStoreAccessService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ GOOD: Business method that aggregates data from multiple MFEs
   * using message bus instead of direct store access
   */
  getOrderPreview(): Observable<any> {
    // Get data from multiple MFEs through message bus
    const cartData$ = this.storeAccess.requestStoreData('cart', 'cart-summary');
    const userData$ = this.storeAccess.requestStoreData('user', 'user-profile');
    const checkoutData$ = this.storeAccess.requestStoreData('checkout', 'checkout-shipping');

    // Combine data from multiple MFEs
    return new Observable(observer => {
      const subscription = combineLatest([cartData$, userData$, checkoutData$])
        .pipe(
          map(([cart, user, checkout]) => ({
            items: cart.items,
            user: {
              name: user.name,
              email: user.email
            },
            shipping: checkout.address,
            total: cart.total,
            estimatedDelivery: this.calculateDeliveryDate(checkout.address)
          })),
          takeUntil(this.destroy$)
        )
        .subscribe(observer);

      return () => subscription.unsubscribe();
    });
  }

  private calculateDeliveryDate(address: any): Date {
    // Business logic for delivery calculation
    const deliveryDays = address.state === 'CA' ? 2 : 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    return deliveryDate;
  }
}

// ============================================================================
// Migration Guide Comments
// ============================================================================

/*
MIGRATION STEPS:

1. ❌ REMOVE direct imports of other MFE selectors and state types
   - Delete: import { getCartItems } from '../../../cart/src/app/store/cart.selectors';
   - Delete: import { CartState } from '../../../cart/src/app/store/cart.state';

2. ✅ ADD message bus dependencies
   - Add: import { TypedStoreAccessService } from 'shared-messagebus';
   - Add: constructor(private storeAccess: TypedStoreAccessService)

3. ❌ REPLACE direct store.select() calls
   - Replace: this.store.select(getCartItems)
   - With: this.storeAccess.getCartItems()

4. ✅ ADD proper error handling and loading states
   - Add retry logic for failed requests
   - Add loading and error state management
   - Add proper subscription cleanup

5. ✅ ENSURE each MFE has store request handlers
   - Add appropriate *MfeStoreHandler service to each MFE
   - Configure handler to respond to store requests
   - Test inter-MFE communication

6. ✅ UPDATE module providers
   - Add MfeStoreAccessService to providers
   - Add TypedStoreAccessService to providers
   - Ensure MessageBusService is available

BENEFITS OF THIS PATTERN:
- ✅ Maintains micro-frontend boundaries
- ✅ Loose coupling between MFEs
- ✅ Centralized error handling
- ✅ Caching and performance optimization
- ✅ Type safety with TypeScript
- ✅ Easy testing and mocking
- ✅ Graceful degradation when MFEs are unavailable
*/
