import { Column, CalculatedColumn, ColumnMetrics, FormatterProps } from '../common/types';
import { getScrollbarSize } from './domUtils';

interface Metrics<R> {
  columns: readonly Column<R>[];
  columnWidths: ReadonlyMap<keyof R, number>;
  minColumnWidth: number;
  viewportWidth: number;
  defaultFormatter: React.ComponentType<FormatterProps<R>>;
}

export function getColumnMetrics<R>(metrics: Metrics<R>): ColumnMetrics<R> {
  let left = 0;
  let totalWidth = 0;
  let allocatedWidths = 0;
  let unassignedColumnsCount = 0;
  let lastFrozenColumnIndex = -1;
  const columns: Array<Column<R> & { width: number | void }> = [];

  for (const metricsColumn of metrics.columns) {
    const width = getSpecifiedWidth(metricsColumn, metrics.columnWidths, metrics.viewportWidth, metrics.minColumnWidth);
    const column = { ...metricsColumn, width };

    if (width === undefined) {
      unassignedColumnsCount++;
    } else {
      allocatedWidths += width;
    }

    if (column.frozen) {
      lastFrozenColumnIndex++;
      columns.splice(lastFrozenColumnIndex, 0, column);
    } else {
      columns.push(column);
    }
  }

  const unallocatedWidth = metrics.viewportWidth - allocatedWidths - getScrollbarSize();
  const unallocatedColumnWidth = Math.max(
    Math.floor(unallocatedWidth / unassignedColumnsCount),
    metrics.minColumnWidth
  );

  const calculatedColumns: CalculatedColumn<R>[] = columns.map((column, idx) => {
    // Every column should have a valid width as this stage
    const width = column.width === undefined ? unallocatedColumnWidth : column.width;
    const newColumn = {
      ...column,
      idx,
      width,
      left,
      formatter: column.formatter || metrics.defaultFormatter
    };
    totalWidth += width;
    left += width;
    return newColumn;
  });

  return {
    columns: calculatedColumns,
    lastFrozenColumnIndex,
    totalColumnWidth: totalWidth,
    viewportWidth: metrics.viewportWidth
  };
}

function getSpecifiedWidth<R>(
  column: Column<R>,
  columnWidths: ReadonlyMap<keyof R, number>,
  viewportWidth: number,
  minColumnWidth: number
): number | void {
  if (columnWidths.has(column.key)) {
    // Use the resized width if available
    return columnWidths.get(column.key);
  }
  if (typeof column.width === 'number') {
    // TODO: allow width to be less than minWidth?
    return Math.max(column.width, minColumnWidth);
  }
  if (typeof column.width === 'string' && /^\d+%$/.test(column.width)) {
    return Math.max(Math.floor(viewportWidth * parseInt(column.width, 10) / 100), minColumnWidth);
  }
}

// Logic extented to allow for functions to be passed down in column.editable
// this allows us to decide whether we can be editing from a cell level
export function canEdit<R>(column: CalculatedColumn<R>, row: R): boolean {
  if (typeof column.editable === 'function') {
    return column.editable(row);
  }
  return Boolean(column.editor || column.editable);
}

export function getColumnScrollPosition<R>(columns: readonly CalculatedColumn<R>[], idx: number, currentScrollLeft: number, currentClientWidth: number): number {
  let left = 0;
  let frozen = 0;

  for (let i = 0; i < idx; i++) {
    const column = columns[i];
    if (column) {
      if (column.width) {
        left += column.width;
      }
      if (column.frozen) {
        frozen += column.width;
      }
    }
  }

  const selectedColumn = columns[idx];
  if (selectedColumn) {
    const scrollLeft = left - frozen - currentScrollLeft;
    const scrollRight = left + selectedColumn.width - currentScrollLeft;

    if (scrollLeft < 0) {
      return scrollLeft;
    }
    if (scrollRight > currentClientWidth) {
      return scrollRight - currentClientWidth;
    }
  }

  return 0;
}
