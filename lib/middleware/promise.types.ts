import { defaultActionNameParser } from './promise.util';

export interface PromiseMiddlewareOptions<S extends Object> {
  actionNameParser?: typeof defaultActionNameParser;
  services: S;
  suffixes?: {
    auto?: string;
    req?: string;
    ok?: string;
    err?: string;
  };
}
