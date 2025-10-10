/**
 * Checkout Hierarchical Selectors
 * Real NgRx selectors with multi-level hierarchy support
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { 
  CheckoutFeatureState, 
  CheckoutItemsEntityState, 
  PaymentMethodsEntityState,
  ShippingMethodsEntityState,
  AddressesEntityState,
  CheckoutUIState,
  CheckoutComputedState,
  checkoutItemsAdapter,
  paymentMethodsAdapter,
  shippingMethodsAdapter,
  addressesAdapter,
  AppState
} from './checkout.state';

// ============================================================================
// FEATURE SELECTOR
// ============================================================================

export const selectCheckoutFeature = createFeatureSelector<CheckoutFeatureState>('checkout');

// ============================================================================
// ENTITY STATE SELECTORS
// ============================================================================

// Items Entity State
export const selectCheckoutItemsState = createSelector(
  selectCheckoutFeature,
  (state: CheckoutFeatureState) => state.items
);

// Payment Methods Entity State
export const selectPaymentMethodsState = createSelector(
  selectCheckoutFeature,
  (state: CheckoutFeatureState) => state.paymentMethods
);

// Shipping Methods Entity State
export const selectShippingMethodsState = createSelector(
  selectCheckoutFeature,
  (state: CheckoutFeatureState) => state.shippingMethods
);

// Addresses Entity State
export const selectAddressesState = createSelector(
  selectCheckoutFeature,
  (state: CheckoutFeatureState) => state.addresses
);

// UI State
export const selectCheckoutUIState = createSelector(
  selectCheckoutFeature,
  (state: CheckoutFeatureState) => state.ui
);

// Computed State
export const selectCheckoutComputedState = createSelector(
  selectCheckoutFeature,
  (state: CheckoutFeatureState) => state.computed
);

// ============================================================================
// ENTITY ADAPTER SELECTORS
// ============================================================================

// Checkout Items Entity Selectors
const checkoutItemsEntitySelectors = checkoutItemsAdapter.getSelectors(selectCheckoutItemsState);

export const selectAllCheckoutItems = checkoutItemsEntitySelectors.selectAll;
export const selectCheckoutItemEntities = checkoutItemsEntitySelectors.selectEntities;
export const selectCheckoutItemIds = checkoutItemsEntitySelectors.selectIds;
export const selectCheckoutItemTotal = checkoutItemsEntitySelectors.selectTotal;

export const selectCheckoutItemById = (itemId: string) => createSelector(
  selectCheckoutItemEntities,
  (entities) => entities[itemId]
);

// Payment Methods Entity Selectors
const paymentMethodsEntitySelectors = paymentMethodsAdapter.getSelectors(selectPaymentMethodsState);

export const selectAllPaymentMethods = paymentMethodsEntitySelectors.selectAll;
export const selectPaymentMethodEntities = paymentMethodsEntitySelectors.selectEntities;
export const selectPaymentMethodIds = paymentMethodsEntitySelectors.selectIds;

export const selectPaymentMethodById = (methodId: string) => createSelector(
  selectPaymentMethodEntities,
  (entities) => entities[methodId]
);

// Shipping Methods Entity Selectors
const shippingMethodsEntitySelectors = shippingMethodsAdapter.getSelectors(selectShippingMethodsState);

export const selectAllShippingMethods = shippingMethodsEntitySelectors.selectAll;
export const selectShippingMethodEntities = shippingMethodsEntitySelectors.selectEntities;

export const selectShippingMethodById = (methodId: string) => createSelector(
  selectShippingMethodEntities,
  (entities) => entities[methodId]
);

// Addresses Entity Selectors
const addressesEntitySelectors = addressesAdapter.getSelectors(selectAddressesState);

export const selectAllAddresses = addressesEntitySelectors.selectAll;
export const selectAddressEntities = addressesEntitySelectors.selectEntities;

export const selectAddressById = (addressId: string) => createSelector(
  selectAddressEntities,
  (entities) => entities[addressId]
);

// ============================================================================
// HIERARCHICAL SELECTORS - Level 1: entities.*
// ============================================================================

// entities.items.*
export const selectCheckoutItemsLoading = createSelector(
  selectCheckoutItemsState,
  (state) => state.loading
);

export const selectCheckoutItemsError = createSelector(
  selectCheckoutItemsState,
  (state) => state.error
);

export const selectSelectedCheckoutItemIds = createSelector(
  selectCheckoutItemsState,
  (state) => state.selectedIds
);

export const selectSelectedCheckoutItems = createSelector(
  selectAllCheckoutItems,
  selectSelectedCheckoutItemIds,
  (items, selectedIds) => items.filter(item => selectedIds.includes(item.id))
);

// entities.paymentMethods.*
export const selectSelectedPaymentMethodId = createSelector(
  selectPaymentMethodsState,
  (state) => state.selectedId
);

export const selectSelectedPaymentMethod = createSelector(
  selectPaymentMethodEntities,
  selectSelectedPaymentMethodId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectAvailablePaymentMethods = createSelector(
  selectAllPaymentMethods,
  (methods) => methods.filter(method => method.id !== 'disabled')
);

export const selectDefaultPaymentMethod = createSelector(
  selectAllPaymentMethods,
  (methods) => methods.find(method => method.isDefault) || null
);

// entities.shippingMethods.*
export const selectSelectedShippingMethodId = createSelector(
  selectShippingMethodsState,
  (state) => state.selectedId
);

export const selectSelectedShippingMethod = createSelector(
  selectShippingMethodEntities,
  selectSelectedShippingMethodId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectShippingMethodsBySpeed = createSelector(
  selectAllShippingMethods,
  (methods) => [...methods].sort((a, b) => a.estimatedDays - b.estimatedDays)
);

// entities.addresses.*
export const selectShippingAddressId = createSelector(
  selectAddressesState,
  (state) => state.shippingAddressId
);

export const selectBillingAddressId = createSelector(
  selectAddressesState,
  (state) => state.billingAddressId
);

export const selectShippingAddress = createSelector(
  selectAddressEntities,
  selectShippingAddressId,
  (entities, addressId) => addressId ? entities[addressId] : null
);

export const selectBillingAddress = createSelector(
  selectAddressEntities,
  selectBillingAddressId,
  (entities, addressId) => addressId ? entities[addressId] : null
);

export const selectDefaultAddresses = createSelector(
  selectAllAddresses,
  (addresses) => addresses.filter(address => address.isDefault)
);

// ============================================================================
// HIERARCHICAL SELECTORS - Level 2: ui.*
// ============================================================================

export const selectCurrentCheckoutStep = createSelector(
  selectCheckoutUIState,
  (state) => state.currentStep
);

export const selectTotalCheckoutSteps = createSelector(
  selectCheckoutUIState,
  (state) => state.totalSteps
);

export const selectIsCheckoutProcessing = createSelector(
  selectCheckoutUIState,
  (state) => state.isProcessing
);

export const selectCheckoutValidationErrors = createSelector(
  selectCheckoutUIState,
  (state) => state.validationErrors
);

export const selectShowCheckoutSummary = createSelector(
  selectCheckoutUIState,
  (state) => state.showSummary
);

export const selectCheckoutProgress = createSelector(
  selectCurrentCheckoutStep,
  selectTotalCheckoutSteps,
  (currentStep, totalSteps) => ({
    currentStep,
    totalSteps,
    percentage: Math.round((currentStep / totalSteps) * 100)
  })
);

// ============================================================================
// HIERARCHICAL SELECTORS - Level 3: computed.*
// ============================================================================

export const selectCheckoutSubtotal = createSelector(
  selectCheckoutComputedState,
  (state) => state.subtotal
);

export const selectCheckoutTax = createSelector(
  selectCheckoutComputedState,
  (state) => state.tax
);

export const selectCheckoutShipping = createSelector(
  selectCheckoutComputedState,
  (state) => state.shipping
);

export const selectCheckoutDiscount = createSelector(
  selectCheckoutComputedState,
  (state) => state.discount
);

export const selectCheckoutTotal = createSelector(
  selectCheckoutComputedState,
  (state) => state.total
);

export const selectCheckoutItemCount = createSelector(
  selectCheckoutComputedState,
  (state) => state.itemCount
);

export const selectCheckoutTotals = createSelector(
  selectCheckoutSubtotal,
  selectCheckoutTax,
  selectCheckoutShipping,
  selectCheckoutDiscount,
  selectCheckoutTotal,
  (subtotal, tax, shipping, discount, total) => ({
    subtotal,
    tax,
    shipping,
    discount,
    total,
    savings: discount
  })
);

// ============================================================================
// HIERARCHICAL SELECTORS - Level 4: Complex Composed Selectors
// ============================================================================

// Complex selector: checkout.validation.errors.byStep
export const selectValidationErrorsByStep = (step: number) => createSelector(
  selectCheckoutValidationErrors,
  (errors) => Object.keys(errors)
    .filter(key => key.startsWith(`step${step}_`))
    .reduce((stepErrors, key) => {
      stepErrors[key.replace(`step${step}_`, '')] = errors[key];
      return stepErrors;
    }, {} as { [field: string]: string })
);

// Complex selector: checkout.summary.complete
export const selectCompleteCheckoutSummary = createSelector(
  selectAllCheckoutItems,
  selectSelectedPaymentMethod,
  selectSelectedShippingMethod,
  selectShippingAddress,
  selectBillingAddress,
  selectCheckoutTotals,
  (items, paymentMethod, shippingMethod, shippingAddress, billingAddress, totals) => ({
    items,
    payment: paymentMethod,
    shipping: {
      method: shippingMethod,
      address: shippingAddress
    },
    billing: {
      address: billingAddress
    },
    totals,
    isComplete: !!(paymentMethod && shippingMethod && shippingAddress && items.length > 0)
  })
);

// Complex selector: checkout.steps.current.validation
export const selectCurrentStepValidation = createSelector(
  selectCurrentCheckoutStep,
  selectAllCheckoutItems,
  selectSelectedPaymentMethod,
  selectSelectedShippingMethod,
  selectShippingAddress,
  selectBillingAddress,
  (currentStep, items, paymentMethod, shippingMethod, shippingAddress, billingAddress) => {
    const validation = {
      isValid: false,
      errors: [] as string[],
      canProceed: false
    };

    switch (currentStep) {
      case 1: // Items Review
        validation.isValid = items.length > 0;
        if (!validation.isValid) {
          validation.errors.push('Cart is empty');
        }
        break;

      case 2: // Shipping
        validation.isValid = !!(shippingMethod && shippingAddress);
        if (!shippingMethod) validation.errors.push('Shipping method required');
        if (!shippingAddress) validation.errors.push('Shipping address required');
        break;

      case 3: // Payment
        validation.isValid = !!(paymentMethod && billingAddress);
        if (!paymentMethod) validation.errors.push('Payment method required');
        if (!billingAddress) validation.errors.push('Billing address required');
        break;

      case 4: // Review
        validation.isValid = !!(items.length && paymentMethod && shippingMethod && shippingAddress && billingAddress);
        break;
    }

    validation.canProceed = validation.isValid;
    return validation;
  }
);

// ============================================================================
// HIERARCHICAL SELECTORS - Level 5: Filtered and Parameterized
// ============================================================================

// Parameterized selectors for hierarchical access
export const selectCheckoutItemsByCategory = (category: string) => createSelector(
  selectAllCheckoutItems,
  (items) => items.filter(item => item.name.toLowerCase().includes(category.toLowerCase()))
);

export const selectPaymentMethodsByType = (type: 'credit-card' | 'paypal' | 'bank-transfer') => createSelector(
  selectAllPaymentMethods,
  (methods) => methods.filter(method => method.type === type)
);

export const selectShippingMethodsInPriceRange = (minCost: number, maxCost: number) => createSelector(
  selectAllShippingMethods,
  (methods) => methods.filter(method => method.cost >= minCost && method.cost <= maxCost)
);

export const selectAddressesByState = (state: string) => createSelector(
  selectAllAddresses,
  (addresses) => addresses.filter(address => address.state.toLowerCase() === state.toLowerCase())
);

// ============================================================================
// ANALYTICS SELECTORS
// ============================================================================

export const selectCheckoutAnalytics = createSelector(
  selectAllCheckoutItems,
  selectCheckoutTotals,
  selectCurrentCheckoutStep,
  selectIsCheckoutProcessing,
  (items, totals, currentStep, isProcessing) => ({
    itemCount: items.length,
    averageItemPrice: items.length > 0 ? totals.subtotal / items.length : 0,
    cartValue: totals.total,
    stepProgress: currentStep,
    conversionFunnel: {
      step1_items: items.length > 0,
      step2_shipping: currentStep >= 2,
      step3_payment: currentStep >= 3,
      step4_review: currentStep >= 4,
      processing: isProcessing
    }
  })
);
