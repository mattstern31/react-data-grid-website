const React          = require('react');
const ReactDOM      = require('react-dom');
const joinClasses    = require('classnames');
import ExcelColumn from 'common/prop-shapes/ExcelColumn';
import columnUtils from './ColumnUtils';
const ResizeHandle   = require('./ResizeHandle');
require('../../../themes/react-data-grid-header.css');

import PropTypes from 'prop-types';

function simpleCellRenderer(objArgs: {column: {name: string}}): ReactElement {
  let headerText = objArgs.column.rowType === 'header' ? objArgs.column.name : '';
  return <div className="widget-HeaderCell__value">{headerText}</div>;
}

class HeaderCell extends React.Component {
  static propTypes = {
    renderer: PropTypes.oneOfType([PropTypes.func, PropTypes.element]).isRequired,
    column: PropTypes.shape(ExcelColumn).isRequired,
    onResize: PropTypes.func.isRequired,
    height: PropTypes.number.isRequired,
    onResizeEnd: PropTypes.func.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    renderer: simpleCellRenderer
  };

  state: {resizing: boolean} = {resizing: false};

  onDragStart = (e: SyntheticMouseEvent) => {
    this.setState({resizing: true});
    // need to set dummy data for FF
    if (e && e.dataTransfer && e.dataTransfer.setData) e.dataTransfer.setData('text/plain', 'dummy');
  };

  onDrag = (e: SyntheticMouseEvent) => {
    let resize = this.props.onResize || null; // for flows sake, doesnt recognise a null check direct
    if (resize) {
      let width = this.getWidthFromMouseEvent(e);
      if (width > 0) {
        resize(this.props.column, width);
      }
    }
  };

  onDragEnd = (e: SyntheticMouseEvent) => {
    let width = this.getWidthFromMouseEvent(e);
    this.props.onResizeEnd(this.props.column, width);
    this.setState({resizing: false});
  };

  getWidthFromMouseEvent = (e: SyntheticMouseEvent): number => {
    let right = e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX) || (e.changedTouches && e.changedTouches[e.changedTouches.length - 1].pageX);
    let left = ReactDOM.findDOMNode(this).getBoundingClientRect().left;
    return right - left;
  };

  getCell = ()=> {
    const {height, column, renderer} = this.props;
    if (React.isValidElement(renderer)) {
      // if it is a string, it's an HTML element, and column is not a valid property, so only pass height
      if (typeof this.props.renderer.type === 'string') {
        return React.cloneElement(renderer, {height});
      }
      return React.cloneElement(renderer, {column, height});
    }
    return this.props.renderer({column});
  };

  getStyle = (): {width:number; left: number; display: string; position: string; overflow: string; height: number; margin: number; textOverflow: string; whiteSpace: string } => {
    return {
      width: this.props.column.width,
      left: this.props.column.left,
      display: 'inline-block',
      position: 'absolute',
      height: this.props.height,
      margin: 0,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };
  };

  setScrollLeft = (scrollLeft: number) => {
    let node = ReactDOM.findDOMNode(this);
    node.style.webkitTransform = `translate3d(${scrollLeft}px, 0px, 0px)`;
    node.style.transform = `translate3d(${scrollLeft}px, 0px, 0px)`;
  };

  removeScroll = () => {
    let node = ReactDOM.findDOMNode(this);
    if (node) {
      let transform = 'none';
      node.style.webkitTransform = transform;
      node.style.transform = transform;
    }
  };

  render(): ?ReactElement {
    let resizeHandle;
    if (this.props.column.resizable) {
      resizeHandle = (<ResizeHandle
      onDrag={this.onDrag}
      onDragStart={this.onDragStart}
      onDragEnd={this.onDragEnd}
      />);
    }
    let className = joinClasses({
      'react-grid-HeaderCell': true,
      'react-grid-HeaderCell--resizing': this.state.resizing,
      'react-grid-HeaderCell--frozen': columnUtils.isFrozen(this.props.column)
    });
    className = joinClasses(className, this.props.className, this.props.column.cellClass);
    let cell = this.getCell();
    return (
      <div className={className} style={this.getStyle()}>
        {cell}
        {resizeHandle}
      </div>
    );
  }
}

module.exports = HeaderCell;
