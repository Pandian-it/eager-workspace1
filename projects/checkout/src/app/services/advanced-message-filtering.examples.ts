import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { 
  MessageBusService, 
  StoreStateRequestMessage, 
  StoreActionMessage, 
  Message, 
  MessageType,
  MessageTypeGuards 
} from 'shared-messagebus';

/**
 * Advanced Message Bus Filtering Examples - UPDATED FOR INTERFACE-BASED MESSAGES
 * 
 * This service demonstrates various ways to filter messages based on:
 * - Message type using MessageType enum (instead of class constructors)
 * - Payload properties with proper type safety
 * - Source MFE identification
 * - Custom business logic with type guards
 * - Multiple criteria combinations using discriminated unions
 * 
 * KEY CHANGES FROM CLASS-BASED TO INTERFACE-BASED:
 * - Use MessageType.ENUM_VALUE instead of MessageClass
 * - Use MessageTypeGuards.isMessageType() instead of instanceof
 * - Specify generic types explicitly: <StoreStateRequestMessage>
 * - All methods now require MessageType enum as first parameter
 * 
 * SECURITY IMPROVEMENTS:
 * - Direct access to messages$ stream is REMOVED for security
 * - External services must use controlled API methods only
 * - New methods: ofMultipleTypes() and ofCustomFilter() for advanced scenarios
 * - Prevents unauthorized message interception and manipulation
 */
@Injectable({ providedIn: 'root' })
export class AdvancedMessageFilteringService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private messageBus: MessageBusService) {
    this.setupAdvancedFiltering();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAdvancedFiltering(): void {

    // ========================================
    // 1. BASIC TYPE FILTERING
    // ========================================
    
    // Listen to all StoreStateRequestMessage instances using MessageType enum
    this.messageBus.ofType<StoreStateRequestMessage>(MessageType.STORE_STATE_REQUEST)
      .pipe(takeUntil(this.destroy$))
      .subscribe(request => {
        console.log('[Filter Example 1] Any store request:', request);
      });

    // ========================================
    // 2. ENHANCED FILTERING WITH CUSTOM PREDICATE
    // ========================================
    
    // Only handle requests for specific store slices
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      (request) => {
        const allowedSlices = ['checkout', 'checkout-payment', 'checkout-shipping'];
        return allowedSlices.includes(request.payload.storeSlice);
      }
    ).pipe(takeUntil(this.destroy$))
     .subscribe(request => {
       console.log('[Filter Example 2] Checkout-related request:', request);
     });

    // ========================================
    // 3. FILTERING BY SOURCE MFE
    // ========================================
    
