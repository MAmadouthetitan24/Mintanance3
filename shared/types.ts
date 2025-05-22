// Type helper to transform null to undefined
export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null
    ? undefined
    : T[K] extends (infer U)[]
      ? NullToUndefined<U>[]
      : Exclude<T[K], null> | (null extends T[K] ? undefined : never);
}; 