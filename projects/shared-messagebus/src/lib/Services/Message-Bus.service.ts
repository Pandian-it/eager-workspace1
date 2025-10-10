import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map, takeUntil, share } from 'rxjs/operators';
import { 
  Message, 
  MessageType, 
  BaseMessage, 
  MessageTypeGuards,
  StoreStateRequestMessage,
  StoreStateResponseMessage,
  StoreActionMessage,
  NavigateToMessage,
  NotificationReceivedMessage 
} from '../MessageTypes/Message';

@Injectable({ providedIn: 'root' })
export class MessageBusService {
  // Core message stream - PRIVATE, no external access
  private _messages$ = new Subject<Message>();
  private destroy$ = new Subject<void>();
  
  // Message history for debugging
  private messageHistory: Message[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Publishes a message to all subscribers
   * @param message The message to publish
   */
  publish<T extends Message>(message: T): void {
    // Add timestamp for debugging
    const timestampedMessage = { 
      ...message, 
      timestamp: new Date() 
    };
    
    // Store in history (private method)
    this.addToHistory(timestampedMessage);
    
    // Broadcast the message
    this._messages$.next(timestampedMessage as T);
  }

  /**
   * Subscribe to messages of a specific type using discriminated union
   * @param messageType The message type string to filter by
   * @returns Observable stream of messages of the specified type
   */
  ofTypeByDiscriminator<T extends Message>(messageType: T['type']): Observable<T> {
    return this._messages$.pipe(
      filter((msg): msg is T => msg.type === messageType),
      map(msg => msg as T),
      share(),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to messages of a specific type using message type enum
   * @param messageType The message type enum value to filter by
   * @returns Observable stream of messages of the specified type
   */
  ofType<T extends Message>(messageType: MessageType): Observable<T> {
    return this._messages$.pipe(
      filter((msg): msg is T => msg.type === messageType),
      map(msg => msg as T),
      share(),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to messages with custom filtering based on message properties
   * @param messageType Message type enum value to filter by
   * @param predicate Custom filter function
   * @returns Observable stream of messages matching the predicate
   */
  ofTypeWithFilter<T extends Message>(
    messageType: MessageType, 
    predicate: (message: T) => boolean
  ): Observable<T> {
    return this._messages$.pipe(
      filter((msg): msg is T => msg.type === messageType),
      filter(predicate),
      map(msg => msg as T),
      share(),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to messages from specific sources
   * @param messageType Message type enum value to filter by
   * @param sources Array of source MFE names to listen to
   * @returns Observable stream of messages from specified sources
   */
  ofTypeFromSources<T extends Message>(
    messageType: MessageType, 
    sources: string[]
  ): Observable<T> {
    return this.ofTypeWithFilter<T>(messageType, (msg) => 
      sources.includes(msg.source || '')
    );
  }

  /**
   * Subscribe to messages with specific payload properties using type guards
   * @param messageType Message type enum value to filter by
   * @param payloadFilter Object with payload properties to match
   * @returns Observable stream of messages matching payload criteria
   */
  ofTypeWithPayload<T extends Message>(
    messageType: MessageType,
    payloadFilter: Partial<T['payload']>
  ): Observable<T> {
    return this.ofTypeWithFilter<T>(messageType, (msg) => {
      // Early return if no payload or filter
      if (!msg.payload || !payloadFilter) {
        return true;
      }

      // Type-safe payload filtering using Object.entries
      return Object.entries(payloadFilter).every(([key, expectedValue]) => {
        // Type assertion to allow string indexing
        const payload = msg.payload as Record<string, any>;
        const actualValue = payload[key];
        
        // Handle undefined values in filter (means any value is acceptable)
        if (expectedValue === undefined) {
          return true;
        }
        
        return actualValue === expectedValue;
      });
    });
  }

  /**
   * Type-safe payload filtering with specific property matching
   * @param messageType Message type enum value to filter by
   * @param propertyName The property name to match
   * @param expectedValue The expected value for the property
   * @returns Observable stream of messages with matching property
   */
  ofTypeWithPayloadProperty<T extends Message, K extends keyof T['payload']>(
    messageType: MessageType,
    propertyName: K,
    expectedValue: T['payload'][K]
  ): Observable<T> {
    return this.ofTypeWithFilter<T>(messageType, (msg) => {
      if (!msg.payload) {
        return false;
      }
      return (msg.payload as any)[propertyName] === expectedValue;
    });
  }

  /**
   * Enhanced subscription method with automatic unsubscription using MessageType
   * @param messageType The message type enum to listen for
   * @param handler The callback function to handle the message
   * @param component Optional component reference for cleanup
   * @returns Unsubscribe function
   */
  subscribe<T extends Message>(messageType: MessageType, handler: (message: T) => void, component?: any): () => void {
    const subscription = this.ofType<T>(messageType).subscribe(handler);
    // Return unsubscribe function
    return () => subscription.unsubscribe();
  }

  /**
   * CONTROLLED API for multiple message types - replaces direct messages$ access
   * Listen to multiple message types with custom filtering logic
   * @param messageTypes Array of message types to listen for
   * @param customFilter Optional custom filter function for additional logic
   * @returns Observable stream of messages matching the criteria
   */
  ofMultipleTypes<T extends Message>(
    messageTypes: MessageType[], 
    customFilter?: (message: Message) => boolean
  ): Observable<T> {
    return this._messages$.pipe(
      filter((msg): msg is T => {
        // First check if message type is in the allowed list
        const isAllowedType = messageTypes.includes(msg.type);
        if (!isAllowedType) return false;
        
        // Apply custom filter if provided
        return customFilter ? customFilter(msg) : true;
      }),
      map(msg => msg as T),
      share(),
      takeUntil(this.destroy$)
    );
  }

  /**
   * CONTROLLED API for complex filtering scenarios
   * Provides access to filtered message stream without exposing raw messages$
   * @param predicate Custom filter function that determines which messages to include
   * @returns Observable stream of messages passing the filter
   */
  ofCustomFilter<T extends Message>(predicate: (message: Message) => boolean): Observable<T> {
    return this._messages$.pipe(
      filter((msg): msg is T => predicate(msg)),
      map(msg => msg as T),
      share(),
      takeUntil(this.destroy$)
    );
  }

 
  /**
   * Clean up resources when service is destroyed
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // CONVENIENCE METHODS FOR COMMON MESSAGE TYPES
  // ============================================================================

  /**
   * Convenient method to listen for store requests
   */
  onStoreRequests(): Observable<StoreStateRequestMessage> {
    return this.ofTypeByDiscriminator<StoreStateRequestMessage>(MessageType.STORE_STATE_REQUEST);
  }

  /**
   * Convenient method to listen for store responses
   */
  onStoreResponses(): Observable<StoreStateResponseMessage> {
    return this.ofTypeByDiscriminator<StoreStateResponseMessage>(MessageType.STORE_STATE_RESPONSE);
  }

  /**
   * Convenient method to listen for store actions
   */
  onStoreActions(): Observable<StoreActionMessage> {
    return this.ofTypeByDiscriminator<StoreActionMessage>(MessageType.STORE_ACTION);
  }

  /**
   * Convenient method to listen for navigation messages
   */
  onNavigationMessages(): Observable<NavigateToMessage> {
    return this.ofTypeByDiscriminator<NavigateToMessage>(MessageType.NAVIGATE_TO);
  }

  /**
   * Convenient method to listen for notifications
   */
  onNotifications(): Observable<NotificationReceivedMessage> {
    return this.ofTypeByDiscriminator<NotificationReceivedMessage>(MessageType.NOTIFICATION_RECEIVED);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS - NO EXTERNAL ACCESS
  // ============================================================================

  /**
   * PRIVATE: Add message to history for debugging
   * This method is intentionally private for internal use only
   */
  private addToHistory(message: Message): void {
    this.messageHistory.push(message);
    
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * PRIVATE: Internal access to message stream for debugging only
   * This method is intentionally private to prevent external access
   * External services should use the controlled API methods above
   */
  private getInternalMessageStream(): Observable<Message> {
    return this._messages$.asObservable();
  }

}
