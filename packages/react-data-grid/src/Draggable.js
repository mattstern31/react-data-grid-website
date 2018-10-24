const React         = require('react');
import PropTypes from 'prop-types';
const createObjectWithProperties = require('./createObjectWithProperties');
require('../../../themes/react-data-grid-header.css');

// The list of the propTypes that we want to include in the Draggable div
const knownDivPropertyKeys = ['onDragStart', 'onDragEnd', 'onDrag', 'style'];

class Draggable extends React.Component {
  static propTypes = {
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func,
    onDrag: PropTypes.func,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.constructor]),
    style: PropTypes.object
  };

  static defaultProps = {
    onDragStart: () => true,
    onDragEnd: () => {},
    onDrag: () => {}
  };

  state = {
    drag: null
  };

  componentWillUnmount() {
    this.cleanUp();
  }

  onMouseDown = (e) => {
    let drag = this.props.onDragStart(e);
    if (e.preventDefault) {
      e.preventDefault();
    }

    if (drag === null && e.button !== 0) {
      return;
    }

    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchend', this.onMouseUp);
    window.addEventListener('touchmove', this.onMouseMove);

    this.setState({drag});
  };

  onMouseMove = (e) => {
    if (this.state.drag === null) {
      return;
    }

    if (e.preventDefault) {
      e.preventDefault();
    }

    this.props.onDrag(e);
  };

  onMouseUp = (e) => {
    this.cleanUp();
    this.props.onDragEnd(e, this.state.drag);
    this.setState({drag: null});
  };

  cleanUp = () => {
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchend', this.onMouseUp);
    window.removeEventListener('touchmove', this.onMouseMove);
  };

  getKnownDivProps = () => {
    return createObjectWithProperties(this.props, knownDivPropertyKeys);
  };

  render() {
    return (
      <div {...this.getKnownDivProps()}
        onMouseDown={this.onMouseDown}
        onTouchStart={this.onMouseDown}
        className="react-grid-HeaderCell__draggable" />
    );
  }
}

module.exports = Draggable;
