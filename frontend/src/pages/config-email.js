import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';

export default function ConfigEmail() {
    const router = useRouter();
    const[usuario, setUsuario] = useState(null);
    const[configs, setConfigs] = useState([]);
    const[configActiva, setConfigActiva] = useState(null);
    const[fuente, setFuente] = useState('');
    const[mostrarFormulario, setMostrarFormulario] = useState(false);
    const[nombre, setNombre] = useState('');
    const[smtpHost, setSmtpHost] = useState('');
    const[smtpPort, setSmtpPort] = useState('587');
    const[smtpUser, setSmtpUser] = useState('');
    const[smtpPass, setSmtpPass] = useState('');
    const[smtpSecure, setSmtpSecure] = useState(false);
    const[exito, setExito] = useState('');
    const[error, setError] = useState('');
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }
        return 'oscuro';
    });
    const colores = obtenerColores(tema);
    const verdeExito = tema === 'oscuro' ? '#4ade80' : '#15803d';
    const textoSecundarioAccesible = tema === 'oscuro' ? '#a0a0a0' : '#696969';
    const[emailTest, setEmailTest] = useState('');
    const[testCargando, setTestCargando] = useState(false);
    const[testResultado, setTestResultado] = useState(null);
    const[editandoId, setEditandoId] = useState(null);

    async function cargarDatos(){
        const token = localStorage.getItem('token');
        const respuesta = await api.get('/config-email', { headers: { Authorization: `Bearer ${token}` }});
        setConfigs(respuesta.data.configs);
        setConfigActiva(respuesta.data.configActiva);
        setFuente(respuesta.data.fuente);
    }

    useEffect(function(){
        async function init(){
            const token = localStorage.getItem('token');
            if(!token){ router.push('/'); return; }
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            if(usuarioGuardado.role !== 'ADMIN'){ router.push('/dashboard'); return; }
            setUsuario(usuarioGuardado);
            await cargarDatos();
        }
        init();
    }, []);

    async function handleGuardar(e){
        e.preventDefault();
        setError(''); 
        setExito('');
        try {
            const token = localStorage.getItem('token');
            
            if(editandoId){
                //Editar configuracion existenten
                await api.put(`/config-email/${editandoId}`, {nombre, smtp_host: smtpHost, smtp_port: smtpPort,smtp_user: smtpUser, smtp_pass: smtpPass || undefined, smtp_secure: smtpSecure}, { headers: { Authorization: `Bearer ${token}` }});
                
                setExito('Configuración actualizada correctamente');
            } else {
                //Crear nueva
                await api.post('/config-email', { nombre, smtp_host: smtpHost, smtp_port: smtpPort,smtp_user: smtpUser, smtp_pass: smtpPass, smtp_secure: smtpSecure}, { headers: { Authorization: `Bearer ${token}` }});
                
                setExito('Configuración guardada y activada correctamente');
            }
            
            setMostrarFormulario(false);
            setEditandoId(null);
            setNombre(''); 
            setSmtpHost(''); 
            setSmtpPort('587');
            setSmtpUser(''); 
            setSmtpPass(''); 
            setSmtpSecure(false);
            await cargarDatos();
        } catch(err){
            setError(err.response?.data?.error || 'Error al guardar');
        }
    }

    async function handleActivar(id){
        try {
            const token = localStorage.getItem('token');
            await api.patch(`/config-email/${id}/activar`, {}, { headers: { Authorization: `Bearer ${token}` }});
            setExito('Configuración activada correctamente');
            await cargarDatos();
        } catch(err){
            setError(err.response?.data?.error || 'Error al activar');
        }
    }

    async function handleEliminar(id){
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/config-email/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setExito('Configuración eliminada correctamente');
            await cargarDatos();
        } catch(err){
            setError(err.response?.data?.error || 'Error al eliminar');
        }
    }

    async function handleTestEmail(e){
        e.preventDefault();
        setTestCargando(true);
        setTestResultado(null);
        try {
            const token = localStorage.getItem('token');
            const respuesta = await api.post('/config-email/test', 
                { destinatario: emailTest }, 
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setTestResultado({ ok: true, mensaje: respuesta.data.message });
        } catch(err){
            setTestResultado({ ok: false, mensaje: err.response?.data?.error || 'Error al enviar el email de prueba' });
        } finally {
            setTestCargando(false);
        }
    }

    function handleEditar(config) {
        setEditandoId(config.id);
        setNombre(config.nombre || '');
        setSmtpHost(config.smtp_host);
        setSmtpPort(String(config.smtp_port));
        setSmtpUser(config.smtp_user);
        setSmtpPass(''); // no precargamos la contraseña por seguridad
        setSmtpSecure(config.smtp_secure);
        setMostrarFormulario(true);
        setExito(''); 
        setError('');
    }


    if(!usuario) 
        return <p>Cargando...</p>;

    return (
        <>
            <Head>
                <title>GranaSAT - Configuración de email</title>
            </Head>
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores}/>
                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>Configuración de email</h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        {fuente === 'env' ? 'Usando configuración del archivo .env' : `Configuración activa: ${configActiva?.nombre || configActiva?.smtp_host}`}
                    </p>

                    {exito && <p style={{ color: verdeExito, fontSize: '13px', margin: '0 0 16px 0'}}>{exito}</p>}
                    {error && <p style={{ color: colores.acento, fontSize: '13px', margin: '0 0 16px 0'}}>{error}</p>}

                    {/* Lista de configuraciones */}
                    {configs.length > 0 && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px'}}>
                            <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 16px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px'}}>
                                CONFIGURACIONES GUARDADAS
                            </h2>
                            {configs.map(function(config) {
                                return (
                                    <div key={config.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colores.borde}`}}>
                                        <div>
                                            <p style={{ color: colores.texto, fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0'}}>{config.nombre || config.smtp_host}</p>
                                            <p style={{ color: textoSecundarioAccesible, fontSize: '12px', margin: 0}}>{config.smtp_host}:{config.smtp_port} — {config.smtp_user}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center'}}>
                                            {config.activo ? (
                                                <span style={{ backgroundColor: '#1a3a2a', color: '#4ade80', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px'}}>
                                                    ACTIVA
                                                </span>
                                            ) : (
                                                <button onClick={function() { handleActivar(config.id); }} style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer'}}>
                                                    Activar
                                                </button>
                                            )}
                                            {!config.activo && (
                                                <button onClick={function() { handleEliminar(config.id); }} style={{ backgroundColor: 'transparent', color: '#f87171', border: '1px solid #f87171', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer'}}>
                                                    Eliminar
                                                </button>
                                            )}
                                            <button onClick={function() { handleEditar(config); }} style={{ backgroundColor: 'transparent', color: colores.texto, border: `1px solid ${colores.borde}`, borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer'}}>
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Test de conexión SMTP */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px', maxWidth: '600px'}}>
                        <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 16px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px'}}>
                            TEST DE CONEXIÓN SMTP
                        </h2>
                        <form onSubmit={handleTestEmail} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end'}}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                    EMAIL DESTINATARIO
                                </label>
                                <input 
                                    type="email" 
                                    value={emailTest} 
                                    onChange={function(e){ setEmailTest(e.target.value); }} 
                                    placeholder="tu@email.com" 
                                    required
                                    style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}
                                />
                            </div>
                            <button type="submit" disabled={testCargando} style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: testCargando ? 'wait' : 'pointer', opacity: testCargando ? 0.7 : 1, whiteSpace: 'nowrap'}}>
                                {testCargando ? 'Enviando...' : 'Enviar test'}
                            </button>
                        </form>
                        {testResultado && (
                            <p style={{ color: testResultado.ok ? verdeExito : '#f87171', fontSize: '13px', margin: '12px 0 0 0', fontWeight: '600'}}>
                                {testResultado.ok ? '✓ ' : '✗ '}{testResultado.mensaje}
                            </p>
                        )}
                    </div>

                    {/* Botón nueva configuración */}
                    <div style={{ marginBottom: '16px'}}>
                        <span onClick={function() { setMostrarFormulario(!mostrarFormulario); setEditandoId(null); setExito(''); setError(''); }} style={{ color: colores.acento, fontSize: '13px', cursor: 'pointer'}}>
                            {mostrarFormulario ? 'Cancelar' : 'Nueva configuración'}
                        </span>
                    </div>

                    {/* Formulario nueva configuración */}
                    {mostrarFormulario && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, maxWidth: '600px'}}>
                            <h2 style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0'}}>
                                {editandoId ? 'Editar configuración' : 'Nueva configuración'}
                            </h2>
                            <form onSubmit={handleGuardar}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                    <div style={{ gridColumn: '1 / -1'}}>
                                        <label htmlFor="nombre" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>NOMBRE</label>
                                        <input id="nombre" type="text" value={nombre} onChange={function(e){ setNombre(e.target.value); }} placeholder="Ej: Gmail desarrollo, UGR producción" style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="smtp_host" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>SERVIDOR SMTP</label>
                                        <input id="smtp_host" type="text" value={smtpHost} onChange={function(e){ setSmtpHost(e.target.value); }} placeholder="smtp.ugr.es" style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="smtp_port" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>PUERTO</label>
                                        <input id="smtp_port" type="number" value={smtpPort} onChange={function(e){ setSmtpPort(e.target.value); }} placeholder="587" style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="smtp_user" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>USUARIO</label>
                                        <input id="smtp_user" type="text" value={smtpUser} onChange={function(e){ setSmtpUser(e.target.value); }} placeholder="usuario@ugr.es" style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="smtp_pass" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>CONTRASEÑA</label>
                                        <input id="smtp_pass" type="password" value={smtpPass} onChange={function(e){ setSmtpPass(e.target.value); }} placeholder="••••••••" style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <input id="smtp_secure" type="checkbox" checked={smtpSecure} onChange={function(e){ setSmtpSecure(e.target.checked); }}/>
                                        <label htmlFor="smtp_secure" style={{ color: colores.texto, fontSize: '14px'}}>Conexión segura (TLS)</label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
                                    <button type="submit" style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
                                        {editandoId ? 'Guardar cambios' : 'Guardar y activar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}