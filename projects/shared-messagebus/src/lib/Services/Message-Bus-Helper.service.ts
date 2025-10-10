import { Injectable } from '@angular/core';
import { Observable, Subject, throwError, timer } from 'rxjs';
import { filter, map, take, takeUntil, switchMap, timeout } from 'rxjs/operators';
import { MessageBusService } from '../Services/Message-Bus.service';
import { 
  Message, 
  MessageType,
  MessageFactory,
  MessageTypeGuards,
  StoreStateRequestMessage, 
  StoreStateResponseMessage,
  StoreActionMessage,
  NavigateToMessage,
  NotificationReceivedMessage 
} from '../MessageTypes/Message';
import {
  UserPayload,
  UserAuthPayload,
  ThemePayload,
  LanguagePayload,
  CartPayload,
  OrderPayload,
  CheckoutPayload,
  RoutePayload,
  StoreActionPayload,
  NavigationPayload,
  NotificationPayload
} from '../MessageTypes/Payloads';

@Injectable({ providedIn: 'root' })
export class MessageBusHelper {
  constructor(private messageBus: MessageBusService) {}

  /**
   * Request data from another MFE's store with timeout and error handling
   * @param storeSlice The store slice to request (e.g., 'user', 'cart', 'orders')
   * @param timeoutMs Timeout in milliseconds (default: 5000)
   * @returns Observable with the requested data
   */
  requestStoreData<T>(storeSlice: string, timeoutMs: number = 5000): Observable<T> {
    // Create request using factory instead of constructor
    const request = MessageFactory.createStoreRequest({ storeSlice }, this.getCurrentMfeName());
    
    // Send the request
    this.messageBus.publish(request);

    // Wait for correlated response using new discriminator method
    return this.messageBus.ofTypeByDiscriminator<StoreStateResponseMessage>(MessageType.STORE_STATE_RESPONSE).pipe(
      filter(msg => msg.correlationId === request.correlationId),
      map(msg => msg.payload.data as T),
      take(1),
      timeout(timeoutMs),
      switchMap(data => {
        if (!data) {
          return throwError(() => new Error(`No data received for store slice: ${storeSlice}`));
        }
        return [data];
      })
    );
  }

  /**
   * Send an action to another MFE's store
   * @param targetStore Target MFE store (e.g., 'cart', 'user', 'orders')
   * @param action Action name
   * @param payload Action payload
   */
  dispatchToStore(targetStore: string, action: string, payload: any): void {
    const message = MessageFactory.createStoreAction({
      action,
      data: payload,
      targetStore
    }, this.getCurrentMfeName());
    this.messageBus.publish(message);
  }

  /**
   * Navigate to a route in another MFE
   * @param route Route path
   * @param params Optional route parameters
   */
  navigateTo(route: string, params?: any): void {
    const message = MessageFactory.createNavigateMessage({
      route,
      params
    }, this.getCurrentMfeName());
    this.messageBus.publish(message);
  }

  /**
   * Show a notification across all MFEs
   * @param message Notification message
   * @param type Notification type
   */
  showNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const notification = MessageFactory.createNotificationMessage({
      message,
      type,
      timestamp: new Date()
    }, this.getCurrentMfeName());
    this.messageBus.publish(notification);
  }

  // Domain-specific helper methods using payload interfaces
  
  /**
   * Notify about user updates across MFEs
   */
  notifyUserUpdated(userPayload: UserPayload): void {
    this.dispatchToStore('user', 'USER_UPDATED', userPayload);
  }

  /**
   * Notify about user authentication
   */
  notifyUserLoggedIn(authPayload: UserAuthPayload): void {
    this.dispatchToStore('auth', 'USER_LOGGED_IN', authPayload);
  }

  /**
   * Notify about theme changes
   */
  notifyThemeChanged(themePayload: ThemePayload): void {
    this.dispatchToStore('ui', 'THEME_CHANGED', themePayload);
  }

  /**
   * Notify about language changes
   */
  notifyLanguageChanged(languagePayload: LanguagePayload): void {
    this.dispatchToStore('ui', 'LANGUAGE_CHANGED', languagePayload);
  }

  /**
   * Notify about cart updates
   */
  notifyCartUpdated(cartPayload: CartPayload): void {
    this.dispatchToStore('cart', 'CART_UPDATED', cartPayload);
  }

  /**
   * Notify about order completion
   */
  notifyOrderCompleted(orderPayload: OrderPayload): void {
    this.dispatchToStore('orders', 'ORDER_COMPLETED', orderPayload);
  }

  /**
   * Notify about checkout process
   */
  notifyCheckoutStarted(checkoutPayload: CheckoutPayload): void {
    this.dispatchToStore('checkout', 'CHECKOUT_STARTED', checkoutPayload);
  }

  /**
   * Get user data from user store
   */
  getUserData(): Observable<UserPayload> {
    return this.requestStoreData<UserPayload>('user');
  }

  /**
   * Get cart data from cart store  
   */
  getCartData(): Observable<CartPayload> {
    return this.requestStoreData<CartPayload>('cart');
  }

  /**
   * Get theme preferences from UI store
   */
  getThemePreferences(): Observable<ThemePayload> {
    return this.requestStoreData<ThemePayload>('ui');
  }

  /**
   * Generic Request/Response pattern with automatic correlation using interfaces
   * @param storeSlice The store slice to request data from
   * @param timeoutMs Timeout in milliseconds
   * @returns Observable with the correlated response
   */
  requestStoreDataWithCorrelation<T>(storeSlice: string, timeoutMs: number = 5000): Observable<T> {
    // Create request using factory
    const request = MessageFactory.createStoreRequest({ storeSlice }, this.getCurrentMfeName());
    
    // Send request
    this.messageBus.publish(request);

    // Wait for correlated response using discriminator method
    return this.messageBus.ofTypeByDiscriminator<StoreStateResponseMessage>(MessageType.STORE_STATE_RESPONSE).pipe(
      filter(msg => msg.correlationId === request.correlationId),
      map(msg => msg.payload.data as T),
      take(1),
      timeout(timeoutMs)
    );
  }

  /**
   * Listen to multiple message types with a single subscription using MessageType enums
   * @param messageTypes Array of message type enums to listen to
   * @param handler Handler function that receives any of the message types
   */
  listenToMultiple<T extends Message>(
    messageTypes: MessageType[],
    handler: (message: T) => void
  ): () => void {
    const subscriptions = messageTypes.map(messageType => 
      this.messageBus.ofType<T>(messageType).subscribe(handler)
    );

    // Return cleanup function
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }

  // Private helper methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentMfeName(): string {
    // You can determine this based on your MFE setup
    // For example, from environment variables or window location
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      switch (port) {
        case '4200': return 'shell';
        case '4201': return 'cart';
        case '4202': return 'checkout';
        case '4203': return 'orders';
        default: return 'unknown';
      }
    }
    return 'server';
  }
}
