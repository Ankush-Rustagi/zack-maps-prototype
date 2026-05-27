import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapProvider } from 'react-map-gl/mapbox';
import './theme.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* MapProvider lets useMap() resolve anywhere in the tree — needed by
        the layout editor which lives outside <Map>. */}
    <MapProvider>
      <App />
    </MapProvider>
  </StrictMode>,
);
