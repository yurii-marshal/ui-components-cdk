import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {UniqueSelectionDispatcher} from '@angular/cdk/collections';

// Increasing integer for generating unique ids for radio components.
let nextUniqueId = 0;

/**
 * Provider Expression that allows d-radio-group to register as a ControlValueAccessor. This
 * allows it to support [(ngModel)] and ngControl.
 * @docs-private
 */
export const RADIO_GROUP_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => RadioGroupDirective),
  multi: true
};

/** Change event object emitted by Radio and RadioGroup. */
export class RadioChange {
  constructor(
    public source: RadioButtonComponent,
    public value: any) {
  }
}

/**
 * A group of radio buttons. May contain one or more `<d-radio-button>` elements.
 */
@Directive({
  selector: 'd-radio-group',
  exportAs: 'dRadioGroup',
  providers: [RADIO_GROUP_CONTROL_VALUE_ACCESSOR],
  host: {
    'role': 'radiogroup',
    'class': 'd-radio-group',
  },
})
export class RadioGroupDirective implements AfterContentInit, ControlValueAccessor {
  /** Selected value for the radio group. */
  private _value: any = null;

  /** The HTML name attribute applied to radio buttons in this group. */
  private _name = `d-radio-group-${nextUniqueId++}`;

  /** The currently selected radio button. Should match value. */
  private _selected: RadioButtonComponent | null = null;

  /** Whether the `value` has been set to its initial value. */
  private _isInitialized = false;

  /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
  private _labelPosition: 'before' | 'after' = 'after';

  /** Whether the radio group is disabled. */
  private _disabled = false;

  /** Whether the radio group is required. */
  private _required = false;

  /**
   * Event emitted when the group value changes.
   * Change events are only emitted when the value changes due to user interaction with
   * a radio button (the same behavior as `<input type-"radio">`).
   */
  @Output() readonly change: EventEmitter<RadioChange> = new EventEmitter<RadioChange>();

  /**
   * Emit when the value attribute changes by variable.
   */
  @Output() dValueChange = new EventEmitter();

  /** Child radio buttons. */
  @ContentChildren(forwardRef(() => RadioButtonComponent), {descendants: true})
  _radios: QueryList<RadioButtonComponent>;

  /** The method to be called in order to update ngModel */
  _controlValueAccessorChangeFn: (value: any) => void = () => {};

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   * @docs-private
   */
  onTouched: () => any = () => {
  }

