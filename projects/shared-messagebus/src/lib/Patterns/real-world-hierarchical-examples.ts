/**
 * Real-World NgRx Hierarchical Selector Examples
 * 
 * This file demonstrates how the enhanced pattern handles actual NgRx
 * scenarios with complex selector hierarchies, entity adapters, and
 * feature-based store organization.
 */

// ============================================================================
// REAL NGRX STORE STRUCTURE EXAMPLE
// ============================================================================

/*
// Typical real-world NgRx state structure:

interface AppState {
  // Feature states
  products: ProductsFeatureState;
  cart: CartFeatureState;
  user: UserFeatureState;
  orders: OrdersFeatureState;
  checkout: CheckoutFeatureState;
}

interface ProductsFeatureState {
  products: ProductsEntityState;     // Entity adapter state
  categories: CategoriesState;
  search: SearchState;
  filters: FiltersState;
  ui: ProductsUIState;
}

interface ProductsEntityState {
  ids: string[];
  entities: { [id: string]: Product };
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

interface CartFeatureState {
  cart: CartEntityState;            // Entity adapter for cart items
  ui: CartUIState;                  // UI-specific state
  analytics: CartAnalyticsState;    // Analytics data
}

// Real selectors with entity adapters:
const productAdapter = createEntityAdapter<Product>();
const cartAdapter = createEntityAdapter<CartItem>();

// Feature selectors
const selectProductsFeature = createFeatureSelector<ProductsFeatureState>('products');
const selectCartFeature = createFeatureSelector<CartFeatureState>('cart');

// Entity selectors
const selectProductsEntityState = createSelector(
  selectProductsFeature,
  (state) => state.products
);

const productEntitySelectors = productAdapter.getSelectors(selectProductsEntityState);

// Complex composed selectors
const selectAllProducts = productEntitySelectors.selectAll;
const selectProductById = productEntitySelectors.selectById;
const selectProductEntities = productEntitySelectors.selectEntities;

const selectProductsByCategory = (category: string) => createSelector(
  selectAllProducts,
  (products) => products.filter(p => p.category === category)
);

const selectProductsWithInventory = createSelector(
  selectAllProducts,
  selectInventoryFeature,
  (products, inventory) => products.map(product => ({
    ...product,
    inStock: inventory.items[product.id]?.quantity > 0
  }))
);
*/

// ============================================================================
// ❌ ANTI-PATTERN: Direct Access to Complex Selectors
// ============================================================================

/*
// ❌ DON'T DO THIS - Direct import of complex hierarchical selectors

import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

// ❌ PROBLEM: Direct imports from other MFE's complex selector hierarchy
import { 
  selectAllProducts,
  selectProductById,
  selectProductsByCategory,
  selectProductsWithInventory,
  selectProductsLoading,
  selectProductsError
} from '../../../products/src/app/store/products/product.selectors';

import { 
  selectCartItems,
  selectCartItemById,
  selectCartTotalWithTax,
  selectCartItemsByCategory,
  selectCartUIState
} from '../../../cart/src/app/store/cart/cart.selectors';

@Component({
  selector: 'app-product-recommendations',
  template: `
    <div class="recommendations">
      <h3>Recommended Products</h3>
      <!-- Complex template using multiple MFE selectors -->
      <div *ngFor="let product of recommendedProducts$ | async">
        {{ product.name }} - {{ product.price }}
      </div>
    </div>
  `
})
export class ProductRecommendationsComponent implements OnInit {
  // ❌ PROBLEM: Direct access to complex hierarchical selectors
  recommendedProducts$: Observable<any[]>;
  cartItems$: Observable<any[]>;
  isLoading$: Observable<boolean>;

  constructor(private store: Store) {}

  ngOnInit() {
    // ❌ PROBLEM: Complex selector compositions across MFE boundaries
    this.cartItems$ = this.store.select(selectCartItems);
    this.isLoading$ = this.store.select(selectProductsLoading);
    
    // ❌ PROBLEM: Parameterized selectors from other MFEs
    this.recommendedProducts$ = this.store.select(
      selectProductsByCategory('electronics')
    );
  }
}
*/

