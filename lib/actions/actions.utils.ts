import snakeCase from 'lodash/snakeCase';
import { Dispatch } from 'redux';

import { ActionCreators } from '../../../root/root.types';
import { DEFAULT_SUFFIX_AUTO } from '../../middleware/promise/promise.constants';
import { ObjectOf } from '../../types/common.types';

export type ActionDispatcher = Dispatch & ActionCreators;

let proxy: ActionDispatcher = null;

export function getActionCreator(originalDispatch: Dispatch): ActionDispatcher {
  // Always returns the same instance once we have created it:
  if (proxy) return proxy;

  return proxy = new Proxy(originalDispatch as any, {
    get: (dispatch: Dispatch & ObjectOf<(payload: any) => ReturnType<Dispatch>>, prop: string | number) => {
      if (prop in dispatch) {
        return dispatch[prop];
      }

      const actionVerbAndContext = snakeCase(prop.toString()).toUpperCase();

      return dispatch[prop] = (...args: any[]) => dispatch({ payload: args.length > 1 ? args : args[0], type: `${ actionVerbAndContext }${ DEFAULT_SUFFIX_AUTO }` });
    },
  }) as ActionDispatcher;
}
