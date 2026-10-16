export interface MinHeap {
  readonly keys: Int32Array;
  size: number;
}

export const createHeap = (capacity: number): MinHeap => ({
  keys: new Int32Array(capacity),
  size: 0,
});

const at = (heap: MinHeap, index: number): number => heap.keys[index] ?? 0;

const swap = (heap: MinHeap, i: number, j: number): void => {
  const value = at(heap, i);
  heap.keys[i] = at(heap, j);
  heap.keys[j] = value;
};

export const pushHeap = (heap: MinHeap, key: number): void => {
  let index = heap.size;
  heap.keys[index] = key;
  heap.size += 1;
  while (index > 0 && at(heap, (index - 1) >> 1) > key) {
    swap(heap, index, (index - 1) >> 1);
    index = (index - 1) >> 1;
  }
};

const smallestChild = (heap: MinHeap, index: number): number => {
  const left = index * 2 + 1;
  const right = left + 1;
  return right < heap.size && at(heap, right) < at(heap, left) ? right : left;
};

export const popHeap = (heap: MinHeap): number => {
  const top = at(heap, 0);
  heap.size -= 1;
  heap.keys[0] = at(heap, heap.size);
  let index = 0;
  let child = smallestChild(heap, index);
  while (child < heap.size && at(heap, child) < at(heap, index)) {
    swap(heap, index, child);
    index = child;
    child = smallestChild(heap, index);
  }
  return top;
};
