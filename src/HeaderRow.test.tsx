import React from 'react';
import { mount } from 'enzyme';

import helpers, { Row } from './test/GridPropHelpers';
import HeaderRow, { HeaderRowProps } from './HeaderRow';
import HeaderCell from './HeaderCell';
import { DEFINE_SORT } from './common/enums';

describe('HeaderRow', () => {
  const defaultProps: HeaderRowProps<Row, 'id'> = {
    rowKey: 'id',
    rows: [],
    scrollLeft: 0,
    columns: helpers.columns,
    lastFrozenColumnIndex: -1,
    onColumnResize() { },
    onGridSort: jest.fn(),
    sortDirection: DEFINE_SORT.NONE,
    width: 1000,
    height: 35,
    allRowsSelected: false,
    onHeaderDrop() { },
    draggableHeaderCell: () => <div />
  };

  const setup = (testProps?: Partial<HeaderRowProps<Row, 'id'>>) => {
    const props: HeaderRowProps<Row, 'id'> = { ...defaultProps, ...testProps };
    const wrapper = mount(<HeaderRow {...props} />);
    const headerCells = wrapper.find(HeaderCell);
    return { wrapper, headerCells, props };
  };

  describe('When column is sortable and headerCellRenderer not provided', () => {
    const sortableColIdx = 1;

    beforeEach(() => {
      defaultProps.columns[sortableColIdx].sortable = true;
      defaultProps.columns[sortableColIdx + 1].sortable = true;
    });

    afterEach(() => {
      defaultProps.columns[sortableColIdx].sortable = false;
      defaultProps.columns[sortableColIdx + 1].sortable = false;
    });

    it('should call onSort when headerRender triggers sort', () => {
      const { wrapper, props } = setup({ sortColumn: defaultProps.columns[sortableColIdx].key, sortDirection: DEFINE_SORT.ASC });
      wrapper.find('.rdg-header-sort-cell').at(0).simulate('click');
      expect(props.onGridSort).toHaveBeenNthCalledWith(1, 'title', 'DESC');

      wrapper.find('.rdg-header-sort-cell').at(1).simulate('click');
      expect(props.onGridSort).toHaveBeenNthCalledWith(2, 'count', 'ASC');
    });
  });

  describe('When column has a headerRenderer', () => {
    const customColumnIdx = 1;
    beforeEach(() => {
      defaultProps.columns[customColumnIdx].headerRenderer = () => <div>Custom</div>;
    });

    it('should render custom column header', () => {
      const { wrapper } = setup();
      expect(wrapper.find('.rdg-cell').at(customColumnIdx).text()).toContain('Custom');
    });

    afterEach(() => {
      defaultProps.columns[customColumnIdx].headerRenderer = undefined;
    });
  });

  describe('Rendering HeaderRow component', () => {
    const renderComponent = (props: HeaderRowProps<Row, 'id'>) => {
      return mount(<HeaderRow {...props} />);
    };

    const requiredProps: HeaderRowProps<Row, 'id'> = {
      rowKey: 'id',
      rows: [],
      scrollLeft: 0,
      width: 1000,
      height: 35,
      columns: helpers.columns,
      lastFrozenColumnIndex: 1,
      onGridSort: jest.fn(),
      allRowsSelected: false,
      onColumnResize: jest.fn(),
      onHeaderDrop() { },
      draggableHeaderCell: () => <div />
    };

    it('passes classname property', () => {
      const wrapper = renderComponent(requiredProps);
      const headerRowDiv = wrapper.find('div').at(0);
      expect(headerRowDiv.hasClass('rdg-header-row')).toBe(true);
    });
    it('does not pass width if not available from props', () => {
      const wrapper = renderComponent(requiredProps);
      const headerRowDiv = wrapper.find('div').at(0);
      expect(headerRowDiv.props().width).toBeUndefined();
    });
    it('does pass the height if available from props', () => {
      const wrapper = renderComponent(requiredProps);
      const headerRowDiv = wrapper.find('div').at(0);
      expect(headerRowDiv.props().style).toStrictEqual({ height: 35, width: 1000 });
    });
  });
});
