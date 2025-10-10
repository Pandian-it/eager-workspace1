/**
 * Checkout Feature State Structure
 * Real NgRx implementation with hierarchical selectors
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

// ============================================================================
// STATE INTERFACES
// ============================================================================

export interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit-card' | 'paypal' | 'bank-transfer';
  displayName: string;
  lastFour?: string;
  isDefault: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  cost: number;
  estimatedDays: number;
  description: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Entity States
export interface CheckoutItemsEntityState extends EntityState<CheckoutItem> {
  selectedIds: string[];
  loading: boolean;
  error: string | null;
}

export interface PaymentMethodsEntityState extends EntityState<PaymentMethod> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export interface ShippingMethodsEntityState extends EntityState<ShippingMethod> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export interface AddressesEntityState extends EntityState<Address> {
  shippingAddressId: string | null;
  billingAddressId: string | null;
  loading: boolean;
  error: string | null;
}

// UI State
export interface CheckoutUIState {
  currentStep: number;
  totalSteps: number;
  isProcessing: boolean;
  validationErrors: { [field: string]: string };
  showSummary: boolean;
}

// Computed State
export interface CheckoutComputedState {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}

// Main Feature State
export interface CheckoutFeatureState {
  items: CheckoutItemsEntityState;
  paymentMethods: PaymentMethodsEntityState;
  shippingMethods: ShippingMethodsEntityState;
  addresses: AddressesEntityState;
  ui: CheckoutUIState;
  computed: CheckoutComputedState;
}

export interface AppState {
  checkout: CheckoutFeatureState;
}

// ============================================================================
// ENTITY ADAPTERS
// ============================================================================

export const checkoutItemsAdapter: EntityAdapter<CheckoutItem> = createEntityAdapter<CheckoutItem>();
export const paymentMethodsAdapter: EntityAdapter<PaymentMethod> = createEntityAdapter<PaymentMethod>();
export const shippingMethodsAdapter: EntityAdapter<ShippingMethod> = createEntityAdapter<ShippingMethod>();
export const addressesAdapter: EntityAdapter<Address> = createEntityAdapter<Address>();

// ============================================================================
// INITIAL STATES
// ============================================================================

export const initialCheckoutItemsState: CheckoutItemsEntityState = checkoutItemsAdapter.getInitialState({
  selectedIds: [],
  loading: false,
  error: null
});

export const initialPaymentMethodsState: PaymentMethodsEntityState = paymentMethodsAdapter.getInitialState({
  selectedId: null,
  loading: false,
  error: null
});

export const initialShippingMethodsState: ShippingMethodsEntityState = shippingMethodsAdapter.getInitialState({
  selectedId: null,
  loading: false,
  error: null
});

export const initialAddressesState: AddressesEntityState = addressesAdapter.getInitialState({
  shippingAddressId: null,
  billingAddressId: null,
  loading: false,
  error: null
});

export const initialCheckoutUIState: CheckoutUIState = {
  currentStep: 1,
  totalSteps: 4,
  isProcessing: false,
  validationErrors: {},
  showSummary: false
};

export const initialCheckoutComputedState: CheckoutComputedState = {
  subtotal: 0,
  tax: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  itemCount: 0
};

export const initialCheckoutFeatureState: CheckoutFeatureState = {
  items: initialCheckoutItemsState,
  paymentMethods: initialPaymentMethodsState,
  shippingMethods: initialShippingMethodsState,
  addresses: initialAddressesState,
  ui: initialCheckoutUIState,
  computed: initialCheckoutComputedState
};
