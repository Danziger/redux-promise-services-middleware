import { AuthService } from '../../../auth/auth.service';
import { ContactService } from '../../../contact/contact.service';
import { DegreesService } from '../../../degrees/degrees.service';
import { KitsService } from '../../../kits/kits.service';
import { QuestionsService } from '../../../questions/questions.service';
import { RootServices } from '../../../root/root.types';
import { ShopifyService } from '../../../shopify/shopify.service';
import { SpecialtiesService } from '../../../specialties/specialties.service';
import { SubtopicsService } from '../../../subtopics/subtopics.service';
import { SurveyService } from '../../../survey/survey.service';
import { UserService } from '../../../user/user.service';
import { api } from '../../utils/api/api.utils';

import { DEFAULT_SUFFIX_AUTO, DEFAULT_SUFFIX_ERR, DEFAULT_SUFFIX_OK, DEFAULT_SUFFIX_REQ } from './promise.constants';
import { createPromiseMiddleware } from './promise.middleware';
import { defaultActionNameParser, getAction, getAsyncActionPayload, isPromise } from './promise.util';

describe('Promise', () => {

  describe('Constants', () => {
    it('Start with', () => {
      [DEFAULT_SUFFIX_AUTO, DEFAULT_SUFFIX_REQ, DEFAULT_SUFFIX_OK, DEFAULT_SUFFIX_ERR]
        .forEach(suffix => expect(suffix).toStartWith('_'));
    });
  });

  describe('Utils', () => {
    describe('isPromise', () => {
      it('returns true when a Promise is passed', () => {
        expect(isPromise(new Promise(() => { /* NOTHING HERE */ }))).toBeTrue();
      });

      it('returns true when a Promise is passed', () => {
        expect(isPromise({ })).toBeFalse();
      });
    });

    describe('defaultActionNameParser', () => {
      it('parses simple action names properly', () => {
        expect(defaultActionNameParser('FETCH_AUTH_REQ')).toMatchObject(['FETCH', 'AUTH', 'AUTH', 'REQ']);
      });

      it('parses complex action names properly', () => {
        expect(defaultActionNameParser('FETCH_AUTH_RECOVERY_LINK_REQ')).toMatchObject(['FETCH', 'AUTH', 'AUTH_RECOVERY_LINK', 'REQ']);
      });
    });

    describe('getAsyncActionPayload', () => {
      let fetchTest: any;
      let fetchTestSomethingElse: any;
      let services: any;

      beforeEach(() => {
        // Defining them above and using jest.restoreAllMocks() doesn't work.
        // See https://github.com/facebook/jest/issues/2965

        // TODO: Extract this (Identity).
        fetchTest = jest.fn((...args) => args.length > 1 ? args : args[0]);
        fetchTestSomethingElse = jest.fn((...args) => args.length > 1 ? args : args[0]);
        services = { TestService: { fetchTest, fetchTestSomethingElse } };
      });

      it('matches action names to services and methods properly', () => {
        expect(getAsyncActionPayload(defaultActionNameParser('FETCH_TEST_AUTO'), true, services)).toBeTrue();
        expect(fetchTest).toHaveBeenCalledWith(true);
        expect(fetchTestSomethingElse).not.toHaveBeenCalled();

        expect(getAsyncActionPayload(defaultActionNameParser('FETCH_TEST_SOMETHING_ELSE_AUTO'), 42, services)).toBe(42);
        expect(fetchTestSomethingElse).toHaveBeenCalledWith(42);
      });

      it('returns `null` if no service or service method found', () => {
        expect(getAsyncActionPayload(defaultActionNameParser('FETCH_FOO_AUTO'), true, services)).toBeNull();
        expect(fetchTest).not.toHaveBeenCalled();
        expect(fetchTestSomethingElse).not.toHaveBeenCalled();

        expect(getAsyncActionPayload(defaultActionNameParser('FETCH_TEST_FOO_AUTO'), true, services)).toBeNull();
        expect(fetchTest).not.toHaveBeenCalled();
        expect(fetchTestSomethingElse).not.toHaveBeenCalled();
      });

      it('spreads payload arrays when calling the service method', () => {
        const payload = [1, 2, 3, 4];

        getAsyncActionPayload(defaultActionNameParser('FETCH_TEST_AUTO'), payload, services);
        expect(fetchTest).toHaveBeenCalledWith(...payload);
        expect(fetchTestSomethingElse).not.toHaveBeenCalled();

        getAsyncActionPayload(defaultActionNameParser('FETCH_TEST_SOMETHING_ELSE_AUTO'), payload, services);
        expect(fetchTestSomethingElse).toHaveBeenCalledWith(...payload);
      });
    });

    describe('getAction', () => {
      it('params are all optional except for type', () => {
        expect(getAction()).toMatchObject({ type: 'UNKNOWN' });
        expect(getAction('A')).toMatchObject({ type: 'A' });
        expect(getAction('A', true)).toMatchObject({ type: 'A', payload: true });
        expect(getAction('A', true, true)).toMatchObject({ type: 'A', payload: true, meta: true });
        expect(getAction(undefined, true, true)).toMatchObject({ type: 'UNKNOWN', payload: true, meta: true });
        expect(getAction('A', undefined, true)).toMatchObject({ type: 'A', meta: true });
      });

      it('adds error = true if the payload is an Error object', () => {
        const error = new Error('Test Error');

        expect(getAction('A', error)).toMatchObject({ type: 'A', payload: error, error: true });
      });
    });

  });

  describe('Middleware', () => {
    it('should work', () => {

      const mockService = {
        mockMethod: jest.fn(),
      };

      const promiseMiddleware = createPromiseMiddleware<any>({
        services: {
          mockService,
        },
      });

      expect(promiseMiddleware).toBeFunction();
    });
  });
});
