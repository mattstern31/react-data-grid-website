import React from 'react';
import Viewport from '../Viewport';
import { shallow} from 'enzyme';
import helpers from './GridPropHelpers';

let viewportProps = {
  rowOffsetHeight: 0,
  totalWidth: 400,
  columnMetrics: {
    columns: helpers.columns,
    minColumnWidth: 80,
    totalWidth: 2600,
    width: 2600
  },
  rowGetter: () => { },
  rowsCount: 50,
  rowHeight: 35,
  onScroll: () => { },
  minHeight: 500,
  overScan: {
    colsStart: 5,
    colsEnd: 5,
    rowsStart: 5,
    rowsEnd: 5
  },
  cellMetaData: {
    selected: {},
    dragged: {},
    onCellClick: () => { },
    onCellDoubleClick: () => { },
    onCommit: () => { },
    onCommitCancel: () => { },
    copied: {},
    handleDragEnterRow: () => { },
    handleTerminateDrag: () => { }
  },
  rowKey: 'Id'
};

describe('<Viewport />', () => {
  it('renders a Canvas component', () => {
    const wrapper = shallow(<Viewport {...viewportProps} />);
    let Canvas = wrapper.find('Canvas');
    expect(Canvas).toBeDefined();
  });

  it('should updated scroll state onScroll', () => {
    let scrollLeft = 0;
    let scrollTop = 200;
    const wrapper = shallow(<Viewport {...viewportProps} />);
    let Canvas = wrapper.find('Canvas');
    Canvas.props().onScroll({ scrollTop, scrollLeft});
    expect(wrapper.state()).toEqual({
      colDisplayEnd: 3,
      colDisplayStart: 0,
      colVisibleEnd: 3,
      colVisibleStart: 0,
      displayEnd: 25,
      displayStart: 0,
      height: viewportProps.minHeight,
      scrollLeft: scrollLeft,
      scrollTop: scrollTop,
      visibleEnd: 20,
      visibleStart: 5,
      isScrolling: true
    });
  });
});