// ============================================================================
// ✅ CORRECT PATTERN: Hierarchical Message Bus Access
// ============================================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map, switchMap } from 'rxjs/operators';
import { HierarchicalTypedStoreAccessService } from './hierarchical-store-communication.pattern';

@Component({
  selector: 'app-product-recommendations',
  template: `
    <div class="recommendations">
      <h3>Recommended Products</h3>
      
      <!-- Loading and error states -->
      <div *ngIf="isLoading$ | async" class="loading">Loading recommendations...</div>
      <div *ngIf="error$ | async as error" class="error">{{ error }}</div>
      
      <!-- Product recommendations -->
      <div class="product-grid">
        <div *ngFor="let product of recommendedProducts$ | async" class="product-card">
          <h4>{{ product.name }}</h4>
          <p>{{ product.price | currency }}</p>
          <span class="category">{{ product.category }}</span>
          <button (click)="addToCart(product)" 
                  [disabled]="!product.inStock">
            {{ product.inStock ? 'Add to Cart' : 'Out of Stock' }}
          </button>
        </div>
      </div>
      
      <!-- Cart summary -->
      <div class="cart-summary" *ngIf="cartSummary$ | async as summary">
        <h4>Your Cart</h4>
        <p>{{ summary.itemCount }} items - {{ summary.total | currency }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./product-recommendations.component.css']
})
export class ProductRecommendationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // ✅ GOOD: Observable streams from hierarchical message bus
  recommendedProducts$: Observable<any[]>;
  cartSummary$: Observable<any>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private hierarchicalStoreAccess: HierarchicalTypedStoreAccessService
  ) {}

  ngOnInit() {
    this.loadRecommendations();
    this.loadCartSummary();
    this.setupLoadingState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecommendations(): void {
    // ✅ GOOD: Get cart items to base recommendations on
    const cartItems$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'entities.items'
    );

    // ✅ GOOD: Get products with complex filtering
    this.recommendedProducts$ = cartItems$.pipe(
      switchMap(cartItems => {
        // Get categories from cart items
        const categories = [...new Set(cartItems.map(item => item.category))];
        
        // Get products from those categories
        return this.hierarchicalStoreAccess.getHierarchicalStoreData(
          'products', 'products', 'entities.filtered.byCategory',
          { categories: categories }
        );
      }),
      // Filter out products already in cart
      switchMap(products => 
        cartItems$.pipe(
          map(cartItems => {
            const cartProductIds = cartItems.map(item => item.productId);
            return products.filter(product => !cartProductIds.includes(product.id));
          })
        )
      ),
      takeUntil(this.destroy$)
    );
  }

  private loadCartSummary(): void {
    // ✅ GOOD: Get computed cart totals through hierarchical path
    this.cartSummary$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'computed.summary'
    ).pipe(takeUntil(this.destroy$));
  }

  private setupLoadingState(): void {
    // ✅ GOOD: Get loading states from UI feature slices
    const productsLoading$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'ui.loading'
    );

    const cartLoading$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'ui.loading'
    );

    this.isLoading$ = combineLatest([productsLoading$, cartLoading$]).pipe(
      map(([productsLoading, cartLoading]) => productsLoading || cartLoading),
      takeUntil(this.destroy$)
    );

    // ✅ GOOD: Get error states
    this.error$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'products', 'products', 'ui.error'
    ).pipe(takeUntil(this.destroy$));
  }

  addToCart(product: any): void {
    // This would typically dispatch an action or call a service
    console.log('Adding to cart:', product);
  }
}

// ============================================================================
// ✅ ADVANCED EXAMPLE: E-commerce Dashboard with Multiple MFE Data
// ============================================================================

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <div class="dashboard-grid">
        
        <!-- User Profile Section -->
        <div class="dashboard-card">
          <h3>Welcome Back</h3>
          <div *ngIf="userProfile$ | async as profile">
            <p>{{ profile.name }}</p>
            <p>Member since {{ profile.memberSince | date }}</p>
          </div>
        </div>
        
        <!-- Order History Section -->
        <div class="dashboard-card">
          <h3>Recent Orders</h3>
          <div *ngFor="let order of recentOrders$ | async" class="order-item">
            <span>Order #{{ order.id }}</span>
            <span>{{ order.date | date }}</span>
            <span>{{ order.total | currency }}</span>
            <span class="status" [class]="order.status">{{ order.status }}</span>
          </div>
        </div>
        
        <!-- Cart Status -->
        <div class="dashboard-card">
          <h3>Current Cart</h3>
          <div *ngIf="cartStatus$ | async as cart">
            <p>{{ cart.itemCount }} items</p>
            <p>Total: {{ cart.total | currency }}</p>
            <button *ngIf="cart.itemCount > 0" 
                    (click)="proceedToCheckout()">
              Proceed to Checkout
            </button>
          </div>
        </div>
        
        <!-- Recommendations -->
        <div class="dashboard-card">
          <h3>Recommended for You</h3>
          <div class="product-list">
            <div *ngFor="let product of personalizedRecommendations$ | async" 
                 class="product-item">
              <span>{{ product.name }}</span>
              <span>{{ product.price | currency }}</span>
            </div>
          </div>
        </div>
        
        <!-- Analytics (if user has appropriate permissions) -->
        <div class="dashboard-card" *ngIf="userPermissions$ | async as permissions">
          <h3 *ngIf="permissions.canViewAnalytics">Sales Analytics</h3>
          <div *ngIf="permissions.canViewAnalytics && salesAnalytics$ | async as analytics">
            <p>This Month: {{ analytics.thisMonth | currency }}</p>
            <p>Growth: {{ analytics.growth }}%</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // ✅ GOOD: All data accessed through hierarchical message bus
  userProfile$: Observable<any>;
  userPermissions$: Observable<any>;
  recentOrders$: Observable<any[]>;
  cartStatus$: Observable<any>;
  personalizedRecommendations$: Observable<any[]>;
  salesAnalytics$: Observable<any>;

  constructor(
    private hierarchicalStoreAccess: HierarchicalTypedStoreAccessService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadOrderData();
    this.loadCartData();
    this.loadRecommendations();
    this.loadAnalytics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    // ✅ Get user profile with nested preferences
    this.userProfile$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'user', 'user', 'entities.profile.current'
    ).pipe(takeUntil(this.destroy$));

    // ✅ Get user permissions for conditional display
    this.userPermissions$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'user', 'auth', 'entities.permissions.all'
    ).pipe(takeUntil(this.destroy$));
  }

  private loadOrderData(): void {
    // ✅ Get recent orders with filters
    this.recentOrders$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'orders', 'orders', 'entities.filtered.recent',
      { limit: 5, includeCancelled: false }
    ).pipe(takeUntil(this.destroy$));
  }

  private loadCartData(): void {
    // ✅ Get cart summary with computed totals
    this.cartStatus$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'cart', 'cart', 'computed.summary'
    ).pipe(takeUntil(this.destroy$));
  }

  private loadRecommendations(): void {
    // ✅ Get personalized recommendations based on order history
    this.personalizedRecommendations$ = this.userProfile$.pipe(
      switchMap(profile => 
        this.hierarchicalStoreAccess.getHierarchicalStoreData(
          'products', 'recommendations', 'personalized.forUser',
          { userId: profile.id, limit: 10 }
        )
      ),
      takeUntil(this.destroy$)
    );
  }

  private loadAnalytics(): void {
    // ✅ Load analytics only if user has permissions
    this.salesAnalytics$ = this.userPermissions$.pipe(
      switchMap(permissions => {
        if (permissions.canViewAnalytics) {
          return this.hierarchicalStoreAccess.getHierarchicalStoreData(
            'analytics', 'sales', 'summary.monthly'
          );
        }
        return new Observable(subscriber => subscriber.next(null));
      }),
      takeUntil(this.destroy$)
    );
  }

  proceedToCheckout(): void {
    // Navigate to checkout or emit event
    console.log('Proceeding to checkout...');
  }
}

// ============================================================================
// ✅ SERVICE EXAMPLE: Complex Business Logic with Multiple MFE Data
// ============================================================================

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EcommerceBusinessService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private hierarchicalStoreAccess: HierarchicalTypedStoreAccessService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ GOOD: Complex business logic aggregating data from multiple MFEs
   * using hierarchical selectors
   */
  calculateShippingRecommendations(userId: string): Observable<any> {
    // Get user's shipping preferences
    const userShippingPrefs$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'user', 'user', 'entities.profile.preferences.shipping',
      { userId }
    );

    // Get current cart with shipping calculations
    const cartShippingData$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'cart', 'shipping', 'calculations.current'
    );

    // Get user's order history for shipping analysis
    const shippingHistory$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'orders', 'orders', 'entities.analytics.shipping.byUser',
      { userId, months: 12 }
    );

    // Get available shipping options
    const shippingOptions$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'checkout', 'shipping', 'options.available'
    );

    return combineLatest([
      userShippingPrefs$,
      cartShippingData$,
      shippingHistory$,
      shippingOptions$
    ]).pipe(
      map(([preferences, cartShipping, history, options]) => {
        // Complex business logic to calculate recommendations
        return this.calculateOptimalShipping(preferences, cartShipping, history, options);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * ✅ GOOD: Product recommendation engine using multiple hierarchical selectors
   */
  getPersonalizedProductRecommendations(userId: string): Observable<any[]> {
    // Get user's purchase history with detailed analytics
    const purchaseHistory$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'orders', 'analytics', 'user.purchasePatterns',
      { userId, includeCategories: true, includeBrands: true }
    );

    // Get user's browsing behavior
    const browsingHistory$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'products', 'analytics', 'user.browsingPatterns',
      { userId, days: 30 }
    );

    // Get current cart context
    const cartContext$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'cart', 'analytics', 'context.categories'
    );

    // Get trending products in user's categories
    const trendingProducts$ = this.hierarchicalStoreAccess.getHierarchicalStoreData(
      'products', 'analytics', 'trending.byUserCategories',
      { userId }
    );

    return combineLatest([
      purchaseHistory$,
      browsingHistory$,
      cartContext$,
      trendingProducts$
    ]).pipe(
      map(([purchases, browsing, cart, trending]) => {
        // Machine learning-like recommendation logic
        return this.generateRecommendations(purchases, browsing, cart, trending);
      }),
      takeUntil(this.destroy$)
    );
  }

  private calculateOptimalShipping(preferences: any, cartShipping: any, history: any, options: any): any {
    // Complex shipping calculation logic
    return {
      recommended: 'express',
      reasoning: 'Based on your preferences and order history',
      alternatives: options.filter(opt => opt.available)
    };
  }

  private generateRecommendations(purchases: any, browsing: any, cart: any, trending: any): any[] {
    // Complex recommendation algorithm
    return [
      { id: '1', name: 'Recommended Product 1', score: 0.95 },
      { id: '2', name: 'Recommended Product 2', score: 0.87 }
    ];
  }
}

// ============================================================================
// HIERARCHICAL SELECTOR PATH EXAMPLES
// ============================================================================

/*
REAL-WORLD HIERARCHICAL SELECTOR PATHS:

✅ User MFE:
- user.entities.profile.current
- user.entities.profile.preferences.shipping
- user.entities.profile.preferences.notifications
- user.auth.state.authentication
- user.auth.entities.permissions.byResource
- user.auth.entities.permissions.all

✅ Products MFE:
- products.entities.all
- products.entities.byId
- products.entities.filtered.byCategory
- products.entities.filtered.byPrice
- products.entities.filtered.inStock
- products.search.results
- products.search.suggestions
- products.analytics.trending.byCategory
- products.ui.loading
- products.ui.selectedProduct

✅ Cart MFE:
- cart.entities.items
- cart.entities.items.byId
- cart.entities.items.byCategory
- cart.computed.totals
- cart.computed.summary
- cart.computed.discounts.applied
- cart.ui.state.isOpen
- cart.analytics.metrics

✅ Orders MFE:
- orders.entities.all
- orders.entities.byId
- orders.entities.filtered.byStatus
- orders.entities.filtered.recent
- orders.entities.analytics.user.purchasePatterns
- orders.entities.history.filtered
- orders.analytics.summary.monthly

✅ Checkout MFE:
- checkout.steps.payment.state
- checkout.steps.shipping.state
- checkout.payment.entities.methods.available
- checkout.shipping.options.calculated
- checkout.validation.errors
- checkout.ui.currentStep

This hierarchical approach mirrors real NgRx store structures and provides
type-safe, performant access to complex nested state across MFE boundaries.
*/
