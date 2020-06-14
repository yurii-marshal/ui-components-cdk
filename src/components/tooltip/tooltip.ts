import { AnimationEvent } from '@angular/animations';
import { Directionality } from '@angular/cdk/bidi';
import { ESCAPE } from '@angular/cdk/keycodes';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState
} from '@angular/cdk/layout';
import {
  FlexibleConnectedPositionStrategy,
  HorizontalConnectionPos,
  OriginConnectionPosition,
  Overlay,
  OverlayConnectionPosition,
  OverlayRef,
  VerticalConnectionPos,
} from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { ComponentPortal } from '@angular/cdk/portal';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { dTooltipAnimations } from './tooltip.animations';
import { ScreenArea, TooltipPlacement, TooltipType, TooltipVisibility } from './types';
import { D_TOOLTIP_DEFAULT_OPTIONS, DTooltipDefaultOptions } from './options';

/**
 * Directive that attaches a design tooltip to the host element. Animates the showing and
 * hiding of a tooltip provided position (defaults to below the element).
 */
@Directive({
  selector: '[dTooltip]',
  exportAs: 'd-tooltip'
})
export class DTooltipDirective implements OnDestroy, OnInit {
  _overlayRef: OverlayRef | null;
  _tooltipInstance: DTooltipComponent | null;
  /** The default delay in ms before showing the tooltip after show is called */
  @Input('showDelay') showDelay = this._defaultOptions.showDelay;
  /** The default delay in ms before hiding the tooltip after hide is called */
  @Input('hideDelay') hideDelay = this._defaultOptions.hideDelay;
  private _portal: ComponentPortal<DTooltipComponent>;
  private _isTooltipBefore = false;
  private _arrowOffsetSize = 12;
  private _arrowClass: string;
  private _anchorPosition: string;
  /** Listeners mapping for user's actions */
  private _manualListeners = new Map<string, EventListenerOrEventListenerObject>();
  /** Emits when the component is destroyed. */
  private readonly _destroyed = new Subject<void>();

  constructor(
    private _overlay: Overlay,
    private _elementRef: ElementRef<HTMLElement>,
    private _scrollDispatcher: ScrollDispatcher,
    private _viewContainerRef: ViewContainerRef,
    private _ngZone: NgZone,
    platform: Platform,
    @Optional() private _dir: Directionality,
    @Optional() @Inject(D_TOOLTIP_DEFAULT_OPTIONS)
    private _defaultOptions: DTooltipDefaultOptions) {

    const element: HTMLElement = _elementRef.nativeElement;
    const hasGestures = typeof window === 'undefined';

    // The mouse events shouldn't be bound on mobile devices, because they can prevent the
    // first tap from firing its click event or can cause the tooltip to open for clicks.
    if (!platform.IOS && !platform.ANDROID) {
      this._manualListeners
        .set('click', () => {
          if (this.trigger === 'click') {
            this.toggle();
          }
        })
        .set('mouseenter', () => {
          if (this.trigger === 'hover') {
            this.show();
          }
        })
        .set('mouseleave', () => {
          if (this.trigger === 'hover') {
            this.hide();
          }
        });
    } else if (!hasGestures) {
      this._manualListeners.set('touchstart', () => this.show());
    }

    this._manualListeners.forEach((listener, event) => element.addEventListener(event, listener));

    if (_defaultOptions && _defaultOptions.position) {
      this.placement = _defaultOptions.position;
    }
  }

  private _placement: TooltipPlacement;

  /** Allows the user to define the position of the tooltip relative to the parent element */
  @Input('placement')
  get placement(): TooltipPlacement {
    return this._placement;
  }

  set placement(value: TooltipPlacement) {
    if (value !== this._placement) {
      this._placement = value;

      if (this._overlayRef) {
        this._updatePosition();

        if (this._tooltipInstance) {
          this._tooltipInstance.show(0);
        }

        this._overlayRef.updatePosition();
      }
    }
  }

