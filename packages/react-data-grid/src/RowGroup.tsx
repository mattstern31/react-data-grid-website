import React, { forwardRef } from 'react';
import { EventTypes } from './common/enums';
import { CellMetaData, RowRendererProps, CalculatedColumn } from './common/types';
import EventBus from './masks/EventBus';

interface Props {
  height: number;
  columns: CalculatedColumn[];
  row: unknown;
  cellRenderer?(): void;
  cellMetaData: CellMetaData;
  isSelected?: boolean;
  idx: number;
  extraClasses?: string;
  forceUpdate?: boolean;
  subRowDetails?: unknown;
  isRowHovered?: boolean;
  colVisibleStartIdx: number;
  colVisibleEndIdx: number;
  colOverscanStartIdx: number;
  colOverscanEndIdx: number;
  isScrolling: boolean;
  columnGroupDisplayName: string;
  columnGroupName: string;
  isExpanded: boolean;
  treeDepth?: number;
  name: string;
  renderer?: React.ComponentType;
  eventBus: EventBus;
  renderBaseRow(p: RowRendererProps): React.ReactElement;
}

const RowGroup = forwardRef<HTMLDivElement, Props>(function RowGroup(props, ref) {
  function onRowExpandToggle(expand?: boolean) {
    const { onRowExpandToggle } = props.cellMetaData;
    if (onRowExpandToggle) {
      const shouldExpand = expand == null ? !props.isExpanded : expand;
      onRowExpandToggle({ rowIdx: props.idx, shouldExpand, columnGroupName: props.columnGroupName, name: props.name });
    }
  }

  function onRowExpandClick() {
    onRowExpandToggle(!props.isExpanded);
  }

  function onClick() {
    props.eventBus.dispatch(EventTypes.SELECT_CELL, { rowIdx: props.idx, idx: 0 });
  }

  const lastColumn = props.columns[props.columns.length - 1];
  const style = { width: lastColumn!.left + lastColumn!.width };
  const Renderer = props.renderer || DefaultBase;

  return (
    <div className="react-grid-row-group" style={style} onClick={onClick}>
      <Renderer {...props} ref={ref} onRowExpandClick={onRowExpandClick} onRowExpandToggle={onRowExpandToggle} />
    </div>
  );
});

export default RowGroup;

interface DefaultBaseProps extends Props {
  onRowExpandClick(): void;
  onRowExpandToggle(expand?: boolean): void;
}

const DefaultBase = forwardRef<HTMLDivElement, DefaultBaseProps>(function DefaultBase(props, ref) {
  function onKeyDown({ key }: React.KeyboardEvent) {
    const { onRowExpandToggle } = props;
    if (key === 'ArrowLeft') {
      onRowExpandToggle(false);
    }
    if (key === 'ArrowRight') {
      onRowExpandToggle(true);
    }
    if (key === 'Enter') {
      onRowExpandToggle(!props.isExpanded);
    }
  }

  const { treeDepth = 0, height, onRowExpandClick, isExpanded, columnGroupDisplayName, name } = props;
  const marginLeft = treeDepth * 20;

  return (
    <div
      className="rdg-row-group-default"
      style={{ height }}
      onKeyDown={onKeyDown}
      tabIndex={0}
      ref={ref}
    >
      <span
        className="row-expand-icon"
        style={{ marginLeft }}
        onClick={onRowExpandClick}
      >
        {isExpanded ? String.fromCharCode(9660) : String.fromCharCode(9658)}
      </span>
      <strong>{columnGroupDisplayName}: {name}</strong>
    </div>
  );
});
