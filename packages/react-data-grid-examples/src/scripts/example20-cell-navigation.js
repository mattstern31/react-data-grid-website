const ReactDataGrid = require('react-data-grid');
const exampleWrapper = require('../components/exampleWrapper');
const React = require('react');

class Example extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.createRows();
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        frozen: true
      },
      {
        key: 'task',
        name: 'Title',
        width: 200
      },
      {
        key: 'priority',
        name: 'Priority',
        width: 200
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        width: 200
      },
      {
        key: 'complete',
        name: '% Complete',
        width: 200
      },
      {
        key: 'startDate',
        name: 'Start Date',
        width: 200
      },
      {
        key: 'completeDate',
        name: 'Expected Complete',
        width: 200
      }
    ];

    this.state = null;
  }

  getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toLocaleDateString();
  };

  createRows = () => {
    let rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        task: 'Task ' + i,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor((Math.random() * 3) + 1)],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor((Math.random() * 3) + 1)],
        startDate: this.getRandomDate(new Date(2015, 3, 1), new Date()),
        completeDate: this.getRandomDate(new Date(), new Date(2016, 0, 1))
      });
    }

    this._rows = rows;
  };

  rowGetter = (i) => {
    return this._rows[i];
  };

  render() {
    return  (
      <ReactDataGrid
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this._rows.length}
        minHeight={500}
        enableCellSelect={true}
        cellNavigationMode="changeRow" />);
  }
}

const exampleDescription = (
  <div>
    <p>By setting <code>cellNavigationMode = 'loopOverRow'</code>, you enable looping round the same row when navigation goes beyond the first/last cells.</p>
    <p>Setting <code>cellNavigationMode = 'changeRow'</code>, would make the selection jump to the next/previous row.</p>
    <p>The default behavior is to do nothing.</p>
  </div>
);

module.exports = exampleWrapper({
  WrappedComponent: Example,
  exampleName: 'Column Navigation Modes Example',
  exampleDescription,
  examplePath: './scripts/example20-cell-navigation.js',
  examplePlaygroundLink: 'https://jsfiddle.net/f6mbnb8z/7/'
});
