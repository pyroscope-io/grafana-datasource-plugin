import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  MetricFindValue,
} from '@grafana/data';
import { getBackendSrv, BackendSrv, getTemplateSrv } from '@grafana/runtime';

import { defaultQuery, FlamegraphQuery, MyDataSourceOptions } from './types';
import { deltaDiff } from './flamebearer';

export class DataSource extends DataSourceApi<FlamegraphQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.instanceSettings = instanceSettings;
    this.backendSrv = getBackendSrv();
    this.url = instanceSettings.url || '';
  }

  instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>;

  backendSrv: BackendSrv;

  url: string;

  async getFlamegraph(query: FlamegraphQuery) {
    // transform 'name' -> 'query'
    // and also get rid of 'name', since it would affect the results
    const { name, ...newQuery } = { ...query, query: query.name };

    const result = await this.backendSrv
      .fetch({
        method: 'GET',
        url: `${this.url}/render/render`,
        params: newQuery,
      })
      .toPromise();

    return result;
  }

  async metricFindQuery(query: string, options?: any) {
    const expandedQuery = getTemplateSrv().replace(query, options.scopedVars);
    const appNamesRegex = /^\s*(apps|applications)(\(\s*\))?\s*$/;
    const labelNamesRegex = /^\s*label_names\((\s*[\w_.-]+)\)\s*$/;
    const labelValuesRegex = /^\s*label_values\(\s*([\w_.-]+)\s*,\s*([\w_]+)\s*\)\s*$/;

    const appsQuery = query.match(appNamesRegex);
    if (appsQuery) {
      return this.queryAppNames();
    }

    const labelNamesQuery = expandedQuery.match(labelNamesRegex);
    if (labelNamesQuery) {
      return this.queryLabelNames(labelNamesQuery[1]);
    }

    const labelValuesQuery = expandedQuery.match(labelValuesRegex);
    if (labelValuesQuery) {
      return this.queryLabelValues(labelValuesQuery[1], labelValuesQuery[2]);
    }

    return [];
  }

  async queryAppNames(): Promise<MetricFindValue[]> {
    const result = await this.backendSrv
      .fetch<Array<{ name: string }>>({
        method: 'GET',
        url: `${this.url}/render/api/apps`,
      })
      .toPromise();
    if (!result) {
      return [];
    }
    return result.data.map((x) => ({ text: x.name }));
  }

  async queryLabelNames(appName: string): Promise<MetricFindValue[]> {
    const result = await this.backendSrv
      .fetch<string[]>({
        method: 'GET',
        url: `${this.url}/render/labels?query=${appName}{}`,
      })
      .toPromise();
    if (!result) {
      return [];
    }
    return result.data.filter((x) => x !== '__name__').map((x) => ({ text: x }));
  }

  async queryLabelValues(appName: string, labelName: string): Promise<MetricFindValue[]> {
    const result = await this.backendSrv
      .fetch<string[]>({
        method: 'GET',
        url: `${this.url}/render/label-values?label=${labelName}&query=${appName}{}`,
      })
      .toPromise();
    if (!result) {
      return [];
    }
    return result.data.map((x) => ({ text: x }));
  }

  // fetchNames fetches all the application names
  // it returns nothing when it fails to communicate with the server
  fetchNames() {
    return this.backendSrv
      .fetch<{ name: string }[]>({
        method: 'GET',
        url: `${this.url}/render/api/apps`,
      })
      .toPromise()
      .then((response) => {
        if (!response) {
          return [];
        }

        return response.data.map((a) => a.name);
      })
      .catch(() => {
        return [];
      });
  }

  async query(options: DataQueryRequest<FlamegraphQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range.raw.from.valueOf();
    const until = range.raw.to.valueOf();

    const promises = options.targets.map((query) => {
      const nameFromVar = getTemplateSrv().replace(query.name, options.scopedVars);

      return this.getFlamegraph({
        ...defaultQuery,
        ...query,
        name: nameFromVar,
        from,
        until,
      }).then((response: any) => {
        const frame = new MutableDataFrame({
          refId: query.refId,
          name: nameFromVar,
          fields: [{ name: 'flamebearer', type: FieldType.other }],
          meta: {
            preferredVisualisationType: 'table',
          },
        });

        frame.appendRow([
          {
            ...response.data.flamebearer,
            ...response.data.metadata,
            levels: deltaDiff(response.data.flamebearer.levels),
          },
        ]);

        return frame;
      });
    });
    return Promise.all(promises).then((data) => ({ data }));
  }

  loadAppNames(): Promise<any> {
    return this.fetchNames();
  }

  async testDatasource() {
    const names = await this.backendSrv
      .fetch<{ name: string }[]>({
        method: 'GET',
        url: `${this.url}/render/api/apps`,
      })
      .toPromise();

    if (names && names.status === 200) {
      return {
        status: 'success',
        message: 'Success',
      };
    }
    return {
      status: 'error',
      message: 'Server is not reachable',
    };
  }
}
