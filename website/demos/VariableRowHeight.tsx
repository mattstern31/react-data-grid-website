import { useMemo } from 'react';

import DataGrid from '../../src';
import type { Column } from '../../src';
import { renderCoordinates } from './renderers';
import type { Props } from './types';

type Row = number;
const rows: readonly Row[] = [...Array(500).keys()];

export default function VariableRowHeight({ direction }: Props) {
  const columns = useMemo((): readonly Column<Row>[] => {
    const columns: Column<Row>[] = [];

    for (let i = 0; i < 30; i++) {
      const key = String(i);
      columns.push({
        key,
        name: key,
        frozen: i < 5,
        resizable: true,
        renderCell: renderCoordinates
      });
    }

    return columns;
  }, []);

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowHeight={rowHeight}
      className="fill-grid"
      direction={direction}
    />
  );
}

function rowHeight() {
  // should be based on the content of the row
  return 25 + Math.round(Math.random() * 75);
}
