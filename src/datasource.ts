import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv, BackendSrv } from "@grafana/runtime";

import { FlamegraphQuery, MyDataSourceOptions } from './types';



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
    const result = await this.backendSrv.fetch({
      method: 'GET',
      url: this.url +'/render/render',
      params: query,
    }).toPromise();

    return result;
  }

  async getNames() {
    const result = await this.backendSrv.fetch<Array<string>>({
      method: 'GET',
      url: this.url +'/render/label-values?label=__name__',
    }).toPromise();

    return result;
  }

  async query(options: DataQueryRequest<FlamegraphQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range.raw.from.valueOf();
    const until = range.raw.to.valueOf();

    const promises = options.targets.map((query) =>
    this.getFlamegraph({ ...query, from, until }).then((response: any) => {
      const frame = new MutableDataFrame({
        refId: query.refId,
        name: query.name,
        fields: [
          { name: "flamebearer", type: FieldType.other },
        ],
      });

      frame.appendRow([response.data.flamebearer]);

      return frame;
    })
  );

    return Promise.all(promises).then((data) => ({ data }));
  }

  loadAppNames(): Promise<any> {
    return this.getNames();
  }

  async testDatasource() {
    const names = await this.getNames();
    if(names.status === 200) {
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
