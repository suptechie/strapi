// TODO: Shorthand id should only be a string on documents.
// It's also a number here to make it works with existing V4 types.
export type ID = string | number;
export type ShortHand = ID;
export type LongHand = { id: ID; locale?: string };

export type GetId = (relation: ID) => ID | null;
