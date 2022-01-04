import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface FlamegraphQuery extends DataQuery {
  query?: string;
  format?: string;
  from?: number | string;
  until?: number | string;
}

export const defaultQuery: Partial<FlamegraphQuery> = {
  query: '',
  format: 'json',
  from: 'now-1h',
  until: 'now',
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
// export interface MySecureJsonData {
//   apiKey?: string;
// }
