import { css } from '@linaria/core';

import type { RenderHeaderCellProps } from './types';
import { useDefaultRenderers } from './DataGridDefaultRenderersProvider';

const headerSortCell = css`
  @layer rdg.SortableHeaderCell {
    cursor: pointer;
    display: flex;

    &:focus {
      outline: none;
    }
  }
`;

const headerSortCellClassname = `rdg-header-sort-cell ${headerSortCell}`;

const headerSortName = css`
  @layer rdg.SortableHeaderCellName {
    flex-grow: 1;
    overflow: hidden;
    overflow: clip;
    text-overflow: ellipsis;
  }
`;

const headerSortNameClassname = `rdg-header-sort-name ${headerSortName}`;

export default function renderHeaderCell<R, SR>({
  column,
  sortDirection,
  priority,
  onSort,
  tabIndex
}: RenderHeaderCellProps<R, SR>) {
  if (!column.sortable) return column.name;

  return (
    <SortableHeaderCell
      onSort={onSort}
      sortDirection={sortDirection}
      priority={priority}
      tabIndex={tabIndex}
    >
      {column.name}
    </SortableHeaderCell>
  );
}

type SharedHeaderCellProps<R, SR> = Pick<
  RenderHeaderCellProps<R, SR>,
  'sortDirection' | 'onSort' | 'priority' | 'tabIndex'
>;

interface SortableHeaderCellProps<R, SR> extends SharedHeaderCellProps<R, SR> {
  children: React.ReactNode;
}

function SortableHeaderCell<R, SR>({
  onSort,
  sortDirection,
  priority,
  children,
  tabIndex
}: SortableHeaderCellProps<R, SR>) {
  const renderSortStatus = useDefaultRenderers<R, SR>()!.renderSortStatus!;

  function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === ' ' || event.key === 'Enter') {
      // stop propagation to prevent scrolling
      event.preventDefault();
      onSort(event.ctrlKey || event.metaKey);
    }
  }

  function handleClick(event: React.MouseEvent<HTMLSpanElement>) {
    onSort(event.ctrlKey || event.metaKey);
  }

  return (
    <span
      tabIndex={tabIndex}
      className={headerSortCellClassname}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className={headerSortNameClassname}>{children}</span>
      <span>{renderSortStatus({ sortDirection, priority })}</span>
    </span>
  );
}
