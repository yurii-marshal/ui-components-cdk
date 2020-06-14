###Selector <d-radio-group>
`d-radio-group` This directive is designed provide a radio-group as defined by UX Wireframes.
A group of radio buttons. May contain one or more <d-radio-button> elements.

```[(ngModel)] - 2-way binding implemented as part of ControlValueAccessor```
```[(dValue)] - 2-way binding for radio-group value changes```

### Inputs:
1. **`dDisabled`**
2. **`name`**
4. **`selected`**
5. **`required`**

| Property               | Required      | Type          | Description                                                                             |
| ---------------------- | ------------- | ------------- | --------------------------------------------------------------------------------------- |
| **`dDisabled`**        | No            | boolean       | Disable all radio buttons in the group                                                  |
| **`name`**             | No            | string        | Name value will be applied to the group if present                                      |
| **`selected`**         | No            | boolean       | Select some instant of d-radio-button in the group (new RadioButtonComponent())         |
| **`required`**         | No            | boolean       | Set required property for all elements in the group                                     |

### Outputs:
(change) - Event emitted when the group value changes.

###Getting Start:
Basic usage:
<d-radio-group>
  <d-radio-button ... ></d-radio-button>
</d-radio-group>

###In html:
```
<d-radio-group [(ngModel)]="radio_group_value"
               [(dValue)]="group_value"
               [dDisabled]="false"
               [required]="true"
               (change)="onRadioGroup($event)">
              <d-radio-button ... ></d-radio-button>
              <d-radio-button ... ></d-radio-button>
              <d-radio-button ... ></d-radio-button>
              ...
</d-radio-group>
```

###Selector <d-radio-button>
`d-radio-button` This component is designed provide a radio-button as defined by UX Wireframes.

### Inputs
1. **`dLabelPosition`**
2. **`dId`**
3. **`dName`**
4. **`dDisabled`**
5. **`dInvertColor`**
6. **`dChecked`**
7. **`dRequired`**

| Property               | Required      | Type          | Description                                                                             |
| ---------------------- | ------------- | ------------- | --------------------------------------------------------------------------------------- |
| **`dLabelPosition`**   | No            | string        | Whether the label should appear after or before the radio-button. Defaults to 'after'. (string: 'before' / 'after')                 |
| **`dId`**              | No            | string        | A unique id for the radio-button input.                                                 |
| **`dName`**            | No            | string        | Name value will be applied to the input element if present.                             |
| **`dDisabled`**        | No            | boolean       | Disables element.                                                                       |
| **`dInvertColor`**     | No            | boolean       | Provides default color for radio-button.                                                |
| **`dChecked`**         | No            | boolean       | Default parameter for checked or unchecked radio-button.                                |
| **`dRequired`**        | No            | boolean       | Whether the radio-button is required.                                                   |

### Outputs
```(dOnChanged) - emit event to parent element ```

###Getting Start
Configuration values can be added as attributes to the <d-radio-button> component
All parameters are optional.

###In html:
```
<d-radio-button
     [dLabelPosition]="'after'"
     [dId]="'IdCheck'" 
     [dName]="'first'"
     [dDisabled]="false"
     dInvertColor
     dChecked
     dRequired
     (dOnChanged)="onRadioButton($event)">
     <span style="font-weight: bold">ExampleLabel</span> 
</d-radio-button>
```
