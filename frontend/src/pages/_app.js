import "@/styles/globals.css";

// Versión y fecha de última modificación
const VERSION = 'v2.0.1';
const FECHA = '26/08/2026';

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