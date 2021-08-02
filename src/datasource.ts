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
          fields: [
            { name: 'flamebearer', type: FieldType.other },
            {name: "traceID", 	type: FieldType.string },
            {name: "spanID", 	type: FieldType.string },
            {name: "parentSpanID", 	type: FieldType.string },
            {name: "serviceName", 	type: FieldType.string },
            {name: "serviceTags", 	type: FieldType.other },
            {name: "startTime", 	type: FieldType.number },
            {name: "duration", 	type: FieldType.number },
            {name: "operationName", type: FieldType.string },
          ],
          meta: {
            preferredVisualisationType: 'trace',
          },
        });

        frame.appendRow([
          {
            ...response.data.flamebearer,
            levels: deltaDiff(response.data.flamebearer.levels),
          },
          "142ba98fb31b78d6",
          "142ba98fb31b78d6",
          "",
          "loki-all",
          [],
          1627916367476,
          99,
          "CAS_CAS",
        ]);
        frame.appendRow([
          {
            ...response.data.flamebearer,
            levels: deltaDiff(response.data.flamebearer.levels),
          },
          "142ba98fb31b78d6",
          "4bcdf97bd09f61d7",
          "142ba98fb31b78d6",
          "loki-all",
          [],
          1627916367477,
          74,
          "CAS"
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


const x = {"data":[{"traceID":"142ba98fb31b78d6","spans":[{"traceID":"142ba98fb31b78d6","spanID":"142ba98fb31b78d6","flags":1,"operationName":"CAS","references":[],"startTime":1627916367476700,"duration":99,"tags":[{"key":"sampler.type","type":"string","value":"const"},{"key":"sampler.param","type":"bool","value":true},{"key":"span.kind","type":"string","value":"client"},{"key":"internal.span.format","type":"string","value":"proto"}],"logs":[],"processID":"p1","warnings":null},{"traceID":"142ba98fb31b78d6","spanID":"4bcdf97bd09f61d7","flags":1,"operationName":"CAS loop","references":[{"refType":"CHILD_OF","traceID":"142ba98fb31b78d6","spanID":"142ba98fb31b78d6"}],"startTime":1627916367476721,"duration":74,"tags":[{"key":"span.kind","type":"string","value":"client"},{"key":"internal.span.format","type":"string","value":"proto"}],"logs":[],"processID":"p1","warnings":null}],"processes":{"p1":{"serviceName":"loki-all","tags":[{"key":"client-uuid","type":"string","value":"7e6fff523e4fa521"},{"key":"hostname","type":"string","value":"ea9ab9bb7008"},{"key":"ip","type":"string","value":"172.20.0.4"},{"key":"jaeger.version","type":"string","value":"Go-2.28.0"}]}},"warnings":null}],"total":0,"limit":0,"offset":0,"errors":null}