/**
 * Enhanced Store Communication Pattern for Complex NgRx Hierarchies
 * 
 * This enhanced pattern supports real-world NgRx scenarios with:
 * - Multi-level selector hierarchies (feature.entity.property)
 * - Parameterized selectors with entity IDs
 * - Complex selector compositions
 * - Entity adapter patterns
 * - Feature-based store organization
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

/**
 * Enhanced store data request supporting hierarchical selectors
 */
export interface HierarchicalStoreRequest {
  targetMfe: string;
  feature: string; // Feature slice (e.g., 'cart', 'user', 'products')
  selectorPath: string; // Hierarchical path (e.g., 'entities.products.byId', 'ui.filters.activeCategory')
  selectorParams?: { [key: string]: any }; // Parameters for selectors (e.g., { id: '123', filters: {...} })
  timeout?: number;
  useCache?: boolean;
  cacheTtl?: number;
}

/**
 * Cache structure supporting hierarchical paths
 */
export interface HierarchicalStoreCache {
  [cacheKey: string]: {
    data: any;
    timestamp: number;
    ttl: number;
    params?: any; // Cache parameters for parameterized selectors
  };
}

/**
 * Enhanced MFE Store Access Service for Complex NgRx Hierarchies
 */
@Injectable({ providedIn: 'root' })
export class EnhancedMfeStoreAccessService {
  private cache = new BehaviorSubject<HierarchicalStoreCache>({});
  private readonly DEFAULT_TIMEOUT = 5000;
  private readonly DEFAULT_CACHE_TTL = 30000; // 30 seconds

  constructor(private messageBus: MessageBusService) {}

  /**
   * Request hierarchical store data from another MFE
   * 
   * @example
   * // Simple feature access
   * getHierarchicalStoreData('cart', 'cart', 'items')
   * 
   * // Entity by ID
   * getHierarchicalStoreData('products', 'products', 'entities.byId', { id: '123' })
   * 
   * // Complex nested path
   * getHierarchicalStoreData('user', 'user', 'profile.preferences.notifications')
   * 
   * // Parameterized selector with filters
   * getHierarchicalStoreData('orders', 'orders', 'filtered.byStatus', { status: 'pending', userId: '456' })
   */
  getHierarchicalStoreData<T>(
    targetMfe: string,
    feature: string,
    selectorPath: string,
    selectorParams?: { [key: string]: any },
    useCache: boolean = true,
    cacheTtl: number = this.DEFAULT_CACHE_TTL,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Observable<T> {
    const cacheKey = this.buildCacheKey(targetMfe, feature, selectorPath, selectorParams);

    // Check cache first
    if (useCache) {
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData) {
        return new Observable(subscriber => {
          subscriber.next(cachedData);
          subscriber.complete();
        });
      }
    }

    // Create hierarchical store request
    const request = MessageFactory.createHierarchicalStoreRequest({
      targetMfe,
      feature,
      selectorPath,
      selectorParams,
      timeout: timeoutMs,
      useCache,
      cacheTtl
    }, this.getCurrentMfeName());

    this.messageBus.publish(request);

    // Wait for correlated response
    return this.messageBus.ofTypeByDiscriminator<StoreStateResponseMessage>(MessageType.STORE_STATE_RESPONSE)
      .pipe(
        filter(response => response.correlationId === request.correlationId),
        map(response => {
          if (!response.payload.success) {
            throw new Error(response.payload.error || 'Store request failed');
          }

          const data = response.payload.data as T;
          
          // Cache the response
          if (useCache) {
            this.setCacheData(cacheKey, data, cacheTtl, selectorParams);
          }
          
          return data;
        }),
        take(1),
        timeout(timeoutMs),
        catchError(error => {
          console.error(`Failed to get hierarchical store data for ${targetMfe}.${feature}.${selectorPath}:`, error);
          return throwError(() => new Error(`Hierarchical store request failed: ${error.message}`));
        })
      );
  }

  /**
   * Clear cache for specific hierarchical path
   */
  clearHierarchicalCache(targetMfe: string, feature: string, selectorPath?: string): void {
    const currentCache = this.cache.value;
    const updatedCache = { ...currentCache };

    Object.keys(updatedCache).forEach(key => {
      if (selectorPath) {
        if (key.startsWith(`${targetMfe}.${feature}.${selectorPath}`)) {
          delete updatedCache[key];
        }
      } else {
        if (key.startsWith(`${targetMfe}.${feature}`)) {
          delete updatedCache[key];
        }
      }
    });

    this.cache.next(updatedCache);
  }

  /**
   * Build cache key for hierarchical selectors
   */
  private buildCacheKey(
    targetMfe: string, 
    feature: string, 
    selectorPath: string, 
    selectorParams?: { [key: string]: any }
  ): string {
    let key = `${targetMfe}.${feature}.${selectorPath}`;
    
    if (selectorParams) {
      // Sort params for consistent cache keys
      const sortedParams = Object.keys(selectorParams)
        .sort()
        .reduce((result, paramKey) => {
          result[paramKey] = selectorParams[paramKey];
          return result;
        }, {} as { [key: string]: any });
      
      key += `::${JSON.stringify(sortedParams)}`;
    }
    
    return key;
  }

