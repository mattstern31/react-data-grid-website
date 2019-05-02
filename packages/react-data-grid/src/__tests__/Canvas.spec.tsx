import React from 'react';
import { shallow } from 'enzyme';

import InteractionMasks from '../masks/InteractionMasks';
import Canvas, { Props } from '../Canvas';
import RowsContainer from '../RowsContainer';
import EventBus from '../masks/EventBus';
import { CellNavigationMode } from '../common/enums';

const noop = () => null;
const getRows = (wrp: ReturnType<typeof renderComponent>) => wrp.find(RowsContainer).props().children.props.children;

const testProps: Props = {
  rowKey: 'row',
  rowHeight: 25,
  height: 200,
  rowOverscanStartIdx: 1,
  rowOverscanEndIdx: 10,
  rowVisibleStartIdx: 0,
  rowVisibleEndIdx: 10,
  colVisibleStartIdx: 0,
  colVisibleEndIdx: 100,
  colOverscanStartIdx: 0,
  colOverscanEndIdx: 100,
  rowsCount: 1,
  columns: [],
  rowGetter() { return []; },
  cellMetaData: {
    rowKey: 'row',
    onCellClick() {},
    onCellContextMenu() {},
    onCellDoubleClick() {},
    onDragEnter() {},
    onCellExpand() {},
    onRowExpandToggle() {}
  },
  interactionMasksMetaData: {
    onCommit() {},
    onGridRowsUpdated: noop,
    onDragHandleDoubleClick: noop
  },
  isScrolling: false,
  length: 1000,
  enableCellSelect: true,
  enableCellAutoFocus: false,
  cellNavigationMode: CellNavigationMode.NONE,
  eventBus: new EventBus(),
  editorPortalTarget: document.body,
  totalColumnWidth: 1000,
  onScroll() {},
  RowsContainer: RowsContainer as Props['RowsContainer']
};

function renderComponent(extraProps?: Partial<Props>) {
  return shallow<Canvas>(<Canvas {...testProps} {...extraProps} />);
}

describe('Canvas Tests', () => {
  it('Should not call setScroll on render', () => {
    const wrapper = renderComponent();
    const testElementNode = wrapper.instance();

    jest.spyOn(testElementNode, 'setScrollLeft').mockImplementation(() => { });
    expect(testElementNode.setScrollLeft).not.toHaveBeenCalled();
  });

  it('Should not call setScroll on update', () => {
    const wrapper = renderComponent();
    const testElementNode = wrapper.instance();

    jest.spyOn(testElementNode, 'setScrollLeft').mockImplementation(() => { });
    testElementNode.componentDidUpdate(testProps);
    expect(testElementNode.setScrollLeft).not.toHaveBeenCalled();
  });

  it('Should render the InteractionMasks component', () => {
    const wrapper = renderComponent();

    expect(wrapper.find(InteractionMasks).props()).toMatchObject({
      rowHeight: 25,
      rowsCount: 1,
      rowVisibleStartIdx: 0,
      rowVisibleEndIdx: 10,
      colVisibleStartIdx: 0,
      colVisibleEndIdx: 100
    });
  });

  describe('Row Selection', () => {
    const COLUMNS = [{ key: 'id', name: 'ID', idx: 0, width: 100, left: 100 }];

    describe('selectBy index', () => {
      it('renders row selected', () => {
        const rowGetter = () => { return { id: 1 }; };

        const props = { rowOverscanStartIdx: 0, rowOverscanEndIdx: 1, COLUMNS, rowGetter, rowsCount: 1, rowSelection: { indexes: [0] } };
        const wrapper = renderComponent(props);

        const rows = getRows(wrapper);
        expect(rows[0].props.isSelected).toBe(true);
      });
    });

    describe('selectBy keys', () => {
      it('renders row selected', () => {
        const rowGetter = () => ({ id: 1 });

        const props = { rowOverscanStartIdx: 0, rowOverscanEndIdx: 1, COLUMNS, rowGetter, rowsCount: 1, rowSelection: { keys: { rowKey: 'id', values: [1] } } };
        const wrapper = renderComponent(props);

        const rows = getRows(wrapper);
        expect(rows[0].props.isSelected).toBe(true);
      });
    });


    describe('selectBy `isSelectedKey`', () => {
      it('renders row selected', () => {
        const rowGetter = (i: number) => i === 0 ? { id: 1, isSelected: true } : {};

        const props = { rowOverscanStartIdx: 0, rowOverscanEndIdx: 1, COLUMNS, rowGetter, rowsCount: 1, rowSelection: { isSelectedKey: 'isSelected' } };
        const wrapper = renderComponent(props);

        const rows = getRows(wrapper);
        expect(rows[0].props.isSelected).toBe(true);
      });
    });
  });

  describe('Tree View', () => {
    const COLUMNS = [{ idx: 0, key: 'id', name: 'ID', width: 100, left: 100 }];

    it('can render a custom renderer if __metadata property exists', () => {
      const EmptyChildRow = (props: unknown, rowIdx: number) => {
        return <div key={rowIdx} className="test-row-renderer" />;
      };

      const rowGetter = () => ({
        id: 0,
        __metaData: {
          isGroup: false,
          treeDepth: 0,
          isExpanded: false,
          columnGroupName: 'colgroup',
          columnGroupDisplayName: 'ColGroup',
          getRowRenderer: EmptyChildRow
        }
      });

      const props = {
        rowOverscanStartIdx: 0,
        rowOverscanEndIdx: 1,
        columns: COLUMNS,
        rowGetter,
        rowsCount: 1,
        getSubRowDetails() {
          return {
            canExpand: false,
            field: 'field',
            expanded: false,
            children: [
              { id: 'row1-0' },
              { id: 'row1-1' }
            ],
            treeDepth: 1,
            siblingIndex: 1,
            numberSiblings: 2
          };
        }
      };

      const wrapper = renderComponent(props);
      const rows = getRows(wrapper);
      expect(rows[0].props.className).toBe('test-row-renderer');
    });
  });
});
