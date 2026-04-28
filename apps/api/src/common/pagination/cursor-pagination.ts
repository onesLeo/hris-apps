export type CursorPaginationQuery = {
  cursor?: string;
  limit?: number;
};

export type CursorPaginationMeta = {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export type CursorPaginatedResponse<T> = {
  data: T[];
  meta: CursorPaginationMeta;
};

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export function buildPaginationMeta<T extends { id: string }>(
  items: T[],
  limit: number,
): CursorPaginationMeta {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  return {
    nextCursor: hasMore && lastItem ? Buffer.from(lastItem.id).toString('base64') : null,
    hasMore,
    limit,
  };
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}
