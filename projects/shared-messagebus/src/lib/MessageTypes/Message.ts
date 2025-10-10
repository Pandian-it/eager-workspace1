import { 
  StoreDataPayload, 
  HierarchicalStoreDataPayload,
  StoreDataResponsePayload, 
  HierarchicalStoreDataResponsePayload,
  StoreActionPayload, 
  NavigationPayload, 
  NotificationPayload 
} from './Payloads';

// ============================================================================
// MESSAGE TYPE ENUM
// ============================================================================

export enum MessageType {
  STORE_STATE_REQUEST = 'STORE_STATE_REQUEST',
  STORE_STATE_RESPONSE = 'STORE_STATE_RESPONSE',
  HIERARCHICAL_STORE_REQUEST = 'HIERARCHICAL_STORE_REQUEST',
  HIERARCHICAL_STORE_RESPONSE = 'HIERARCHICAL_STORE_RESPONSE',
  STORE_ACTION = 'STORE_ACTION',
  NAVIGATE_TO = 'NAVIGATE_TO',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED'
}

// ============================================================================
// INTERFACE-BASED MESSAGE SYSTEM
// ============================================================================

// Base message interface (replaces abstract Message class)
export interface BaseMessage<TPayload = unknown> {
  type: MessageType;
  payload: TPayload;
  source?: string;
  correlationId?: string;
  timestamp?: Date;
}

// Specific message interfaces (directly inherit from BaseMessage)
export interface StoreStateRequestMessage extends BaseMessage<StoreDataPayload> {
  type: MessageType.STORE_STATE_REQUEST;
  correlationId: string; // Required for requests
}

export interface StoreStateResponseMessage extends BaseMessage<StoreDataResponsePayload> {
  type: MessageType.STORE_STATE_RESPONSE;
  correlationId: string; // Required for responses
}

// Hierarchical store message interfaces
export interface HierarchicalStoreRequestMessage extends BaseMessage<HierarchicalStoreDataPayload> {
  type: MessageType.HIERARCHICAL_STORE_REQUEST;
  correlationId: string; // Required for requests
}

export interface HierarchicalStoreResponseMessage extends BaseMessage<HierarchicalStoreDataResponsePayload> {
  type: MessageType.HIERARCHICAL_STORE_RESPONSE;
  correlationId: string; // Required for responses
}

export interface StoreActionMessage extends BaseMessage<StoreActionPayload> {
  type: MessageType.STORE_ACTION;
}

export interface NavigateToMessage extends BaseMessage<NavigationPayload> {
  type: MessageType.NAVIGATE_TO;
}

export interface NotificationReceivedMessage extends BaseMessage<NotificationPayload> {
  type: MessageType.NOTIFICATION_RECEIVED;
}

// Union type for all messages (enables discriminated unions)
export type Message = 
  | StoreStateRequestMessage 
  | StoreStateResponseMessage 
  | HierarchicalStoreRequestMessage
  | HierarchicalStoreResponseMessage
  | StoreActionMessage
  | NavigateToMessage
  | NotificationReceivedMessage;

// Helper union types for specific message categories
/*export type RequestMessages = StoreStateRequestMessage;
export type ResponseMessages = StoreStateResponseMessage;
export type ActionMessages = StoreActionMessage;
export type NavigationMessages = NavigateToMessage;
export type NotificationMessages = NotificationReceivedMessage;*/

// ============================================================================
// UTILITY CLASSES (Replaces class methods and inheritance)
// ============================================================================

export class MessageUtils {
  static generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static isExpired(message: BaseMessage, ttlMs: number): boolean {
    if (!message.timestamp) return false;
    return Date.now() - message.timestamp.getTime() > ttlMs;
  }

  static getAge(message: BaseMessage): number {
    if (!message.timestamp) return 0;
    return Date.now() - message.timestamp.getTime();
  }

  static validateMessage(message: BaseMessage): boolean {
    return !!(message.type && message.payload);
  }
}

// ============================================================================
// TYPE MAPPING FOR GENERIC FACTORY
// ============================================================================

