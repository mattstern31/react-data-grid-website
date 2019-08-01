import React from 'react';
import { isElement } from 'react-is';
import { HeaderRowType, DEFINE_SORT } from '../../enums';
import { CalculatedColumn } from '../../types';

const SORT_TEXT = {
  [DEFINE_SORT.ASC]: '\u25B2',
  [DEFINE_SORT.DESC]: '\u25BC',
  [DEFINE_SORT.NONE]: ''
} as const;

export interface Props<R> {
  column: CalculatedColumn<R>;
  rowType: HeaderRowType;
  onSort(columnKey: keyof R, direction: DEFINE_SORT): void;
  sortDirection: DEFINE_SORT;
  sortDescendingFirst: boolean;
}

export default function SortableHeaderCell<R>(props: Props<R>) {
  const { column, rowType, onSort, sortDirection, sortDescendingFirst } = props;
  function onClick() {
    let direction;
    switch (sortDirection) {
      case DEFINE_SORT.ASC:
        direction = sortDescendingFirst ? DEFINE_SORT.NONE : DEFINE_SORT.DESC;
        break;
      case DEFINE_SORT.DESC:
        direction = sortDescendingFirst ? DEFINE_SORT.ASC : DEFINE_SORT.NONE;
        break;
      default:
        direction = sortDescendingFirst ? DEFINE_SORT.DESC : DEFINE_SORT.ASC;
        break;
    }
    onSort(column.key, direction);
  }

  const { headerRenderer } = column;
  const content = !headerRenderer
    ? column.name
    : isElement(headerRenderer)
      ? React.cloneElement(headerRenderer, { column })
      : React.createElement(headerRenderer, { column, rowType });

  return (
    <div className="rdg-sortable-header-cell" onClick={onClick}>
      <span className="pull-right">{SORT_TEXT[sortDirection]}</span>
      {content}
    </div>
  );
}