    // Only listen to requests from Cart and Orders MFEs
    this.messageBus.ofTypeFromSources<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      ['cart', 'orders']
    ).pipe(takeUntil(this.destroy$))
     .subscribe(request => {
       console.log('[Filter Example 3] Request from Cart or Orders:', request);
     });

    // ========================================
    // 4. FILTERING BY PAYLOAD PROPERTIES
    // ========================================
    
    // Only handle requests specifically for 'checkout' slice
    this.messageBus.ofTypeWithPayload<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      { storeSlice: 'checkout' }
    ).pipe(takeUntil(this.destroy$))
     .subscribe(request => {
       console.log('[Filter Example 4] Direct checkout request:', request);
     });

    // ========================================
    // 5. COMPLEX BUSINESS LOGIC FILTERING
    // ========================================
    
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      (request) => {
        // Complex business logic:
        // - Must be checkout-related
        // - Must come from authenticated sources
        // - Must not be a self-request
        // - Must be during business hours (example)
        
        const isCheckoutRelated = request.payload.storeSlice.startsWith('checkout');
        const isFromTrustedSource = ['cart', 'orders', 'shell'].includes(request.source || '');
        const isNotSelfRequest = request.source !== 'checkout';
        const isDuringBusinessHours = this.isBusinessHours();
        
        return isCheckoutRelated && isFromTrustedSource && isNotSelfRequest && isDuringBusinessHours;
      }
    ).pipe(takeUntil(this.destroy$))
     .subscribe(request => {
       console.log('[Filter Example 5] Complex filtered request:', request);
     });

    // ========================================
    // 6. FILTERING STORE ACTIONS BY TARGET
    // ========================================
    
    // Only handle store actions targeting checkout
    this.messageBus.ofTypeWithFilter<StoreActionMessage>(
      MessageType.STORE_ACTION,
      (action) => action.payload.targetStore === 'checkout'
    ).pipe(takeUntil(this.destroy$))
     .subscribe(action => {
       console.log('[Filter Example 6] Store action for checkout:', action);
     });

    // ========================================
    // 7. CORRELATION ID FILTERING (for responses)
    // ========================================
    
    // Filter responses by correlation ID (useful for request/response patterns)
    const specificCorrelationId = 'req_123456789';
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      (msg) => msg.correlationId === specificCorrelationId
    ).pipe(takeUntil(this.destroy$))
     .subscribe(response => {
       console.log('[Filter Example 7] Specific correlation response:', response);
     });

    // ========================================
    // 8. TIME-BASED FILTERING
    // ========================================
    
    // Only handle recent messages (within last 5 seconds)
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      (request) => {
        const messageTime = request.timestamp?.getTime() || 0;
        const now = Date.now();
        const fiveSecondsAgo = now - (5 * 1000);
        
        return messageTime >= fiveSecondsAgo;
      }
    ).pipe(takeUntil(this.destroy$))
     .subscribe(request => {
       console.log('[Filter Example 8] Recent request:', request);
     });

    // ========================================
    // 9. COMBINING MULTIPLE MESSAGE TYPES USING CONTROLLED API
    // ========================================
    
    // Listen to multiple types using the controlled API (no direct messages$ access)
    this.messageBus.ofMultipleTypes<StoreStateRequestMessage | StoreActionMessage>(
      [MessageType.STORE_STATE_REQUEST, MessageType.STORE_ACTION],
      (msg) => {
        // Additional filtering logic for both types using type guards
        if (MessageTypeGuards.isStoreRequest(msg)) {
          return msg.payload.storeSlice.includes('checkout');
        }
        if (MessageTypeGuards.isStoreAction(msg)) {
          return msg.payload.targetStore === 'checkout';
        }
        return false;
      }
    ).pipe(takeUntil(this.destroy$))
     .subscribe(msg => {
       console.log('[Filter Example 9] Multiple types with checkout filter:', msg);
     });

    // ========================================
    // 10. REGEX-BASED PAYLOAD FILTERING
    // ========================================
    
    // Filter store slices using regex patterns
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      (request) => {
        const checkoutPattern = /^checkout(-\w+)?$/;
        return checkoutPattern.test(request.payload.storeSlice);
      }
    ).pipe(takeUntil(this.destroy$))
     .subscribe(request => {
       console.log('[Filter Example 10] Regex-filtered request:', request);
     });

    // ========================================
    // 11. ADVANCED CUSTOM FILTERING (Replaces direct messages$ access)
    // ========================================
    
    // Example of complex cross-message-type filtering using controlled API
    this.messageBus.ofCustomFilter<Message>((msg) => {
      // Complex business logic across all message types
      const hasValidSource = msg.source && ['cart', 'orders', 'shell'].includes(msg.source);
      const isRecent = msg.timestamp ? (Date.now() - msg.timestamp.getTime()) < 30000 : false;
      const isCheckoutRelated = (
        (MessageTypeGuards.isStoreRequest(msg) && msg.payload.storeSlice.includes('checkout')) ||
        (MessageTypeGuards.isStoreAction(msg) && msg.payload.targetStore === 'checkout')
      );
      
      return hasValidSource && isRecent && isCheckoutRelated;
    }).pipe(takeUntil(this.destroy$))
     .subscribe(msg => {
       console.log('[Filter Example 11] Advanced custom filtered message:', msg);
     });
  }

  // Helper methods for complex filtering
  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 9 && hour <= 17; // 9 AM to 5 PM
  }

  private isUserAuthenticated(): boolean {
    // Check authentication status
    return true; // Mock implementation
  }

  // Example of creating reusable filter functions
  public static createCheckoutFilter() {
    return (request: StoreStateRequestMessage): boolean => {
      return request.payload.storeSlice.startsWith('checkout') &&
             request.source !== 'checkout';
    };
  }

  public static createTrustedSourceFilter(trustedSources: string[]) {
    return (message: Message): boolean => {
      return trustedSources.includes(message.source || '');
    };
  }
}

// ========================================
// USAGE EXAMPLES IN COMPONENTS - SECURE API ONLY
// ========================================

/*
// In a component - using ONLY the controlled MessageBus API:
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private messageBus: MessageBusService) {}

  ngOnInit() {
    // Example 1: Simple type filtering with MessageType enum
    this.messageBus.ofType<StoreStateRequestMessage>(MessageType.STORE_STATE_REQUEST)
      .pipe(takeUntil(this.destroy$))
      .subscribe(request => {
        // Handle any store request
      });

    // Example 2: Filtered by source using controlled API
    this.messageBus.ofTypeFromSources<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST, 
      ['cart']
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(request => {
      // Handle requests only from cart MFE
    });

    // Example 3: Complex filtering with type safety
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      (req) => req.payload.storeSlice === 'checkout' && req.source === 'cart'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(request => {
      // Handle checkout requests specifically from cart
    });

    // Example 4: Multiple message types using controlled API
    this.messageBus.ofMultipleTypes<StoreStateRequestMessage | StoreActionMessage>(
      [MessageType.STORE_STATE_REQUEST, MessageType.STORE_ACTION],
      (msg) => {
        // Use type guards for safe type checking
        if (MessageTypeGuards.isStoreRequest(msg)) {
          return msg.payload.storeSlice.includes('checkout');
        }
        if (MessageTypeGuards.isStoreAction(msg)) {
          return msg.payload.targetStore === 'checkout';
        }
        return false;
      }
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(msg => {
      // Handle multiple message types safely
    });

    // Example 5: Advanced custom filtering (replaces direct messages$ access)
    this.messageBus.ofCustomFilter<Message>((msg) => {
      return msg.source === 'trusted-mfe' && 
             msg.correlationId?.startsWith('important_');
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(msg => {
      // Handle messages with complex custom logic
    });

    // Example 6: Using reusable filters with controlled API
    this.messageBus.ofTypeWithFilter<StoreStateRequestMessage>(
      MessageType.STORE_STATE_REQUEST,
      AdvancedMessageFilteringService.createCheckoutFilter()
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(request => {
      // Handle using predefined filter
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// SECURITY NOTE: 
// - Direct access to messageBus.messages$ is NO LONGER AVAILABLE
// - Use controlled API methods: ofType, ofTypeWithFilter, ofMultipleTypes, ofCustomFilter
// - This prevents unauthorized message interception and ensures proper filtering
*/
