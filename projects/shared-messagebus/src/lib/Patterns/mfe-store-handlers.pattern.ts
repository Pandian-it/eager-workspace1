/**
 * MFE Store Request Handler Pattern
 * 
 * Each MFE should implement this pattern to respond to store data requests
 * from other MFEs via the message bus, replacing direct NgRx selector access.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { 
  MessageBusService, 
  MessageFactory, 
  MessageType, 
  StoreStateRequestMessage,
  MessageTypeGuards 
} from 'shared-messagebus';

/**
 * Generic Store Request Handler for any MFE
 * Each MFE should extend this base class and implement their specific selectors
 */
@Injectable()
export abstract class BaseMfeStoreHandler implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    protected messageBus: MessageBusService,
    protected store: Store<any>
  ) {
    this.setupStoreRequestHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Abstract method that each MFE must implement to handle their specific store slices
   */
  protected abstract handleStoreRequest(storeSlice: string): any;

  /**
   * Abstract method to determine if this MFE can handle the requested store slice
   */
  protected abstract canHandleStoreSlice(storeSlice: string): boolean;

  /**
   * Abstract method to get the MFE name
   */
  protected abstract getMfeName(): string;

  private setupStoreRequestHandling(): void {
    this.messageBus.ofType<StoreStateRequestMessage>(MessageType.STORE_STATE_REQUEST)
      .pipe(
        filter(request => this.shouldHandleRequest(request)),
        takeUntil(this.destroy$)
      )
      .subscribe(request => {
        this.processStoreRequest(request);
      });
  }

  private shouldHandleRequest(request: StoreStateRequestMessage): boolean {
    // Don't handle requests from self
    if (request.source === this.getMfeName()) {
      return false;
    }

    // Check if this MFE can handle the requested store slice
    return this.canHandleStoreSlice(request.payload.storeSlice);
  }

  private processStoreRequest(request: StoreStateRequestMessage): void {
    try {
      // Get the requested data using MFE-specific logic
      const storeData = this.handleStoreRequest(request.payload.storeSlice);

      if (storeData) {
        // Subscribe to the selector and send response
        storeData.pipe(
          map((data: any) => ({
            storeSlice: request.payload.storeSlice,
            data,
            success: true
          })),
          takeUntil(this.destroy$)
        ).subscribe(responsePayload => {
          const response = MessageFactory.createStoreResponse(
            responsePayload,
            request.correlationId,
            this.getMfeName()
          );
          
          this.messageBus.publish(response);
        });
      } else {
        // Send error response
        this.sendErrorResponse(request, `Store slice '${request.payload.storeSlice}' not found`);
      }
    } catch (error) {
      this.sendErrorResponse(request, `Error accessing store: ${error}`);
    }
  }

  private sendErrorResponse(request: StoreStateRequestMessage, errorMessage: string): void {
    const errorResponse = MessageFactory.createStoreResponse(
      {
        storeSlice: request.payload.storeSlice,
        data: null,
        success: false,
        error: errorMessage
      },
      request.correlationId,
      this.getMfeName()
    );
    
    this.messageBus.publish(errorResponse);
  }
}

// ============================================================================
// SPECIFIC MFE IMPLEMENTATIONS
// ============================================================================

/**
 * USER MFE Store Handler
 */
@Injectable({ providedIn: 'root' })
export class UserMfeStoreHandler extends BaseMfeStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<any> // Replace with your actual UserState type
  ) {
    super(messageBus, store);
  }

  protected getMfeName(): string {
    return 'user';
  }

  protected canHandleStoreSlice(storeSlice: string): boolean {
    const userStoreSlices = [
      'user',
      'user-profile', 
      'user-preferences',
      'user-auth',
      'user-permissions'
    ];
    return userStoreSlices.includes(storeSlice);
  }

  protected handleStoreRequest(storeSlice: string): any {
    // Import your actual selectors here
    // import * as userSelectors from './store/user.selectors';
    
    switch (storeSlice) {
      case 'user':
        return this.store.select(/* userSelectors.getCurrentUser */);
        
      case 'user-profile':
        return this.store.select(/* userSelectors.getUserProfile */);
        
      case 'user-preferences':
        return this.store.select(/* userSelectors.getUserPreferences */);
        
      case 'user-auth':
        return this.store.select(/* userSelectors.getAuthState */);
        
      case 'user-permissions':
        return this.store.select(/* userSelectors.getUserPermissions */);
        
      default:
        return null;
    }
  }
}

/**
 * CART MFE Store Handler
 */
@Injectable({ providedIn: 'root' })
export class CartMfeStoreHandler extends BaseMfeStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<any> // Replace with your actual CartState type
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
      'cart-discounts'
    ];
    return cartStoreSlices.includes(storeSlice);
  }

  protected handleStoreRequest(storeSlice: string): any {
    // Import your actual selectors here
    // import * as cartSelectors from './store/cart.selectors';
    
    switch (storeSlice) {
      case 'cart':
        return this.store.select(/* cartSelectors.getCartState */);
        
      case 'cart-items':
        return this.store.select(/* cartSelectors.getCartItems */);
        
      case 'cart-summary':
        return this.store.select(/* cartSelectors.getCartSummary */);
        
      case 'cart-totals':
        return this.store.select(/* cartSelectors.getCartTotals */);
        
      case 'cart-discounts':
        return this.store.select(/* cartSelectors.getCartDiscounts */);
        
      default:
        return null;
    }
  }
}

/**
 * CHECKOUT MFE Store Handler
 */
@Injectable({ providedIn: 'root' })
export class CheckoutMfeStoreHandler extends BaseMfeStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<any> // Replace with your actual CheckoutState type
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
      'payment-methods'
    ];
    return checkoutStoreSlices.includes(storeSlice);
  }

  protected handleStoreRequest(storeSlice: string): any {
    // Import your actual selectors here
    // import * as checkoutSelectors from './store/checkout.selectors';
    
    switch (storeSlice) {
      case 'checkout':
        return this.store.select(/* checkoutSelectors.getCheckoutState */);
        
      case 'checkout-payment':
        return this.store.select(/* checkoutSelectors.getPaymentInfo */);
        
      case 'checkout-shipping':
        return this.store.select(/* checkoutSelectors.getShippingInfo */);
        
      case 'checkout-billing':
        return this.store.select(/* checkoutSelectors.getBillingInfo */);
        
      case 'payment-methods':
        return this.store.select(/* checkoutSelectors.getPaymentMethods */);
        
      default:
        return null;
    }
  }
}