  /** Name of the radio button group. All radio buttons inside this group will use this name. */
  @Input()
  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
    this._updateRadioButtonNames();
  }

  /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
  @Input()
  get labelPosition(): 'before' | 'after' {
    return this._labelPosition;
  }
  set labelPosition(v) {
    this._labelPosition = v === 'before' ? 'before' : 'after';
    this._markRadiosForCheck();
  }

  /**
   * Value for the radio-group. Should equal the value of the selected radio button if there is
   * a corresponding radio button with a matching value. If there is not such a corresponding
   * radio button, this value persists to be applied in case a new radio button is added with a
   * matching value.
   */
  @Input()
  get dValue(): any {
    return this._value;
  }

  set dValue(newValue: any) {
    if (this._value !== newValue) {
      // Set this before proceeding to ensure no circular loop occurs with selection.
      this._value = newValue;
      this._updateSelectedRadioFromValue();
      this._checkSelectedRadioButton();
    }
  }

  _checkSelectedRadioButton() {
    if (this._selected && !this._selected.dChecked) {
      this._selected.dChecked = true;
    }
  }

  /**
   * The currently selected radio button. If set to a new radio button, the radio group value
   * will be updated to match the new selected button.
   */
  @Input()
  get selected() {
    return this._selected;
  }

  set selected(selected: RadioButtonComponent | null) {
    this._selected = selected;
    this.dValue = selected ? selected.value : null;
    this._checkSelectedRadioButton();
  }

  /** Whether the radio group is disabled */
  @Input()
  get dDisabled(): boolean {
    return this._disabled;
  }

  set dDisabled(value) {
    this._disabled = !!value;
    this._markRadiosForCheck();
  }

  /** Whether the radio group is required */
  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = value;
    this._markRadiosForCheck();
  }

  constructor(private _changeDetector: ChangeDetectorRef) {
  }

  /**
   * Initialize properties once content children are available.
   * This allows us to propagate relevant attributes to associated buttons.
   */
  ngAfterContentInit() {
    this._isInitialized = true;
  }

  private _updateRadioButtonNames(): void {
    if (this._radios) {
      this._radios.forEach(radio => {
        radio.dName = this.name;
        radio._markForCheck();
      });
    }
  }

  /** Updates the `selected` radio button from the internal _value state. */
  private _updateSelectedRadioFromValue(): void {
    // If the value already matches the selected radio, do nothing.
    const isAlreadySelected = this._selected !== null && this._selected.value === this._value;
    if (this._radios && !isAlreadySelected) {
      this._selected = null;
      this._radios.forEach(radio => {
        radio.dChecked = this.dValue === radio.value;
        if (radio.dChecked) {
          this._selected = radio;
        }
      });
    }
  }

  /** Dispatch change event with current selection and group value. */
  _emitChangeEvent(): void {
    if (this._isInitialized) {
      this.change.emit(new RadioChange(this._selected, this._value));
    }
  }

  /** Dispatch change event with current selection and group value. */
  _emitDValueChangeEvent(): void {
    if (this._isInitialized) {
      this.dValueChange.emit(this._value);
    }
  }

  /**
   * Marks the radio buttons as needing checking for change detection.
   */
  _markRadiosForCheck() {
    if (this._radios) {
      this._radios.forEach(radio => radio._markForCheck());
    }
  }

  /**
   * Sets the model value. Implemented as part of ControlValueAccessor.
   * @param value
   */
  writeValue(value: any) {
    this.dValue = value;
    this._changeDetector.markForCheck();
  }

  /**
   * Registers a callback to be triggered when the model value changes.
   * Implemented as part of ControlValueAccessor.
   * @param fn Callback to be registered.
   */
  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  /**
   * Registers a callback to be triggered when the control is touched.
   * Implemented as part of ControlValueAccessor.
   * @param fn Callback to be registered.
   */
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  /**
   * Sets the disabled state of the control. Implemented as a part of ControlValueAccessor.
   * @param isDisabled Whether the control should be disabled.
   */
  setDisabledState(isDisabled: boolean) {
    this.dDisabled = isDisabled;
    this._changeDetector.markForCheck();
  }
}