  private _tooltipClass = '';

  /** Classes to be passed to the tooltip. Supports the same syntax as `ngClass`. */
  @Input('dTooltipClass')
  get tooltipClass() {
    return this._tooltipClass;
  }

  set tooltipClass(value: string) {
    this._tooltipClass = value;
    if (this._tooltipInstance) {
      this._setTooltipClass(this._tooltipClass);
    }
  }

  private _tooltipType: TooltipType = 'info';

  /** Types of the tooltip. Provides additional styling. */
  @Input('dTooltipType')
  get tooltipType(): TooltipType {
    return this._tooltipType;
  }

  set tooltipType(value: TooltipType) {
    this._tooltipType = value;
    if (this._tooltipInstance) {
      this._setTooltipType(this._tooltipType);
    }
  }

  private _trigger = 'hover';

  /** Sets type of trigger from HTML attribute ('hover' | 'click') */
  @Input('trigger')
  get trigger() {
    return this._trigger;
  }

  set trigger(value: string) {
    if (value) {
      this._trigger = value;
    }
  }

  private _message = '';

  /** The message to be displayed in the tooltip */
  @Input('dTooltip')
  get message() {
    return this._message;
  }

  set message(value: string) {
    // If the message is not a string (e.g. number), convert it to a string and trim it.
    this._message = value != null ? `${value}`.trim() : '';

    if (!this._message && this._isTooltipVisible()) {
      this.hide(0);
    } else {
      this._updateTooltipMessage();
    }
  }

  /**
   * Setup styling-specific things
   */
  ngOnInit() {
    const element = this._elementRef.nativeElement;
    const elementStyle = element.style as CSSStyleDeclaration & { webkitUserDrag: string };

    if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
      // Since `user-select: none` is not needed for the `longpress` event and can cause unexpected
      // behavior for text fields, we always clear the `user-select` to avoid issues on iOS and in Safari.
      elementStyle.webkitUserSelect = elementStyle.userSelect = elementStyle.msUserSelect = '';
    }

