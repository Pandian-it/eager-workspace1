/**
 * Real-World Example: Shell MFE accessing Checkout's Hierarchical Selectors
 * 
 * This example shows how the shell or other MFEs can access complex
 * checkout data using the hierarchical message bus pattern.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map, switchMap, filter } from 'rxjs/operators';
import { EnhancedMfeStoreAccessService } from 'shared-messagebus';

@Component({
  selector: 'app-checkout-progress-widget',
  template: `
    <div class="checkout-widget" *ngIf="checkoutInProgress$ | async">
      <div class="widget-header">
        <h4>Checkout Progress</h4>
        <button class="close-btn" (click)="hideWidget()">×</button>
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-section" *ngIf="checkoutProgress$ | async as progress">
        <div class="progress-bar">
          <div class="progress-fill" 
               [style.width.%]="progress.percentage">
          </div>
        </div>
        <span class="progress-text">
          Step {{ progress.currentStep }} of {{ progress.totalSteps }}
        </span>
      </div>
      
      <!-- Current Step Status -->
      <div class="step-status" *ngIf="currentStepValidation$ | async as validation">
        <div class="step-indicator" [class.valid]="validation.isValid">
          <span *ngIf="validation.isValid">✓</span>
          <span *ngIf="!validation.isValid">!</span>
        </div>
        <div class="step-content">
          <h5>{{ getCurrentStepName(currentStep$ | async) }}</h5>
          <div *ngIf="!validation.isValid" class="errors">
            <p *ngFor="let error of validation.errors" class="error">{{ error }}</p>
          </div>
          <p *ngIf="validation.isValid" class="success">Ready to continue</p>
        </div>
      </div>
      
      <!-- Cart Summary -->
      <div class="cart-summary" *ngIf="checkoutTotals$ | async as totals">
        <div class="total-line">
          <span>{{ itemCount$ | async }} items</span>
          <span>{{ totals.subtotal | currency }}</span>
        </div>
        <div class="total-line" *ngIf="totals.shipping > 0">
          <span>Shipping</span>
          <span>{{ totals.shipping | currency }}</span>
        </div>
        <div class="total-line" *ngIf="totals.tax > 0">
          <span>Tax</span>
          <span>{{ totals.tax | currency }}</span>
        </div>
        <div class="total-line total" *ngIf="totals.discount > 0">
          <span>Discount</span>
          <span class="discount">-{{ totals.discount | currency }}</span>
        </div>
        <div class="total-line total">
          <span><strong>Total</strong></span>
          <span><strong>{{ totals.total | currency }}</strong></span>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="actions">
        <button class="btn-secondary" (click)="viewFullCheckout()">
          View Checkout
        </button>
        <button class="btn-primary" 
                *ngIf="(currentStepValidation$ | async)?.canProceed"
                (click)="continueCheckout()">
          Continue
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./checkout-progress-widget.component.css']
})
export class CheckoutProgressWidgetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // ✅ Hierarchical store access observables
  checkoutInProgress$: Observable<boolean>;
  checkoutProgress$: Observable<any>;
  currentStep$: Observable<number>;
  currentStepValidation$: Observable<any>;
  checkoutTotals$: Observable<any>;
  itemCount$: Observable<number>;

  constructor(
    private storeAccess: EnhancedMfeStoreAccessService
  ) {}

  ngOnInit() {
    this.setupCheckoutDataStreams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupCheckoutDataStreams(): void {
    // ✅ Access checkout UI progress through hierarchical path
    this.checkoutProgress$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',           // Target MFE
      'checkout',          // Feature
      'ui.progress'        // Hierarchical path
    ).pipe(takeUntil(this.destroy$));

    // ✅ Get current step
    this.currentStep$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'ui.currentStep'
    ).pipe(takeUntil(this.destroy$));

    // ✅ Get current step validation with complex selector
    this.currentStepValidation$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'steps.current.validation'
    ).pipe(takeUntil(this.destroy$));

    // ✅ Get computed totals
    this.checkoutTotals$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'computed.totals'
    ).pipe(takeUntil(this.destroy$));

    // ✅ Get item count
    this.itemCount$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'computed.itemCount'
    ).pipe(takeUntil(this.destroy$));

    // ✅ Determine if checkout is in progress
    this.checkoutInProgress$ = combineLatest([
      this.itemCount$,
      this.currentStep$
    ]).pipe(
      map(([itemCount, currentStep]) => itemCount > 0 && currentStep > 0),
      takeUntil(this.destroy$)
    );
  }

  getCurrentStepName(step: number): string {
    const stepNames = {
      1: 'Review Items',
      2: 'Shipping Information',
      3: 'Payment Method',
      4: 'Order Review'
    };
    return stepNames[step] || 'Unknown Step';
  }

  hideWidget(): void {
    // Hide the widget
  }

  viewFullCheckout(): void {
    // Navigate to full checkout page
  }

  continueCheckout(): void {
    // Continue to next step
  }
}

// ============================================================================
// ADVANCED EXAMPLE: Admin Dashboard with Checkout Analytics
// ============================================================================

@Component({
  selector: 'app-checkout-analytics-dashboard',
  template: `
    <div class="analytics-dashboard">
      <h2>Checkout Analytics</h2>
      
      <!-- Real-time Checkout Status -->
      <div class="analytics-card">
        <h3>Active Checkouts</h3>
        <div class="metric">
          <span class="value">{{ activeCheckouts$ | async }}</span>
          <span class="label">In Progress</span>
        </div>
      </div>
      
      <!-- Payment Methods Analysis -->
      <div class="analytics-card">
        <h3>Payment Methods</h3>
        <div *ngFor="let method of paymentMethodsAnalysis$ | async" class="method-stat">
          <span>{{ method.displayName }}</span>
          <span>{{ method.usageCount }}</span>
        </div>
      </div>
      
      <!-- Shipping Preferences -->
      <div class="analytics-card">
        <h3>Shipping Preferences</h3>
        <div *ngFor="let method of shippingAnalysis$ | async" class="shipping-stat">
          <span>{{ method.name }}</span>
          <span>{{ method.percentage }}%</span>
        </div>
      </div>
      
      <!-- Validation Errors -->
      <div class="analytics-card">
        <h3>Common Validation Issues</h3>
        <div *ngFor="let error of validationErrorsAnalysis$ | async" class="error-stat">
          <span>{{ error.field }}</span>
          <span class="error-count">{{ error.count }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./checkout-analytics-dashboard.component.css']
})
export class CheckoutAnalyticsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeCheckouts$: Observable<number>;
  paymentMethodsAnalysis$: Observable<any[]>;
  shippingAnalysis$: Observable<any[]>;
  validationErrorsAnalysis$: Observable<any[]>;

  constructor(
    private storeAccess: EnhancedMfeStoreAccessService
  ) {}

  ngOnInit() {
    this.setupAnalyticsStreams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAnalyticsStreams(): void {
    // ✅ Get checkout analytics summary
    const checkoutAnalytics$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'analytics',
      'summary'
    );

    // ✅ Get all payment methods for analysis
    const allPaymentMethods$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'entities.paymentMethods.all'
    );

    // ✅ Get shipping methods analysis
    const allShippingMethods$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'entities.shippingMethods.bySpeed'
    );

    // ✅ Get validation errors
    const validationErrors$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'ui.validationErrors'
    );

    // Calculate active checkouts
    this.activeCheckouts$ = checkoutAnalytics$.pipe(
      map(analytics => analytics?.conversionFunnel ? 
        Object.values(analytics.conversionFunnel).filter(Boolean).length : 0
      ),
      takeUntil(this.destroy$)
    );

    // Analyze payment methods
    this.paymentMethodsAnalysis$ = allPaymentMethods$.pipe(
      map(methods => methods?.map(method => ({
        ...method,
        usageCount: Math.floor(Math.random() * 100) // Mock usage data
      })) || []),
      takeUntil(this.destroy$)
    );

    // Analyze shipping methods
    this.shippingAnalysis$ = allShippingMethods$.pipe(
      map(methods => {
        const total = methods?.length || 1;
        return methods?.map((method, index) => ({
          ...method,
          percentage: Math.floor((index + 1) / total * 100)
        })) || [];
      }),
      takeUntil(this.destroy$)
    );

    // Analyze validation errors
    this.validationErrorsAnalysis$ = validationErrors$.pipe(
      map(errors => {
        if (!errors || typeof errors !== 'object') return [];
        
        return Object.entries(errors).map(([field, message]) => ({
          field,
          message,
          count: Math.floor(Math.random() * 50) + 1 // Mock count
        }));
      }),
      takeUntil(this.destroy$)
    );
  }
}

// ============================================================================
// BUSINESS SERVICE EXAMPLE: Order Processing with Checkout Data
// ============================================================================

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrderProcessingService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private storeAccess: EnhancedMfeStoreAccessService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ Process order using hierarchical checkout data
   */
  processOrder(): Observable<any> {
    // Get complete checkout summary
    const checkoutSummary$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'checkout',
      'summary.complete'
    );

    // Get payment information
    const selectedPayment$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'payment',
      'selected'
    );

    // Get shipping information
    const selectedShipping$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'shipping',
      'selected'
    );

    // Get validation status
    const validationStatus$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'validation',
      'currentStep'
    );

    return combineLatest([
      checkoutSummary$,
      selectedPayment$,
      selectedShipping$,
      validationStatus$
    ]).pipe(
      filter(([summary, payment, shipping, validation]) => 
        summary?.isComplete && validation?.isValid
      ),
      map(([summary, payment, shipping, validation]) => ({
        orderId: this.generateOrderId(),
        items: summary.items,
        payment: payment,
        shipping: {
          method: shipping,
          address: summary.shipping.address
        },
        billing: summary.billing,
        totals: summary.totals,
        processedAt: new Date().toISOString()
      })),
      takeUntil(this.destroy$)
    );
  }

  /**
   * ✅ Validate checkout before processing
   */
  validateCheckoutForProcessing(): Observable<{ isValid: boolean; errors: string[] }> {
    // Check all required validation steps
    const step1Validation$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'validation',
      'errors.byStep',
      { step: 1 }
    );

    const step2Validation$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'validation',
      'errors.byStep',
      { step: 2 }
    );

    const step3Validation$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'validation',
      'errors.byStep',
      { step: 3 }
    );

    const step4Validation$ = this.storeAccess.getHierarchicalStoreData(
      'checkout',
      'validation',
      'errors.byStep',
      { step: 4 }
    );

    return combineLatest([
      step1Validation$,
      step2Validation$,
      step3Validation$,
      step4Validation$
    ]).pipe(
      map(([step1, step2, step3, step4]) => {
        const allErrors = [
          ...Object.values(step1 || {}),
          ...Object.values(step2 || {}),
          ...Object.values(step3 || {}),
          ...Object.values(step4 || {})
        ].filter(Boolean);

        return {
          isValid: allErrors.length === 0,
          errors: allErrors as string[]
        };
      }),
      takeUntil(this.destroy$)
    );
  }

  private generateOrderId(): string {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}

// ============================================================================
// HIERARCHICAL PATHS USED IN THIS EXAMPLE
// ============================================================================

/*
REAL HIERARCHICAL PATHS DEMONSTRATED:

✅ checkout.ui.progress                    - Get checkout progress info
✅ checkout.ui.currentStep                 - Current step number  
✅ checkout.steps.current.validation       - Current step validation status
✅ checkout.computed.totals                - Calculated totals
✅ checkout.computed.itemCount             - Number of items
✅ checkout.summary.complete               - Complete checkout summary
✅ checkout.entities.paymentMethods.all    - All payment methods
✅ checkout.entities.shippingMethods.bySpeed - Shipping methods by speed
✅ checkout.ui.validationErrors            - Current validation errors
✅ checkout.validation.errors.byStep       - Validation errors by specific step
✅ checkout.analytics.summary              - Analytics data
✅ payment.selected                        - Selected payment method
✅ shipping.selected                       - Selected shipping method
✅ validation.currentStep                  - Current step validation

This demonstrates how real NgRx applications with complex hierarchical 
selectors can be accessed across MFE boundaries using the message bus 
pattern while maintaining type safety and performance.
*/
