import { createSelector } from 'reselect';
import groupRows from './RowGrouper';
import filterRows from './RowFilterer';
import sortRows from './RowSorter';
import { isEmptyObject, isEmptyArray } from '../utils';

const getInputRows = (state) => state.rows;
const getFilters = (state) => state.filters;
const getFilteredRows = createSelector([getFilters, getInputRows], (filters, rows = []) => {
  if (!filters || isEmptyObject(filters)) {
    return rows;
  }
  return filterRows(filters, rows);
});

const getSortColumn = state => state.sortColumn;
const getSortDirection = state => state.sortDirection;
const getSortedRows = createSelector([getFilteredRows, getSortColumn, getSortDirection], (rows, sortColumn, sortDirection) => {
  if (!sortDirection && !sortColumn) {
    return rows;
  }
  return sortRows(rows, sortColumn, sortDirection);
});

const getGroupedColumns = (state) => state.groupBy;
const getExpandedRows = (state) => state.expandedRows;
const getFlattenedGroupedRows = createSelector([getSortedRows, getGroupedColumns, getExpandedRows], (rows, groupedColumns, expandedRows = {}) => {
  if (!groupedColumns || isEmptyObject(groupedColumns) || isEmptyArray(groupedColumns)) {
    return rows;
  }
  return groupRows(rows, groupedColumns, expandedRows);
});

const getSelectedKeys = (state) => state.selectedKeys;
const getRowKey = (state) => state.rowKey;
const getSelectedRowsByKey = createSelector([getRowKey, getSelectedKeys, getInputRows], (rowKey, selectedKeys, rows = []) => {
  return selectedKeys.map(k => {
    return rows.filter(r => {
      return r[rowKey] === k;
    })[0];
  });
});

export {
  getFlattenedGroupedRows as getRows,
  getSelectedRowsByKey
};
