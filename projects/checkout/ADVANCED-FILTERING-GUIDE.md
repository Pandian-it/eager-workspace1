# Advanced Message Bus Filtering Guide

## Overview

Yes, **it is absolutely possible** to apply filters based on message interfaces in the `ofType` method subscription! The enhanced MessageBusService now provides multiple filtering approaches for sophisticated message handling.

## Available Filtering Methods

### 1. **Basic Type Filtering** (`ofType`)
Filter by message class/interface only:
```typescript
// Listen to all StoreStateRequestMessage instances
this.messageBus.ofType(StoreStateRequestMessage)
  .subscribe(request => {
    // Handle any store request
  });
```

### 2. **Enhanced Type + Custom Filtering** (`ofTypeWithFilter`)
Filter by message type AND custom business logic:
```typescript
// Only handle checkout-related requests from trusted sources
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  (request) => {
    return request.payload.storeSlice.startsWith('checkout') &&
           request.source !== 'checkout' &&
           ['cart', 'orders', 'shell'].includes(request.source || '');
  }
).subscribe(request => {
  // Handle filtered requests
});
```

### 3. **Source-Based Filtering** (`ofTypeFromSources`)
Filter by message type AND source MFE:
```typescript
// Only listen to requests from Cart and Orders MFEs
this.messageBus.ofTypeFromSources(
  StoreStateRequestMessage,
  ['cart', 'orders']
).subscribe(request => {
  // Handle requests only from specified MFEs
});
```

### 4. **Payload Property Filtering** (`ofTypeWithPayload`)
Filter by message type AND specific payload properties:
```typescript
// Only handle requests specifically for 'checkout' slice
this.messageBus.ofTypeWithPayload(
  StoreStateRequestMessage,
  { storeSlice: 'checkout' }
).subscribe(request => {
  // Handle exact payload matches
});
```

## Real-World Filtering Examples

### Security Filtering
```typescript
// Only accept requests from authenticated, trusted sources
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  (request) => {
    const trustedSources = ['cart', 'orders', 'shell'];
    const isAuthenticated = this.authService.isAuthenticated();
    const isTrustedSource = trustedSources.includes(request.source || '');
    
    return isAuthenticated && isTrustedSource && request.source !== 'checkout';
  }
)
```

### Time-Based Filtering
```typescript
// Only handle recent messages (within last 5 seconds)
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  (request) => {
    const messageTime = request.timestamp?.getTime() || 0;
    const fiveSecondsAgo = Date.now() - (5 * 1000);
    return messageTime >= fiveSecondsAgo;
  }
)
```

### Regex Pattern Filtering
```typescript
// Filter store slices using regex patterns
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  (request) => {
    const checkoutPattern = /^checkout(-\w+)?$/;
    return checkoutPattern.test(request.payload.storeSlice);
  }
)
```

### Business Hours Filtering
```typescript
// Only process requests during business hours
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  (request) => {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    const isCheckoutRelated = request.payload.storeSlice.includes('checkout');
    
    return isBusinessHours && isCheckoutRelated;
  }
)
```

## Multiple Message Type Filtering

Handle multiple message types with union types:
```typescript
// Listen to multiple types with custom filtering
this.messageBus.messages$.pipe(
  filter((msg): msg is StoreStateRequestMessage | StoreActionMessage => 
    msg instanceof StoreStateRequestMessage || msg instanceof StoreActionMessage
  ),
  filter(msg => {
    // Additional filtering logic for both types
    if (msg instanceof StoreStateRequestMessage) {
      return msg.payload.storeSlice.includes('checkout');
    }
    if (msg instanceof StoreActionMessage) {
      return msg.payload.targetStore === 'checkout';
    }
    return false;
  })
).subscribe(msg => {
  // Handle multiple message types with checkout filter
});
```

## Reusable Filter Functions

Create reusable filter predicates:
```typescript
// Define reusable filters
export class MessageFilters {
  static createCheckoutFilter() {
    return (request: StoreStateRequestMessage): boolean => {
      return request.payload.storeSlice.startsWith('checkout') &&
             request.source !== 'checkout';
    };
  }

  static createTrustedSourceFilter(trustedSources: string[]) {
    return (message: Message): boolean => {
      return trustedSources.includes(message.source || '');
    };
  }
}

// Use reusable filters
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  MessageFilters.createCheckoutFilter()
)
```

## Implementation in Checkout MFE

The checkout Store Request Handler now uses advanced filtering:

```typescript
// Enhanced filtering approach in StoreRequestHandlerService
this.messageBus.ofTypeWithFilter(
  StoreStateRequestMessage,
  (request) => {
    // Multiple filter criteria:
    // 1. Must be a checkout-related store slice
    // 2. Must not be from checkout itself (avoid self-requests)
    // 3. Source must be from trusted MFEs
    const trustedSources = ['cart', 'orders', 'shell'];
    
    return this.isCheckoutStoreRequest(request.payload.storeSlice) &&
           request.source !== 'checkout' &&
           trustedSources.includes(request.source || '');
  }
).pipe(takeUntil(this.destroy$))
 .subscribe((request: StoreStateRequestMessage) => {
   console.log(`[Checkout] Processing filtered store request from ${request.source}`, request);
   this.handleStoreRequest(request);
 });
```

## Performance Benefits

✅ **Reduced Processing**: Only relevant messages are processed  
✅ **Type Safety**: Full TypeScript support with proper type guards  
✅ **Memory Efficiency**: Unwanted messages are filtered early  
✅ **Security**: Built-in source validation and authentication checks  
✅ **Maintainability**: Reusable filter functions and clear business logic  

## Best Practices

1. **Filter Early**: Apply filters as close to the source as possible
2. **Use Type Guards**: Leverage TypeScript's type system for safety
3. **Create Reusable Filters**: Define common filtering logic once
4. **Log Filtered Messages**: Help with debugging and monitoring
5. **Combine Multiple Criteria**: Use comprehensive filtering for security and performance

## Summary

The enhanced MessageBusService provides powerful filtering capabilities that go far beyond basic type filtering. You can now filter messages based on:

- **Interface/Type** - Basic `ofType` functionality
- **Payload Properties** - Specific field values
- **Source MFE** - Which micro frontend sent the message
- **Business Logic** - Complex custom predicates
- **Time Constraints** - Message age and timing
- **Security Rules** - Authentication and authorization
- **Regex Patterns** - Pattern matching on message content

This makes the message bus system extremely flexible and suitable for enterprise-grade micro frontend architectures!
