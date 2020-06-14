import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {
  NotificationAction,
  PopoverNotification,
  PopoverNotificationService,
} from './notification.service';
import {
  DPopoverScrollStrategy,
  DPopoverHorizontalAlign,
  DPopoverVerticalAlign,
  VALID_SCROLL,
  VALID_HORIZ_ALIGN,
  VALID_VERT_ALIGN,
  VALID_PLACEMENT, Placement,
} from './types';

function getUnanchoredPopoverError(): Error {
  return Error('DPopover is not anchored to any DPopoverAnchor.');
}

function getInvalidPlacementError(alignment): Error {
  return Error(generateGenericError('placement', alignment, VALID_PLACEMENT));
}

function getInvalidHorizontalAlignError(alignment): Error {
  return Error(generateGenericError('horizontalAlign', alignment, VALID_HORIZ_ALIGN));
}

function getInvalidVerticalAlignError(alignment): Error {
  return Error(generateGenericError('verticalAlign', alignment, VALID_VERT_ALIGN));
}

function getInvalidScrollStrategyError(strategy): Error {
  return Error(generateGenericError('scrollStrategy', strategy, VALID_SCROLL));
}

function generateGenericError(apiName: string, invalid: any, valid: string[]): string {
  return `Invalid ${apiName}: '${invalid}'. Valid options are ` +
    `${valid.map(v => `'${v}'`).join(', ')}.`;
}

@Component({
  selector: 'd-popover-template',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./popover.component.scss'],
  templateUrl: './popover.component.html',
})
export class DPopoverComponent implements OnInit, OnDestroy {
  /** Alignment of the popover on the horizontal axis. */
  get horizontalAlign() {
    return this._horizontalAlign;
  }

  set horizontalAlign(val: DPopoverHorizontalAlign) {
    this._validateHorizontalAlign(val);
    if (this._horizontalAlign !== val) {
      this._horizontalAlign = val;
      this._dispatchConfigNotification(new PopoverNotification(NotificationAction.REPOSITION));
    }
  }

  private _horizontalAlign: DPopoverHorizontalAlign = 'center';

  /** Alignment of the popover on the vertical axis. */
  get verticalAlign() {
    return this._verticalAlign;
  }

  set verticalAlign(val: DPopoverVerticalAlign) {
    this._validateVerticalAlign(val);
    if (this._verticalAlign !== val) {
      this._verticalAlign = val;
      this._dispatchConfigNotification(new PopoverNotification(NotificationAction.REPOSITION));
    }
  }

  private _verticalAlign: DPopoverVerticalAlign = 'bottom';

  /** Placement of the popover as alternative way to set the position. */
  @Input()
  get placement() {
    return this._placement;
  }

  set placement(val: Placement) {
    this._validatePlacement(val);
    if (this._placement !== val) {
      this._placement = val;
      this._dispatchConfigNotification(new PopoverNotification(NotificationAction.REPOSITION));
    }
  }

  private _placement: Placement = 'bottom';

  /** Whether the popover always opens with the specified alignment. */
  @Input()
  get forceAlignment() {
    return this._forceAlignment;
  }

  set forceAlignment(val: boolean) {
    if (this._forceAlignment !== val) {
      this._forceAlignment = val;
      this._dispatchConfigNotification(new PopoverNotification(NotificationAction.REPOSITION));
    }
  }

  private _forceAlignment = false;

  /**
   * Whether the popover's alignment is locked after opening. This prevents the popover
   * from changing its alignement when scrolling or changing the size of the viewport.
   */
  @Input()
  get lockAlignment() {
    return this._lockAlignment;
  }

  set lockAlignment(val: boolean) {
    if (this._lockAlignment !== val) {
      this._lockAlignment = val;
      this._dispatchConfigNotification(new PopoverNotification(NotificationAction.REPOSITION));
    }
  }

  private _lockAlignment = true;

  /** How the popover should handle scrolling. */
  @Input()
  get scrollStrategy() {
    return this._scrollStrategy;
  }

  set scrollStrategy(val: DPopoverScrollStrategy) {
    this._validateScrollStrategy(val);
    if (this._scrollStrategy !== val) {
      this._scrollStrategy = val;
      this._dispatchConfigNotification(new PopoverNotification(NotificationAction.UPDATE_CONFIG));
    }
  }

  private _scrollStrategy: DPopoverScrollStrategy = 'reposition';

  /** Whether the popover should have a backdrop (includes closing on click by default). */
  @Input()
  get hasBackdrop() {
    return this._hasBackdrop;
  }

  set hasBackdrop(val: boolean) {
    this._hasBackdrop = val;
  }

  private _hasBackdrop = false;

  /** Optional backdrop class. */
  @Input() backdropClass = '';

  /** Emits when the popover is opened. */
  @Output() opened = new EventEmitter<void>();

