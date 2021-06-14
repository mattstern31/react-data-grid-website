import type { Column } from '../src';
import {
  getCells,
  getCellsAtRowIndex,
  getGrid,
  getHeaderCells,
  getRows,
  queryCells,
  queryHeaderCells,
  queryRows,
  setup
} from './utils';

const rowHeight = 35;

function setupGrid(
  enableVirtualization: boolean,
  columnCount: number,
  rowCount: number,
  frozenColumnCount = 0,
  summaryRowCount = 0
) {
  const columns: Column<unknown>[] = [];
  const rows = Array(rowCount);
  const summaryRows = Array(summaryRowCount).fill(null);

  for (let i = 0; i < columnCount; i++) {
    const key = String(i);
    columns.push({
      key,
      name: key,
      width: 100 + ((i * 10) % 50),
      frozen: i < frozenColumnCount
    });
  }

  return setup({ columns, rows, summaryRows, rowHeight, enableVirtualization });
}

function assertHeightFill(height: number) {
  // if there are not enough rows, we need to fill the rows viewport's height so summary rows stick to the bottom of the container
  expect(document.querySelector('.rdg-focus-sink + div')).toHaveStyle({ height: `${height}px` });
}

function assertElements(
  elements: HTMLElement[],
  attribute: string,
  count: number,
  startIdx: number,
  endIdx: number
) {
  expect(elements).toHaveLength(count);
  expect(elements[0]).toHaveAttribute(attribute, String(startIdx));
  expect(elements[elements.length - 1]).toHaveAttribute(attribute, String(endIdx));
}

function assertIndexes(
  cells: HTMLElement[],
  expectedIndexes: number[],
  attribute: string,
  indexOffset: number
) {
  const actualIndexes = cells.map(
    (cell) => parseInt(cell.getAttribute(attribute)!, 10) - indexOffset
  );
  expect(actualIndexes).toStrictEqual(expectedIndexes);
}

function assertHeaderCells(count: number, startIdx: number, endIdx: number) {
  assertElements(getHeaderCells(), 'aria-colindex', count, startIdx + 1, endIdx + 1);
}

function assertHeaderCellIndexes(indexes: number[]) {
  assertIndexes(getHeaderCells(), indexes, 'aria-colindex', 1);
}

function assertRows(count: number, startIdx: number, endIdx: number) {
  assertElements(getRows(), 'aria-rowindex', count, startIdx + 2, endIdx + 2);
}

function assertRowIndexes(indexes: number[]) {
  assertIndexes(getRows(), indexes, 'aria-rowindex', 2);
}

function assertCells(rowIdx: number, count: number, startIdx: number, endIdx: number) {
  assertElements(getCellsAtRowIndex(rowIdx), 'aria-colindex', count, startIdx + 1, endIdx + 1);
}

function assertCellIndexes(rowIdx: number, indexes: number[]) {
  assertIndexes(getCellsAtRowIndex(rowIdx), indexes, 'aria-colindex', 1);
}

test('virtualization is enabled', () => {
  setupGrid(true, 30, 100);

  const grid = getGrid();

  assertHeightFill(100 * rowHeight);

  assertHeaderCells(18, 0, 17);
  assertRows(34, 0, 33);
  assertCells(0, 18, 0, 17);

  grid.scrollTop = 249;
  assertRows(38, 3, 40);

  grid.scrollTop = 250;
  assertRows(39, 3, 41);

  grid.scrollTop = 419;
  assertRows(39, 7, 45);

  grid.scrollTop = 420;
  assertRows(38, 8, 45);

  grid.scrollTop = 529;
  assertRows(38, 11, 48);

  grid.scrollTop = 530;
  assertRows(39, 11, 49);

  grid.scrollTop = 1000;
  assertRows(39, 24, 62);

  // scroll height = header height + row height * row count
  // max top = scroll height - grid height
  grid.scrollTop = rowHeight + rowHeight * 100 - 1080;
  assertRows(34, 66, 99);

  grid.scrollLeft = 90;
  assertHeaderCells(18, 0, 17);
  assertCells(66, 18, 0, 17);

  grid.scrollLeft = 91;
  assertHeaderCells(19, 0, 18);
  assertCells(66, 19, 0, 18);

  grid.scrollLeft = 209;
  assertHeaderCells(19, 0, 18);
  assertCells(66, 19, 0, 18);

  grid.scrollLeft = 210;
  assertHeaderCells(18, 1, 18);
  assertCells(66, 18, 1, 18);

  // max left = row width - grid width
  grid.scrollLeft = parseInt(grid.style.getPropertyValue('--row-width'), 10) - 1920;
  assertHeaderCells(17, 13, 29);
  assertCells(66, 17, 13, 29);
});

test('virtualization is enabled with 4 frozen columns', () => {
  setupGrid(true, 30, 30, 4);

  const grid = getGrid();

  assertHeightFill(30 * rowHeight);

  let indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  grid.scrollLeft = 1000;
  indexes = [0, 1, 2, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  // max left = row width - grid width
  grid.scrollLeft = parseInt(grid.style.getPropertyValue('--row-width'), 10) - 1920;
  indexes = [0, 1, 2, 3, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);
});

test('virtualization is enabled with all columns frozen', () => {
  setupGrid(true, 30, 30, 30);

  const grid = getGrid();

  assertHeightFill(30 * rowHeight);

  const indexes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29
  ];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  grid.scrollLeft = 1000;
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  // max left = row width - grid width
  grid.scrollLeft = parseInt(grid.style.getPropertyValue('--row-width'), 10) - 1920;
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);
});

test('virtualization is enabled with 2 summary rows', () => {
  setupGrid(true, 1, 100, 0, 2);

  const grid = getGrid();

  assertHeightFill(100 * rowHeight);

  assertRowIndexes([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, 100, 101
  ]);

  grid.scrollTop = 1000;
  assertRowIndexes([
    24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 100, 101
  ]);
});

test('zero columns', () => {
  setupGrid(true, 0, 100);

  assertHeightFill(100 * rowHeight);
  expect(queryHeaderCells()).toHaveLength(0);
  expect(queryCells()).toHaveLength(0);
  expect(getRows()).toHaveLength(34);
});

test('zero rows', () => {
  setupGrid(true, 20, 0);

  assertHeightFill(1080 - rowHeight);
  expect(getHeaderCells()).toHaveLength(18);
  expect(queryCells()).toHaveLength(0);
  expect(queryRows()).toHaveLength(0);
});

test('zero rows + 2 summary rows', () => {
  setupGrid(true, 20, 0, 0, 2);

  assertHeightFill(1080 - rowHeight * 3);
});

test('virtualization is enable with not enough columns or rows to virtualize', () => {
  setupGrid(true, 5, 5);

  assertHeightFill(1080 - rowHeight);

  assertHeaderCells(5, 0, 4);
  assertRows(5, 0, 4);

  const cells = getCells();
  expect(cells).toHaveLength(5 * 5);
});

test('enableVirtualization is disabled', () => {
  setupGrid(false, 40, 100);

  assertHeightFill(100 * rowHeight);

  assertHeaderCells(40, 0, 39);
  assertRows(100, 0, 99);

  const cells = getCells();
  expect(cells).toHaveLength(40 * 100);
});
