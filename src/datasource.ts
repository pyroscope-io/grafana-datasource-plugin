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
    console.log(instanceSettings)
  }

  instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>;
  backendSrv: BackendSrv;
  url: string;

  async doRequest(query: FlamegraphQuery) {
    const result = await this.backendSrv.fetch({
      method: 'GET',
      url: this.url +'/render/render',
      params: query,
    }).toPromise();

    return result;
  }

  async query(options: DataQueryRequest<FlamegraphQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range.raw.from.valueOf();
    const until = range.raw.to.valueOf();

    const promises = options.targets.map((query) =>
    this.doRequest({ ...query, from, until }).then((response: any) => {
      const frame = new MutableDataFrame({
        refId: query.refId,
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

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
