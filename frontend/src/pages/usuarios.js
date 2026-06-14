import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';
import Navbar from "../components/Navbar";
import api from '../lib/api';
import Head from 'next/head';

export default function Usuarios() {
    const[usuario, setUsuario] = useState(null);
    const[usuarios, setUsuarios] = useState([]);
    const[mostrarFormulario, setMostrarFormulario] = useState(false);
    const[error, setError] = useState('');
    const[exito, setExito] = useState('');
    const[username, setUsername] = useState('');
    const[email, setEmail] = useState('');
    const[password, setPassword] = useState('');
    const[role, setRole] = useState('RESPONSABLE');
    const[nombre, setNombre] = useState('');
    const[apellidos, setApellidos] = useState('');
    const[telefonoMovil, setTelefonoMovil] = useState('');
    const[telefonoFijo, setTelefonoFijo] = useState('');
    const[dispositivos, setDispositivos] = useState([]);
    const[instalaciones, setInstalaciones] = useState([]);
    const router = useRouter();
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }

        return 'oscuro'
    });
    const colores = obtenerColores(tema);
    const verdeExito = tema === 'oscuro' ? '#4ade80' : '#15803d';
    
    /*
        useEffect se ejecuta despues de que el componenente se pinte en pantalla
    */
    useEffect(function(){
        async function cargarDatos(){
            const token = localStorage.getItem('token');
            
            if(!token){
                router.push('/');
                return;
            }

            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            
            if(usuarioGuardado.role !== 'ADMIN'){
                router.push('/dashboard');
                return;
            }

            setUsuario(usuarioGuardado);

            const respuestaDispositivos = await api.get('/dispositivos', {headers: {Authorization: `Bearer ${token}`}});
            setDispositivos(respuestaDispositivos.data.dispositivos);

            const respuestaInstalaciones = await api.get('/instalaciones', { headers: { Authorization: `Bearer ${token}` }});
            setInstalaciones(respuestaInstalaciones.data.instalaciones);

            const respuesta = await api.get('/usuarios', {headers: {Authorization: `Bearer ${token}`}});
            setUsuarios(respuesta.data.usuarios);

            console.log('Dispositivos:', respuestaDispositivos.data);

        }
        cargarDatos();
    }, []) 

    async function handleCrearUsuario(e){
        e.preventDefault();
        setError('');
        setExito('');

        try{
            const token = localStorage.getItem('token');
            await api.post('/auth/register', {username, email, password, role, nombre, apellidos, telefono_movil: telefonoMovil, telefono_fijo: telefonoFijo}, {headers: {Authorization: `Bearer ${token}`}});
            
            const respuesta = await api.get('/usuarios', {headers: {Authorization: `Bearer ${token}`}});
            setUsuarios(respuesta.data.usuarios);

            setUsername('');
            setEmail('');
            setPassword('');
            setNombre('');
            setApellidos('');
            setTelefonoFijo('');
            setTelefonoMovil('');
            setMostrarFormulario(false);
            setExito('Usuario creado correctamente');
        
        } catch (err){
            console.log('Error al crear usuario: ', err);
            setError(err.response?.data?.error || 'Error al crear el usuario');
        }
    }

    async function handleCambiarEstadoUsuario(id){
        try{
            const token = localStorage.getItem('token');
            await api.patch(`/usuarios/${id}/estado`, {}, {headers: {Authorization: `Bearer ${token}`}});

            const respuesta  = await api.get('/usuarios', {headers: {Authorization: `Bearer ${token}`}});
            setUsuarios(respuesta.data.usuarios)
        
        } catch(err){
            console.log('Error al cambiar el estado del usuario: ', err);
            setError('Error al cambiar el estado del usuario');
        } 
    }

    async function handleSubirAvatar(id, archivo){
        if(!archivo) 
            return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            formData.append('avatar', archivo);
            await api.post(`/usuarios/${id}/avatar`, formData, {headers: { Authorization: `Bearer ${token}`,'Content-Type': 'multipart/form-data'}});
            
            const respuesta = await api.get('/usuarios', {headers: {Authorization: `Bearer ${token}`}});
            
            setUsuarios(respuesta.data.usuarios);
            setExito('Avatar actualizado correctamente');
        } catch(err){
            setError('Error al subir el avatar');
        }
    }

    if(!usuario) {
        return <p>CARGANDO...</p>;
    }

    const textoSecundarioAccesible = tema === 'oscuro' ? '#a0a0a0' : '#696969';

    return (
        <>
            <Head>
                <title>
                    GranaSAT - Usuarios
                </title>
            </Head>

            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>Usuarios</h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        Gestión de usuarios del sistema
                    </p>

                    {/* Cabecera lista */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                        <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: 0, borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px'}}>
                            USUARIOS ({usuarios.length})
                        </h2>
                        <span onClick={function() { setMostrarFormulario(!mostrarFormulario); setError(''); setExito(''); }} style={{ color: colores.acento, fontSize: '13px', cursor: 'pointer'}}>
                            {mostrarFormulario ? 'x Cancelar' : '+ Nuevo usuario'}
                        </span>
                    </div>

                    {/* Mensaje de éxito */}
                    {exito && (
                        <p style={{ color: verdeExito, fontSize: '13px', margin: '0 0 16px 0'}}>{exito}</p>
                    )}

                    {/* Formulario nuevo usuario */}
                    {mostrarFormulario && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px'}}>
                            <h2 style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0'}}>
                                Nuevo usuario
                            </h2>
                            <form onSubmit={handleCrearUsuario}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                    <div>
                                        <label htmlFor="nombre" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>NOMBRE</label>
                                        <input id="nombre" type="text" value={nombre} onChange={function(e) { setNombre(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="apellidos" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>APELLIDOS</label>
                                        <input id="apellidos" type="text" value={apellidos} onChange={function(e) { setApellidos(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="username" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>USUARIO</label>
                                        <input id="username" type="text" value={username} onChange={function(e) { setUsername(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="email" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>EMAIL</label>
                                        <input id="email" type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="password" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>CONTRASEÑA</label>
                                        <input id="password" type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="telefono_movil" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>TELÉFONO MÓVIL</label>
                                        <input id="telefono_movil" type="text" value={telefonoMovil} onChange={function(e) { setTelefonoMovil(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="telefono_fijo" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>TELÉFONO FIJO</label>
                                        <input id="telefono_fijo" type="text" value={telefonoFijo} onChange={function(e) { setTelefonoFijo(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1'}}>
                                        <label htmlFor="role" style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>ROL</label>
                                        <select id="role" value={role} onChange={function(e) { setRole(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}>
                                            <option value="RESPONSABLE">RESPONSABLE</option>
                                            <option value="TITULAR">TITULAR</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                </div>
                                {error && <p style={{ color: colores.acento, fontSize: '13px', margin: '0 0 16px 0'}}>{error}</p>}
                                <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
                                    <button type="submit" style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
                                        Crear usuario
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Lista de usuarios */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `1px solid ${colores.borde}`}}>
                            <p style={{ margin: 0}}></p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Nombre
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Email
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Rol
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Acción
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Perfil
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Estado
                            </p>
                        </div>
                        {usuarios.map(function(u){
                            return(
                                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '50px 2fr 2fr 1fr 1fr 1fr 1fr', padding: '16px 20px', borderBottom: `1px solid ${colores.borde}`, alignItems: 'center'}}>
                                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={function() { document.getElementById(`avatar-input-${u.id}`).click(); }}>
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.nombre} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover'}}/>
                                        ) : (
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colores.borde, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colores.textoSecundario, fontSize: '14px', fontWeight: '600'}}>
                                                {u.nombre ? u.nombre.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        )}
                                        <input id={`avatar-input-${u.id}`} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none'}} onChange={function(e) { handleSubirAvatar(u.id, e.target.files[0]); }}/>
                                    </div>
                                    <div>
                                        <p style={{ color: colores.texto, fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0'}}>
                                            {u.nombre} {u.apellidos}
                                        </p>
                                        <p style={{ color: textoSecundarioAccesible, fontSize: '12px', margin: 0}}>
                                            {u.username}
                                        </p>
                                        {u.role === 'RESPONSABLE' && (
                                            <p style={{ color: colores.acento, fontSize: '11px', margin: '2px 0 0 0', cursor: 'pointer'}}
                                               onClick={function() { router.push('/mapa'); }}>
                                                {dispositivos.filter(function(d) {
                                                    const instalacion = instalaciones.find(function(i) { return i.id === d.instalacion_id; });
                                                    return instalacion && instalacion.responsable_id === u.id;
                                                }).length} IoT asignados
                                            </p>
                                        )}
                                    </div>
                                    <p style={{ color: colores.texto, fontSize: '13px', margin: 0}}>{u.email}</p>
                                    <span style={{ backgroundColor: colores.fondo, color: textoSecundarioAccesible, fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                        {u.role}
                                    </span>
                                    <button onClick={function() { handleCambiarEstadoUsuario(u.id); }} style={{ backgroundColor: u.activo ? '#2a2a2a' : '#1a3a2a', color: u.activo ? '#a0a0a0' : '#4ade80', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: usuario.id === u.id ? 'not-allowed' : 'pointer', opacity: usuario.id === u.id ? 0.5 : 1 }} disabled={usuario.id === u.id}>
                                        {u.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button onClick={function() {router.push('/perfil?id=' + u.id); }} style={{background: 'none', border: `1px solid ${colores.borde}`, color: colores.texto, fontSize: '12px', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer'}}>
                                        Ver perfil
                                    </button>
                                    <span style={{ backgroundColor: u.activo ? '#1a3a2a' : '#2a2a2a', color: u.activo ? '#4ade80' : '#a0a0a0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', display: 'inline-block'}}>
                                        {u.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </>
    );
}