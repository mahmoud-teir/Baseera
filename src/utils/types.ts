/** Remove `readonly` from an object type (RN 0.88 style types are readonly). */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
