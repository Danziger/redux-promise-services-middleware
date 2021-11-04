import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';

import { FluxStandardAction } from '../../utils/actions/actions.types';

export function isPromise(maybePromise: any): maybePromise is Promise<any> {
  return maybePromise && typeof maybePromise === 'object' && typeof maybePromise.then === 'function';
}

export function defaultActionNameParser(actionType: string): [string, string, string, string] {
  const parts = actionType.split('_');

  const suffix = parts.pop();
  const [verb, ...rest] = parts;

  // Verb, service, method, suffix:
  return [verb, rest[0], rest.join('_'), suffix];
}

export function getAsyncActionPayload(actionTypeParts: [string, string, string, string], payload: any | any[], services: any): any {
  let serviceName: string;
  let methodName: string;

  const [VERB, SERVICE, METHOD] = actionTypeParts;
  const serviceNameBase = upperFirst(camelCase(SERVICE));
  const service = services[serviceName = `${ serviceNameBase }Service`] || services[serviceName = `${ serviceNameBase }sService`];
  const method = service ? service[methodName = `${ camelCase(VERB) }${ upperFirst(camelCase(METHOD)) }`] : null;

  /* istanbul ignore next */
  if (process.env.DEV) {
    if (method) {
      console.info(`Calling ${ serviceName }.${ methodName }`);
    } else if (service) {
      console.error(`Could not find method ${ serviceName }.${ methodName }`);
    } else {
      console.error(`Could not find service ${ serviceName }[s].Have you added it to root.store.ts?`);
    }
  }

  return method ? (Array.isArray(payload) ? method(...payload) : method(payload)) : null;
}

/**
 * Function: getAction
 * Description: This function constructs and returns a rejected
 * or fulfilled action object. The action object is based off the Flux
 * Standard Action (FSA).
 *
 * Given an original action with the type FOO:
 *
 * The rejected object model will be:
 * {
 *   error: true,
 *   type: 'FOO_REJECTED',
 *   payload: ...,
 *   meta: ... (optional)
 * }
 *
 * The fulfilled object model will be:
 * {
 *   type: 'FOO_FULFILLED',
 *   payload: ...,
 *   meta: ... (optional)
 * }
 */
export function getAction(type: string = 'UNKNOWN', payload?: any, meta?: any): FluxStandardAction {
  const action: FluxStandardAction = { type };

  if (payload !== undefined) {
    action.payload = payload;
  }

  if (meta !== undefined) {
    action.meta = meta;
  }

  if (payload instanceof Error) {
    action.error = true;
  }

  return action;
}
