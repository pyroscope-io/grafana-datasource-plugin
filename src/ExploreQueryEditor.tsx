import defaults from 'lodash/defaults';

import React, { useState, useEffect } from 'react';
import { ExploreQueryFieldProps, SelectableValue } from '@grafana/data';
import { Label, Select } from '@grafana/ui';
import { DataSource } from './datasource';
import { FlamegraphQuery, MyDataSourceOptions, defaultQuery } from './types';

export type Props = ExploreQueryFieldProps<DataSource, FlamegraphQuery, MyDataSourceOptions>;

export default (props: Props) => {
  const query = defaults(props.query, defaultQuery);
  const [appName, setAppName] = useState<SelectableValue<string>>({ label: query.name, value: query.name });
  const [names, setNames] = useState<Array<SelectableValue<string>>>([]);
  const loadAppNames = (query: string) => {
    return props.datasource.loadAppNames().then(
      result => setNames(result.data.map((value: string) => ({ label: value, value }))),
      response => {
        throw new Error(response.statusText);
      }
    );
  };

  useEffect(() => {
    loadAppNames('');
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const { onChange, query, onRunQuery } = props;
    if (appName.value) {
      onChange({ ...query, name: appName.value });
      onRunQuery();
    }
    // eslint-disable-next-line
  }, [appName]);

  return (
    <div className="gf-form">
      {/* <FormField
          labelWidth={8}
          value={name}
          onChange={this.onNameChange}
          label="Application name"
        /> */}
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10px' }}>
        <Label style={{ marginTop: '8px', marginRight: '10px' }}>Application</Label>
        <Select
          onChange={v => (v ? setAppName(v) : setAppName({ label: '', value: '' }))}
          value={appName}
          options={names}
          backspaceRemovesValue
          isClearable
          allowCustomValue
        />
      </div>
    </div>
  );
};