@Component({
  selector: 'd-radio-button',
  templateUrl: 'radio.component.html',
  styleUrls: ['radio.component.scss'],
  encapsulation: ViewEncapsulation.None,
  exportAs: 'dRadioButton',
  host: {
    '[attr.tabindex]': '-1',
    '[attr.id]': 'dId'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonComponent implements OnInit, AfterViewInit, OnDestroy {
  /** The native `<input type=radio>` element */
  @ViewChild('input') _inputElement: ElementRef<HTMLInputElement>;

  private _uniqueId = `d-radio-${++nextUniqueId}`;

  /** Unique id of a current element */
  @Input() dId: string = this._uniqueId;

  /** Invert color of component to white. Will be visible on a dark background */
  @Input() dInvertColor?: boolean;

  /** Analog to HTML 'name' attribute used to group radios for unique selection. */
  @Input() dName: string;

  /** Whether this radio button is checked. */
  @Input()
  get dChecked(): boolean { return this._checked; }
  set dChecked(value: boolean) {
    const newCheckedState = value;
    if (this._checked !== newCheckedState) {
      this._checked = newCheckedState;
      if (newCheckedState && this.radioGroup && this.radioGroup.dValue !== this.value) {
        this.radioGroup.selected = this;
      } else if (!newCheckedState && this.radioGroup && this.radioGroup.dValue === this.value) {

        // When unchecking the selected radio button, update the selected radio
        // property on the group.
        this.radioGroup.selected = null;
      }

      if (newCheckedState) {
        // Notify all radio buttons with the same name to un-check.
        this._radioDispatcher.notify(this.dId, this.dName);
      }
      this._changeDetector.markForCheck();
    }
  }

  /** The value of this radio button. */
  @Input()
  get value(): any {
    return this._value;
  }

  set value(value: any) {
    if (this._value !== value) {
      this._value = value;
      if (this.radioGroup !== null) {
        if (!this.dChecked) {
          // Update checked when the value changed to match the radio group's value
          this.dChecked = this.radioGroup.dValue === value;
        }
        if (this.dChecked) {
          this.radioGroup.selected = this;
        }
      }
    }
  }

  /** Whether the label should appear after or before the radio button. Defaults to 'after' */
  @Input()
  get dLabelPosition() {
    return this._labelPosition || (this.radioGroup && this.radioGroup.labelPosition) || 'after';
  }

  set dLabelPosition(value: 'before' | 'after') {
    this._labelPosition = value;
  }

  private _labelPosition: 'before' | 'after';

  /** Whether the radio button is disabled. */
  @Input()
  get dDisabled(): boolean {
    return this._disabled || (this.radioGroup !== null && this.radioGroup.dDisabled);
  }

  set dDisabled(value: boolean) {
    const newDisabledState = value;
    if (this._disabled !== newDisabledState) {
      this._disabled = newDisabledState;
      this._changeDetector.markForCheck();
    }
  }

  /** Whether the radio button is required. */
  @Input()
  get required(): boolean {
    return this._required || (this.radioGroup && this.radioGroup.required);
  }
  set required(value: boolean) {
    this._required = value;
  }

  /**
   * Event emitted when the checked state of this radio button changes.
   * Change events are only emitted when the value changes due to user interaction with
   * the radio button (the same behavior as `<input type-"radio">`).
   */
  @Output() readonly change: EventEmitter<RadioChange> = new EventEmitter<RadioChange>();

  /** The parent radio group. May or may not be present. */
  radioGroup: RadioGroupDirective;

  /** ID of the native input element inside `<d-radio-button>` */
  get inputId(): string {
    return `${this.dId || this._uniqueId}-input`;
  }
  /** Whether this radio is checked. */
  private _checked = false;

  /** Whether this radio is disabled. */
  private _disabled: boolean;

  /** Whether this radio is required. */
  private _required: boolean;

  /** Value assigned to this radio. */
  private _value: any = null;

  /** Unregister function for _radioDispatcher */
  private _removeUniqueSelectionListener: () => void = () => {};

  constructor(@Optional() radioGroup: RadioGroupDirective,
              elementRef: ElementRef,
              private _radioDispatcher: UniqueSelectionDispatcher,
              private _changeDetector: ChangeDetectorRef) {
    this.radioGroup = radioGroup;
    this._removeUniqueSelectionListener =
      _radioDispatcher.listen((id: string, name: string) => {
        if (id !== this.dId && name === this.dName) {
          this.dChecked = false;
        }
      });
  }

  ngOnInit() {
    if (this.radioGroup) {
      // If the radio is inside a radio group, determine if it should be checked
      this.dChecked = this.radioGroup.dValue === this._value;
      // Copy name from parent radio group
      this.dName = this.radioGroup.name;
      this.dInvertColor = this.dInvertColor !== undefined;
    }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this._removeUniqueSelectionListener();
  }

  /**
   * Marks the radio button as needing checking for change detection.
   * This method is exposed because the parent radio group will directly
   * update bound properties of the radio button.
   */
  _markForCheck() {
    this._changeDetector.markForCheck();
  }

  /** Dispatch change event with current value. */
  private _emitChangeEvent(): void {
    this.change.emit(new RadioChange(this, this._value));
  }

  /**
   * Prevent click event completely
   * @param event
   */
  onClick(event: Event) {
    event.stopPropagation();
  }

  /**
   * Prevent change event, set current input to checked state,
   * generate emit from current radio button and radio group in common
   * @param event
   */
  dOnChanged(event: Event) {
    event.stopPropagation();
    const groupValueChanged = this.radioGroup && this.value !== this.radioGroup.dValue;
    this.dChecked = true;
    this._emitChangeEvent();

    if (this.radioGroup) {
      this.radioGroup._controlValueAccessorChangeFn(this.value);
      if (groupValueChanged) {
        this.radioGroup._emitDValueChangeEvent();
        this.radioGroup._emitChangeEvent();
      }
    }
  }
}