  private getCachedData<T>(cacheKey: string): T | null {
    const currentCache = this.cache.value;
    const cachedItem = currentCache[cacheKey];
    
    if (!cachedItem) {
      return null;
    }

    const now = Date.now();
    if (now - cachedItem.timestamp > cachedItem.ttl) {
      // Cache expired, remove it
      const updatedCache = { ...currentCache };
      delete updatedCache[cacheKey];
      this.cache.next(updatedCache);
      return null;
    }

    return cachedItem.data as T;
  }

  private setCacheData(
    cacheKey: string, 
    data: any, 
    ttl: number, 
    params?: any
  ): void {
    const currentCache = this.cache.value;
    const updatedCache = {
      ...currentCache,
      [cacheKey]: {
        data,
        timestamp: Date.now(),
        ttl,
        params
      }
    };
    this.cache.next(updatedCache);
  }

  private getCurrentMfeName(): string {
    // Implementation to get current MFE name
    return 'unknown'; // This should be implemented based on your MFE naming strategy
  }
}

/**
 * Typed Store Access Service for Real-World NgRx Hierarchies
 */
@Injectable({ providedIn: 'root' })
export class HierarchicalTypedStoreAccessService {
  
  constructor(private enhancedStoreAccess: EnhancedMfeStoreAccessService) {}

  // ============================================================================
  // CART MFE - Hierarchical Selectors
  // ============================================================================

  /**
   * Get all cart items
   */
  getCartItems(): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'entities.items'
    );
  }

  /**
   * Get specific cart item by ID
   */
  getCartItemById(itemId: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'entities.items.byId', { id: itemId }
    );
  }

  /**
   * Get cart totals with calculations
   */
  getCartTotals(): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'computed.totals'
    );
  }

  /**
   * Get cart UI state (loading, errors, etc.)
   */
  getCartUIState(): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'ui.state'
    );
  }

  /**
   * Get filtered cart items by category
   */
  getCartItemsByCategory(category: string): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'entities.items.byCategory', { category }
    );
  }

  // ============================================================================
  // USER MFE - Profile and Auth Hierarchies
  // ============================================================================

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'user', 'user', 'entities.profile.current'
    );
  }

  /**
   * Get user preferences by category
   */
  getUserPreferences(category?: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'user', 'user', 'entities.profile.preferences', 
      category ? { category } : undefined
    );
  }

  /**
   * Get user authentication state
   */
  getUserAuthState(): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'user', 'auth', 'state.authentication'
    );
  }

  /**
   * Get user permissions for specific resource
   */
  getUserPermissions(resource?: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'user', 'auth', 'entities.permissions.byResource',
      resource ? { resource } : undefined
    );
  }

  // ============================================================================
  // PRODUCTS MFE - Entity Adapter Patterns
  // ============================================================================

  /**
   * Get all products (entity adapter pattern)
   */
  getAllProducts(): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'entities.all'
    );
  }

  /**
   * Get product by ID (entity adapter)
   */
  getProductById(productId: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'entities.byId', { id: productId }
    );
  }

  /**
   * Get products by category with filters
   */
  getProductsByCategory(category: string, filters?: any): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'entities.filtered.byCategory', 
      { category, ...filters }
    );
  }

  /**
   * Get product search results
   */
  getProductSearchResults(searchTerm: string, filters?: any): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'search.results', 
      { searchTerm, ...filters }
    );
  }

  /**
   * Get products loading state
   */
  getProductsLoadingState(): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'ui.loading'
    );
  }

  // ============================================================================
  // ORDERS MFE - Complex Order Hierarchies
  // ============================================================================

  /**
   * Get orders by status with pagination
   */
  getOrdersByStatus(status: string, page?: number, pageSize?: number): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'orders', 'orders', 'entities.filtered.byStatus',
      { status, page, pageSize }
    );
  }

  /**
   * Get order details with line items
   */
  getOrderDetails(orderId: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'orders', 'orders', 'entities.detailed.byId', { id: orderId }
    );
  }

  /**
   * Get order history with filters
   */
  getOrderHistory(filters?: { dateFrom?: Date, dateTo?: Date, status?: string }): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'orders', 'orders', 'entities.history.filtered', filters
    );
  }

  /**
   * Get order analytics data
   */
  getOrderAnalytics(timeframe: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'orders', 'orders', 'analytics.summary', { timeframe }
    );
  }

  // ============================================================================
  // CHECKOUT MFE - Multi-Step Process State
  // ============================================================================

  /**
   * Get checkout step state
   */
  getCheckoutStepState(step: string): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'checkout', 'checkout', `steps.${step}.state`
    );
  }

  /**
   * Get payment methods for user
   */
  getPaymentMethods(userId?: string): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'checkout', 'payment', 'entities.methods.available',
      userId ? { userId } : undefined
    );
  }

  /**
   * Get shipping options for address
   */
  getShippingOptions(address: any): Observable<any[]> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'checkout', 'shipping', 'options.calculated', { address }
    );
  }

  /**
   * Get checkout validation errors
   */
  getCheckoutValidationErrors(): Observable<any> {
    return this.enhancedStoreAccess.getHierarchicalStoreData(
      'checkout', 'checkout', 'validation.errors'
    );
  }
}
