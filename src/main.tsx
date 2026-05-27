import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapProvider } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import MapboxWorker from 'mapbox-gl/dist/mapbox-gl-csp-worker.js?worker';
import './theme.css';
import './styles.css';
import App from './App';

// Required when using the CSP build (see vite.config.ts comment). The CSP
// variant of mapbox-gl ships without dynamic imports inside the worker, so
// we wire the worker manually via Vite's `?worker` import helper. The cast
// is needed because Vite's worker-constructor signature differs from the
// DOM Worker type that @types/mapbox-gl expects.
;(mapboxgl as unknown as { workerClass: unknown }).workerClass = MapboxWorker;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* MapProvider lets useMap() resolve anywhere in the tree — needed by
        the layout editor which lives outside <Map>. */}
    <MapProvider>
      <App />
    </MapProvider>
  </StrictMode>,
);
