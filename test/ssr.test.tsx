// @vitest-environment node
import { renderToString } from 'react-dom/server';

import DataGrid from '../src';
import type { Column } from '../src';

interface Row {
  id: number;
  title: string;
}

const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID' },
  { key: 'title', name: 'Title' }
];

const rows: readonly Row[] = [
  { id: 0, title: 'Example' },
  { id: 1, title: 'Demo' }
];

function App() {
  return <DataGrid columns={columns} rows={rows} />;
}

test('basic server-side rendering (SSR) support', () => {
  // make sure we're not running in the JSDOM environment
  expect(globalThis.window).toBeUndefined();

  const html = renderToString(<App />);
  expect(html).not.toHaveLength(0);

  // make sure `@testing-library/jest-dom` does not polyfill `window.CSS`
  expect(typeof CSS).toBe('undefined');
});
