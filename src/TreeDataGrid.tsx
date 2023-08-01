import { forwardRef, useCallback, useMemo } from 'react';
import type { Key, RefAttributes } from 'react';

import { useLatestFunc } from './hooks';
import { assertIsValidKeyGetter, isCtrlKeyHeldDown } from './utils';
import type {
  CellKeyboardEvent,
  CellKeyDownArgs,
  GroupRow,
  Maybe,
  Omit,
  RenderRowProps,
  RowHeightArgs,
  RowsChangeData
} from './types';
import { renderToggleGroup, SELECT_COLUMN_KEY } from '.';
import DataGrid from './DataGrid';
import type { DataGridHandle, DataGridProps } from './DataGrid';
import { useDefaultRenderers } from './DataGridDefaultRenderersProvider';
import GroupedRow from './GroupRow';
import { defaultRenderRow } from './Row';

export interface TreeDataGridProps<R, SR = unknown, K extends Key = Key>
  extends Omit<DataGridProps<R, SR, K>, 'role' | 'aria-rowcount' | 'rowHeight' | 'onFill'> {
  rowHeight?: Maybe<number | ((args: RowHeightArgs<R>) => number)>;
  groupBy: readonly string[];
  rowGrouper: (rows: readonly R[], columnKey: string) => Record<string, readonly R[]>;
  expandedGroupIds: ReadonlySet<unknown>;
  onExpandedGroupIdsChange: (expandedGroupIds: Set<unknown>) => void;
}

type GroupByDictionary<TRow> = Record<
  string,
  {
    readonly childRows: readonly TRow[];
    readonly childGroups: readonly TRow[] | Readonly<GroupByDictionary<TRow>>;
    readonly startRowIndex: number;
  }
>;

