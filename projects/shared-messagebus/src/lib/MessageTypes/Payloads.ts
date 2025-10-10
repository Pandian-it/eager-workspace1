// Core payload interfaces for MFE communication
export interface StoreDataPayload {
  storeSlice: string;
}

// Enhanced payload for hierarchical store requests
export interface HierarchicalStoreDataPayload {
  targetMfe: string;
  feature: string;
  selectorPath: string;
  selectorParams?: { [key: string]: any };
}

export interface StoreDataResponsePayload {
  storeSlice: string;
  data: any;
  success?: boolean;
  error?: string;
}

// Enhanced payload for hierarchical store responses
export interface HierarchicalStoreDataResponsePayload {
  targetMfe: string;
  feature: string;
  selectorPath: string;
  selectorParams?: { [key: string]: any };
  data: any;
  success?: boolean;
  error?: string;
}

export interface StoreActionPayload {
  action: string;
  data: any;
  targetStore: string;
}

export interface NavigationPayload {
  route: string;
  params?: any;
}

export interface NotificationPayload {
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: Date;
}

// Additional domain-specific payload interfaces
export interface UserPayload {
  id: number;
  name: string;
  email?: string;
}

export interface UserAuthPayload {
  userId: number;
  token: string;
}

export interface ThemePayload {
  theme: 'dark' | 'light';
}

export interface LanguagePayload {
  language: string;
}

export interface CartPayload {
  itemCount: number;
  totalPrice: number;
}

export interface OrderPayload {
  orderId: string;
  total: number;
}

export interface CheckoutPayload {
  checkoutId?: string;
  cartId?: string;
  step?: number;
  items?: any[];
  total?: number;
}

export interface RoutePayload {
  currentRoute: string;
  previousRoute?: string;
}
