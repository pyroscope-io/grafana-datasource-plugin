import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv, BackendSrv } from '@grafana/runtime';

import { FlamegraphQuery, MyDataSourceOptions } from './types';
import { getTemplateSrv } from '@grafana/runtime';
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
    const result = await this.backendSrv
      .fetch({
        method: 'GET',
        url: this.url + '/render/render',
        params: query,
      })
      .toPromise();

    return result;
  }

  async getNames() {
    const result = await this.backendSrv
      .fetch<string[]>({
        method: 'GET',
        url: this.url + '/render/label-values?label=__name__',
      })
      .toPromise();

    return result;
  }

  async query(options: DataQueryRequest<FlamegraphQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range.raw.from.valueOf();
    const until = range.raw.to.valueOf();

    const promises = options.targets.map(query => {
      let nameFromVar: string | undefined;
      if (query?.name?.startsWith('$')) {
        const appNameVar = getTemplateSrv()
          .getVariables()
          .find(vari => query?.name?.slice(1) === vari.name);
        // @ts-ignore
        nameFromVar = appNameVar?.query;
      }
      return this.getFlamegraph({ ...query, name: nameFromVar || query.name, from, until }).then((response: any) => {
        const frame = new MutableDataFrame({
          refId: query.refId,
          name: nameFromVar || query.name,
          fields: [{ name: 'flamebearer', type: FieldType.other }],
          meta: {
            preferredVisualisationType: 'table',
          },
        });

        frame.appendRow([
          {
            ...response.data.flamebearer,
            levels: deltaDiff(response.data.flamebearer.levels),
          },
        ]);

        return frame;
      });
    });
    return Promise.all(promises).then(data => ({ data }));
  }

  loadAppNames(): Promise<any> {
    return this.getNames();
  }

  async testDatasource() {
    const names = await this.getNames();
    if (names.status === 200) {
      return {
        status: 'success',
        message: 'Success',
      };
    } else {
      return {
        status: 'error',
        message: 'Server is not reachable',
      };
    }
  }
}