function TreeDataGrid<R, SR, K extends Key>(
  {
    columns: rawColumns,
    rows: rawRows,
    rowHeight: rawRowHeight,
    rowKeyGetter: rawRowKeyGetter,
    onCellKeyDown: rawOnCellKeyDown,
    onRowsChange,
    selectedRows: rawSelectedRows,
    onSelectedRowsChange: rawOnSelectedRowsChange,
    renderers,
    groupBy: rawGroupBy,
    rowGrouper,
    expandedGroupIds,
    onExpandedGroupIdsChange,
    ...props
  }: TreeDataGridProps<R, SR, K>,
  ref: React.Ref<DataGridHandle>
) {
  const defaultRenderers = useDefaultRenderers<R, SR>();
  const rawRenderRow = renderers?.renderRow ?? defaultRenderers?.renderRow ?? defaultRenderRow;
  const headerAndTopSummaryRowsCount = 1 + (props.topSummaryRows?.length ?? 0);
  const isRtl = props.direction === 'rtl';
  const leftKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
  const rightKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const toggleGroupLatest = useLatestFunc(toggleGroup);

  const { columns, groupBy } = useMemo(() => {
    const columns = [...rawColumns].sort(({ key: aKey }, { key: bKey }) => {
      // Sort select column first:
      if (aKey === SELECT_COLUMN_KEY) return -1;
      if (bKey === SELECT_COLUMN_KEY) return 1;

      // Sort grouped columns second, following the groupBy order:
      if (rawGroupBy.includes(aKey)) {
        if (rawGroupBy.includes(bKey)) {
          return rawGroupBy.indexOf(aKey) - rawGroupBy.indexOf(bKey);
        }
        return -1;
      }
      if (rawGroupBy.includes(bKey)) return 1;

      // Sort other columns last:
      return 0;
    });

    const groupBy: string[] = [];
    for (const [index, column] of columns.entries()) {
      if (rawGroupBy.includes(column.key)) {
        groupBy.push(column.key);
        columns[index] = {
          ...column,
          frozen: true,
          renderCell: () => null,
          renderGroupCell: column.renderGroupCell ?? renderToggleGroup,
          editable: false
        };
      }
    }

    return { columns, groupBy };
  }, [rawColumns, rawGroupBy]);

  const [groupedRows, rowsCount] = useMemo(() => {
    if (groupBy.length === 0) return [undefined, rawRows.length];

    const groupRows = (
      rows: readonly R[],
      [groupByKey, ...remainingGroupByKeys]: readonly string[],
      startRowIndex: number
    ): [Readonly<GroupByDictionary<R>>, number] => {
      let groupRowsCount = 0;
      const groups: GroupByDictionary<R> = {};
      for (const [key, childRows] of Object.entries(rowGrouper(rows, groupByKey))) {
        // Recursively group each parent group
        const [childGroups, childRowsCount] =
          remainingGroupByKeys.length === 0
            ? [childRows, childRows.length]
            : groupRows(childRows, remainingGroupByKeys, startRowIndex + groupRowsCount + 1); // 1 for parent row
        groups[key] = { childRows, childGroups, startRowIndex: startRowIndex + groupRowsCount };
        groupRowsCount += childRowsCount + 1; // 1 for parent row
      }

      return [groups, groupRowsCount];
    };

    return groupRows(rawRows, groupBy, 0);
  }, [groupBy, rowGrouper, rawRows]);

  const [rows, isGroupRow] = useMemo((): [
    ReadonlyArray<R | GroupRow<R>>,
    (row: R | GroupRow<R>) => row is GroupRow<R>
  ] => {
    const allGroupRows = new Set<unknown>();
    if (!groupedRows) return [rawRows, isGroupRow];

    const flattenedRows: Array<R | GroupRow<R>> = [];
    const expandGroup = (
      rows: GroupByDictionary<R> | readonly R[],
      parentId: string | undefined,
      level: number
    ): void => {
      if (isReadonlyArray(rows)) {
        flattenedRows.push(...rows);
        return;
      }
      Object.keys(rows).forEach((groupKey, posInSet, keys) => {
        // TODO: should users have control over the generated key?
        const id = parentId !== undefined ? `${parentId}__${groupKey}` : groupKey;
        const isExpanded = expandedGroupIds.has(id);
        const { childRows, childGroups, startRowIndex } = rows[groupKey];

        const groupRow: GroupRow<R> = {
          id,
          parentId,
          groupKey,
          isExpanded,
          childRows,
          level,
          posInSet,
          startRowIndex,
          setSize: keys.length
        };
        flattenedRows.push(groupRow);
        allGroupRows.add(groupRow);

        if (isExpanded) {
          expandGroup(childGroups, id, level + 1);
        }
      });
    };

    expandGroup(groupedRows, undefined, 0);
    return [flattenedRows, isGroupRow];

    function isGroupRow(row: R | GroupRow<R>): row is GroupRow<R> {
      return allGroupRows.has(row);
    }
  }, [expandedGroupIds, groupedRows, rawRows]);

  const rowHeight = useMemo(() => {
    if (typeof rawRowHeight === 'function') {
      return (row: R | GroupRow<R>): number => {
        if (isGroupRow(row)) {
          return rawRowHeight({ type: 'GROUP', row });
        }
        return rawRowHeight({ type: 'ROW', row });
      };
    }

    return rawRowHeight;
  }, [isGroupRow, rawRowHeight]);

  const getParentRowAndIndex = useCallback(
    (row: R | GroupRow<R>) => {
      const rowIdx = rows.indexOf(row);
      for (let i = rowIdx - 1; i >= 0; i--) {
        const parentRow = rows[i];
        if (isGroupRow(parentRow) && (!isGroupRow(row) || row.parentId === parentRow.id)) {
          return [parentRow, i] as const;
        }
      }

      return undefined;
    },
    [isGroupRow, rows]
  );

  const rowKeyGetter = useCallback(
    (row: R | GroupRow<R>) => {
      if (isGroupRow(row)) {
        return row.id;
      }

      if (typeof rawRowKeyGetter === 'function') {
        return rawRowKeyGetter(row);
      }

      const parentRowAndIndex = getParentRowAndIndex(row);
      if (parentRowAndIndex !== undefined) {
        const { startRowIndex, childRows } = parentRowAndIndex[0];
        const groupIndex = childRows.indexOf(row);
        return startRowIndex + groupIndex + 1;
      }

      return rows.indexOf(row);
    },
    [getParentRowAndIndex, isGroupRow, rawRowKeyGetter, rows]
  );

  const selectedRows = useMemo((): Maybe<ReadonlySet<Key>> => {
    if (rawSelectedRows == null) return null;

    assertIsValidKeyGetter<R, K>(rawRowKeyGetter);

    const selectedRows = new Set<Key>(rawSelectedRows);
    for (const row of rows) {
      if (isGroupRow(row)) {
        // select parent row if all the children are selected
        const isGroupRowSelected = row.childRows.every((cr) =>
          rawSelectedRows.has(rawRowKeyGetter(cr))
        );
        if (isGroupRowSelected) {
          selectedRows.add(row.id);
        }
      }
    }

    return selectedRows;
  }, [isGroupRow, rawRowKeyGetter, rawSelectedRows, rows]);

  function onSelectedRowsChange(newSelectedRows: Set<Key>) {
    if (!rawOnSelectedRowsChange) return;

    assertIsValidKeyGetter<R, K>(rawRowKeyGetter);

    const newRawSelectedRows = new Set(rawSelectedRows);
    for (const row of rows) {
      const key = rowKeyGetter(row);
      if (selectedRows?.has(key) && !newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          // select all children if the parent row is selected
          for (const cr of row.childRows) {
            newRawSelectedRows.delete(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.delete(key as K);
        }
      } else if (!selectedRows?.has(key) && newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          // unselect all children if the parent row is unselected
          for (const cr of row.childRows) {
            newRawSelectedRows.add(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.add(key as K);
        }
      }
    }

    rawOnSelectedRowsChange(newRawSelectedRows);
  }

  function handleKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
    rawOnCellKeyDown?.(args, event);
    if (event.isGridDefaultPrevented()) return;

    if (args.mode === 'EDIT') return;
    const { column, rowIdx, selectCell } = args;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const idx = column?.idx ?? -1;
    const row = rows[rowIdx];

    if (!isGroupRow(row)) return;
    if (
      idx === -1 &&
      // Collapse the current group row if it is focused and is in expanded state
      ((event.key === leftKey && row.isExpanded) ||
        // Expand the current group row if it is focused and is in collapsed state
        (event.key === rightKey && !row.isExpanded))
    ) {
      event.preventDefault(); // Prevents scrolling
      event.preventGridDefault();
      toggleGroup(row.id);
    }

    // If a group row is focused, and it is collapsed, move to the parent group row (if there is one).
    if (idx === -1 && event.key === leftKey && !row.isExpanded && row.level !== 0) {
      const parentRowAndIndex = getParentRowAndIndex(row);
      if (parentRowAndIndex !== undefined) {
        event.preventGridDefault();
        selectCell({ idx, rowIdx: parentRowAndIndex[1] });
      }
    }

    // Prevent copy/paste on group rows
    if (isCtrlKeyHeldDown(event) && (event.keyCode === 67 || event.keyCode === 86)) {
      event.preventGridDefault();
    }
  }

  function handleRowsChange(updatedRows: R[], { indexes, column }: RowsChangeData<R, SR>) {
    if (!onRowsChange) return;
    const updatedRawRows = [...rawRows];
    const rawIndexes: number[] = [];
    indexes.forEach((index) => {
      const rawIndex = rawRows.indexOf(rows[index] as R);
      updatedRawRows[rawIndex] = updatedRows[index];
      rawIndexes.push(rawIndex);
    });
    onRowsChange(updatedRawRows, {
      indexes: rawIndexes,
      column
    });
  }

  function toggleGroup(groupId: unknown) {
    const newExpandedGroupIds = new Set(expandedGroupIds);
    if (newExpandedGroupIds.has(groupId)) {
      newExpandedGroupIds.delete(groupId);
    } else {
      newExpandedGroupIds.add(groupId);
    }
    onExpandedGroupIdsChange(newExpandedGroupIds);
  }

  function renderRow(
    key: Key,
    {
      row,
      rowClass,
      onCellClick,
      onCellDoubleClick,
      onCellContextMenu,
      onRowChange,
      lastFrozenColumnIndex,
      copiedCellIdx,
      draggedOverCellIdx,
      setDraggedOverRowIdx,
      selectedCellEditor,
      selectedCellDragHandle,
      ...rowProps
    }: RenderRowProps<R, SR>
  ) {
    if (isGroupRow(row)) {
      const { startRowIndex } = row;
      return (
        <GroupedRow
          key={key}
          {...rowProps}
          aria-rowindex={headerAndTopSummaryRowsCount + startRowIndex + 1}
          row={row}
          groupBy={groupBy}
          toggleGroup={toggleGroupLatest}
        />
      );
    }

    let ariaRowIndex = rowProps['aria-rowindex'];
    const parentRowAndIndex = getParentRowAndIndex(row);
    if (parentRowAndIndex !== undefined) {
      const { startRowIndex, childRows } = parentRowAndIndex[0];
      const groupIndex = childRows.indexOf(row);
      ariaRowIndex = startRowIndex + headerAndTopSummaryRowsCount + groupIndex + 2;
    }

    return rawRenderRow(key, {
      ...rowProps,
      'aria-rowindex': ariaRowIndex,
      row,
      rowClass,
      onCellClick,
      onCellDoubleClick,
      onCellContextMenu,
      onRowChange,
      lastFrozenColumnIndex,
      copiedCellIdx,
      draggedOverCellIdx,
      setDraggedOverRowIdx,
      selectedCellEditor,
      selectedCellDragHandle
    });
  }

  return (
    <DataGrid<R, SR, Key>
      {...props}
      role="treegrid"
      aria-rowcount={
        rowsCount + 1 + (props.topSummaryRows?.length ?? 0) + (props.bottomSummaryRows?.length ?? 0)
      }
      ref={ref}
      columns={columns}
      rows={rows as R[]} // TODO: check types
      rowHeight={rowHeight}
      rowKeyGetter={rowKeyGetter}
      onRowsChange={handleRowsChange}
      selectedRows={selectedRows}
      onSelectedRowsChange={onSelectedRowsChange}
      onCellKeyDown={handleKeyDown}
      renderers={{
        ...renderers,
        renderRow
      }}
    />
  );
}

function isReadonlyArray(arr: unknown): arr is readonly unknown[] {
  return Array.isArray(arr);
}

export default forwardRef(TreeDataGrid) as <R, SR = unknown, K extends Key = Key>(
  props: TreeDataGridProps<R, SR, K> & RefAttributes<DataGridHandle>
) => JSX.Element;
