export interface FluxStandardAction<T extends string = string, P = null, M = void> {
  type: T;
  payload?: P;
  meta?: M;
  error?: P extends Error ? true : void;
}

export interface AnyFluxStandardAction extends FluxStandardAction<string, any, any> { }
