import React from 'react';

import Grid, { GridProps } from './Grid';
import ToolbarContainer from './ToolbarContainer';
import CheckboxEditor, { CheckboxEditorProps } from './common/editors/CheckboxEditor';
import { SelectAll } from './formatters';
import * as rowUtils from './RowUtils';
import { getSize } from './ColumnUtils';
import KeyCodes from './KeyCodes';
import { sameColumn, sameColumns, recalculate, resizeColumn } from './ColumnMetrics';
import { CellNavigationMode, EventTypes, UpdateActions, HeaderRowType, DEFINE_SORT } from './common/enums';
import { EventBus } from './masks';
import { Position, Column, CalculatedColumn, CellMetaData, InteractionMasksMetaData, ColumnMetrics, RowData, SelectedRange, RowSelection, HeaderRowData, AddFilterEvent, ColumnList, CommitEvent, GridRowsUpdatedEvent, RowSelectionParams } from './common/types';

type SharedGridProps = Pick<GridProps,
/** The primary key property of each row */
'rowKey'
/** The height of each row in pixels */
| 'rowHeight'
| 'rowRenderer'
| 'rowGroupRenderer'
/** A function called for each rendered row that should return a plain key/value pair object */
| 'rowGetter'
/** The number of rows to be rendered */
| 'rowsCount'
/** The minimum height of the grid in pixels */
| 'minHeight'
/** When set, grid will scroll to this row index */
| 'scrollToRowIndex'
/** Component used to render a context menu. react-data-grid-addons provides a default context menu which may be used*/
| 'contextMenu'
/** Used to toggle whether cells can be selected or not */
| 'enableCellSelect'
/** Toggles whether cells should be autofocused */
| 'enableCellAutoFocus'
| 'cellNavigationMode'
/** The node where the editor portal should mount. */
| 'editorPortalTarget'
/** The key of the column which is currently being sorted */
| 'sortColumn'
/** The direction to sort the sortColumn*/
| 'sortDirection'
/** Called when the grid is scrolled */
| 'onScroll'
/** Component used to render a draggable header cell */
| 'draggableHeaderCell'
| 'getValidFilterValues'
| 'RowsContainer'
| 'emptyRowsView'
| 'onHeaderDrop'
| 'getSubRowDetails'
>;

type SharedCellMetaData = Pick<CellMetaData,
/** Function called on each cell render to render a list of actions for each cell */
'getCellActions'
/** Called whenever a sub row is deleted from the grid */
| 'onDeleteSubRow'
/** Called whenever a sub row is added to the grid */
| 'onAddSubRow'
/** Function called whenever a cell has been expanded */
| 'onCellExpand'
| 'onRowExpandToggle'
>;

type SharedInteractionMasksMetaData = Pick<InteractionMasksMetaData,
/** Deprecated: Function called when grid is updated via a copy/paste. Use onGridRowsUpdated instead*/
'onCellCopyPaste'
/** Function called whenever a cell is selected */
| 'onCellSelected'
/** Function called whenever a cell is deselected */
| 'onCellDeSelected'
/** called before cell is set active, returns a boolean to determine whether cell is editable */
| 'onCheckCellIsEditable'
>;

