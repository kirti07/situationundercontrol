type NumberArray = Int8Array | Uint8Array | Int32Array | Float32Array | Float64Array;

export const at = (array: NumberArray, index: number): number => array[index] ?? 0;
