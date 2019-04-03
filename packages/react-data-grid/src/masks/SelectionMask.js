import React from 'react';
import PropTypes from 'prop-types';

import CellMask from './CellMask';

function SelectionMask({ selectedPosition, innerRef, getSelectedDimensions, children }) {
  const dimensions = getSelectedDimensions(selectedPosition, true);
  return (
    <CellMask
      {...dimensions}
      className="rdg-selected"
      innerRef={innerRef}
      tabIndex="0"
    >
      {children}
    </CellMask>
  );
}

SelectionMask.propTypes = {
  selectedPosition: PropTypes.object.isRequired,
  getSelectedDimensions: PropTypes.func.isRequired,
  innerRef: PropTypes.func.isRequired
};

export default SelectionMask;