interface Props extends SharedGridProps, SharedCellMetaData, SharedInteractionMasksMetaData {
  /** An array of objects representing each column on the grid. Can also be an ImmutableJS object */
  columns: ColumnList;
  /** The minimum width of the grid in pixels */
  minWidth?: number;
  /** The height of the header row in pixels */
  headerRowHeight?: number;
  /** The height of the header filter row in pixels */
  headerFiltersHeight: number;
  /** Deprecated: Legacy prop to turn on row selection. Use rowSelection props instead*/
  enableRowSelect: boolean | string;
  /** Component used to render toolbar above the grid */
  toolbar?: React.ReactElement;
  cellRangeSelection?: {
    onStart(selectedRange: SelectedRange): void;
    onUpdate?(selectedRange: SelectedRange): void;
    onComplete?(selectedRange: SelectedRange): void;
  };
  /** Minimum column width in pixels */
  minColumnWidth: number;
  /** Component to render the UI in the header row for selecting all rows  */
  selectAllRenderer?: React.ComponentType;
  /** Function called whenever row is clicked */
  onRowClick?(rowIdx: number, rowData: RowData, column: CalculatedColumn): void;
  /** Function called whenever row is double clicked */
  onRowDoubleClick?(rowIdx: number, rowData: RowData, column: CalculatedColumn): void;
  onAddFilter?(e: AddFilterEvent): void;
  onClearFilters?(): void;
  /** Function called whenever grid is sorted*/
  onGridSort?: GridProps['onSort'];
  /** Function called whenever keyboard key is released */
  onGridKeyUp?(e: React.KeyboardEvent<HTMLDivElement>): void;
  /** Function called whenever keyboard key is pressed down */
  onGridKeyDown?(e: React.KeyboardEvent<HTMLDivElement>): void;
  onRowSelect?(rowData: RowData[]): void;
  columnEquality(c1: Column, c2: Column): boolean;
  rowSelection?: {
    enableShiftSelect?: boolean;
    /** Function called whenever rows are selected */
    onRowsSelected?(args: RowSelectionParams[]): void;
    /** Function called whenever rows are deselected */
    onRowsDeselected?(args: RowSelectionParams[]): void;
    /** toggle whether to show a checkbox in first column to select rows */
    showCheckbox?: boolean;
    /** Method by which rows should be selected */
    selectBy: RowSelection;
  };
  /** Custom checkbox formatter */
  rowActionsCell?: React.ComponentType<CheckboxEditorProps>;
  /**
   * Callback called whenever row data is updated
   * When editing is enabled, this callback will be called for the following scenarios
   * 1. Using the supplied editor of the column. The default editor is the [SimpleTextEditor](https://github.com/adazzle/react-data-grid/blob/master/packages/common/editors/SimpleTextEditor.js).
   * 2. Copy/pasting the value from one cell to another <kbd>CTRL</kbd>+<kbd>C</kbd>, <kbd>CTRL</kbd>+<kbd>V</kbd>
   * 3. Update multiple cells by dragging the fill handle of a cell up or down to a destination cell.
   * 4. Update all cells under a given cell by double clicking the cell's fill handle.
   */
  onGridRowsUpdated?(event: GridRowsUpdatedEvent): void;
  /** Called when a column is resized */
  onColumnResize?(idx: number, width: number): void;
}

type DefaultProps = Pick<Props,
'enableCellSelect'
| 'rowHeight'
| 'headerFiltersHeight'
| 'enableRowSelect'
| 'minHeight'
| 'rowKey'
| 'cellNavigationMode'
| 'enableCellAutoFocus'
| 'minColumnWidth'
| 'columnEquality'
| 'editorPortalTarget'
>;


interface State {
  columnMetrics: ColumnMetrics;
  lastRowIdxUiSelected: number;
  selectedRows: RowData[];
  canFilter?: boolean;
  sortColumn?: string;
  sortDirection?: DEFINE_SORT;
}

function isRowSelected(keys: unknown, indexes: unknown, isSelectedKey: unknown, rowData: RowData, rowIdx: number) {
  return rowUtils.isRowSelected(keys as { rowKey?: string; values?: string[] } | null, indexes as number[] | null, isSelectedKey as string | null, rowData, rowIdx);
}

/** Main API Component to render a data grid of rows and columns
 *
 * Example code
 * -----
 *
 * ```javascript
 * <ReactDataGrid
 *   columns={columns}
 *   rowGetter={i => rows[i]}
 *   rowsCount={3} />
 * ```
*/
export default class ReactDataGrid extends React.Component<Props, State> {
  static displayName = 'ReactDataGrid';

