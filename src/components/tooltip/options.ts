/** Default `dTooltip` options that can be overridden. */
import {InjectionToken} from '@angular/core';
import {TooltipPlacement} from './types';

export interface DTooltipDefaultOptions {
  showDelay: number;
  hideDelay: number;
  touchendHideDelay: number;
  position?: TooltipPlacement;
}

/** Injection token to be used to override the default options for `DTooltipDirective`. */
export const D_TOOLTIP_DEFAULT_OPTIONS =
  new InjectionToken<DTooltipDefaultOptions>('d-tooltip-default-options', {
    providedIn: 'root',
    factory: D_TOOLTIP_DEFAULT_OPTIONS_FACTORY
  });

/** @docs-private */
export function D_TOOLTIP_DEFAULT_OPTIONS_FACTORY(): DTooltipDefaultOptions {
  return {
    position: 'bottom',
    showDelay: 0,
    hideDelay: 0,
    touchendHideDelay: 1500,
  };
}
