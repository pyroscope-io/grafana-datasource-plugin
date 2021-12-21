import defaults from 'lodash/defaults';

import React, { useState, useEffect } from 'react';
import { Label, QueryField, TypeaheadInput, TypeaheadOutput } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, FlamegraphQuery } from './types';

type Props = QueryEditorProps<DataSource, FlamegraphQuery, MyDataSourceOptions>;

export const QueryEditor = (props: Props) => {
  const query = defaults(props.query, defaultQuery);
  const [appName, setAppName] = useState<SelectableValue<string>>({ label: query.name, value: query.name });

  const loadAppNames = () => {
    return props.datasource.loadAppNames().then(
      result => {
        return result.data.map((value: string) => ({ label: value, value }));
      },
      response => {
        throw new Error(response.statusText);
      }
    );
  };

  useEffect(() => {
    const { onChange, query } = props;
    if (appName.value) {
      onChange({ ...query, name: appName.value });
    }
    // eslint-disable-next-line
  }, [appName]);

  const onTypeAhead = async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
    const appNames = await loadAppNames();

    return {
      suggestions: [
        {
          label: 'Applications',
          items: [...appNames],
        },
      ],
    };
  };

  return (
    <div className="gf-form">
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10px' }}>
        <Label style={{ marginTop: '8px', marginRight: '10px' }}>Query</Label>

        <div className="gf-form gf-form--grow flex-shrink-1 min-width-30">
          <QueryField
            placeholder="Enter a FlameQL query (run with Shift+Enter)"
            portalOrigin="pyroscope"
            onRunQuery={props.onRunQuery}
            query="$query0"
            onTypeahead={onTypeAhead}
            onChange={v => (v ? setAppName({ value: v }) : setAppName({ label: '', value: '' }))}
          />
        </div>
      </div>
    </div>
  );
};
