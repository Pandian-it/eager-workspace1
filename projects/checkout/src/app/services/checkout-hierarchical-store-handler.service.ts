/**
 * Enhanced Checkout Store Handler with Real NgRx Hierarchical Selectors
 * 
 * This replaces the mock data with actual NgRx selectors that support
 * hierarchical paths like 'checkout.entities.items.byId'
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { 
  MessageBusService, 
  MessageFactory, 
  MessageType,
  MessageTypeGuards 
} from 'shared-messagebus';
import { BaseHierarchicalStoreHandler } from 'shared-messagebus';

// Import the actual NgRx selectors
import * as checkoutSelectors from '../store/checkout.selectors';
import { CheckoutFeatureState } from '../store/checkout.state';

/**
 * Hierarchical store request interface for checkout
 */
interface CheckoutHierarchicalRequest {
  type: MessageType.STORE_STATE_REQUEST;
  payload: {
    feature: string;
    selectorPath: string;
    selectorParams?: { [key: string]: any };
  };
  correlationId: string;
  source: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutHierarchicalStoreHandler extends BaseHierarchicalStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<{ checkout: CheckoutFeatureState }>
  ) {
    super(messageBus, store);
    console.log('[Checkout] Hierarchical Store Handler initialized');
  }

  protected getMfeName(): string {
    return 'checkout';
  }

  protected canHandleFeature(feature: string): boolean {
    const checkoutFeatures = [
      'checkout',
      'payment', 
      'shipping',
      'validation',
      'analytics'
    ];
    return checkoutFeatures.includes(feature);
  }

  protected resolveHierarchicalSelector(
    feature: string,
    selectorPath: string,
    selectorParams?: { [key: string]: any }
  ): Observable<any> | null {
    
    console.log(`[Checkout] Resolving hierarchical selector: ${feature}.${selectorPath}`, selectorParams);
    
    switch (feature) {
      case 'checkout':
        return this.resolveCheckoutSelectors(selectorPath, selectorParams);
      case 'payment':
        return this.resolvePaymentSelectors(selectorPath, selectorParams);
      case 'shipping':
        return this.resolveShippingSelectors(selectorPath, selectorParams);
      case 'validation':
        return this.resolveValidationSelectors(selectorPath, selectorParams);
      case 'analytics':
        return this.resolveAnalyticsSelectors(selectorPath, selectorParams);
      default:
        console.warn(`[Checkout] Unknown feature: ${feature}`);
        return null;
    }
  }

  // ============================================================================
  // CHECKOUT FEATURE SELECTORS
  // ============================================================================

  private resolveCheckoutSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'entities':
        return this.resolveCheckoutEntitySelectors(pathParts.slice(1), params);
      case 'ui':
        return this.resolveCheckoutUISelectors(pathParts.slice(1), params);
      case 'computed':
        return this.resolveCheckoutComputedSelectors(pathParts.slice(1), params);
      case 'summary':
        return this.resolveCheckoutSummarySelectors(pathParts.slice(1), params);
      case 'steps':
        return this.resolveCheckoutStepsSelectors(pathParts.slice(1), params);
      default:
        console.warn(`[Checkout] Unknown checkout selector path: ${pathParts[0]}`);
        return null;
    }
  }

  private resolveCheckoutEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    switch (pathParts[0]) {
      case 'items':
        return this.resolveItemsEntitySelectors(pathParts.slice(1), params);
      case 'paymentMethods':
        return this.resolvePaymentMethodsEntitySelectors(pathParts.slice(1), params);
      case 'shippingMethods':
        return this.resolveShippingMethodsEntitySelectors(pathParts.slice(1), params);
      case 'addresses':
        return this.resolveAddressesEntitySelectors(pathParts.slice(1), params);
      default:
        return null;
    }
  }

  private resolveItemsEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    if (pathParts.length === 0) {
      // checkout.entities.items - get all checkout items
      return this.store.select(checkoutSelectors.selectAllCheckoutItems);
    }
    
    switch (pathParts[0]) {
      case 'all':
        // checkout.entities.items.all
        return this.store.select(checkoutSelectors.selectAllCheckoutItems);
        
      case 'byId':
        // checkout.entities.items.byId
        if (params?.id) {
          return this.store.select(checkoutSelectors.selectCheckoutItemById(params.id));
        }
        break;
        
      case 'selected':
        // checkout.entities.items.selected
        return this.store.select(checkoutSelectors.selectSelectedCheckoutItems);
        
      case 'byCategory':
        // checkout.entities.items.byCategory
        if (params?.category) {
          return this.store.select(checkoutSelectors.selectCheckoutItemsByCategory(params.category));
        }
        break;
        
      case 'count':
        // checkout.entities.items.count
        return this.store.select(checkoutSelectors.selectCheckoutItemTotal);
        
      case 'loading':
        // checkout.entities.items.loading
        return this.store.select(checkoutSelectors.selectCheckoutItemsLoading);
        
      case 'error':
        // checkout.entities.items.error
        return this.store.select(checkoutSelectors.selectCheckoutItemsError);
        
      default:
        return null;
    }
    
    return null;
  }

  private resolvePaymentMethodsEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    if (pathParts.length === 0) {
      // checkout.entities.paymentMethods
      return this.store.select(checkoutSelectors.selectAllPaymentMethods);
    }
    
    switch (pathParts[0]) {
      case 'all':
        return this.store.select(checkoutSelectors.selectAllPaymentMethods);
        
      case 'available':
        return this.store.select(checkoutSelectors.selectAvailablePaymentMethods);
        
      case 'selected':
        return this.store.select(checkoutSelectors.selectSelectedPaymentMethod);
        
      case 'default':
        return this.store.select(checkoutSelectors.selectDefaultPaymentMethod);
        
      case 'byType':
        if (params?.type) {
          return this.store.select(checkoutSelectors.selectPaymentMethodsByType(params.type));
        }
        break;
        
      case 'byId':
        if (params?.id) {
          return this.store.select(checkoutSelectors.selectPaymentMethodById(params.id));
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveShippingMethodsEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    if (pathParts.length === 0) {
      return this.store.select(checkoutSelectors.selectAllShippingMethods);
    }
    
    switch (pathParts[0]) {
      case 'all':
        return this.store.select(checkoutSelectors.selectAllShippingMethods);
        
      case 'selected':
        return this.store.select(checkoutSelectors.selectSelectedShippingMethod);
        
      case 'bySpeed':
        return this.store.select(checkoutSelectors.selectShippingMethodsBySpeed);
        
      case 'byPriceRange':
        if (params?.minCost !== undefined && params?.maxCost !== undefined) {
          return this.store.select(checkoutSelectors.selectShippingMethodsInPriceRange(params.minCost, params.maxCost));
        }
        break;
        
      case 'byId':
        if (params?.id) {
          return this.store.select(checkoutSelectors.selectShippingMethodById(params.id));
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveAddressesEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    if (pathParts.length === 0) {
      return this.store.select(checkoutSelectors.selectAllAddresses);
    }
    
    switch (pathParts[0]) {
      case 'all':
        return this.store.select(checkoutSelectors.selectAllAddresses);
        
      case 'shipping':
        return this.store.select(checkoutSelectors.selectShippingAddress);
        
      case 'billing':
        return this.store.select(checkoutSelectors.selectBillingAddress);
        
      case 'default':
        return this.store.select(checkoutSelectors.selectDefaultAddresses);
        
      case 'byState':
        if (params?.state) {
          return this.store.select(checkoutSelectors.selectAddressesByState(params.state));
        }
        break;
        
      case 'byId':
        if (params?.id) {
          return this.store.select(checkoutSelectors.selectAddressById(params.id));
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  // ============================================================================
  // UI SELECTORS
  // ============================================================================

  private resolveCheckoutUISelectors(pathParts: string[], params?: any): Observable<any> | null {
    switch (pathParts[0]) {
      case 'currentStep':
        return this.store.select(checkoutSelectors.selectCurrentCheckoutStep);
        
      case 'totalSteps':
        return this.store.select(checkoutSelectors.selectTotalCheckoutSteps);
        
      case 'progress':
        return this.store.select(checkoutSelectors.selectCheckoutProgress);
        
      case 'isProcessing':
        return this.store.select(checkoutSelectors.selectIsCheckoutProcessing);
        
      case 'validationErrors':
        return this.store.select(checkoutSelectors.selectCheckoutValidationErrors);
        
      case 'showSummary':
        return this.store.select(checkoutSelectors.selectShowCheckoutSummary);
        
      default:
        return null;
    }
  }

  // ============================================================================
  // COMPUTED SELECTORS
  // ============================================================================

  private resolveCheckoutComputedSelectors(pathParts: string[], params?: any): Observable<any> | null {
    switch (pathParts[0]) {
      case 'subtotal':
        return this.store.select(checkoutSelectors.selectCheckoutSubtotal);
        
      case 'tax':
        return this.store.select(checkoutSelectors.selectCheckoutTax);
        
      case 'shipping':
        return this.store.select(checkoutSelectors.selectCheckoutShipping);
        
      case 'discount':
        return this.store.select(checkoutSelectors.selectCheckoutDiscount);
        
      case 'total':
        return this.store.select(checkoutSelectors.selectCheckoutTotal);
        
      case 'itemCount':
        return this.store.select(checkoutSelectors.selectCheckoutItemCount);
        
      case 'totals':
        return this.store.select(checkoutSelectors.selectCheckoutTotals);
        
      default:
        return null;
    }
  }

  // ============================================================================
  // SUMMARY SELECTORS
  // ============================================================================

  private resolveCheckoutSummarySelectors(pathParts: string[], params?: any): Observable<any> | null {
    switch (pathParts[0]) {
      case 'complete':
        return this.store.select(checkoutSelectors.selectCompleteCheckoutSummary);
        
      default:
        return null;
    }
  }

  // ============================================================================
  // STEPS SELECTORS
  // ============================================================================

  private resolveCheckoutStepsSelectors(pathParts: string[], params?: any): Observable<any> | null {
    switch (pathParts[0]) {
      case 'current':
        if (pathParts[1] === 'validation') {
          return this.store.select(checkoutSelectors.selectCurrentStepValidation);
        }
        break;
        
      case 'validation':
        if (pathParts[1] === 'byStep' && params?.step) {
          return this.store.select(checkoutSelectors.selectValidationErrorsByStep(params.step));
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  // ============================================================================
  // PAYMENT FEATURE SELECTORS
  // ============================================================================

  private resolvePaymentSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'methods':
        return this.resolvePaymentMethodsEntitySelectors(pathParts.slice(1), params);
        
      case 'selected':
        return this.store.select(checkoutSelectors.selectSelectedPaymentMethod);
        
      default:
        return null;
    }
  }

  // ============================================================================
  // SHIPPING FEATURE SELECTORS
  // ============================================================================

  private resolveShippingSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'methods':
        return this.resolveShippingMethodsEntitySelectors(pathParts.slice(1), params);
        
      case 'address':
        return this.store.select(checkoutSelectors.selectShippingAddress);
        
      case 'selected':
        return this.store.select(checkoutSelectors.selectSelectedShippingMethod);
        
      default:
        return null;
    }
  }

  // ============================================================================
  // VALIDATION FEATURE SELECTORS
  // ============================================================================

  private resolveValidationSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'errors':
        if (pathParts[1] === 'byStep' && params?.step) {
          return this.store.select(checkoutSelectors.selectValidationErrorsByStep(params.step));
        }
        return this.store.select(checkoutSelectors.selectCheckoutValidationErrors);
        
      case 'currentStep':
        return this.store.select(checkoutSelectors.selectCurrentStepValidation);
        
      default:
        return null;
    }
  }

  // ============================================================================
  // ANALYTICS FEATURE SELECTORS
  // ============================================================================

  private resolveAnalyticsSelectors(selectorPath: string, params?: any): Observable<any> | null {
    switch (selectorPath) {
      case 'summary':
        return this.store.select(checkoutSelectors.selectCheckoutAnalytics);
        
      default:
        return null;
    }
  }
}