    // If the consumer explicitly made the element draggable, clear the `-webkit-user-drag`.
    if (element.draggable && elementStyle.webkitUserDrag === 'none') {
      elementStyle.webkitUserDrag = '';
    }
  }

  /**
   * Dispose the tooltip when destroyed.
   */
  ngOnDestroy() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._tooltipInstance = null;
    }

    // Clean up the event listeners set in the constructor
    this._manualListeners.forEach((listener, event) => {
      this._elementRef.nativeElement.removeEventListener(event, listener);
    });
    this._manualListeners.clear();

    this._destroyed.next();
    this._destroyed.complete();
  }

  /** Shows the tooltip after the delay in ms, defaults to tooltip-delay-show or 0ms if no input */
  show(delay: number = this.showDelay): void {
    if (!this.message || (this._isTooltipVisible() &&
      !this._tooltipInstance._showTimeoutId && !this._tooltipInstance._hideTimeoutId)) {
      return;
    }

    const overlayRef = this._createOverlay();

    this._detach();
    this._portal = this._portal || new ComponentPortal(DTooltipComponent, this._viewContainerRef);
    this._tooltipInstance = overlayRef.attach(this._portal).instance;
    this._tooltipInstance.afterHidden()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());
    this._setTooltipClass(this._tooltipClass);
    this._setTooltipType(this._tooltipType);
    this._updateTooltipMessage();
    this._tooltipInstance.show(delay);
  }

  /** Hides the tooltip after the delay in ms, defaults to tooltip-delay-hide or 0ms if no input */
  hide(delay: number = this.hideDelay): void {
    if (this._tooltipInstance) {
      this._tooltipInstance.hide(delay);
    }
  }

  /** Shows/hides the tooltip */
  toggle(): void {
    this._isTooltipVisible() ? this.hide() : this.show();
  }

  /** Returns true if the tooltip is currently visible to the user */
  _isTooltipVisible(): boolean {
    return !!this._tooltipInstance && this._tooltipInstance.isVisible();
  }

  _arrowReposition(position) {
    if (this._placement === 'right' && position.connectionPair.offsetX === -this._arrowOffsetSize) {
      this._tooltipInstance._arrowClass = 'right';
    } else if (this._placement === 'left' && position.connectionPair.offsetX === this._arrowOffsetSize) {
      this._tooltipInstance._arrowClass = 'left';
    } else if (this._placement === 'top' && position.connectionPair.offsetY === this._arrowOffsetSize) {
      this._tooltipInstance._arrowClass = this._isTooltipBefore ? 'bottom-before' : 'bottom-after';
    } else if (this._placement === 'bottom' && position.connectionPair.offsetY === -this._arrowOffsetSize) {
      this._tooltipInstance._arrowClass = this._isTooltipBefore ? 'top-before' : 'top-after';
    }
  }

  /**
   * Returns the origin position and a fallback position based on the user's position preference.
   */
  _getOrigin(): { main: OriginConnectionPosition, fallback: OriginConnectionPosition } {
    const isLtr = !this._dir || this._dir.value === 'ltr';
    const placement = this._getCorrectedPlacement(this.placement);
    let originPosition: OriginConnectionPosition;

    if (placement === 'top' || placement === 'bottom') {
      originPosition = {originX: 'center', originY: placement};
    } else if (
      (placement === 'left' && isLtr) ||
      (placement === 'right' && !isLtr)) {
      originPosition = {originX: 'start', originY: 'center'};
    } else if (
      (placement === 'right' && isLtr) ||
      (placement === 'left' && !isLtr)) {
      originPosition = {originX: 'end', originY: 'center'};
    } else {
      throw getDTooltipInvalidPositionError(placement);
    }

    const {x, y} = this._invertOriginPosition(originPosition.originX, originPosition.originY, placement);

    return {
      main: originPosition,
      fallback: {originX: x, originY: y}
    };
  }

  /** Returns the overlay position and a fallback position based on the user's preference */
  _getOverlayPosition(): { main: OverlayConnectionPosition, fallback: OverlayConnectionPosition } {
    const isLtr = !this._dir || this._dir.value === 'ltr';
    const placement = this._getCorrectedPlacement(this.placement);
    let overlayPosition: OverlayConnectionPosition;

    if (placement === 'top') {
      overlayPosition = {overlayX: this._isTooltipBefore ? 'end' : 'start', overlayY: 'bottom'};
    } else if (placement === 'bottom') {
      overlayPosition = {overlayX: this._isTooltipBefore ? 'end' : 'start', overlayY: 'top'};
    } else if (
      (placement === 'left' && isLtr) ||
      (placement === 'right' && !isLtr)) {
      overlayPosition = {overlayX: 'end', overlayY: 'center'};
    } else if (
      (placement === 'right' && isLtr) ||
      (placement === 'left' && !isLtr)) {
      overlayPosition = {overlayX: 'start', overlayY: 'center'};
    } else {
      throw getDTooltipInvalidPositionError(placement);
    }

    const {x, y} = this._invertOverlayPosition(overlayPosition.overlayX, overlayPosition.overlayY, placement);

    return {
      main: overlayPosition,
      fallback: {overlayX: x, overlayY: y}
    };
  }

  /** Returns the overlay offsets and a fallback offsets */
  _getOffsets() {
    const isLtr = !this._dir || this._dir.value === 'ltr';
    const placement = this._getCorrectedPlacement(this.placement);
    const arrowShiftX = this._arrowOffsetSize + this._arrowOffsetSize / 2;
    let offsetSize: OverlayConnectionOffset;

    if (placement === 'top') {
      offsetSize = {
        offsetX: this._isTooltipBefore ? arrowShiftX : -arrowShiftX,
        offsetY: -this._arrowOffsetSize
      };
    } else if (placement === 'bottom') {
      offsetSize = {
        offsetX: this._isTooltipBefore ? arrowShiftX : -arrowShiftX,
        offsetY: this._arrowOffsetSize
      };
    } else if (
      (placement === 'left' && isLtr) ||
      (placement === 'right' && !isLtr)) {
      offsetSize = {offsetX: -this._arrowOffsetSize, offsetY: 0};
    } else if (
      (placement === 'right' && isLtr) ||
      (placement === 'left' && !isLtr)) {
      offsetSize = {offsetX: this._arrowOffsetSize, offsetY: 0};
    } else {
      throw getDTooltipInvalidPositionError(placement);
    }

    const {x, y} = this._invertOffsets(offsetSize.offsetX, offsetSize.offsetY, placement);

    return {
      main: offsetSize,
      fallback: {offsetX: x, offsetY: y}
    };
  }

  /** Create the overlay config and position strategy */
  private _createOverlay(): OverlayRef {
    if (this._overlayRef) {
      return this._overlayRef;
    }

    const scrollableAncestors = this._scrollDispatcher.getAncestorScrollContainers(this._elementRef);

    // Create connected position strategy that listens for scroll events to reposition.
    const strategy = this._overlay.position()
      .flexibleConnectedTo(this._elementRef)
      .withTransformOriginOn('.d-tooltip')
      .withScrollableContainers(scrollableAncestors);

    strategy.positionChanges.pipe(takeUntil(this._destroyed)).subscribe(position => {
      if (this._tooltipInstance) {
        if (position.scrollableViewProperties.isOverlayClipped && this._tooltipInstance.isVisible()) {
          // After position changes occur and the overlay is clipped by
          // a parent scrollable then close the tooltip.
          this._ngZone.run(() => this.hide(0));
        } else {
          this._arrowReposition(position);
        }
      }
    });

    this._overlayRef = this._overlay.create({
      direction: this._dir,
      panelClass: 'd-tooltip-panel',
      positionStrategy: strategy,
      scrollStrategy: this._overlay.scrollStrategies.reposition()
    });

    this._updatePosition();

    this._overlayRef.detachments()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());

    return this._overlayRef;
  }

  /** Detaches the currently-attached tooltip. */
  private _detach() {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }

    this._tooltipInstance = null;
  }

  /** Automatic correction of placement accordingly to screen area */
  private _positionAdjustment() {
    const anchorBoundingBox = this._elementRef.nativeElement.getBoundingClientRect();
    this._anchorPosition = this._getAnchorPosition(anchorBoundingBox.left, anchorBoundingBox.top);
    if (this._placement === 'top' || this._placement === 'bottom') {
      switch (this._anchorPosition) {
        // 'main' area: placement must be changed to 'after' automatically
        case 'main':
          this._isTooltipBefore = false;
          this._arrowClass = this._placement === 'top' ? 'top-after' : 'bottom-after';
          break;
        // 'right' area: placement must be changed to 'before' automatically
        case 'right':
          this._isTooltipBefore = true;
          this._arrowClass = this._placement === 'top' ? 'top-before' : 'bottom-before';
          break;
        // 'bottom' area: placement must be changed to 'top-after' automatically
        case 'bottom':
          this._isTooltipBefore = false;
          this._arrowClass = 'top-after';
          break;
        // 'bottom-right' area: placement must be changed to 'top-before' automatically
        case 'bottom-right':
          this._isTooltipBefore = true;
          this._arrowClass = 'top-before';
          break;
      }
    } else {
      this._arrowClass = this._placement === 'left' ? 'right' : 'left';
    }
  }

  /** Updates the position of the current tooltip. */
  private _updatePosition() {
    const position = this._overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
    this._positionAdjustment();
    const origin = this._getOrigin();
    const overlay = this._getOverlayPosition();
    const offset = this._getOffsets();

    position.withPositions([
      {...origin.main, ...overlay.main, ...offset.main},
      {...origin.fallback, ...overlay.fallback, ...offset.fallback}
    ]);
  }

  /** Updates coordinates of portal accordingly to a screen area. */
  private _getCorrectedPlacement(placement) {
    if (this._anchorPosition === 'bottom' || this._anchorPosition === 'bottom-right') {
      if (placement === 'bottom') {
        return placement = 'top';
      }
    } else if (this._anchorPosition === 'right') {
      if (placement === 'right') {
        return placement = 'left';
      }
    }

    return placement;
  }

  /** Return type of screen area due to position of the anchor */
  private _getAnchorPosition(elementPositionX: number, elementPositionY: number): ScreenArea {
    const targetX = window.innerWidth - elementPositionX;
    const targetY = window.innerHeight - elementPositionY;

    if (targetX <= 282 && targetY > 120) {
      return 'right';
    } else if (targetX >= 282 && targetY <= 120) {
      return 'bottom';
    } else if (targetX < 282 && targetY <= 120) {
      return 'bottom-right';
    }

    return 'main';
  }

  /** Updates the tooltip message and repositions the overlay according to the new message length */
  private _updateTooltipMessage() {
    // Must wait for the message to be painted to the tooltip so that the overlay can properly
    // calculate the correct positioning based on the size of the text.
    if (this._tooltipInstance) {
      this._tooltipInstance.message = this.message;
      this._tooltipInstance._markForCheck();

      this._ngZone.onMicrotaskEmpty.asObservable().pipe(
        take(1),
        takeUntil(this._destroyed)
      ).subscribe(() => {
        if (this._tooltipInstance) {
          this._overlayRef.updatePosition();
        }
      });
    }
  }

  /** Updates the tooltip class */
  private _setTooltipClass(tooltipClass: string) {
    if (this._tooltipInstance) {
      this._tooltipInstance.tooltipClass.push(tooltipClass);
      this._tooltipInstance._markForCheck();
    }
  }

  /** Updates the tooltip type */
  private _setTooltipType(tooltipType: TooltipType) {
    if (this._tooltipInstance) {
      this._tooltipInstance._arrowClass = this._arrowClass;
      this._tooltipInstance.tooltipClass.push(tooltipType);
      this._tooltipInstance._markForCheck();
    }
  }

  /** Inverts an origin position. */
  private _invertOriginPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos, placement) {
    if (placement === 'top' || placement === 'bottom') {
      if (y === 'top') {
        y = 'bottom';
      } else if (y === 'bottom') {
        y = 'top';
      }
    } else {
      if (x === 'end') {
        x = 'start';
      } else if (x === 'start') {
        x = 'end';
      }
    }

    return {x, y};
  }

  /** Inverts an overlay position. */
  private _invertOverlayPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos, placement) {
    if (placement === 'top' || placement === 'bottom') {
      if (y === 'top') {
        y = 'bottom';
      } else if (y === 'bottom') {
        y = 'top';
      }
    } else {
      if (x === 'end') {
        x = 'start';
      } else if (x === 'start') {
        x = 'end';
      }
    }

    return {x, y};
  }

  /** Inverts an overlay offsets. */
  private _invertOffsets(x: number, y: number, placement) {
    if (placement === 'top' || placement === 'bottom') {
      if (y === this._arrowOffsetSize) {
        y = -this._arrowOffsetSize;
      } else if (y === -this._arrowOffsetSize) {
        y = this._arrowOffsetSize;
      }
    } else if (placement === 'left' || placement === 'right') {
      if (x === this._arrowOffsetSize) {
        x = -this._arrowOffsetSize;
      } else if (x === -this._arrowOffsetSize) {
        x = this._arrowOffsetSize;
      }
    }

    return {x, y};
  }
}

