import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { obtenerColores } from '../lib/temas';

const CLAVES_CONFIG = [
    {
        clave: 'umbral_vigilada',
        label: 'Zona Vigilada',
        descripcion: 'Límite inferior de la zona vigilada',
        color: '#7b9fc7',
        unidad: 'µSv/h'
    },
    {
        clave: 'umbral_controlada',
        label: 'Zona Controlada',
        descripcion: 'Límite inferior de la zona controlada',
        color: '#4ade80',
        unidad: 'µSv/h'
    },
    {
        clave: 'umbral_controlada_limitada',
        label: 'Zona Controlada: Permanencia Limitada',
        descripcion: 'Límite inferior de la zona controlada de permanencia limitada',
        color: '#fbbf24',
        unidad: 'µSv/h'
    },
    {
        clave: 'umbral_controlada_reglamentada',
        label: 'Zona Controlada: Permanencia Reglamentada',
        descripcion: 'Límite inferior de la zona controlada de permanencia reglamentada',
        color: '#f97316',
        unidad: 'µSv/h'
    },
    {
        clave: 'umbral_acceso_prohibido',
        label: 'Zona de Acceso Prohibido',
        descripcion: 'Límite inferior de la zona de acceso prohibido',
        color: '#f87171',
        unidad: 'µSv/h'
    }
];

export default function ConfiguracionPage() {
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [configuracion, setConfiguracion] = useState({});
    const [valores, setValores] = useState({});
    const [exito, setExito] = useState('');
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(null);
    const [tema, setTema] = useState('oscuro');
    const colores = obtenerColores(tema);

    useEffect(function() {
        const temaGuardado = localStorage.getItem('tema');
        if (temaGuardado) setTema(temaGuardado);
    }, []);

    useEffect(function() {
        async function cargarDatos() {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/'); return; }

            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            if (usuarioGuardado?.role !== 'ADMIN') { router.push('/dashboard'); return; }
            setUsuario(usuarioGuardado);

            const respuesta = await api.get('/configuracion', { headers: { Authorization: `Bearer ${token}` } });
            const config = {};
            const vals = {};
            respuesta.data.configuracion.forEach(function(c) {
                config[c.clave] = c;
                vals[c.clave] = c.valor;
            });
            setConfiguracion(config);
            setValores(vals);
        }
        cargarDatos();
    }, []);

    async function handleGuardar(clave) {
        setGuardando(clave);
        setExito('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            await api.put(`/configuracion/${clave}`, { valor: valores[clave] }, { headers: { Authorization: `Bearer ${token}` } });
            setExito(`Umbral actualizado correctamente`);
            setTimeout(function() { setExito(''); }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar');
        } finally {
            setGuardando(null);
        }
    }

    if (!usuario) return <p>Cargando...</p>;

    return (
        <>
            <Head><title>GranaSAT - Configuración</title></Head>
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh' }}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores} />
                <main style={{ padding: '32px 40px' }}>
                    <h1 style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>Configuración</h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0' }}>
                        Umbrales de zonas radiológicas
                    </p>

                    {exito && <p style={{ color: '#4ade80', fontSize: '13px', marginBottom: '16px' }}>{exito}</p>}
                    {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}` }}>
                        <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 20px 0', paddingLeft: '8px' }}>
                            UMBRALES DE ZONAS RADIOLÓGICAS
                        </h2>
                        <p style={{ color: colores.textoSecundario, fontSize: '13px', margin: '0 0 24px 0' }}>
                            Define los límites inferiores de cada zona radiológica en µSv/h. La gráfica de radiación usará estos valores para colorear el fondo según la zona.
                        </p>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            {CLAVES_CONFIG.map(function(item) {
                                return (
                                    <div key={item.clave} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '8px', border: `1px solid ${colores.borde}`, backgroundColor: colores.fondo }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                                                <p style={{ color: colores.texto, fontSize: '14px', fontWeight: '600', margin: 0 }}>{item.label}</p>
                                            </div>
                                            <p style={{ color: colores.textoSecundario, fontSize: '12px', margin: '0 0 12px 0' }}>{item.descripcion}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    value={valores[item.clave] || ''}
                                                    onChange={function(e) {
                                                        setValores(function(prev) {
                                                            const nuevo = { ...prev };
                                                            nuevo[item.clave] = e.target.value;
                                                            return nuevo;
                                                        });
                                                    }}
                                                    style={{ width: '150px', backgroundColor: colores.tarjeta, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '8px 12px', color: colores.texto, fontSize: '14px' }}
                                                />
                                                <span style={{ color: colores.textoSecundario, fontSize: '13px' }}>{item.unidad}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={function() { handleGuardar(item.clave); }}
                                            disabled={guardando === item.clave}
                                            style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: guardando === item.clave ? 'wait' : 'pointer', opacity: guardando === item.clave ? 0.7 : 1, whiteSpace: 'nowrap' }}
                                        >
                                            {guardando === item.clave ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}