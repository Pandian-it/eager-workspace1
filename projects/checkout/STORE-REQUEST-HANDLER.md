# Checkout MFE - Store Request Handler

This document explains how the Store Request Handler service works in the Checkout MFE and how to use it for cross-MFE communication.

## Overview

The Store Request Handler service enables the Checkout MFE to:
1. **Respond to store data requests** from other MFEs
2. **Make requests to other MFEs** for their store data
3. **Manage local checkout state** with mock data (ready for NgRx integration)

## Files Added

### 1. StoreRequestHandlerService (`src/app/services/store-request-handler.service.ts`)

**Purpose**: Handles incoming store data requests and manages local checkout state.

**Features**:
- Listens for `StoreStateRequestMessage` from other MFEs
- Responds with checkout data for these store slices:
  - `checkout` - Current checkout step, addresses, payment method
  - `checkout-payment` - Payment method details and processing state
  - `checkout-shipping` - Shipping method and costs
  - `checkout-summary` - Order totals and item summary
- Provides methods to update local checkout state
- Automatic error handling and response correlation

### 2. CheckoutSummaryComponent (`src/app/components/checkout-summary.component.ts`)

**Purpose**: Example component showing how to use both incoming and outgoing message bus communication.

**Features**:
- Displays current checkout state
- Request data from other MFEs (Cart, User data)
- Update local checkout state
- Send notifications to other MFEs

## How to Use

### Requesting Data from Other MFEs

```typescript
// In any component or service
constructor(private messageBusHelper: MessageBusHelper) {}

// Get cart data from Cart MFE
this.messageBusHelper.getCartData().subscribe(cartData => {
  console.log('Cart data received:', cartData);
});

// Get user data from Shell MFE  
this.messageBusHelper.getUserData().subscribe(userData => {
  console.log('User data received:', userData);
});
```

### Responding to Store Requests (Automatic)

The `StoreRequestHandlerService` automatically handles incoming requests. It's initialized in `app.component.ts` and runs in the background.

**Supported Store Slices**:
- `checkout` - Main checkout state
- `checkout-payment` - Payment information  
- `checkout-shipping` - Shipping details
- `checkout-summary` - Order summary

### Updating Local Checkout State

```typescript
// In a component
constructor(private storeRequestHandler: StoreRequestHandlerService) {}

// Update checkout step
this.storeRequestHandler.updateCheckoutStep(2);

// Update payment method
this.storeRequestHandler.updatePaymentMethod('paypal');

// Update shipping address
this.storeRequestHandler.updateShippingAddress({
  street: '123 Main St',
  city: 'Anytown',
  zip: '12345'
});
```

### Sending Notifications to Other MFEs

```typescript
// Notify other MFEs about checkout progress
this.messageBusHelper.notifyCheckoutStarted({
  checkoutId: 'checkout-123',
  step: 2,
  items: cartItems,
  total: 99.99
});
```

## Testing the Implementation

1. **Build the checkout MFE**: `nx build checkout`
2. **Run the checkout MFE**: `nx serve checkout`
3. **Navigate to**: `http://localhost:4202/summary`
4. **Test buttons**:
   - "Get Cart Data from Cart MFE" - Requests cart data (will timeout if Cart MFE not running)
   - "Get User Data from Shell MFE" - Requests user data (will timeout if Shell MFE not running)
   - "Update Checkout Step" - Updates local state
   - "Set PayPal Payment" - Updates payment method

## Integration with NgRx (Future Enhancement)

To integrate with NgRx stores, replace the mock data in `StoreRequestHandlerService`:

```typescript
// Replace mock data access with NgRx selectors
private getStoreData(storeSlice: string): Observable<any> {
  switch (storeSlice) {
    case 'checkout':
      return this.store.select(selectCheckoutState).pipe(take(1));
    case 'checkout-payment':
      return this.store.select(selectPaymentState).pipe(take(1));
    // ... etc
  }
}
```

## Message Bus Architecture

The checkout MFE uses the shared-messagebus library for all cross-MFE communication:

- **MessageBusHelper**: High-level API for making requests
- **MessageBusService**: Low-level message publishing/subscription  
- **StoreRequestHandlerService**: Handles incoming store requests
- **Typed Payloads**: Type-safe message payloads for all communication

## Next Steps

1. Add similar Store Request Handler services to other MFEs (Cart, Orders, Shell)
2. Implement NgRx stores and integrate with the message bus
3. Add more sophisticated checkout workflows
4. Implement real-time checkout state synchronization
