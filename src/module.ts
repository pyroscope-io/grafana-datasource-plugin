import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import ExploreQueryEditor from './ExploreQueryEditor';
import { FlamegraphQuery, MyDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, FlamegraphQuery, MyDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setExploreQueryField(ExploreQueryEditor);
