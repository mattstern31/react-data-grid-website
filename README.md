# React Data Grid [![npm-badge]][npm-url] [![appveyor-badge]][appveyor-url] [![codecov-badge]][codecov-url]

[npm-badge]: https://img.shields.io/npm/v/react-data-grid/next.svg
[npm-url]: https://www.npmjs.com/package/react-data-grid
[appveyor-badge]: https://img.shields.io/appveyor/ci/adazzle/react-data-grid.svg
[appveyor-url]: https://ci.appveyor.com/project/adazzle/react-data-grid
[codecov-badge]: https://img.shields.io/codecov/c/github/adazzle/react-data-grid/next.svg
[codecov-url]: https://codecov.io/gh/adazzle/react-data-grid

Excel-like grid component built with React, with editors, keyboard navigation, copy &amp; paste, and the like


http://adazzle.github.io/react-data-grid/
![react-data-grid](https://cloud.githubusercontent.com/assets/1432798/7348812/78063bd6-ecec-11e4-89d5-ffd327721cd7.PNG)


Overview
--------
ReactDataGrid is an advanced JavaScript spreadsheet-like grid component built using React

Installation
------------
The easiest way to use react-data-grid is to install it from npm and build it into your app with Webpack.
```sh
npm install react-data-grid
```

You can then import react-data-grid in your application as follows:
```js
import ReactDataGrid from 'react-data-grid';
```

Versions In This Repository
--------

- [master](https://github.com/adazzle/react-data-grid/commits/master) - commits that will be included in the next _minor_ or _patch_ release
- [next](https://github.com/adazzle/react-data-grid/commits/next) - commits that will be included in the next _major_ release (breaking changes)

Most PRs should be made to **master**, unless you know it is a breaking change.

To install the latest **unstable** version, you can run
```sh
npm install react-data-grid@next
```

Themes
------
We use [Bootstrap](https://github.com/twbs/bootstrap). If you want your Grid to get the "default" styling like the picture above, you'll need to include it separately.

```sh
npm install bootstrap
```
and then import the css from the dist folder when bootstrapping your application
```js
import 'bootstrap/dist/css/bootstrap.css';
```

Migrations
--------
If you intend to do a major release update for you react-data-grid check [the migration documents](migrations).

Features
--------

- Lightning fast virtual rendering
- [Can render hundreds of thousands of rows with no lag](http://adazzle.github.io/react-data-grid/#/examples/one-million-rows)
- Keyboard navigation
- [Fully editable grid](http://adazzle.github.io/react-data-grid/#/examples/editable)
- [Rich cell editors like checkbox and dropdown editors, complete with keyboard navigation](http://adazzle.github.io/react-data-grid/#/examples/built-in-editors)
- Custom cell Editors - Easily create your own
- [Custom cell Formatters](http://adazzle.github.io/react-data-grid/#/examples/custom-formatters)
- [Frozen columns](http://adazzle.github.io/react-data-grid/#/examples/frozen-cols)
- [Resizable columns](http://adazzle.github.io/react-data-grid/#/examples/resizable-cols)
- [Sorting](http://adazzle.github.io/react-data-grid/#/examples/sortable-cols)
- [Filtering](http://adazzle.github.io/react-data-grid/#/examples/filterable-sortable-grid)
- [Context Menu](http://adazzle.github.io/react-data-grid/#/examples/context-menu)
- Copy and Paste values into other cells
- [Multiple cell updates using cell dragdown](http://adazzle.github.io/react-data-grid/#/examples/cell-drag-down)
- [Association of events of individual columns](http://adazzle.github.io/react-data-grid/#/examples/column-events)


Contributing
------------

Please see [CONTRIBUTING](CONTRIBUTING.md)

Credits
------------
This project has been built upon the great work done by [Prometheus Research](https://github.com/prometheusresearch). For the original project, please click [here]( https://github.com/prometheusresearch/react-grid). It is released under [MIT](https://github.com/adazzle/react-data-grid/blob/master/LICENSE)
