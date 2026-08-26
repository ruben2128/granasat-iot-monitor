import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';
import Navbar from "../components/Navbar";
import Head from "next/head";
import { obtenerColores } from '../lib/temas';

export default function Perfil() {
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [licencias, setLicencias] = useState([]);
    const [instalaciones, setInstalaciones] = useState([]);
    const [tema, setTema] = useState('oscuro');
    const [usuarioPerfil, setUsuarioPerfil] = useState(null);
    const colores = obtenerColores(tema);
    const {id: idQuery} = router.query;

    // Formulario nueva licencia
    const [instalacionId, setInstalacionId] = useState('');
    const [campoAplicacion, setCampoAplicacion] = useState('');
    const [fechaConcesion, setFechaConcesion] = useState('');
    const [fechaCaducidad, setFechaCaducidad] = useState('');
    const [error, setError] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [editNombre, setEditNombre] = useState('');
    const [editApellidos, setEditApellidos] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editTelefonoMovil, setEditTelefonoMovil] = useState('');
    const [editTelefonoFijo, setEditTelefonoFijo] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [nivel, setNivel] = useState('');

    useEffect(function() {
        const temaGuardado = localStorage.getItem('tema');

        if(temaGuardado){
            setTema(temaGuardado);
        }
    }, []);

    useEffect(function() {
        if(!router.isReady){
            return;
        }

        async function cargarDatos() {
            const token = localStorage.getItem('token');

            if(!token) {
                router.push('/'); return; 
            }

            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            
            setUsuario(usuarioGuardado);

            const idObjetivo = idQuery || usuarioGuardado.id;

            if(idQuery && idQuery !== usuarioGuardado.id) {
                const respUsuario = await api.get(`/usuarios/${idQuery}`, { headers: { Authorization: `Bearer ${token}`}});
                
                setUsuarioPerfil(respUsuario.data);
                setEditNombre(respUsuario.data.nombre || '');
                setEditApellidos(respUsuario.data.apellidos || '');
                setEditEmail(respUsuario.data.email || '');
                setEditTelefonoMovil(respUsuario.data.telefono_movil || '');
                setEditTelefonoFijo(respUsuario.data.telefono_fijo || '');
            } else {
                setUsuarioPerfil(usuarioGuardado);
                setEditNombre(usuarioGuardado.nombre || '');
                setEditApellidos(usuarioGuardado.apellidos || '');
                setEditEmail(usuarioGuardado.email || '');
                setEditTelefonoMovil(usuarioGuardado.telefono_movil || '');
                setEditTelefonoFijo(usuarioGuardado.telefono_fijo || '');
            }

            const respLicencias = await api.get(`/usuarios/${idObjetivo}/licencias`, { headers: { Authorization: `Bearer ${token}` }});
            
            setLicencias(respLicencias.data.licencias);

            const respInstalaciones = await api.get('/instalaciones', { headers: { Authorization: `Bearer ${token}` }});
            
            setInstalaciones(respInstalaciones.data.instalaciones);
        }
        cargarDatos();
    }, [idQuery, router.isReady]);

    async function handleCrearLicencia(e) {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const idObjetivo = idQuery || usuario.id;

            await api.post(`/usuarios/${idObjetivo}/licencias`, {
                instalacion_id: instalacionId || null,
                campo_aplicacion: campoAplicacion,
                fecha_concesion: fechaConcesion || null,
                fecha_caducidad: fechaCaducidad || null,
                nivel: nivel || null
            }, { headers: { Authorization: `Bearer ${token}` }});

            const resp = await api.get(`/usuarios/${idObjetivo}/licencias`, { headers: { Authorization: `Bearer ${token}` }});
            
            setLicencias(resp.data.licencias);
            setCampoAplicacion('');
            setInstalacionId('');
            setFechaConcesion('');
            setFechaCaducidad('');
            setNivel('');
            setMostrarFormulario(false);
        } catch(err) {
            setError(err.response?.data?.error || 'Error al crear la licencia');
        }
    }

    async function handleEliminarLicencia(id) {
        if(!confirm('¿Seguro que quieres eliminar esta licencia?'))  {
            return;
        }
            
        try {
            const token = localStorage.getItem('token');
            const idObjetivo = idQuery || usuario.id;

            await api.delete(`/usuarios/${idObjetivo}/licencias/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setLicencias(licencias.filter(function(l) { return l.id !== id; }));
        } catch(err) {
            alert('Error al eliminar la licencia');
        }
    }

    async function handleGuardarPerfil(e) {
        e.preventDefault();
        setGuardando(true);

        try {
            const token = localStorage.getItem('token');
            const idObjetivo = idQuery || usuario.id;

            await api.put(`/usuarios/${idObjetivo}`, {
                nombre: editNombre,
                apellidos: editApellidos,
                email: editEmail,
                telefono_movil: editTelefonoMovil || null,
                telefono_fijo: editTelefonoFijo || null
            }, { headers: { Authorization: `Bearer ${token}` }});

            // Recargar datos
            if(idQuery && idQuery !== usuario.id) {
                const resp = await api.get(`/usuarios/${idQuery}`, { headers: { Authorization: `Bearer ${token}` }});
                
                setUsuarioPerfil(resp.data);
            } else {
                setUsuarioPerfil({...usuarioPerfil, nombre: editNombre, apellidos: editApellidos, email: editEmail, telefono_movil: editTelefonoMovil, telefono_fijo: editTelefonoFijo});
            }

            if(!idQuery || idQuery === usuario.id) {
                const usuarioActualizado = {
                    ...usuario, 
                    nombre: editNombre, 
                    apellidos: editApellidos, 
                    email: editEmail, 
                    telefono_movil: editTelefonoMovil, 
                    telefono_fijo: editTelefonoFijo
                };
                
                localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
                setUsuario(usuarioActualizado);
            }
            setModoEdicion(false);
        } catch(err) {
            setError(err.response?.data?.error || 'Error al guardar los cambios');
        } finally {
            setGuardando(false);
        }
    }

    async function handleSubirFotoPerfil(archivo) {
        if(!archivo) return;

        try {
            const token = localStorage.getItem('token');
            const idObjetivo = idQuery || usuario.id;
            const formData = new FormData();

            formData.append('avatar', archivo);
            
            const respAvatar = await api.post(`/usuarios/${idObjetivo}/avatar`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            setUsuarioPerfil(function(prev) { 
                return {...prev, avatar: respAvatar.data.avatar}; 
            });

            // Si es el propio usuario, actualizar también el localStorage
            if(!idQuery || idQuery === usuario.id) {
                const usuarioActualizado = {...usuario, avatar: respAvatar.data.avatar};
                localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

                setUsuario(usuarioActualizado);
            }
        } catch(err) {
            alert('Error al subir la foto');
        }
    }

    function formatearFecha(fecha) {
        if(!fecha) {
            return '-';
        }
        
        return new Date(fecha).toLocaleDateString('es-ES');
    }

    function obtenerEstadoCaducidad(fecha) {
        if(!fecha) {
            return null;
        }

        const dias = Math.floor((new Date(fecha) - new Date()) / (1000*60*60*24));
        if(dias < 0){ 
            return { color: '#f87171', texto: 'Caducada' };
        }

        if(dias < 30){
            return { color: '#fbbf24', texto: `Caduca en ${dias} días` };
        }

        return { color: '#4ade80', texto: `Válida` };
    }

    if(!usuario){
        return <p>Cargando...</p>;
    }

    const estiloInput = {
        width: '100%',
        backgroundColor: colores.fondo,
        border: `1px solid ${colores.borde}`,
        borderRadius: '8px',
        padding: '10px 12px',
        color: colores.texto,
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const estiloLabel = {
        color: colores.textoSecundario,
        fontSize: '11px',
        fontWeight: '600',
        display: 'block',
        marginBottom: '6px'
    };

    return (
        <>
            <Head><title>GranaSAT - Perfil</title></Head>
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh' }}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores} />
                <main style={{ padding: '32px 40px' }}>
                    <button onClick={function() { router.back(); }} style={{ background: 'none', border: 'none', color: colores.texto, fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
                        Volver
                    </button>

                    {/* Datos del usuario */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', margin: 0, borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px' }}>
                                DATOS DEL USUARIO
                            </h2>
                            {(usuario.role === 'ADMIN' || !idQuery || idQuery === usuario.id) && (
                                <button onClick={function() { setModoEdicion(!modoEdicion); }} style={{ background: 'none', border: `1px solid ${colores.borde}`, color: colores.texto, borderRadius: '8px', padding: '4px 14px', fontSize: '12px', cursor: 'pointer' }}>
                                    {modoEdicion ? 'Cancelar' : 'Editar'}
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ cursor: 'pointer' }} onClick={function() { document.getElementById('foto-perfil-input').click(); }}>
                                {usuarioPerfil?.avatar ? (
                                    <img src={usuarioPerfil.avatar} alt="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colores.borde}` }}/>
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: colores.borde, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colores.textoSecundario, fontSize: '22px', fontWeight: '600' }}>
                                        {usuarioPerfil?.nombre ? usuarioPerfil.nombre.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                                <input id="foto-perfil-input" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={function(e) { handleSubirFotoPerfil(e.target.files[0]); }}/>
                            </div>
                        </div>

                        {modoEdicion ? (
                            <form onSubmit={handleGuardarPerfil}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={estiloLabel}>
                                            NOMBRE
                                        </label>
                                        <input type="text" value={editNombre} onChange={function(e){ setEditNombre(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            APELLIDOS
                                        </label>
                                        <input type="text" value={editApellidos} onChange={function(e){ setEditApellidos(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            EMAIL
                                        </label>
                                        <input type="email" value={editEmail} onChange={function(e){ setEditEmail(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            TELÉFONO MÓVIL
                                        </label>
                                        <input type="text" value={editTelefonoMovil} onChange={function(e){ setEditTelefonoMovil(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            TELÉFONO FIJO
                                        </label>
                                        <input type="text" value={editTelefonoFijo} onChange={function(e){ setEditTelefonoFijo(e.target.value); }} style={estiloInput}/>
                                    </div>
                                </div>
                                {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button type="submit" disabled={guardando} style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {[
                                    { label: 'Nombre', value: `${usuarioPerfil?.nombre || ''} ${usuarioPerfil?.apellidos || ''}` },
                                    { label: 'Username', value: usuarioPerfil?.username },
                                    { label: 'Email', value: usuarioPerfil?.email },
                                    { label: 'Rol', value: usuarioPerfil?.role },
                                    { label: 'Teléfono móvil', value: usuarioPerfil?.telefono_movil },
                                    { label: 'Teléfono fijo', value: usuarioPerfil?.telefono_fijo },
                                ].map(function(item) {
                                    return (
                                        <div key={item.label}>
                                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', margin: '0 0 6px 0' }}>{item.label.toUpperCase()}</p>
                                            <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>{item.value || '-'}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Licencias */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', margin: 0, borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px' }}>
                                LICENCIAS ({licencias.length})
                            </h2>
                            {usuario.role === 'ADMIN' && (
                                <span onClick={function() { setMostrarFormulario(!mostrarFormulario); }} style={{ color: colores.acento, fontSize: '13px', cursor: 'pointer' }}>
                                    {mostrarFormulario ? 'Cancelar' : '+ Nueva licencia'}
                                </span>
                            )}
                        </div>

                        {mostrarFormulario && usuario.role === 'ADMIN' && (
                            <form onSubmit={handleCrearLicencia} style={{ marginBottom: '24px', padding: '20px', border: `1px solid ${colores.borde}`, borderRadius: '8px' }}>
                                {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={estiloLabel}>
                                            CAMPO DE APLICACIÓN
                                        </label>
                                        <input type="text" value={campoAplicacion} onChange={function(e){ setCampoAplicacion(e.target.value); }} required style={estiloInput} placeholder="Ej: Radiodiagnóstico, Radioterapia..." />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={estiloLabel}>
                                            INSTALACIÓN
                                        </label>
                                        <select value={instalacionId} onChange={function(e){ setInstalacionId(e.target.value); }} style={estiloInput}>
                                            <option value="">Sin instalación específica</option>
                                            {instalaciones.map(function(i) {
                                                return <option key={i.id} value={i.id}>{i.nombre}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={estiloLabel}>
                                            NIVEL
                                        </label>
                                        <select value={nivel} onChange={function(e){ setNivel(e.target.value); }} style={estiloInput}>
                                            <option value="">Sin especificar</option>
                                            <option value="OPERADOR">Operador</option>
                                            <option value="SUPERVISOR">Supervisor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            FECHA DE CONCESIÓN
                                        </label>
                                        <input type="date" value={fechaConcesion} onChange={function(e){ setFechaConcesion(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            FECHA DE CADUCIDAD
                                        </label>
                                        <input type="date" value={fechaCaducidad} onChange={function(e){ setFechaCaducidad(e.target.value); }} style={estiloInput} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button type="submit" style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                        Añadir licencia
                                    </button>
                                </div>
                            </form>
                        )}

                        {licencias.length === 0 ? (
                            <p style={{ color: colores.textoSecundario, fontSize: '14px' }}>No hay licencias registradas.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {licencias.map(function(licencia) {
                                    const estado = obtenerEstadoCaducidad(licencia.fecha_caducidad);
                                    return (
                                        <div key={licencia.id} style={{ padding: '16px', border: `1px solid ${colores.borde}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ color: colores.texto, fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0' }}>
                                                    {licencia.campo_aplicacion} {licencia.nivel && `(${licencia.nivel === 'OPERADOR' ? 'Operador' : 'Supervisor'})`} 
                                                </p>
                                                {licencia.instalacion && (
                                                    <p style={{ color: colores.textoSecundario, fontSize: '12px', margin: '0 0 4px 0' }}>
                                                        {licencia.instalacion.nombre}
                                                    </p>
                                                )}
                                                <p style={{ color: colores.textoSecundario, fontSize: '12px', margin: '0 0 4px 0' }}>
                                                    Concesión: {formatearFecha(licencia.fecha_concesion)} — Caducidad: {formatearFecha(licencia.fecha_caducidad)}
                                                </p>
                                                {estado && (
                                                    <span style={{ color: estado.color, fontSize: '12px', fontWeight: '600' }}>
                                                        {estado.texto}
                                                    </span>
                                                )}
                                            </div>
                                            {usuario.role === 'ADMIN' && (
                                                <button onClick={function() { handleEliminarLicencia(licencia.id); }} style={{ background: 'none', border: '1px solid #f87171', color: '#f87171', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}