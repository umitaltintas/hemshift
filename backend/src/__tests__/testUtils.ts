import type { QueryResult, QueryResultRow } from 'pg'

export const createQueryResult = <T extends QueryResultRow>(
  partial: Partial<QueryResult<T>> = {}
): QueryResult<T> => ({
  command: partial.command ?? '',
  rowCount: partial.rowCount ?? partial.rows?.length ?? 0,
  oid: partial.oid ?? 0,
  rows: partial.rows ?? [],
  fields: partial.fields ?? []
})