  static defaultProps: DefaultProps = {
    enableCellSelect: false,
    rowHeight: 35,
    headerFiltersHeight: 45,
    enableRowSelect: false,
    minHeight: 350,
    rowKey: 'id',
    cellNavigationMode: CellNavigationMode.NONE,
    enableCellAutoFocus: true,
    minColumnWidth: 80,
    columnEquality: sameColumn,
    editorPortalTarget: document.body
  };

  private readonly grid = React.createRef<HTMLDivElement>();
  private readonly base = React.createRef<Grid>();
  private readonly selectAllCheckbox = React.createRef<HTMLInputElement>();
  private readonly eventBus = new EventBus();
  private readonly _keysDown = new Set<number>();
  private _cachedColumns?: ColumnList;
  private _cachedComputedColumns?: ColumnList;

  constructor(props: Props) {
    super(props);
    const initialState: State = {
      columnMetrics: this.createColumnMetrics(),
      selectedRows: [],
      canFilter: false,
      lastRowIdxUiSelected: -1
    };

    if (this.props.sortColumn && this.props.sortDirection) {
      initialState.sortColumn = this.props.sortColumn;
      initialState.sortDirection = this.props.sortDirection;
    }
    this.state = initialState;
  }

  componentDidMount() {
    window.addEventListener('resize', this.metricsUpdated);
    if (this.props.cellRangeSelection) {
      window.addEventListener('mouseup', this.handleWindowMouseUp);
    }
    this.metricsUpdated();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.metricsUpdated);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.columns) {
      if (!sameColumns(this.props.columns, nextProps.columns, this.props.columnEquality)
        || nextProps.minWidth !== this.props.minWidth) {
        const columnMetrics = this.createColumnMetrics(nextProps);
        this.setState({ columnMetrics });
      }
    }
  }

  selectCell({ idx, rowIdx }: Position, openEditor?: boolean) {
    this.eventBus.dispatch(EventTypes.SELECT_CELL, { rowIdx, idx }, openEditor);
  }

  gridWidth() {
    const { current } = this.grid;
    return current && current.parentElement ? current.parentElement.offsetWidth : 0;
  }

  getTotalWidth() {
    if (this.grid.current) {
      return this.gridWidth();
    }
    return getSize(this.props.columns) * this.props.minColumnWidth;
  }

  getColumn(idx: number) {
    return this.state.columnMetrics.columns[idx];
  }

  getSize() {
    return this.state.columnMetrics.columns.length;
  }

  metricsUpdated = () => {
    const columnMetrics = this.createColumnMetrics();
    this.setState({ columnMetrics });
  };

  createColumnMetrics(props = this.props) {
    const gridColumns = this.setupGridColumns(props);
    const metrics = {
      columns: gridColumns,
      minColumnWidth: this.props.minColumnWidth,
      totalWidth: this.props.minWidth || this.getTotalWidth()
    };
    return recalculate(metrics);
  }

  isSingleKeyDown(keyCode: number) {
    return this._keysDown.has(keyCode) && this._keysDown.size === 1;
  }

  handleColumnResize = (idx: number, width: number) => {
    const columnMetrics = resizeColumn(this.state.columnMetrics, idx, width);
    this.setState({ columnMetrics });
    if (this.props.onColumnResize) {
      this.props.onColumnResize(idx, width);
    }
  };

  handleDragEnter = (overRowIdx: number) => {
    this.eventBus.dispatch(EventTypes.DRAG_ENTER, overRowIdx);
  };

  handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Track which keys are currently down for shift clicking etc
    this._keysDown.add(e.keyCode);

    const { onGridKeyDown } = this.props;
    if (onGridKeyDown) {
      onGridKeyDown(e);
    }
  };

  handleViewportKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Track which keys are currently down for shift clicking etc
    this._keysDown.delete(e.keyCode);

    const { onGridKeyUp } = this.props;
    if (onGridKeyUp) {
      onGridKeyUp(e);
    }
  };

  handlerCellClick = ({ rowIdx, idx }: Position) => {
    const { onRowClick, rowGetter } = this.props;
    this.selectCell({ rowIdx, idx });

    if (onRowClick) {
      onRowClick(rowIdx, rowGetter(rowIdx), this.getColumn(idx));
    }
  };

  handleCellMouseDown = (position: Position) => {
    this.eventBus.dispatch(EventTypes.SELECT_START, position);
  };

  handleCellMouseEnter = (position: Position) => {
    this.eventBus.dispatch(EventTypes.SELECT_UPDATE, position);
  };

  handleWindowMouseUp = () => {
    this.eventBus.dispatch(EventTypes.SELECT_END);
  };

  handleCellContextMenu = (position: Position) => {
    this.selectCell(position);
  };

  handleCellDoubleClick = ({ rowIdx, idx }: Position) => {
    const { onRowDoubleClick, rowGetter } = this.props;
    if (onRowDoubleClick) {
      onRowDoubleClick(rowIdx, rowGetter(rowIdx), this.getColumn(idx));
    }
    this.openCellEditor(rowIdx, idx);
  };

  handleToggleFilter = () => {
    // setState() does not immediately mutate this.state but creates a pending state transition.
    // Therefore if you want to do something after the state change occurs, pass it in as a callback function.
    this.setState((prevState) => ({ canFilter: !prevState.canFilter }), () => {
      if (this.state.canFilter === false && this.props.onClearFilters) {
        this.props.onClearFilters();
      }
    });
  };

  handleDragHandleDoubleClick: InteractionMasksMetaData['onDragHandleDoubleClick'] = (e) => {
    const cellKey = this.getColumn(e.idx).key;
    this.handleGridRowsUpdated(cellKey, e.rowIdx, this.props.rowsCount - 1, { [cellKey]: e.rowData[cellKey] }, UpdateActions.COLUMN_FILL);
  };

  handleGridRowsUpdated: InteractionMasksMetaData['onGridRowsUpdated'] = (cellKey, fromRow, toRow, updated, action, originRow) => {
    const { rowGetter, rowKey, onGridRowsUpdated } = this.props;
    if (!onGridRowsUpdated) {
      return;
    }

    const rowIds = [];
    for (let i = fromRow; i <= toRow; i++) {
      rowIds.push(rowGetter(i)[rowKey]);
    }

    const fromRowData = rowGetter(action === UpdateActions.COPY_PASTE ? originRow! : fromRow);
    const fromRowId = fromRowData[rowKey];
    const toRowId = rowGetter(toRow)[rowKey];
    onGridRowsUpdated({ cellKey, fromRow, toRow, fromRowId, toRowId, rowIds, updated, action, fromRowData });
  };

  handleCommit = (commit: CommitEvent) => {
    const targetRow = commit.rowIdx;
    this.handleGridRowsUpdated(commit.cellKey, targetRow, targetRow, commit.updated, UpdateActions.CELL_UPDATE);
  };

  handleSort = (sortColumn: string, sortDirection: DEFINE_SORT) => {
    this.setState({ sortColumn, sortDirection }, () => {
      const { onGridSort } = this.props;
      if (onGridSort) {
        onGridSort(sortColumn, sortDirection);
      }
    });
  };

  getSelectedRow(rows: RowData[], key: unknown) {
    return rows.find(r => r[this.props.rowKey] === key);
  }

  useNewRowSelection = () => {
    return this.props.rowSelection && this.props.rowSelection.selectBy;
  };

  // return false if not a shift select so can be handled as normal row selection
  handleShiftSelect = (rowIdx: number) => {
    const { rowSelection } = this.props;
    if (rowSelection && this.state.lastRowIdxUiSelected > -1 && this.isSingleKeyDown(KeyCodes.Shift)) {
      const { keys, indexes, isSelectedKey } = rowSelection.selectBy as { [key: string]: unknown };
      const isPreviouslySelected = isRowSelected(keys, indexes, isSelectedKey, this.props.rowGetter(rowIdx), rowIdx);

      if (isPreviouslySelected) return false;

      let handled = false;

      if (rowIdx > this.state.lastRowIdxUiSelected) {
        const rowsSelected = [];

        for (let i = this.state.lastRowIdxUiSelected + 1; i <= rowIdx; i++) {
          rowsSelected.push({ rowIdx: i, row: this.props.rowGetter(i) });
        }

        if (typeof rowSelection.onRowsSelected === 'function') {
          rowSelection.onRowsSelected(rowsSelected);
        }

        handled = true;
      } else if (rowIdx < this.state.lastRowIdxUiSelected) {
        const rowsSelected = [];

        for (let i = rowIdx; i <= this.state.lastRowIdxUiSelected - 1; i++) {
          rowsSelected.push({ rowIdx: i, row: this.props.rowGetter(i) });
        }

        if (typeof rowSelection.onRowsSelected === 'function') {
          rowSelection.onRowsSelected(rowsSelected);
        }

        handled = true;
      }

      if (handled) {
        this.setState({ lastRowIdxUiSelected: rowIdx });
      }

      return handled;
    }

    return false;
  };

  handleNewRowSelect = (rowIdx: number, rowData: RowData) => {
    const { current } = this.selectAllCheckbox;
    if (current && current.checked === true) {
      current.checked = false;
    }

    const { rowSelection } = this.props;
    if (rowSelection) {
      const { keys, indexes, isSelectedKey } = rowSelection.selectBy as { [key: string]: unknown };
      const isPreviouslySelected = isRowSelected(keys, indexes, isSelectedKey, rowData, rowIdx);

      this.setState({ lastRowIdxUiSelected: isPreviouslySelected ? -1 : rowIdx });
      const cb = isPreviouslySelected ? rowSelection.onRowsDeselected : rowSelection.onRowsSelected;
      if (typeof cb === 'function') {
        cb([{ rowIdx, row: rowData }]);
      }
    }
  };

  // columnKey not used here as this function will select the whole row,
  // but needed to match the function signature in the CheckboxEditor
  handleRowSelect = (rowIdx: number, columnKey: string, rowData: RowData, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const { rowSelection } = this.props;

    if (this.useNewRowSelection()) {
      if (rowSelection && rowSelection.enableShiftSelect === true) {
        if (!this.handleShiftSelect(rowIdx)) {
          this.handleNewRowSelect(rowIdx, rowData);
        }
      } else {
        this.handleNewRowSelect(rowIdx, rowData);
      }
    } else { // Fallback to old onRowSelect handler
      const selectedRows = this.props.enableRowSelect === 'single' ? [] : [...this.state.selectedRows];
      const selectedRow = this.getSelectedRow(selectedRows, rowData[this.props.rowKey]);
      if (selectedRow) {
        selectedRow.isSelected = !selectedRow.isSelected;
      } else {
        rowData.isSelected = true;
        selectedRows.push(rowData);
      }
      this.setState({ selectedRows });
      if (this.props.onRowSelect) {
        this.props.onRowSelect(selectedRows.filter(r => r.isSelected === true));
      }
    }
  };

  handleCheckboxChange = (e: React.ChangeEvent<HTMLElement>) => {
    const allRowsSelected = e.currentTarget instanceof HTMLInputElement && e.currentTarget.checked;
    const { rowSelection } = this.props;
    if (rowSelection && this.useNewRowSelection()) {
      const { keys, indexes, isSelectedKey } = rowSelection.selectBy as { [key: string]: unknown };

      if (allRowsSelected && typeof rowSelection.onRowsSelected === 'function') {
        const selectedRows = [];
        for (let i = 0; i < this.props.rowsCount; i++) {
          const rowData = this.props.rowGetter(i);
          if (!isRowSelected(keys, indexes, isSelectedKey, rowData, i)) {
            selectedRows.push({ rowIdx: i, row: rowData });
          }
        }

        if (selectedRows.length > 0) {
          rowSelection.onRowsSelected(selectedRows);
        }
      } else if (!allRowsSelected && typeof rowSelection.onRowsDeselected === 'function') {
        const deselectedRows = [];
        for (let i = 0; i < this.props.rowsCount; i++) {
          const rowData = this.props.rowGetter(i);
          if (isRowSelected(keys, indexes, isSelectedKey, rowData, i)) {
            deselectedRows.push({ rowIdx: i, row: rowData });
          }
        }

        if (deselectedRows.length > 0) {
          rowSelection.onRowsDeselected(deselectedRows);
        }
      }
    } else {
      const selectedRows = [];
      for (let i = 0; i < this.props.rowsCount; i++) {
        const row = { ...this.props.rowGetter(i), isSelected: allRowsSelected };
        selectedRows.push(row);
      }
      this.setState({ selectedRows });
      if (typeof this.props.onRowSelect === 'function') {
        this.props.onRowSelect(selectedRows.filter(r => r.isSelected === true));
      }
    }
  };

  getRowOffsetHeight() {
    return this.getHeaderRows().reduce((offsetHeight, row) => offsetHeight += row.height, 0);
  }

  getHeaderRows() {
    const { headerRowHeight, rowHeight, onAddFilter, headerFiltersHeight } = this.props;
    const rows: HeaderRowData[] = [{ height: headerRowHeight || rowHeight, rowType: HeaderRowType.HEADER }];
    if (this.state.canFilter === true) {
      rows.push({
        rowType: HeaderRowType.FILTER,
        filterable: true,
        onFilterChange: onAddFilter,
        height: headerFiltersHeight
      });
    }
    return rows;
  }

  getRowSelectionProps() {
    return this.props.rowSelection && this.props.rowSelection.selectBy;
  }

  getSelectedRows() {
    if (this.props.rowSelection) {
      return;
    }

    return this.state.selectedRows.filter(r => r.isSelected === true);
  }

  openCellEditor(rowIdx: number, idx: number) {
    this.selectCell({ rowIdx, idx }, true);
  }

  scrollToColumn(colIdx: number) {
    this.eventBus.dispatch(EventTypes.SCROLL_TO_COLUMN, colIdx);
  }

  setupGridColumns(props = this.props): ColumnList {
    const { columns } = props;
    if (this._cachedColumns === columns) {
      return this._cachedComputedColumns!;
    }

    this._cachedColumns = columns;

    if (this.props.rowActionsCell || (props.enableRowSelect && !this.props.rowSelection) || (props.rowSelection && props.rowSelection.showCheckbox !== false)) {
      const SelectAllComponent = this.props.selectAllRenderer || SelectAll;
      const SelectAllRenderer = <SelectAllComponent onChange={this.handleCheckboxChange} ref={this.selectAllCheckbox} />;
      const headerRenderer = props.enableRowSelect === 'single' ? undefined : SelectAllRenderer;
      const Formatter = (this.props.rowActionsCell ? this.props.rowActionsCell : CheckboxEditor) as unknown as React.ComponentClass<{ rowSelection: unknown }>;
      const selectColumn: Column = {
        key: 'select-row',
        name: '',
        formatter: <Formatter rowSelection={this.props.rowSelection} />,
        onCellChange: this.handleRowSelect,
        filterable: false,
        headerRenderer,
        width: 60,
        frozen: true,
        getRowMetaData: (rowData: RowData) => rowData,
        cellClass: this.props.rowActionsCell ? 'rdg-row-actions-cell' : ''
      };

      this._cachedComputedColumns = Array.isArray(columns)
        ? [selectColumn, ...columns]
        : columns.unshift(selectColumn);
    } else {
      this._cachedComputedColumns = columns.slice(0) as ColumnList;
    }

    return this._cachedComputedColumns;
  }

  render() {
    const cellMetaData: CellMetaData = {
      rowKey: this.props.rowKey,
      onCellClick: this.handlerCellClick,
      onCellContextMenu: this.handleCellContextMenu,
      onCellDoubleClick: this.handleCellDoubleClick,
      onCellExpand: this.props.onCellExpand,
      onRowExpandToggle: this.props.onRowExpandToggle,
      getCellActions: this.props.getCellActions,
      onDeleteSubRow: this.props.onDeleteSubRow,
      onAddSubRow: this.props.onAddSubRow,
      onDragEnter: this.handleDragEnter
    };
    if (this.props.cellRangeSelection) {
      cellMetaData.onCellMouseDown = this.handleCellMouseDown;
      cellMetaData.onCellMouseEnter = this.handleCellMouseEnter;
    }

    const interactionMasksMetaData: InteractionMasksMetaData = {
      onCheckCellIsEditable: this.props.onCheckCellIsEditable,
      onCellCopyPaste: this.props.onCellCopyPaste,
      onGridRowsUpdated: this.handleGridRowsUpdated,
      onDragHandleDoubleClick: this.handleDragHandleDoubleClick,
      onCellSelected: this.props.onCellSelected,
      onCellDeSelected: this.props.onCellDeSelected,
      onCellRangeSelectionStarted: this.props.cellRangeSelection && this.props.cellRangeSelection.onStart,
      onCellRangeSelectionUpdated: this.props.cellRangeSelection && this.props.cellRangeSelection.onUpdate,
      onCellRangeSelectionCompleted: this.props.cellRangeSelection && this.props.cellRangeSelection.onComplete,
      onCommit: this.handleCommit
    };

    let containerWidth: string | number = this.props.minWidth || this.gridWidth();
    let gridWidth: string | number = containerWidth;

    // depending on the current lifecycle stage, gridWidth() may not initialize correctly
    // this also handles cases where it always returns undefined -- such as when inside a div with display:none
    // eg Bootstrap tabs and collapses
    if (Number.isNaN(containerWidth) || containerWidth === 0) {
      containerWidth = '100%';
      gridWidth = '100%';
    }

    return (
      <div
        className="react-grid-Container"
        style={{ width: containerWidth }}
        ref={this.grid}
      >
        <ToolbarContainer
          toolbar={this.props.toolbar}
          columns={this.props.columns}
          rowsCount={this.props.rowsCount}
          onToggleFilter={this.handleToggleFilter}
        />
        <Grid
          ref={this.base}
          rowKey={this.props.rowKey}
          headerRows={this.getHeaderRows()}
          draggableHeaderCell={this.props.draggableHeaderCell}
          getValidFilterValues={this.props.getValidFilterValues}
          columnMetrics={this.state.columnMetrics}
          rowGetter={this.props.rowGetter}
          rowsCount={this.props.rowsCount}
          rowHeight={this.props.rowHeight}
          rowRenderer={this.props.rowRenderer}
          rowGroupRenderer={this.props.rowGroupRenderer}
          cellMetaData={cellMetaData}
          selectedRows={this.getSelectedRows()}
          rowSelection={this.getRowSelectionProps()}
          rowOffsetHeight={this.getRowOffsetHeight()}
          sortColumn={this.state.sortColumn}
          sortDirection={this.state.sortDirection}
          onSort={this.handleSort}
          minHeight={this.props.minHeight}
          totalWidth={gridWidth}
          onViewportKeydown={this.handleViewportKeyDown}
          onViewportKeyup={this.handleViewportKeyUp}
          onColumnResize={this.handleColumnResize}
          scrollToRowIndex={this.props.scrollToRowIndex}
          contextMenu={this.props.contextMenu}
          enableCellSelect={this.props.enableCellSelect}
          enableCellAutoFocus={this.props.enableCellAutoFocus}
          cellNavigationMode={this.props.cellNavigationMode}
          eventBus={this.eventBus}
          onScroll={this.props.onScroll}
          RowsContainer={this.props.RowsContainer}
          emptyRowsView={this.props.emptyRowsView}
          onHeaderDrop={this.props.onHeaderDrop}
          getSubRowDetails={this.props.getSubRowDetails}
          editorPortalTarget={this.props.editorPortalTarget}
          interactionMasksMetaData={interactionMasksMetaData}
        />
      </div>
    );
  }
}

export type ReactDataGridProps = JSX.LibraryManagedAttributes<typeof ReactDataGrid, Props>;
