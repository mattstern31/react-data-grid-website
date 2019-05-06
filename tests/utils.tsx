import React from 'react';
import { render } from 'react-testing-library';
import ReactDataGrid, { ReactDataGridProps, RowData } from '../packages/react-data-grid/src';

export function getProps(extraProps?: Partial<ReactDataGridProps>): ReactDataGridProps {
  const rows: RowData[] = [];

  return {
    columns: [{
      key: 'col1',
      name: 'Column 1'
    }, {
      key: 'col2',
      name: 'Column 2'
    }],
    rowGetter(idx: number): RowData {
      return rows[idx];
    },
    rowsCount: rows.length,
    ...extraProps
  };
}

export function setup(props: ReactDataGridProps = getProps()) {
  return {
    props,
    ...render(<ReactDataGrid {...props} />)
  };
}
