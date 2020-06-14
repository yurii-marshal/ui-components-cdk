##### This directive is a **`dTooltip`** ui-component

### Positioning

The tooltip will be displayed accordingly to screen area but this can be configured using the
`placement` input.
Due to specification, screen is divided with 4 fields (`'main'`, `'right'`, `'bottom'`, `'right-bottom'`).<br>
Placement property isn't required. Tooltip placement will be changed automatically. <br>

|||
|--- |--- |
|Main|Right|
|Bottom| Bottom-right|

`'main' area:` placement must be changed to 'after' automatically. 'top' and 'bottom' are optional <br>
`'right' area:` placement must be changed to 'before' automatically. 'top' and 'bottom' are optional <br> 
`'bottom' area:` placement must be changed to 'top-after' automatically <br> 
`'bottom-right' area:` placement must be changed to 'top-before' automatically <br> 

Options can be set in the directive tag, so they have the highest priority.

    <span dTooltip="Tooltip text" placement="top">Tooltip on top</span>

### Internal styling
Tooltip provides 4 types of styling accordingly to kind of information <br>
`'info'` - black background due to specification (for informative purposes only) <br>
`'error'` - red background, designed for error messages <br>
`'warning'` - orange background, for attentional text <br>
`'success'` - green background, for success operations <br>

### Inputs

|name|type|defaults|description|
|--- |--- |--- |--- |
|`dTooltip`|string|-|Text message of the tooltip|
|`placement`|"top", "bottom", "left", "right"|"bottom"|Position of the tooltip.|
|`dTooltipType`|"info", "warning", "error", "success"|'info'|Define type of the tooltip information for styling appropriately|
|`trigger`|"hover", "click"|"hover"|Specifies how the tooltip is triggered. Control the closing time with "hideDelay".|
|`dTooltipClass`|string||Classes to be passed to the tooltip.|
|`showDelay`|number|0|Delay before the tooltip will be shown|
|`hideDelay`|number|0|Delay before the tooltip will be hidden|

### In html:

    <span dTooltip="{{tooltipValue}}"
          placement="top"
          dTooltipType="warning"
          dTooltipClass="custom-user-class"
          trigger="click"
          [showDelay]="500"
          [hideDelay]="500"
         >
    </span>
