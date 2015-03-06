/* @flow */
/**
* @jsx React.DOM

*/
'use strict';

var React = require('react/addons');
var Row = require('../../Row');

var Toolbar = React.createClass({
  propTypes: {
    onAddRow : React.PropTypes.func,
    onToggleFilter : React.PropTypes.func.isRequired,
    enableFilter : React.PropTypes.bool,
    numberOfRows : React.PropTypes.number.isRequired
  },
  onAddRow(){
    if(this.props.onAddRow){
      this.props.onAddRow({newRowIndex : this.props.numberOfRows});
    }
  },

  getDefaultProps(): {enableAddRow: boolean}{
    return {
      enableAddRow : true
    }
  },

  renderAddRowButton(): ReactElement{
    if(this.props.onAddRow){
      return(<button type="button" className="btn" onClick={this.onAddRow}>
        Add Row
      </button>)
    }
  },

  renderToggleFilterButton(): ReactElement{
    if(this.props.enableFilter){
      return(  <button type="button" className="btn" onClick={this.props.onToggleFilter}>
      Filter Rows
      </button>)
    }
  },

  render(): ?ReactElement{
    return (
      <div className="react-grid-Toolbar">
        <div className="tools">
          {this.renderAddRowButton()}
          {this.renderToggleFilterButton()}
        </div>
      </div>)
      }
});

module.exports = Toolbar;
