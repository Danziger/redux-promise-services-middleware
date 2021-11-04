import { AuthData } from '../../../auth/auth.types';

import { ACTION_CREATE, ACTION_DELETE, ACTION_FETCH, ACTION_LIST, ACTION_UPDATE } from './actions.constants';
import { getActionCreator } from './actions.utils';

describe('Actions', () => {

  describe('Constants', () => {
    it('all end with \'_\'', () => {
      [ACTION_CREATE, ACTION_DELETE, ACTION_FETCH, ACTION_LIST, ACTION_UPDATE]
        .forEach(actionPrefix => expect(actionPrefix).toEndWith('_'));
    });
  });

  describe('Utils', () => {
    const proxyDispatch = getActionCreator(action => action);

    it('returns a Function\'s Proxy', () => {
      // It actually returns a Proxy, but that's completely transparent to us.
      // See https://stackoverflow.com/questions/36372611/how-to-test-if-an-object-is-a-proxy

      expect(proxyDispatch).toBeInstanceOf(Function);
    });

    it('returns a valid action creator when called', () => {
      // The action creators return types are "incorrect" on purpose to account for
      // the custom Promise Middleware being there, so we need to cast them to `any`
      // here so that TS does not complain, thinking they actually return a Promise:

      const fetchAuthActionCreator = proxyDispatch.fetchAuth;

      expect(fetchAuthActionCreator).toBeInstanceOf(Function);

      const fetchAuthAction: any = fetchAuthActionCreator();

      // TODO: Could be chained, but it looks like jest-chain / jest-extended types are fucked up:
      expect(fetchAuthAction).toBeDefined();
      expect(fetchAuthAction).toMatchObject({
        payload: undefined,
        type: 'FETCH_AUTH_AUTO',
      });
    });

    it('sets the payload to the first param if only 1 is provided', () => {
      const authData: AuthData = { loginIdentifier: 'alice', password: 'password' };
      const createUserAction: any = proxyDispatch.createAuth(authData);

      // TODO: Could be chained, but it looks like jest-chain / jest-extended types are fucked up:
      expect(createUserAction).toBeDefined();
      expect(createUserAction).toMatchObject({
        payload: authData,
        type: 'CREATE_AUTH_AUTO',
      });
    });

    it('sets the payload to an array if more than 1 param is provided', () => {
      const fetchSomethingElseActionCreator = (proxyDispatch as any).fetchSomethingElse;

      expect(fetchSomethingElseActionCreator).toBeInstanceOf(Function);

      const fetchSomethingElseAction = fetchSomethingElseActionCreator(1, 2, 3);

      // TODO: Could be chained, but it looks like jest-chain / jest-extended types are fucked up:
      expect(fetchSomethingElseAction).toBeDefined();
      expect(fetchSomethingElseAction).toMatchObject({
        payload: [1, 2, 3],
        type: 'FETCH_SOMETHING_ELSE_AUTO',
      });
    });

    it('should cache action creators', () => {
      const fetchAuthActionCreator = proxyDispatch.fetchAuth;

      expect(fetchAuthActionCreator).toBeInstanceOf(Function);
      expect(proxyDispatch.fetchAuth).toBe(fetchAuthActionCreator);
      expect(proxyDispatch.hasOwnProperty('fetchAuth')).toBeTrue();
      expect(proxyDispatch.hasOwnProperty('somethingElse')).toBeFalse();
    });
  });

});
