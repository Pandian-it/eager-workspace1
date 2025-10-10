/**
 * Enhanced MFE Store Handlers for Hierarchical NgRx Selectors
 * 
 * These handlers support real-world NgRx patterns:
 * - Feature-based store organization
 * - Entity adapter patterns  
 * - Complex selector compositions
 * - Parameterized selectors
 * - Multi-level hierarchies
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map, switchMap } from 'rxjs/operators';
import { 
  MessageBusService, 
  MessageFactory, 
  MessageType,
  MessageTypeGuards 
} from 'shared-messagebus';

/**
 * Hierarchical store request message interface
 */
export interface HierarchicalStoreRequestMessage {
  type: MessageType.STORE_STATE_REQUEST;
  payload: {
    feature: string;
    selectorPath: string;
    selectorParams?: { [key: string]: any };
  };
  correlationId: string;
  source: string;
}

/**
 * Base class for handling hierarchical store requests
 */
@Injectable()
export abstract class BaseHierarchicalStoreHandler implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    protected messageBus: MessageBusService,
    protected store: Store<any>
  ) {
    this.setupHierarchicalStoreRequestHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Abstract method to get the MFE name
   */
  protected abstract getMfeName(): string;

  /**
   * Abstract method to determine if this MFE can handle the requested feature
   */
  protected abstract canHandleFeature(feature: string): boolean;

  /**
   * Abstract method to resolve hierarchical selector paths
   */
  protected abstract resolveHierarchicalSelector(
    feature: string,
    selectorPath: string,
    selectorParams?: { [key: string]: any }
  ): Observable<any> | null;

  private setupHierarchicalStoreRequestHandling(): void {
    this.messageBus.ofType<HierarchicalStoreRequestMessage>(MessageType.STORE_STATE_REQUEST)
      .pipe(
        filter(request => this.shouldHandleRequest(request)),
        takeUntil(this.destroy$)
      )
      .subscribe(request => {
        this.processHierarchicalStoreRequest(request);
      });
  }

  private shouldHandleRequest(request: HierarchicalStoreRequestMessage): boolean {
    // Don't handle requests from self
    if (request.source === this.getMfeName()) {
      return false;
    }

    // Check if this MFE can handle the requested feature
    return this.canHandleFeature(request.payload.feature);
  }

  private processHierarchicalStoreRequest(request: HierarchicalStoreRequestMessage): void {
    try {
      const { feature, selectorPath, selectorParams } = request.payload;
      
      // Resolve the hierarchical selector
      const selectorObservable = this.resolveHierarchicalSelector(feature, selectorPath, selectorParams);

      if (selectorObservable) {
        // Subscribe to the selector and send response
        selectorObservable.pipe(
          map((data: any) => ({
            feature,
            selectorPath,
            selectorParams,
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
        this.sendErrorResponse(
          request, 
          `Hierarchical selector '${feature}.${selectorPath}' not found`
        );
      }
    } catch (error) {
      this.sendErrorResponse(request, `Error resolving hierarchical selector: ${error}`);
    }
  }

  private sendErrorResponse(request: HierarchicalStoreRequestMessage, errorMessage: string): void {
    const errorResponse = MessageFactory.createStoreResponse(
      {
        feature: request.payload.feature,
        selectorPath: request.payload.selectorPath,
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
// CART MFE - Hierarchical Store Handler
// ============================================================================

@Injectable({ providedIn: 'root' })
export class CartHierarchicalStoreHandler extends BaseHierarchicalStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<any> // Replace with CartState
  ) {
    super(messageBus, store);
  }

  protected getMfeName(): string {
    return 'cart';
  }

  protected canHandleFeature(feature: string): boolean {
    const cartFeatures = ['cart', 'cart-ui', 'cart-analytics'];
    return cartFeatures.includes(feature);
  }

  protected resolveHierarchicalSelector(
    feature: string,
    selectorPath: string,
    selectorParams?: { [key: string]: any }
  ): Observable<any> | null {
    
    // Import your actual selectors - this is just an example structure
    // import * as cartSelectors from '../store/cart.selectors';
    // import * as cartEntitySelectors from '../store/cart-entity.selectors';
    
    switch (feature) {
      case 'cart':
        return this.resolveCartSelectors(selectorPath, selectorParams);
      case 'cart-ui':
        return this.resolveCartUISelectors(selectorPath, selectorParams);
      case 'cart-analytics':
        return this.resolveCartAnalyticsSelectors(selectorPath, selectorParams);
      default:
        return null;
    }
  }

  private resolveCartSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'entities':
        return this.resolveCartEntitySelectors(pathParts.slice(1), params);
      case 'computed':
        return this.resolveCartComputedSelectors(pathParts.slice(1), params);
      case 'state':
        return this.resolveCartStateSelectors(pathParts.slice(1), params);
      default:
        return null;
    }
  }

  private resolveCartEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    // Example: entities.items, entities.items.byId, entities.items.byCategory
    
    switch (pathParts[0]) {
      case 'items':
        if (pathParts.length === 1) {
          // entities.items - get all cart items
          return this.store.select(/* cartSelectors.getAllCartItems */);
        }
        
        switch (pathParts[1]) {
          case 'byId':
            // entities.items.byId - get cart item by ID
            if (params?.id) {
              return this.store.select(/* cartSelectors.getCartItemById(params.id) */);
            }
            break;
            
          case 'byCategory':
            // entities.items.byCategory - get cart items by category
            if (params?.category) {
              return this.store.select(/* cartSelectors.getCartItemsByCategory(params.category) */);
            }
            break;
            
          case 'active':
            // entities.items.active - get active cart items
            return this.store.select(/* cartSelectors.getActiveCartItems */);
            
          default:
            return null;
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveCartComputedSelectors(pathParts: string[], params?: any): Observable<any> | null {
    // Example: computed.totals, computed.summary, computed.discounts
    
    switch (pathParts[0]) {
      case 'totals':
        return this.store.select(/* cartSelectors.getCartTotals */);
        
      case 'summary':
        return this.store.select(/* cartSelectors.getCartSummary */);
        
      case 'discounts':
        if (pathParts[1] === 'applied') {
          return this.store.select(/* cartSelectors.getAppliedDiscounts */);
        }
        return this.store.select(/* cartSelectors.getAvailableDiscounts */);
        
      case 'itemCount':
        return this.store.select(/* cartSelectors.getCartItemCount */);
        
      default:
        return null;
    }
  }

  private resolveCartStateSelectors(pathParts: string[], params?: any): Observable<any> | null {
    // Example: state.loading, state.errors, state.lastUpdated
    
    switch (pathParts[0]) {
      case 'loading':
        return this.store.select(/* cartSelectors.getCartLoadingState */);
        
      case 'errors':
        return this.store.select(/* cartSelectors.getCartErrors */);
        
      case 'lastUpdated':
        return this.store.select(/* cartSelectors.getCartLastUpdated */);
        
      default:
        return null;
    }
  }

  private resolveCartUISelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'state':
        // cart-ui.state.isOpen, cart-ui.state.activeTab
        if (pathParts[1] === 'isOpen') {
          return this.store.select(/* cartUISelectors.getCartUIOpen */);
        }
        if (pathParts[1] === 'activeTab') {
          return this.store.select(/* cartUISelectors.getActiveCartTab */);
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveCartAnalyticsSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'metrics':
        // cart-analytics.metrics.addToCartEvents
        return this.store.select(/* cartAnalyticsSelectors.getCartMetrics */);
        
      default:
        return null;
    }
  }
}

// ============================================================================
// PRODUCTS MFE - Hierarchical Store Handler (Entity Adapter Example)
// ============================================================================

@Injectable({ providedIn: 'root' })
export class ProductsHierarchicalStoreHandler extends BaseHierarchicalStoreHandler {
  
  constructor(
    messageBus: MessageBusService,
    store: Store<any> // Replace with ProductsState
  ) {
    super(messageBus, store);
  }

  protected getMfeName(): string {
    return 'products';
  }

  protected canHandleFeature(feature: string): boolean {
    const productFeatures = ['products', 'categories', 'search', 'filters'];
    return productFeatures.includes(feature);
  }

  protected resolveHierarchicalSelector(
    feature: string,
    selectorPath: string,
    selectorParams?: { [key: string]: any }
  ): Observable<any> | null {
    
    switch (feature) {
      case 'products':
        return this.resolveProductSelectors(selectorPath, selectorParams);
      case 'categories':
        return this.resolveCategorySelectors(selectorPath, selectorParams);
      case 'search':
        return this.resolveSearchSelectors(selectorPath, selectorParams);
      case 'filters':
        return this.resolveFilterSelectors(selectorPath, selectorParams);
      default:
        return null;
    }
  }

  private resolveProductSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'entities':
        return this.resolveProductEntitySelectors(pathParts.slice(1), params);
      case 'ui':
        return this.resolveProductUISelectors(pathParts.slice(1), params);
      default:
        return null;
    }
  }

  private resolveProductEntitySelectors(pathParts: string[], params?: any): Observable<any> | null {
    // Entity Adapter patterns: entities.all, entities.byId, entities.filtered
    
    switch (pathParts[0]) {
      case 'all':
        // products.entities.all - get all products (from entity adapter)
        return this.store.select(/* productSelectors.selectAllProducts */);
        
      case 'byId':
        // products.entities.byId - get product by ID
        if (params?.id) {
          return this.store.select(/* productSelectors.selectProductById(params.id) */);
        }
        break;
        
      case 'filtered':
        return this.resolveFilteredProductSelectors(pathParts.slice(1), params);
        
      case 'ids':
        // products.entities.ids - get all product IDs
        return this.store.select(/* productSelectors.selectProductIds */);
        
      case 'total':
        // products.entities.total - get total count
        return this.store.select(/* productSelectors.selectProductTotal */);
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveFilteredProductSelectors(pathParts: string[], params?: any): Observable<any> | null {
    // Example: entities.filtered.byCategory, entities.filtered.byPrice
    
    switch (pathParts[0]) {
      case 'byCategory':
        if (params?.category) {
          return this.store.select(/* productSelectors.selectProductsByCategory(params.category) */);
        }
        break;
        
      case 'byPrice':
        if (params?.minPrice !== undefined && params?.maxPrice !== undefined) {
          return this.store.select(/* productSelectors.selectProductsByPriceRange(params.minPrice, params.maxPrice) */);
        }
        break;
        
      case 'inStock':
        return this.store.select(/* productSelectors.selectInStockProducts */);
        
      case 'featured':
        return this.store.select(/* productSelectors.selectFeaturedProducts */);
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveProductUISelectors(pathParts: string[], params?: any): Observable<any> | null {
    // Example: ui.loading, ui.selectedProduct, ui.viewMode
    
    switch (pathParts[0]) {
      case 'loading':
        return this.store.select(/* productUISelectors.getProductsLoading */);
        
      case 'selectedProduct':
        return this.store.select(/* productUISelectors.getSelectedProduct */);
        
      case 'viewMode':
        return this.store.select(/* productUISelectors.getProductViewMode */);
        
      default:
        return null;
    }
  }

  private resolveSearchSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'results':
        // search.results - get search results
        if (params?.searchTerm) {
          return this.store.select(/* searchSelectors.getSearchResults(params.searchTerm) */);
        }
        break;
        
      case 'suggestions':
        // search.suggestions - get search suggestions
        return this.store.select(/* searchSelectors.getSearchSuggestions */);
        
      case 'history':
        // search.history - get search history
        return this.store.select(/* searchSelectors.getSearchHistory */);
        
      default:
        return null;
    }
    
    return null;
  }

  private resolveCategorySelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'all':
        return this.store.select(/* categorySelectors.getAllCategories */);
        
      case 'tree':
        return this.store.select(/* categorySelectors.getCategoryTree */);
        
      case 'active':
        return this.store.select(/* categorySelectors.getActiveCategory */);
        
      default:
        return null;
    }
  }

  private resolveFilterSelectors(selectorPath: string, params?: any): Observable<any> | null {
    const pathParts = selectorPath.split('.');
    
    switch (pathParts[0]) {
      case 'active':
        return this.store.select(/* filterSelectors.getActiveFilters */);
        
      case 'available':
        return this.store.select(/* filterSelectors.getAvailableFilters */);
        
      default:
        return null;
    }
  }
}

// ============================================================================
// Implementation Example Comments
// ============================================================================

/*
REAL-WORLD IMPLEMENTATION EXAMPLE:

1. Replace comment placeholders with actual selectors:

// Before (commented placeholders):
return this.store.select(/* productSelectors.selectAllProducts * /);

// After (actual implementation):
import * as productSelectors from '../store/products/product.selectors';
return this.store.select(productSelectors.selectAllProducts);

2. Entity Adapter Integration:

// If using @ngrx/entity, your selectors might look like:
const productAdapter = createEntityAdapter<Product>();
const productSelectors = productAdapter.getSelectors();

export const selectAllProducts = createSelector(
  selectProductsState,
  productSelectors.selectAll
);

export const selectProductById = (id: string) => createSelector(
  selectProductsState,
  productSelectors.selectEntities,
  (entities) => entities[id]
);

3. Feature-based Store Organization:

interface AppState {
  cart: CartState;
  products: ProductsState;
  user: UserState;
  // ... other features
}

4. Parameterized Selector Examples:

export const selectProductsByCategory = (category: string) => createSelector(
  selectAllProducts,
  (products) => products.filter(product => product.category === category)
);

export const selectProductsByPriceRange = (minPrice: number, maxPrice: number) => createSelector(
  selectAllProducts,
  (products) => products.filter(product => 
    product.price >= minPrice && product.price <= maxPrice
  )
);

MIGRATION FROM SIMPLE TO HIERARCHICAL:

// Before (simple slice access):
this.storeAccess.getStoreData('cart', 'items')

// After (hierarchical access):
this.hierarchicalStoreAccess.getHierarchicalStoreData(
  'cart',           // target MFE
  'cart',           // feature
  'entities.items'  // hierarchical path
)

// With parameters:
this.hierarchicalStoreAccess.getHierarchicalStoreData(
  'products',
  'products', 
  'entities.filtered.byCategory',
  { category: 'electronics' }
)
*/
