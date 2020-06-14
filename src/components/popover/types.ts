export type DPopoverScrollStrategy = 'noop' | 'block' | 'reposition' | 'close';
export const VALID_SCROLL: DPopoverScrollStrategy[] = [
  'noop',
  'block',
  'reposition',
  'close'
];

export type Placement = 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right'
  | 'left' | 'left-top' | 'left-bottom' | 'right' | 'right-top' | 'right-bottom';
export const VALID_PLACEMENT: Placement[] = [
  'top',
  'top-left',
  'top-right',
  'bottom',
  'bottom-left',
  'bottom-right',
  'left',
  'left-top',
  'left-bottom',
  'right',
  'right-top',
  'right-bottom'
];

export type DPopoverHorizontalAlign = 'left' | 'start' | 'center' | 'end' | 'right';
export const VALID_HORIZ_ALIGN: DPopoverHorizontalAlign[] = [
  'left',
  'start',
  'center',
  'end',
  'right'
];

export type DPopoverVerticalAlign = 'top' | 'start' | 'center' | 'end' | 'bottom';
export const VALID_VERT_ALIGN: DPopoverVerticalAlign[] = [
  'top',
  'start',
  'center',
  'end',
  'bottom'
];
