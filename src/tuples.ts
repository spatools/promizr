export type GetLength<Tuple extends readonly any[]> = Tuple extends { length: infer L } ? L : -1;
export type GetLast<Tuple extends readonly any[]> = Tuple[PreviousIndex<GetLength<Tuple>>];
export type GetLast2<Tuple extends readonly any[]> = Tuple[PreviousIndex<PreviousIndex<GetLength<Tuple>>>];
export type GetFirst<Tuple extends readonly any[]> = Tuple[0];

export type Prepend<Tuple extends readonly any[], Item> = [first: Item, ...rest: Tuple];
export type Append<Tuple extends readonly any[], Item> = [...tuple: Tuple, last: Item];
export type Concat<Tuple1 extends readonly any[], Tuple2 extends readonly any[]> = [...tuple: Tuple1, ...append: Tuple2];

export type RemoveFirst<Tuple extends readonly any[]> = Tuple extends [first: any, ...result: infer Result] ? Result : Tuple;
export type RemoveLast<Tuple extends readonly any[]> = Tuple extends [...result: infer Result, last: any] ? Result : Tuple;
export type RemoveFromStart<Tuple extends readonly any[], ToRemove extends readonly any[]> = Tuple extends [...start: ToRemove, ...result: infer Result] ? Result : Tuple;
export type RemoveFromEnd<Tuple extends readonly any[], ToRemove extends readonly any[]> = Tuple extends [...result: infer Result, ...end: ToRemove] ? Result : Tuple;

export type PreviousIndex<T extends number> = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62][T];