  /** Emits when the popover is closed. */
  @Output() closed = new EventEmitter<any>();

  /** Emits when the popover has finished opening. */
  @Output() afterOpen = new EventEmitter<void>();

  /** Emits when the popover has finished closing. */
  @Output() afterClose = new EventEmitter<void>();

  /** Emits when the backdrop is clicked. */
  @Output() backdropClicked = new EventEmitter<void>();

  /** Emits when a keydown event is targeted to this popover's overlay. */
  @Output() overlayKeydown = new EventEmitter<KeyboardEvent>();

  /** Reference to template so it can be placed within a portal. */
  @ViewChild(TemplateRef) _templateRef: TemplateRef<any>;

  /** Classes to be added to the popover for setting the correct transform origin. */
  _classList: any = {};

  /** Whether the popover is presently open. */
  _open = false;

  /** Instance of notification service. Will be undefined until attached to an anchor. */
  _notifications: PopoverNotificationService;

  /** Reference to the element to build a focus trap around. */
  @ViewChild('focusTrapElement')
  private _focusTrapElement: ElementRef;

  /** Set styles from component variables */
  _arrowAlignmentStyles: Object;

  /** Set length of an arrow cube */
  _arrowBorderSideLength = 5;

  constructor(@Optional() @Inject(DOCUMENT) private _document: any) {
  }

  ngOnInit() {
    this._setAlignmentPlaces();
    this._setAlignmentClasses();
  }

  ngOnDestroy() {
    if (this._notifications) {
      this._notifications.dispose();
    }
  }

  /** Open this popover. */
  open(): void {
    const notification = new PopoverNotification(NotificationAction.OPEN);
    this._dispatchActionNotification(notification);
  }

  /** Close this popover. */
  close(value?: any): void {
    const notification = new PopoverNotification(NotificationAction.CLOSE, value);
    this._dispatchActionNotification(notification);
  }

  /** Toggle this popover open or closed. */
  toggle(): void {
    const notification = new PopoverNotification(NotificationAction.TOGGLE);
    this._dispatchActionNotification(notification);
  }

  /** Realign the popover to the anchor. */
  realign(): void {
    const notification = new PopoverNotification(NotificationAction.REALIGN);
    this._dispatchActionNotification(notification);
  }

  /** Calculate alignment of the arrow. */
  _setArrowAlignment(anchorWidth, anchorHeight, popoverWidth, popoverHeight) {
    const isHorizontalArrowRelatedToAnchor = popoverWidth > anchorWidth;
    const isVerticalArrowRelatedToAnchor = popoverHeight > anchorHeight;

    const centralHorizontalAlignment = {
      'left': '50%',
      '-webkit-transform': 'translate(-50%, 0)',
      '-ms-transform': 'translate(-50%, 0)',
      'transform': 'translate(-50%, 0)',
    };

    const centralVerticalAlignment = {
      'top': '50%',
      '-webkit-transform': 'translate(0, -50%)',
      '-ms-transform': 'translate(0, -50%)',
      'transform': 'translate(0, -50%)',
    };

    if (this.placement.startsWith('top') || this.placement.startsWith('bottom')) {
      if (isHorizontalArrowRelatedToAnchor) {
        if (this.placement === 'top-left' || this.placement === 'bottom-left') {
          this._arrowAlignmentStyles = {
            'left': (anchorWidth / 2) - (this._arrowBorderSideLength / 2) + 'px'
          };
        } else if (this.placement === 'top-right' || this.placement === 'bottom-right') {
          this._arrowAlignmentStyles = {
            'right': (anchorWidth / 2) - this._arrowBorderSideLength + 'px'
          };
        } else if (this.placement === 'top' || this.placement === 'bottom') {
          this._arrowAlignmentStyles = centralHorizontalAlignment;
        }
      } else {
        this._arrowAlignmentStyles = centralHorizontalAlignment;
      }
    } else {
      if (isVerticalArrowRelatedToAnchor) {
        if (this.placement === 'left-top' || this.placement === 'right-top') {
          this._arrowAlignmentStyles = {
            'bottom': (anchorHeight / 2) - (this._arrowBorderSideLength / 2) + 'px'
          };
        } else if (this.placement === 'left-bottom' || this.placement === 'right-bottom') {
          this._arrowAlignmentStyles = {
            'top': (anchorHeight / 2) - this._arrowBorderSideLength + 'px'
          };
        } else if (this.placement === 'left' || this.placement === 'right') {
          this._arrowAlignmentStyles = centralVerticalAlignment;
        }
      } else {
        this._arrowAlignmentStyles = centralVerticalAlignment;
      }
    }
  }

