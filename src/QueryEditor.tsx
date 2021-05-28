import defaults from 'lodash/defaults';

import React, { useState, useEffect } from 'react';
import { Label, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, FlamegraphQuery } from './types';


type Props = QueryEditorProps<DataSource, FlamegraphQuery, MyDataSourceOptions>;

export const QueryEditor = (props: Props) => {
  const query = defaults(props.query, defaultQuery);
  const [appName, setAppName] = useState<SelectableValue<string>>({ label: query.name, value: query.name });
  const [names, setNames] = useState<SelectableValue<string>[]>([]);
  const loadAppNames = (query: string) => {
    return props.datasource.loadAppNames().then(
      result => setNames(result.data.map((value: string) => ({ label: value, value }))),
      response => {
        throw new Error(response.statusText);
      }
    );
  }

  useEffect(() => {
    loadAppNames('');
  }, [])

  useEffect(() => {
    const { onChange, query, onRunQuery } = props;
    if(appName.value) {
      onChange({ ...query, name: appName.value });
      onRunQuery();
    }
  }, [appName]);

    return (
      <div className="gf-form">
        {/* <FormField
          labelWidth={8}
          value={name}
          onChange={this.onNameChange}
          label="Application name"
        /> */}
        <div style={{display: 'flex', flexDirection: 'row', marginTop: '10px'}}>
        <Label style={{marginTop: '8px', marginRight: '10px'}}>Application</Label>
        <Select
          onChange={(v) => v ? setAppName(v) : setAppName({label:'', value: ''})}
          value={appName}
          options={names}
          backspaceRemovesValue
          isClearable
          allowCustomValue
        />
        </div>
      </div>
    );
}
