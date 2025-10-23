import { 
  StoreDataPayload, 
  StoreDataResponsePayload, 
  StoreActionPayload, 
  NavigationPayload, 
  NotificationPayload 
} from './Payloads';

// ============================================================================
// HYBRID APPROACH: Interfaces + Utility Classes + Type Guards
// ============================================================================

// 1. Core message interfaces (zero runtime cost)
export interface BaseMessage<TPayload = unknown> {
  type: string;
  payload: TPayload;
  source?: string;
  correlationId?: string;
  timestamp?: Date;
}

/*export interface RequestMessage<TPayload = unknown> extends BaseMessage<TPayload> {
  correlationId: string; // Required for requests
}

export interface ResponseMessage<TPayload = unknown> extends BaseMessage<TPayload> {
  correlationId: string; // Required for responses
}
*/
// 2. Specific message interfaces with discriminated unions
export interface StoreStateRequestMessage extends BaseMessage<StoreDataPayload> {
  type: 'STORE_STATE_REQUEST';
}

export interface StoreStateResponseMessage extends BaseMessage<StoreDataResponsePayload> {
  type: 'STORE_STATE_RESPONSE';
}

export interface StoreActionMessage extends BaseMessage<StoreActionPayload> {
  type: 'STORE_ACTION';
}

export interface NavigateToMessage extends BaseMessage<NavigationPayload> {
  type: 'NAVIGATE_TO';
}

export interface NotificationReceivedMessage extends BaseMessage<NotificationPayload> {
  type: 'NOTIFICATION_RECEIVED';
}

// 3. Union type for all messages
export type Message = 
  | StoreStateRequestMessage 
  | StoreStateResponseMessage 
  | StoreActionMessage
  | NavigateToMessage
  | NotificationReceivedMessage;

// ============================================================================
// ABSTRACTION PRESERVATION: Utility Classes & Factories
// ============================================================================

// 4. Message utilities (keeps abstraction benefits)
export class MessageUtils {
  static isExpired(message: BaseMessage, ttlMs: number): boolean {
    if (!message.timestamp) return false;
    return Date.now() - message.timestamp.getTime() > ttlMs;
  }

  static getAge(message: BaseMessage): number {
    if (!message.timestamp) return 0;
    return Date.now() - message.timestamp.getTime();
  }

  static generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static validateMessage(message: BaseMessage): boolean {
    return !!(message.type && message.payload);
  }
}

// 5. Request/Response utilities (preserves inheritance-like behavior)


// ============================================================================
// FACTORY FUNCTIONS: Replace constructors with validation
// ============================================================================

// 6. Validated factory functions (replaces constructor validation)
export class MessageFactory {
  static createStoreRequest(
    payload: StoreDataPayload, 
    source?: string,
    correlationId?: string
  ): StoreStateRequestMessage {
    // Validation (preserves constructor-like behavior)
    if (!payload.storeSlice) {
      throw new Error('storeSlice is required for store requests');
    }

    return {
      type: 'STORE_STATE_REQUEST',
      payload,
      source,
      correlationId: correlationId || MessageUtils.generateCorrelationId(),
      timestamp: new Date()
    };
  }

  static createStoreResponse(
    payload: StoreDataResponsePayload,
    correlationId: string,
    source?: string
  ): StoreStateResponseMessage {
    // Validation
    if (!correlationId) {
      throw new Error('correlationId is required for responses');
    }
    if (!payload.storeSlice) {
      throw new Error('storeSlice is required in response payload');
    }

    return {
      type: 'STORE_STATE_RESPONSE',
      payload,
      correlationId,
      source,
      timestamp: new Date()
    };
  }

  static createStoreAction(
    payload: StoreActionPayload,
    source?: string
  ): StoreActionMessage {
    // Validation
    if (!payload.action || !payload.targetStore) {
      throw new Error('action and targetStore are required');
    }

    return {
      type: 'STORE_ACTION',
      payload,
      source,
      correlationId: MessageUtils.generateCorrelationId(),
      timestamp: new Date()
    };
  }
}

// ============================================================================
// TYPE GUARDS: Replace instanceof checks
// ============================================================================

// 7. Type guards (replaces instanceof)
export class MessageTypeGuards {
  static isMessage(obj: any): obj is Message {
    return obj && typeof obj.type === 'string' && obj.payload !== undefined;
  }

  /*static isRequestMessage(msg: Message): msg is RequestMessage {
    return !!(msg as RequestMessage).correlationId;
  }

  static isResponseMessage(msg: Message): msg is ResponseMessage {
    return !!(msg as ResponseMessage).correlationId;
  }
*/
  static isStoreRequest(msg: Message): msg is StoreStateRequestMessage {
    return msg.type === 'STORE_STATE_REQUEST';
  }

  static isStoreResponse(msg: Message): msg is StoreStateResponseMessage {
    return msg.type === 'STORE_STATE_RESPONSE';
  }

  static isStoreAction(msg: Message): msg is StoreActionMessage {
    return msg.type === 'STORE_ACTION';
  }

  static isNavigateMessage(msg: Message): msg is NavigateToMessage {
    return msg.type === 'NAVIGATE_TO';
  }

  static isNotificationMessage(msg: Message): msg is NotificationReceivedMessage {
    return msg.type === 'NOTIFICATION_RECEIVED';
  }
}

// ============================================================================
// ADVANCED ABSTRACTIONS: Pattern matching & functional helpers
// ============================================================================

// 8. Pattern matching (even better than class inheritance)
export class MessageMatcher {
  static match<T>(
    message: Message,
    patterns: {
      storeRequest?: (msg: StoreStateRequestMessage) => T;
      storeResponse?: (msg: StoreStateResponseMessage) => T;
      storeAction?: (msg: StoreActionMessage) => T;
      navigation?: (msg: NavigateToMessage) => T;
      notification?: (msg: NotificationReceivedMessage) => T;
      default?: (msg: Message) => T;
    }
  ): T | undefined {
    switch (message.type) {
      case 'STORE_STATE_REQUEST':
        return patterns.storeRequest?.(message as StoreStateRequestMessage);
      case 'STORE_STATE_RESPONSE':
        return patterns.storeResponse?.(message as StoreStateResponseMessage);
      case 'STORE_ACTION':
        return patterns.storeAction?.(message as StoreActionMessage);
      case 'NAVIGATE_TO':
        return patterns.navigation?.(message as NavigateToMessage);
      case 'NOTIFICATION_RECEIVED':
        return patterns.notification?.(message as NotificationReceivedMessage);
      default:
        return patterns.default?.(message);
    }
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// 1. Creating messages (with validation)
const request = MessageFactory.createStoreRequest({ storeSlice: 'cart' }, 'checkout');

// 2. Type checking (replaces instanceof)
if (MessageTypeGuards.isStoreRequest(message)) {
  // TypeScript knows this is StoreStateRequestMessage
  console.log(message.payload.storeSlice);
}

// 3. Utility methods (replaces class methods)
if (MessageUtils.isExpired(message, 5000)) {
  console.log('Message expired');
}

// 4. Pattern matching (better than inheritance)
const result = MessageMatcher.match(message, {
  storeRequest: (req) => `Handling request for ${req.payload.storeSlice}`,
  storeResponse: (res) => `Got response: ${res.payload.success}`,
  default: (msg) => `Unknown message type: ${msg.type}`
});

// 5. Functional composition
const isValidRequest = (msg: Message): boolean =>
  MessageTypeGuards.isStoreRequest(msg) && 
  MessageUtils.validateMessage(msg) &&
  !MessageUtils.isExpired(msg, 30000);
*/
