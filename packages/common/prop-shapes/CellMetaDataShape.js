import PropTypes from 'prop-types';

module.exports = {
  rowKey: PropTypes.string.isRequired,
  onCellClick: PropTypes.func.isRequired,
  onCellMouseDown: PropTypes.func.isRequired,
  onCellMouseEnter: PropTypes.func.isRequired,
  onCellContextMenu: PropTypes.func.isRequired,
  onCellDoubleClick: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onRowExpandToggle: PropTypes.func.isRequired,
  onDeleteSubRow: PropTypes.func,
  onAddSubRow: PropTypes.func,
  onColumnEvent: PropTypes.func.isRequired,
  onCellExpand: PropTypes.func.isRequired,
  getCellActions: PropTypes.func
};
