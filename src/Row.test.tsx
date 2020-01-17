/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { shallow } from 'enzyme';

import Row from './Row';
import Cell from './Cell';
import { createColumns } from './test/utils';
import { RowRendererProps } from './common/types';
import EventBus from './EventBus';

type RowType = any;

describe('Row', () => {
  function setup(props: RowRendererProps<RowType>) {
    const wrapper = shallow<typeof Row>(<Row {...props} />);
    const cells = wrapper.find(Cell);
    return { wrapper, cells };
  }

  const requiredProperties: RowRendererProps<RowType> = {
    height: 30,
    width: 1000,
    viewportColumns: createColumns(50),
    row: { key: 'value' },
    cellRenderer: Cell,
    rowIdx: 17,
    scrollLeft: 0,
    lastFrozenColumnIndex: -1,
    isRowSelected: false,
    isSummaryRow: false,
    eventBus: new EventBus()
  };

  it('passes classname property', () => {
    const { wrapper } = setup(requiredProperties);
    const draggableDiv = wrapper.find('div').at(0);
    expect(draggableDiv.hasClass('rdg-row')).toBe(true);
  });

  it('passes style property', () => {
    const { wrapper } = setup(requiredProperties);
    const draggableDiv = wrapper.find('div').at(0);
    expect(draggableDiv.props().style).toBeDefined();
  });
});
