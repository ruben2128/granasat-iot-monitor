import "@/styles/globals.css";

// Versión y fecha de última modificación
const VERSION = 'v1.8';
const FECHA = '14/06/2026';

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