  /** Reduce placement aliases due to needs of CDK Portal */
  _setAlignmentPlaces() {
    switch (this.placement) {
      case 'top':
        this.horizontalAlign = 'center';
        this.verticalAlign = 'top';
        break;
      case 'top-left':
        this.horizontalAlign = 'start';
        this.verticalAlign = 'top';
        break;
      case 'top-right':
        this.horizontalAlign = 'end';
        this.verticalAlign = 'top';
        break;
      case 'bottom':
        this.horizontalAlign = 'center';
        this.verticalAlign = 'bottom';
        break;
      case 'bottom-left':
        this.horizontalAlign = 'start';
        this.verticalAlign = 'bottom';
        break;
      case 'bottom-right':
        this.horizontalAlign = 'end';
        this.verticalAlign = 'bottom';
        break;
      case 'left':
        this.horizontalAlign = 'left';
        this.verticalAlign = 'center';
        break;
      case 'left-top':
        this.horizontalAlign = 'left';
        this.verticalAlign = 'start';
        break;
      case 'left-bottom':
        this.horizontalAlign = 'left';
        this.verticalAlign = 'end';
        break;
      case 'right':
        this.horizontalAlign = 'right';
        this.verticalAlign = 'center';
        break;
      case 'right-top':
        this.horizontalAlign = 'right';
        this.verticalAlign = 'start';
        break;
      case 'right-bottom':
        this.horizontalAlign = 'right';
        this.verticalAlign = 'end';
        break;
    }
  }

  /** Apply alignment classes based on alignment inputs. */
  _setAlignmentClasses(horizAlign = this.horizontalAlign, vertAlign = this.verticalAlign) {

    let placement = this.placement.slice();

    // in the case if popover applies realign
    switch (horizAlign) {
      case 'right':
        if (placement.startsWith('left')) {
          placement = placement.replace('left', 'right');
        }
        break;
      case 'left':
        if (placement.startsWith('right')) {
          placement = placement.replace('right', 'left');
        }
        break;
    }

    switch (vertAlign) {
      case 'top':
        if (placement.startsWith('bottom')) {
          placement = placement.replace('bottom', 'top');
        }
        break;
      case 'bottom':
        if (placement.startsWith('top')) {
          placement = placement.replace('top', 'bottom');
        }
        break;
    }

    this._classList['d-v-top'] = placement === 'top' || placement === 'top-left' || placement === 'top-right';

    this._classList['d-v-start'] = placement === 'left-top' || placement === 'right-top';

    this._classList['d-v-center'] = placement === 'left' || placement === 'right';

    this._classList['d-v-end'] = placement === 'left-bottom' || placement === 'right-bottom';

    this._classList['d-v-bottom'] = placement === 'bottom' || placement === 'bottom-left' || placement === 'bottom-right';

    this._classList['d-h-left'] = placement === 'left' || placement === 'left-top' || placement === 'left-bottom';

    this._classList['d-h-start'] = placement === 'top-left' || placement === 'bottom-left';

    this._classList['d-h-center'] = placement === 'top' || placement === 'bottom';

    this._classList['d-h-end'] = placement === 'top-right' || placement === 'bottom-right';

    this._classList['d-h-right'] = placement === 'right' || placement === 'right-top' || placement === 'right-bottom';
  }

  /** Dispatch a notification to the notification service, if possible. */
  private _dispatchConfigNotification(notification: PopoverNotification) {
    if (this._notifications) {
      this._notifications.dispatch(notification);
    }
  }

  /** Dispatch a notification to the notification service and throw if unable to. */
  private _dispatchActionNotification(notification: PopoverNotification) {
    if (!this._notifications) {
      throw getUnanchoredPopoverError();
    }

    this._notifications.dispatch(notification);
  }

  /** Throws an error if the alignment is not a valid placement. */
  private _validatePlacement(pos: Placement): void {
    if (VALID_PLACEMENT.indexOf(pos) === -1) {
      throw getInvalidPlacementError(pos);
    }
  }

  /** Throws an error if the alignment is not a valid horizontalAlign. */
  private _validateHorizontalAlign(pos: DPopoverHorizontalAlign): void {
    if (VALID_HORIZ_ALIGN.indexOf(pos) === -1) {
      throw getInvalidHorizontalAlignError(pos);
    }
  }

  /** Throws an error if the alignment is not a valid verticalAlign. */
  private _validateVerticalAlign(pos: DPopoverVerticalAlign): void {
    if (VALID_VERT_ALIGN.indexOf(pos) === -1) {
      throw getInvalidVerticalAlignError(pos);
    }
  }

  /** Throws an error if the scroll strategy is not a valid strategy. */
  private _validateScrollStrategy(strategy: DPopoverScrollStrategy): void {
    if (VALID_SCROLL.indexOf(strategy) === -1) {
      throw getInvalidScrollStrategyError(strategy);
    }
  }

}