// Map message types to their corresponding interfaces
export interface MessageTypeMap {
  [MessageType.STORE_STATE_REQUEST]: StoreStateRequestMessage;
  [MessageType.STORE_STATE_RESPONSE]: StoreStateResponseMessage;
  [MessageType.HIERARCHICAL_STORE_REQUEST]: HierarchicalStoreRequestMessage;
  [MessageType.HIERARCHICAL_STORE_RESPONSE]: HierarchicalStoreResponseMessage;
  [MessageType.STORE_ACTION]: StoreActionMessage;
  [MessageType.NAVIGATE_TO]: NavigateToMessage;
  [MessageType.NOTIFICATION_RECEIVED]: NotificationReceivedMessage;
}

// Extract payload types from message interfaces
export type PayloadType<T extends MessageType> = MessageTypeMap[T]['payload'];

// Options for message creation
export interface MessageCreationOptions {
  source?: string;
  correlationId?: string;
  timestamp?: Date;
}

// ============================================================================
// GENERIC FACTORY FUNCTIONS (Replaces individual factory methods)
// ============================================================================

export class MessageFactory {
  /**
   * Generic factory method that creates any message type with full type safety
   * @param type - The message type discriminator
   * @param payload - The payload for the message (type-safe based on message type)
   * @param options - Optional parameters (source, correlationId, timestamp)
   * @returns The created message with proper typing
   */
  static create<T extends MessageType>(
    type: T,
    payload: PayloadType<T>,
    options: MessageCreationOptions = {}
  ): MessageTypeMap[T] {
    // Delegate to specific factory methods for proper validation and typing
    switch (type) {
      case MessageType.STORE_STATE_REQUEST:
        return MessageFactory.createStoreRequest(
          payload as StoreDataPayload, 
          options.source, 
          options.correlationId
        ) as MessageTypeMap[T];
        
      case MessageType.STORE_STATE_RESPONSE:
        return MessageFactory.createStoreResponse(
          payload as StoreDataResponsePayload,
          options.correlationId || '',
          options.source
        ) as MessageTypeMap[T];

      case MessageType.HIERARCHICAL_STORE_REQUEST:
        return MessageFactory.createHierarchicalStoreRequest(
          payload as HierarchicalStoreDataPayload,
          options.source,
          options.correlationId
        ) as MessageTypeMap[T];

      case MessageType.HIERARCHICAL_STORE_RESPONSE:
        return MessageFactory.createHierarchicalStoreResponse(
          payload as HierarchicalStoreDataResponsePayload,
          options.correlationId || '',
          options.source
        ) as MessageTypeMap[T];
        
      case MessageType.STORE_ACTION:
        return MessageFactory.createStoreAction(
          payload as StoreActionPayload,
          options.source
        ) as MessageTypeMap[T];
        
      case MessageType.NAVIGATE_TO:
        return MessageFactory.createNavigateMessage(
          payload as NavigationPayload,
          options.source
        ) as MessageTypeMap[T];
        
      case MessageType.NOTIFICATION_RECEIVED:
        return MessageFactory.createNotificationMessage(
          payload as NotificationPayload,
          options.source
        ) as MessageTypeMap[T];
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  // ============================================================================
  // SPECIFIC FACTORY METHODS (With embedded validation and correlationId logic)
  // ============================================================================

  static createStoreRequest(
    payload: StoreDataPayload, 
    source?: string,
    correlationId?: string
  ): StoreStateRequestMessage {
    // Validation
    if (!payload.storeSlice) {
      throw new Error('storeSlice is required for store requests');
    }

    return {
      type: MessageType.STORE_STATE_REQUEST,
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
      throw new Error('correlationId is required for response messages');
    }

    return {
      type: MessageType.STORE_STATE_RESPONSE,
      payload,
      correlationId,
      source,
      timestamp: new Date()
    };
  }

  // ============================================================================
  // HIERARCHICAL STORE FACTORY METHODS
  // ============================================================================

  static createHierarchicalStoreRequest(
    payload: HierarchicalStoreDataPayload,
    source?: string,
    correlationId?: string
  ): HierarchicalStoreRequestMessage {
    // Validation
    if (!payload.targetMfe || !payload.feature || !payload.selectorPath) {
      throw new Error('targetMfe, feature, and selectorPath are required for hierarchical store requests');
    }

    return {
      type: MessageType.HIERARCHICAL_STORE_REQUEST,
      payload,
      source,
      correlationId: correlationId || MessageUtils.generateCorrelationId(),
      timestamp: new Date()
    };
  }

  static createHierarchicalStoreResponse(
    payload: HierarchicalStoreDataResponsePayload,
    correlationId: string,
    source?: string
  ): HierarchicalStoreResponseMessage {
    // Validation
    if (!correlationId) {
      throw new Error('correlationId is required for hierarchical response messages');
    }

    return {
      type: MessageType.HIERARCHICAL_STORE_RESPONSE,
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
      type: MessageType.STORE_ACTION,
      payload,
      source,
      correlationId: MessageUtils.generateCorrelationId(),
      timestamp: new Date()
    };
  }

  static createNavigateMessage(
    payload: NavigationPayload,
    source?: string
  ): NavigateToMessage {
    return {
      type: MessageType.NAVIGATE_TO,
      payload,
      source,
      correlationId: MessageUtils.generateCorrelationId(),
      timestamp: new Date()
    };
  }

  static createNotificationMessage(
    payload: NotificationPayload,
    source?: string
  ): NotificationReceivedMessage {
    return {
      type: MessageType.NOTIFICATION_RECEIVED,
      payload,
      source,
      correlationId: MessageUtils.generateCorrelationId(),
      timestamp: new Date()
    };
  }
}

// ============================================================================
// TYPE GUARDS (Replaces instanceof checks)
// ============================================================================

export class MessageTypeGuards {
  static isMessage(obj: any): obj is Message {
    return obj && Object.values(MessageType).includes(obj.type) && obj.payload !== undefined;
  }
/*
  static isRequestMessage(msg: Message): msg is RequestMessages {
    return msg.type === MessageType.STORE_STATE_REQUEST;
  }

  static isResponseMessage(msg: Message): msg is ResponseMessages {
    return msg.type === MessageType.STORE_STATE_RESPONSE;
  }
*/
  static isStoreRequest(msg: Message): msg is StoreStateRequestMessage {
    return msg.type === MessageType.STORE_STATE_REQUEST;
  }

  static isStoreResponse(msg: Message): msg is StoreStateResponseMessage {
    return msg.type === MessageType.STORE_STATE_RESPONSE;
  }

  static isStoreAction(msg: Message): msg is StoreActionMessage {
    return msg.type === MessageType.STORE_ACTION;
  }

  static isNavigateMessage(msg: Message): msg is NavigateToMessage {
    return msg.type === MessageType.NAVIGATE_TO;
  }

  static isNotificationMessage(msg: Message): msg is NotificationReceivedMessage {
    return msg.type === MessageType.NOTIFICATION_RECEIVED;
  }

  // Helper methods for checking if message has correlation ID
  static hasCorrelationId(msg: Message): msg is StoreStateRequestMessage | StoreStateResponseMessage {
    return !!(msg as any).correlationId;
  }

  static isCorrelatedMessage(msg: Message, correlationId: string): boolean {
    return this.hasCorrelationId(msg) && msg.correlationId === correlationId;
  }
}


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
      case MessageType.STORE_STATE_REQUEST:
        return patterns.storeRequest?.(message as StoreStateRequestMessage);
      case MessageType.STORE_STATE_RESPONSE:
        return patterns.storeResponse?.(message as StoreStateResponseMessage);
      case MessageType.STORE_ACTION:
        return patterns.storeAction?.(message as StoreActionMessage);
      case MessageType.NAVIGATE_TO:
        return patterns.navigation?.(message as NavigateToMessage);
      case MessageType.NOTIFICATION_RECEIVED:
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

// ============================================================================
// EXPORTS
// ============================================================================

// Export factory and type guards with aliases for easier use
/*export { 
  MessageFactory,
  MessageTypeGuards,
  MessageUtils
};
*/