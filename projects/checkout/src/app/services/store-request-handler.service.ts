import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MessageBusService, StoreStateRequestMessage, StoreStateResponseMessage, MessageFactory, MessageTypeGuards, MessageType } from 'shared-messagebus';

@Injectable({ providedIn: 'root' })
export class StoreRequestHandlerService implements OnDestroy {
  private destroy$ = new Subject<void>();

  // Mock checkout store data - replace with actual NgRx store selectors
  private checkoutData = {
    checkout: {
      currentStep: 1,
      paymentMethod: null,
      shippingAddress: null,
      billingAddress: null,
      orderSummary: null
    },
    'checkout-payment': {
      selectedPaymentMethod: 'credit-card',
      paymentDetails: null,
      isProcessing: false
    },
    'checkout-shipping': {
      selectedShippingMethod: 'standard',
      shippingCost: 9.99,
      estimatedDelivery: '3-5 business days'
    },
    'checkout-summary': {
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      items: []
    }
  };

  constructor(private messageBus: MessageBusService) {
    this.setupStoreRequestHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupStoreRequestHandling(): void {
    // Enhanced filtering approach using new discriminator method
    this.messageBus.ofTypeByDiscriminator<StoreStateRequestMessage>(MessageType.STORE_STATE_REQUEST)
      .pipe(
        filter((request) => {
          // Multiple filter criteria:
          // 1. Must be a checkout-related store slice
          // 2. Must not be from checkout itself (avoid self-requests)
          // 3. Source must be from trusted MFEs
          const trustedSources = ['cart', 'orders', 'shell'];
          
          return this.isCheckoutStoreRequest(request.payload.storeSlice) &&
                 request.source !== 'checkout' &&
                 trustedSources.includes(request.source || '');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((request: StoreStateRequestMessage) => {
        console.log(`[Checkout] Processing filtered store request from ${request.source} for slice '${request.payload.storeSlice}':`, request);
        this.handleStoreRequest(request);
      });
  }

  private isCheckoutStoreRequest(storeSlice: string): boolean {
    const checkoutSlices = [
      'checkout',
      'checkout-payment', 
      'checkout-shipping',
      'checkout-summary'
    ];
    return checkoutSlices.includes(storeSlice);
  }

  private handleStoreRequest(request: StoreStateRequestMessage): void {
    const { storeSlice } = request.payload;
    
    try {
      // Get data from store slice
      const data = this.getStoreData(storeSlice);
      
      // Send response using factory instead of constructor
      const response = MessageFactory.createStoreResponse({
        data,
        storeSlice,
        success: true
      }, request.correlationId, 'checkout');
      
      this.messageBus.publish(response);
      
      console.log(`[Checkout] Responded to store request for '${storeSlice}'`, data);
    } catch (error) {
      // Send error response using factory
      const errorResponse = MessageFactory.createStoreResponse({
        data: null,
        storeSlice,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, request.correlationId, 'checkout');
      
      this.messageBus.publish(errorResponse);
      
      console.error(`[Checkout] Error handling store request for '${storeSlice}':`, error);
    }
  }

  private getStoreData(storeSlice: string): any {
    // In a real implementation, you would use NgRx selectors here
    // For example:
    // return this.store.select(getCheckoutState).pipe(take(1)).toPromise();
    
    switch (storeSlice) {
      case 'checkout':
        return this.checkoutData.checkout;
      
      case 'checkout-payment':
        return this.checkoutData['checkout-payment'];
      
      case 'checkout-shipping':
        return this.checkoutData['checkout-shipping'];
      
      case 'checkout-summary':
        return this.checkoutData['checkout-summary'];
      
      default:
        throw new Error(`Unknown checkout store slice: ${storeSlice}`);
    }
  }

  // Example methods for updating store data (mock implementation)
  updateCheckoutStep(step: number): void {
    this.checkoutData.checkout.currentStep = step;
  }

  updatePaymentMethod(paymentMethod: string): void {
    this.checkoutData['checkout-payment'].selectedPaymentMethod = paymentMethod;
  }

  updateShippingAddress(address: any): void {
    this.checkoutData.checkout.shippingAddress = address;
  }

  updateOrderSummary(summary: any): void {
    this.checkoutData['checkout-summary'] = { ...this.checkoutData['checkout-summary'], ...summary };
  }

  // Method to get current checkout data (for local use)
  getCurrentCheckoutData() {
    return { ...this.checkoutData };
  }
}
