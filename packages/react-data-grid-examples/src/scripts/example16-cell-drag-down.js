const ReactDataGrid = require('react-data-grid');
const exampleWrapper = require('../components/exampleWrapper');
const React = require('react');

const Example = React.createClass({
  getInitialState() {
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        width: 80
      },
      {
        key: 'task',
        name: 'Title',
        editable: true
      },
      {
        key: 'priority',
        name: 'Priority',
        editable: true
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        editable: true
      }
    ];

    return { rows: this.createRows(1000) };
  },

  createRows(numberOfRows) {
    let rows = [];
    for (let i = 1; i < numberOfRows; i++) {
      rows.push({
        id: i,
        task: 'Task ' + i,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor((Math.random() * 3) + 1)],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor((Math.random() * 3) + 1)]
      });
    }
    return rows;
  },

  rowGetter(i) {
    return this.state.rows[i];
  },

  handleGridRowsUpdated({ fromRow, toRow, updated }) {
    let rows = this.state.rows.slice();

    for (let i = fromRow; i <= toRow; i++) {
      let rowToUpdate = rows[i];
      let updatedRow = React.addons.update(rowToUpdate, {$merge: updated});
      rows[i] = updatedRow;
    }

    this.setState({ rows });
  },

  render() {
    return  (
      <ReactDataGrid
        enableCellSelect={true}
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        minHeight={500}
        onGridRowsUpdated={this.handleGridRowsUpdated} />);
  }
});

const exampleDescription = (
  <div>
    <p>This example demonstrates how you can easily update multiple cells by dragging from the drag handle of an editable cell.</p>
    <p>Alternatively by double clicking on the drag handle, you can update all the cells underneath the active cell.</p>
  </div>);

module.exports = exampleWrapper({
  WrappedComponent: Example,
  exampleName: 'Cell Drag Down Example',
  exampleDescription,
  examplePath: './scripts/example16-cell-drag-down.js',
  examplePlaygroundLink: 'https://jsfiddle.net/f6mbnb8z/4/'
});
