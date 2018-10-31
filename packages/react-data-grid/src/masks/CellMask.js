import React from 'react';
import PropTypes from 'prop-types';

const setMaskStyle = ({ left, top, width, height, zIndex, position }) => {
  return {
    height,
    width,
    zIndex,
    position: position || 'absolute',
    pointerEvents: 'none',
    transform: `translate(${left}px, ${top}px)`,
    outline: 0
  };
};

const CellMask = ({ width, height, top, left, zIndex, children, position, innerRef, ...rest }) => (
  <div
    style={setMaskStyle({ left, top, width, height, zIndex, position })}
    data-test="cell-mask"
    ref={innerRef}
    {...rest}
  >
    {children}
  </div>
);

CellMask.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  zIndex: PropTypes.number.isRequired,
  children: PropTypes.node,
  innerRef: PropTypes.func
};

export default CellMask;
