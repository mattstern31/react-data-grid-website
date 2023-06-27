import { useMemo } from 'react';

import { floor, max, min } from '../utils';

interface ViewportRowsArgs<R> {
  rows: readonly R[];
  rowHeight: number | ((row: R) => number);
  clientHeight: number;
  scrollTop: number;
  enableVirtualization: boolean;
}

export function useViewportRows<R>({
  rows,
  rowHeight,
  clientHeight,
  scrollTop,
  enableVirtualization
}: ViewportRowsArgs<R>) {
  const { totalRowHeight, gridTemplateRows, getRowTop, getRowHeight, findRowIdx } = useMemo(() => {
    if (typeof rowHeight === 'number') {
      return {
        totalRowHeight: rowHeight * rows.length,
        gridTemplateRows: ` repeat(${rows.length}, ${rowHeight}px)`,
        getRowTop: (rowIdx: number) => rowIdx * rowHeight,
        getRowHeight: () => rowHeight,
        findRowIdx: (offset: number) => floor(offset / rowHeight)
      };
    }

    let totalRowHeight = 0;
    let gridTemplateRows = ' ';
    // Calcule the height of all the rows upfront. This can cause performance issues
    // and we can consider using a similar approach as react-window
    // https://github.com/bvaughn/react-window/blob/b0a470cc264e9100afcaa1b78ed59d88f7914ad4/src/VariableSizeList.js#L68
    const rowPositions = rows.map((row) => {
      const currentRowHeight = rowHeight(row);
      const position = { top: totalRowHeight, height: currentRowHeight };
      gridTemplateRows += `${currentRowHeight}px `;
      totalRowHeight += currentRowHeight;
      return position;
    });

    const validateRowIdx = (rowIdx: number) => {
      return max(0, min(rows.length - 1, rowIdx));
    };

    return {
      totalRowHeight,
      gridTemplateRows,
      getRowTop: (rowIdx: number) => rowPositions[validateRowIdx(rowIdx)].top,
      getRowHeight: (rowIdx: number) => rowPositions[validateRowIdx(rowIdx)].height,
      findRowIdx(offset: number) {
        let start = 0;
        let end = rowPositions.length - 1;
        while (start <= end) {
          const middle = start + floor((end - start) / 2);
          const currentOffset = rowPositions[middle].top;

          if (currentOffset === offset) return middle;

          if (currentOffset < offset) {
            start = middle + 1;
          } else if (currentOffset > offset) {
            end = middle - 1;
          }

          if (start > end) return end;
        }
        return 0;
      }
    };
  }, [rowHeight, rows]);

  let rowOverscanStartIdx = 0;
  let rowOverscanEndIdx = rows.length - 1;

  if (enableVirtualization) {
    const overscanThreshold = 4;
    const rowVisibleStartIdx = findRowIdx(scrollTop);
    const rowVisibleEndIdx = findRowIdx(scrollTop + clientHeight);
    rowOverscanStartIdx = max(0, rowVisibleStartIdx - overscanThreshold);
    rowOverscanEndIdx = min(rows.length - 1, rowVisibleEndIdx + overscanThreshold);
  }

  return {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    totalRowHeight,
    gridTemplateRows,
    getRowTop,
    getRowHeight,
    findRowIdx
  };
}
