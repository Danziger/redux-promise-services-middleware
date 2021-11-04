import { Middleware } from 'redux';
import { DeepPartial } from 'utility-types';

import { ObjectOf } from '../../types/common.types';
import { AnyFluxStandardAction } from '../../utils/actions/actions.types';

import { DEFAULT_SUFFIX_AUTO, DEFAULT_SUFFIX_ERR, DEFAULT_SUFFIX_OK, DEFAULT_SUFFIX_REQ } from './promise.constants';
import { PromiseMiddlewareOptions } from './promise.types';
import { defaultActionNameParser, getAction, getAsyncActionPayload, isPromise } from './promise.util';

// Initially forked from https://github.com/pburtchaell/redux-promise-middleware/blob/master/src/index.js.

/**
 * Returns a configured Promise Middleware falling back to the default options.
 *
 * @param config Custom options.
 *
 * @returns A configured Promise Middleware.
 */
export function createPromiseMiddleware<S extends Object>(config: PromiseMiddlewareOptions<S>): Middleware {
  const {
    actionNameParser = defaultActionNameParser,
    suffixes = { },
    services = { },
  } = config || { };

  const SUFFIX_AUTO = suffixes.auto || DEFAULT_SUFFIX_AUTO;
  const SUFFIX_REQ = suffixes.req || DEFAULT_SUFFIX_REQ;
  const SUFFIX_OK = suffixes.ok || DEFAULT_SUFFIX_OK;
  const SUFFIX_ERR = suffixes.err || DEFAULT_SUFFIX_ERR;
  const SUFFIXES_REGEXP = new RegExp(`(?:${ SUFFIX_AUTO }|${ SUFFIX_REQ }|${ SUFFIX_OK }|${ SUFFIX_ERR })$`);

  return (api) => {
    // TODO: We can get getState here to check cached data!

    const { dispatch } = api;

    return next => (action: AnyFluxStandardAction) => {
      const { type } = action;

      let { payload } = action;

      if (type.endsWith(SUFFIX_AUTO)) {
        // If the action type ends in SUFFIX_AUTO, automatically add its payload promise from the injected services:
        payload = action.payload = {
          promise: getAsyncActionPayload(actionNameParser(type), payload, services),
          data: payload,
        };
      }

      if (!payload) {
        // If there's no payload, move on to the next middleware:
        return next(action);
      }

      /**
       * There are multiple ways to dispatch a promise. The first step is to
       * determine if the promise is defined:
       *
       *   A. Implicitly (action.payload is the promise)
       *   B. Explicitly (action.payload.promise is the promise)
       *   C. As an async function (returns a promise when called)
       *
       * If the promise is not defined in one of these three ways, we don't do
       * anything and move on to the next middleware in the middleware chain.
       */

      let promise: Promise<any>;
      let data: any;

      if (isPromise(payload)) {
        // A. Is the promise implicitly defined?
        promise = payload;
      } else if (isPromise(payload.promise)) {
        // B: Is the promise explicitly defined?
        promise = payload.promise;
        data = payload.data;
      } else if (typeof payload === 'function' || typeof payload.promise === 'function') {
        // C: Is the promise returned by an async function?
        promise = payload.promise ? payload.promise() : payload();
        data = payload.promise ? payload.data : undefined;

        if (!isPromise(promise)) {
          // If the returned value is not a promise, move on to the next middleware:
          return next({ ...action, payload: promise });
        }
      } else {
        return next(action);
      }

      const { meta } = action;

      // First, dispatch the pending action, including any data (for optimistic updates)
      // and/or meta from the original action.
      next(getAction(type.replace(SUFFIXES_REGEXP, SUFFIX_REQ), data, meta));

      // Then, wait for the promise to resolve in order to dispatch a success (OK) or
      // failure (ERR) action as well, and return the resolved value or error back to
      // the callee of dispatch:

      return promise.then((response: any = null) => {
        // This function dispatches the fulfilled action and returns the value the Promise resolved to:
        // TODO: Add mapResponseToPayload and mapResponseToMeta

        let resolvedPayload: any;

        if (!response) {
          resolvedPayload = response;
        } else if (response.hasOwnProperty('data')) {
          resolvedPayload = response.data;
        } else if (Array.isArray(response) && response[0] && response[0].hasOwnProperty('data')) {
          resolvedPayload = response.map(res => res.data);
        } else {
          resolvedPayload = response;
        }

        dispatch(getAction(type.replace(SUFFIXES_REGEXP, SUFFIX_OK), resolvedPayload, meta));

        return response; // TODO: Make this configurable.
      }, (err: Error) => {
        // This function dispatches the rejected action and returns the original Error object:
        // TODO: Send just one part of err?
        // TODO: Add mapErrorToPayload
        // TODO: Make a list of the different application/frontend development flows we should use on the Readme
        dispatch(getAction(type.replace(SUFFIXES_REGEXP, SUFFIX_ERR), err));

        // TODO: Should I just return this as [err, response]?
        // TODO: Add a silent option?
        throw err;
      });
    };
  };
}
