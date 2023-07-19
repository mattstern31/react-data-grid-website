import { useMemo } from 'react';

import { clampColumnWidth, max, min } from '../utils';
import type { CalculatedColumn, Column } from '../types';
import { renderValue } from '../cellRenderers';
import { SELECT_COLUMN_KEY } from '../Columns';
import type { DataGridProps } from '../DataGrid';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ColumnMetric {
  width: number;
  left: number;
}

const DEFAULT_COLUMN_WIDTH = 'auto';
const DEFAULT_COLUMN_MIN_WIDTH = 50;

interface CalculatedColumnsArgs<R, SR> extends Pick<DataGridProps<R, SR>, 'defaultColumnOptions'> {
  rawColumns: readonly Column<R, SR>[];
  viewportWidth: number;
  scrollLeft: number;
  measuredColumnWidths: ReadonlyMap<string, number>;
  resizedColumnWidths: ReadonlyMap<string, number>;
  enableVirtualization: boolean;
}

export function useCalculatedColumns<R, SR>({
  rawColumns,
  measuredColumnWidths,
  resizedColumnWidths,
  viewportWidth,
  scrollLeft,
  defaultColumnOptions,
  enableVirtualization
}: CalculatedColumnsArgs<R, SR>) {
  const defaultWidth = defaultColumnOptions?.width ?? DEFAULT_COLUMN_WIDTH;
  const defaultMinWidth = defaultColumnOptions?.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
  const defaultMaxWidth = defaultColumnOptions?.maxWidth ?? undefined;
  const defaultFormatter = defaultColumnOptions?.renderCell ?? renderValue;
  const defaultSortable = defaultColumnOptions?.sortable ?? false;
  const defaultResizable = defaultColumnOptions?.resizable ?? false;

  const { columns, colSpanColumns, lastFrozenColumnIndex } = useMemo((): {
    columns: readonly CalculatedColumn<R, SR>[];
    colSpanColumns: readonly CalculatedColumn<R, SR>[];
    lastFrozenColumnIndex: number;
  } => {
    let lastFrozenColumnIndex = -1;

    const columns = rawColumns.map((rawColumn) => {
      const frozen = rawColumn.frozen ?? false;

      const column: Mutable<CalculatedColumn<R, SR>> = {
        ...rawColumn,
        idx: 0,
        frozen,
        isLastFrozenColumn: false,
        width: rawColumn.width ?? defaultWidth,
        minWidth: rawColumn.minWidth ?? defaultMinWidth,
        maxWidth: rawColumn.maxWidth ?? defaultMaxWidth,
        sortable: rawColumn.sortable ?? defaultSortable,
        resizable: rawColumn.resizable ?? defaultResizable,
        renderCell: rawColumn.renderCell ?? defaultFormatter
      };

      if (frozen) {
        lastFrozenColumnIndex++;
      }

      return column;
    });

    columns.sort(({ key: aKey, frozen: frozenA }, { key: bKey, frozen: frozenB }) => {
      // Sort select column first:
      if (aKey === SELECT_COLUMN_KEY) return -1;
      if (bKey === SELECT_COLUMN_KEY) return 1;

      // Sort frozen columns second:
      if (frozenA) {
        if (frozenB) return 0;
        return -1;
      }
      if (frozenB) return 1;

      // Sort other columns last:
      return 0;
    });

    const colSpanColumns: CalculatedColumn<R, SR>[] = [];
    columns.forEach((column, idx) => {
      column.idx = idx;

      if (column.colSpan != null) {
        colSpanColumns.push(column);
      }
    });

    if (lastFrozenColumnIndex !== -1) {
      columns[lastFrozenColumnIndex].isLastFrozenColumn = true;
    }

    return {
      columns,
      colSpanColumns,
      lastFrozenColumnIndex
    };
  }, [
    rawColumns,
    defaultWidth,
    defaultMinWidth,
    defaultMaxWidth,
    defaultFormatter,
    defaultResizable,
    defaultSortable
  ]);

  const { templateColumns, layoutCssVars, totalFrozenColumnWidth, columnMetrics } = useMemo((): {
    templateColumns: readonly string[];
    layoutCssVars: Readonly<Record<string, string>>;
    totalFrozenColumnWidth: number;
    columnMetrics: ReadonlyMap<CalculatedColumn<R, SR>, ColumnMetric>;
  } => {
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>();
    let left = 0;
    let totalFrozenColumnWidth = 0;
    const templateColumns: string[] = [];

    for (const column of columns) {
      let width =
        resizedColumnWidths.get(column.key) ?? measuredColumnWidths.get(column.key) ?? column.width;

      if (typeof width === 'number') {
        width = clampColumnWidth(width, column);
      } else {
        // This is a placeholder width so we can continue to use virtualization.
        // The actual value is set after the column is rendered
        width = column.minWidth;
      }
      templateColumns.push(`${width}px`);
      columnMetrics.set(column, { width, left });
      left += width;
    }

    if (lastFrozenColumnIndex !== -1) {
      const columnMetric = columnMetrics.get(columns[lastFrozenColumnIndex])!;
      totalFrozenColumnWidth = columnMetric.left + columnMetric.width;
    }

    const layoutCssVars: Record<string, string> = {};

    for (let i = 0; i <= lastFrozenColumnIndex; i++) {
      const column = columns[i];
      layoutCssVars[`--rdg-frozen-left-${column.idx}`] = `${columnMetrics.get(column)!.left}px`;
    }

    return { templateColumns, layoutCssVars, totalFrozenColumnWidth, columnMetrics };
  }, [measuredColumnWidths, resizedColumnWidths, columns, lastFrozenColumnIndex]);

  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo((): [number, number] => {
    if (!enableVirtualization) {
      return [0, columns.length - 1];
    }
    // get the viewport's left side and right side positions for non-frozen columns
    const viewportLeft = scrollLeft + totalFrozenColumnWidth;
    const viewportRight = scrollLeft + viewportWidth;
    // get first and last non-frozen column indexes
    const lastColIdx = columns.length - 1;
    const firstUnfrozenColumnIdx = min(lastFrozenColumnIndex + 1, lastColIdx);

    // skip rendering non-frozen columns if the frozen columns cover the entire viewport
    if (viewportLeft >= viewportRight) {
      return [firstUnfrozenColumnIdx, firstUnfrozenColumnIdx];
    }

    // get the first visible non-frozen column index
    let colVisibleStartIdx = firstUnfrozenColumnIdx;
    while (colVisibleStartIdx < lastColIdx) {
      const { left, width } = columnMetrics.get(columns[colVisibleStartIdx])!;
      // if the right side of the columnn is beyond the left side of the available viewport,
      // then it is the first column that's at least partially visible
      if (left + width > viewportLeft) {
        break;
      }
      colVisibleStartIdx++;
    }

    // get the last visible non-frozen column index
    let colVisibleEndIdx = colVisibleStartIdx;
    while (colVisibleEndIdx < lastColIdx) {
      const { left, width } = columnMetrics.get(columns[colVisibleEndIdx])!;
      // if the right side of the column is beyond or equal to the right side of the available viewport,
      // then it the last column that's at least partially visible, as the previous column's right side is not beyond the viewport.
      if (left + width >= viewportRight) {
        break;
      }
      colVisibleEndIdx++;
    }

    const colOverscanStartIdx = max(firstUnfrozenColumnIdx, colVisibleStartIdx - 1);
    const colOverscanEndIdx = min(lastColIdx, colVisibleEndIdx + 1);

    return [colOverscanStartIdx, colOverscanEndIdx];
  }, [
    columnMetrics,
    columns,
    lastFrozenColumnIndex,
    scrollLeft,
    totalFrozenColumnWidth,
    viewportWidth,
    enableVirtualization
  ]);

  return {
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    templateColumns,
    layoutCssVars,
    lastFrozenColumnIndex,
    totalFrozenColumnWidth
  };
}
