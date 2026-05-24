import React from 'react';
import { createRoot } from 'react-dom/client';
import AngoraApp from '../AngoraApp.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AngoraApp />
  </React.StrictMode>,
);
