const React = require('react');
require('../../../../themes/react-data-grid-toolbar.css');

const Toolbar = React.createClass({
  propTypes: {
    onAddRow: React.PropTypes.func,
    onToggleFilter: React.PropTypes.func,
    enableFilter: React.PropTypes.bool,
    numberOfRows: React.PropTypes.number,
    addRowButtonText: React.PropTypes.string,
    filterRowsButtonText: React.PropTypes.string,
    children: React.PropTypes.any
  },

  onAddRow() {
    if (this.props.onAddRow !== null && this.props.onAddRow instanceof Function) {
      this.props.onAddRow({newRowIndex: this.props.numberOfRows});
    }
  },

  getDefaultProps() {
    return {
      enableAddRow: true,
      addRowButtonText: 'Add Row',
      filterRowsButtonText: 'Filter Rows'
    };
  },

  renderAddRowButton() {
    if (this.props.onAddRow ) {
      return (<button type="button" className="btn" onClick={this.onAddRow}>
        {this.props.addRowButtonText}
      </button>);
    }
  },

  renderToggleFilterButton() {
    if (this.props.enableFilter) {
      return (<button type="button" className="btn" onClick={this.props.onToggleFilter}>
      {this.props.filterRowsButtonText}
    </button>);
    }
  },

  render() {
    return (
      <div className="react-grid-Toolbar">
        <div className="tools">
          {this.renderAddRowButton()}
          {this.renderToggleFilterButton()}
          {this.props.children}
        </div>
      </div>);
  }
});

module.exports = Toolbar;
