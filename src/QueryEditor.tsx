import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, FlamegraphQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, FlamegraphQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, name: event.target.value });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { name } = query;

    return (
      <div className="gf-form">
        {/* <FormField
          width={4}
          value={constant}
          onChange={this.onConstantChange}
          label="Constant"
          type="number"
          step="0.1"
        /> */}
        <FormField
          labelWidth={8}
          value={name}
          onChange={this.onNameChange}
          label="Application name"
        />
      </div>
    );
  }
}