@Component({
  selector: 'd-tooltip-component',
  templateUrl: 'tooltip.component.html',
  styleUrls: ['tooltip.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [dTooltipAnimations.tooltipState]
})
export class DTooltipComponent implements OnDestroy {
  /** Message to display in the tooltip */
  message: string;

  /** Classes to be added to the tooltip. Supports the same syntax as `ngClass`. */
  tooltipClass: string[] = [];

  _arrowClass: string;

  /** The timeout ID of any current timer set to show the tooltip */
  _showTimeoutId: number | null;

  /** The timeout ID of any current timer set to hide the tooltip */
  _hideTimeoutId: number | null;

  /** Property watched by the animation framework to show or hide the tooltip */
  _visibility: TooltipVisibility = 'initial';
  /** Stream that emits whether the user has a handset-sized display.  */
  _isHandset: Observable<BreakpointState> = this._breakpointObserver.observe(Breakpoints.Handset);
  @HostBinding('style.zoom') zoom = this._visibility === 'visible' ? 1 : null;
  /** Whether interactions on the page should close the tooltip */
  private _closeOnInteraction = false;
  /** Subject for notifying that the tooltip has been hidden from the view */
  private readonly _onHide: Subject<any> = new Subject();

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _breakpointObserver: BreakpointObserver) {
  }

  /**
   * Shows the tooltip with an animation originating from the provided origin
   */
  show(delay: number): void {
    // Cancel the delayed hide if it is scheduled
    if (this._hideTimeoutId) {
      clearTimeout(this._hideTimeoutId);
      this._hideTimeoutId = null;
    }
    // Body interactions should cancel the tooltip if there is a delay in showing.
    this._closeOnInteraction = true;
    this._showTimeoutId = setTimeout(() => {
      this._visibility = 'visible';
      this._showTimeoutId = null;

      // Mark for check so if any parent component has set the
      // ChangeDetectionStrategy to OnPush it will be checked anyways
      this._markForCheck();
    }, delay);
  }

  /**
   * Begins the animation to hide the tooltip after the provided delay in ms.
   */
  hide(delay: number): void {
    // Cancel the delayed show if it is scheduled
    if (this._showTimeoutId) {
      clearTimeout(this._showTimeoutId);
      this._showTimeoutId = null;
    }

    this._hideTimeoutId = setTimeout(() => {
      this._visibility = 'hidden';
      this._hideTimeoutId = null;

      // Mark for check so if any parent component has set the
      // ChangeDetectionStrategy to OnPush it will be checked anyways
      this._markForCheck();
    }, delay);
  }

  /** Returns an observable that notifies when the tooltip has been hidden from view. */
  afterHidden(): Observable<void> {
    return this._onHide.asObservable();
  }

  /** Whether the tooltip is being displayed. */
  isVisible(): boolean {
    return this._visibility === 'visible';
  }

  ngOnDestroy() {
    this._onHide.complete();
  }

  _animationStart() {
    this._closeOnInteraction = false;
  }

  _animationDone(event: AnimationEvent): void {
    const toState = event.toState as TooltipVisibility;

    if (toState === 'hidden' && !this.isVisible()) {
      this._onHide.next();
    }

    if (toState === 'visible' || toState === 'hidden') {
      this._closeOnInteraction = true;
    }
  }

  /**
   * Interactions on the HTML body should close the tooltip immediately as defined in the
   * design spec.
   */
  @HostListener('body:click')
  _handleBodyInteraction(): void {
    if (this._closeOnInteraction) {
      this.hide(0);
    }
  }

  /**
   * Marks that the tooltip needs to be checked in the next change detection run.
   * Mainly used for rendering the initial text before positioning a tooltip, which
   * can be problematic in components with OnPush change detection.
   */
  _markForCheck(): void {
    this._changeDetectorRef.markForCheck();
  }
}

/**
 * Creates an error to be thrown if the user supplied an invalid tooltip position.
 */
export function getDTooltipInvalidPositionError(placement: string) {
  return Error(`Tooltip position "${placement}" is invalid.`);
}

export interface OverlayConnectionOffset {
  offsetX: number;
  offsetY: number;
}
