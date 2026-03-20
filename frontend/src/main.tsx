import React from 'react';
import ReactDOM from 'react-dom/client';
import { renderPartRiskGraph } from './PartRiskGraph';

// Dev entry point with mock context
const mockContext = {
  version: '0.1.0',
  host: '',
  api: {
    fetch: (url: string) => fetch(url, { credentials: 'include' }),
  },
  navigate: (url: string) => {
    console.log('Navigate to:', url);
    window.location.href = url;
  },
  user: { username: 'dev' },
  context: {},
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    {renderPartRiskGraph(mockContext as never)}
  </React.StrictMode>
);
