import "@/styles/globals.css";
import 'leaflet/dist/leaflet.css';

// Versión y fecha de última modificación — actualizar manualmente en cada commit
const VERSION = 'v1.2.0';
const FECHA = '16/05/2026';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <div style={{
        position: 'fixed',
        bottom: '8px',
        right: '12px',
        fontSize: '11px',
        color: '#666',
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        {VERSION} — {FECHA}
      </div>
    </>
  );
}