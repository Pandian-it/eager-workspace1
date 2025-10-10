/**
 * Store Communication Pattern for MFE NgRx Store Access
 * 
 * This pattern enables secure, decoupled access to other MFEs' store data
 * without direct NgRx selector access, maintaining MFE boundaries.
 * 
 * Key Benefits:
 * - No direct store dependencies between MFEs
 * - Type-safe store data requests
 * - Cached responses for performance
 * - Request/Response correlation
 * - Automatic retry and timeout handling
 */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { 
  filter, 
  map, 
  take, 
  timeout, 
  catchError, 
  shareReplay, 
  switchMap,
  distinctUntilChanged,
  takeUntil 
} from 'rxjs/operators';
import { MessageBusService, MessageFactory, MessageType, StoreStateResponseMessage } from '../Services/Message-Bus.service';

export interface StoreDataCache {
  [storeSlice: string]: {
    data: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

@Injectable({ providedIn: 'root' })
export class MfeStoreAccessService {
  private cache = new BehaviorSubject<StoreDataCache>({});
  private readonly DEFAULT_TIMEOUT = 5000;
  private readonly DEFAULT_CACHE_TTL = 30000; // 30 seconds

  constructor(private messageBus: MessageBusService) {}

  /**
   * Request store data from another MFE with caching
   * @param storeSlice The store slice to request (e.g., 'user', 'cart', 'orders')
   * @param useCache Whether to use cached data if available
   * @param cacheTtl Cache time-to-live in milliseconds
   * @param timeoutMs Request timeout in milliseconds
   */
  getStoreData<T>(
    storeSlice: string, 
    useCache: boolean = true,
    cacheTtl: number = this.DEFAULT_CACHE_TTL,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Observable<T> {
    // Check cache first
    if (useCache) {
      const cachedData = this.getCachedData<T>(storeSlice);
      if (cachedData) {
        return new Observable(subscriber => {
          subscriber.next(cachedData);
          subscriber.complete();
        });
      }
    }

    // Create and send request
    const request = MessageFactory.createStoreRequest(
      { storeSlice }, 
      this.getCurrentMfeName()
    );

    this.messageBus.publish(request);

    // Wait for correlated response
    return this.messageBus.ofTypeByDiscriminator<StoreStateResponseMessage>(MessageType.STORE_STATE_RESPONSE)
      .pipe(
        filter(response => response.correlationId === request.correlationId),
        map(response => {
          const data = response.payload.data as T;
          
          // Cache the response
          if (useCache) {
            this.setCacheData(storeSlice, data, cacheTtl);
          }
          
          return data;
        }),
        take(1),
        timeout(timeoutMs),
        catchError(error => {
          console.error(`Failed to get store data for ${storeSlice}:`, error);
          return throwError(() => new Error(`Store data request failed for ${storeSlice}: ${error.message}`));
        })
      );
  }

  /**
   * Subscribe to store data with automatic updates
   * @param storeSlice The store slice to monitor
   * @param refreshInterval How often to refresh data (in milliseconds)
   */
  subscribeToStoreData<T>(
    storeSlice: string, 
    refreshInterval: number = 60000
  ): Observable<T> {
    return timer(0, refreshInterval).pipe(
      switchMap(() => this.getStoreData<T>(storeSlice, false)), // Always fresh data
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  /**
   * Get multiple store slices in parallel
   * @param storeSlices Array of store slices to request
   * @param useCache Whether to use cached data
   */
  getMultipleStoreData<T extends Record<string, any>>(
    storeSlices: string[],
    useCache: boolean = true
  ): Observable<T> {
    const requests = storeSlices.map(slice => 
      this.getStoreData(slice, useCache).pipe(
        map(data => ({ [slice]: data }))
      )
    );

    return new Observable<T>(subscriber => {
      const results: Partial<T> = {};
      let completedRequests = 0;

      requests.forEach((request, index) => {
        request.subscribe({
          next: (data) => {
            Object.assign(results, data);
            completedRequests++;
            
            if (completedRequests === requests.length) {
              subscriber.next(results as T);
              subscriber.complete();
            }
          },
          error: (error) => {
            subscriber.error(error);
          }
        });
      });
    });
  }

  /**
   * Clear cache for specific store slice or all cache
   * @param storeSlice Optional specific slice to clear
   */
  clearCache(storeSlice?: string): void {
    const currentCache = this.cache.value;
    
    if (storeSlice) {
      delete currentCache[storeSlice];
    } else {
      // Clear all cache
      Object.keys(currentCache).forEach(key => delete currentCache[key]);
    }
    
    this.cache.next({ ...currentCache });
  }

  /**
   * Get current cache state for debugging
   */
  getCacheState(): StoreDataCache {
    return this.cache.value;
  }

  // Private helper methods
  private getCachedData<T>(storeSlice: string): T | null {
    const cached = this.cache.value[storeSlice];
    
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = (now - cached.timestamp) > cached.ttl;
    
    if (isExpired) {
      this.clearCache(storeSlice);
      return null;
    }
    
    return cached.data as T;
  }

  private setCacheData(storeSlice: string, data: any, ttl: number): void {
    const currentCache = this.cache.value;
    
    currentCache[storeSlice] = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.next({ ...currentCache });
  }

  private getCurrentMfeName(): string {
    // Determine MFE name from environment or configuration
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      switch (port) {
        case '4200': return 'shell';
        case '4201': return 'cart';
        case '4202': return 'checkout';
        case '4203': return 'orders';
        case '4204': return 'user';
        default: return 'unknown';
      }
    }
    return 'server';
  }
}

// ============================================================================
// TYPED STORE ACCESS HELPERS
// ============================================================================

/**
 * Typed store access helpers for common store slices
 */
@Injectable({ providedIn: 'root' })
export class TypedStoreAccessService {
  constructor(private storeAccess: MfeStoreAccessService) {}

  // User Store Access
  getCurrentUser(): Observable<any> {
    return this.storeAccess.getStoreData('user');
  }

  getUserProfile(): Observable<any> {
    return this.storeAccess.getStoreData('user-profile');
  }

  getUserPreferences(): Observable<any> {
    return this.storeAccess.getStoreData('user-preferences');
  }

  // Cart Store Access
  getCartItems(): Observable<any> {
    return this.storeAccess.getStoreData('cart');
  }

  getCartSummary(): Observable<any> {
    return this.storeAccess.getStoreData('cart-summary');
  }

  // Order Store Access
  getUserOrders(): Observable<any> {
    return this.storeAccess.getStoreData('orders');
  }

  getOrderHistory(): Observable<any> {
    return this.storeAccess.getStoreData('order-history');
  }

  // Checkout Store Access
  getCheckoutState(): Observable<any> {
    return this.storeAccess.getStoreData('checkout');
  }

  getPaymentMethods(): Observable<any> {
    return this.storeAccess.getStoreData('payment-methods');
  }

  // Combined Data Access
  getUserWithCart(): Observable<{ user: any; cart: any }> {
    return this.storeAccess.getMultipleStoreData(['user', 'cart']);
  }

  getCheckoutCompleteData(): Observable<{ user: any; cart: any; orders: any }> {
    return this.storeAccess.getMultipleStoreData(['user', 'cart', 'orders']);
  }
}
