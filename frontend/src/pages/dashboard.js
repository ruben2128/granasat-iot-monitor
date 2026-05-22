import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';
import Navbar from "../components/Navbar";
import api from '../lib/api';
import Head from 'next/head';

export default function Dashboard() {
    //useState es para indicar que el valor va a cambiar y cuando cambie, se debe actualizar la pantalla
    //variables entre corchetes porque useState devuelve un array con dos elementos, asi que tenemos que desestructurarlo
    const[usuario, setUsuario] = useState(null);
    const[instalaciones, setInstalaciones] = useState([]);
    const[dispositivos, setDispositivos] = useState([]);
    const[nombre, setNombreInstalacion] = useState('');
    const[codigo, setCodigoInstalacion] = useState('');
    const[descripcion, setDescripcionInstalacion] = useState('');
    const[ubicacion, setUbicacionInstalacion] = useState('');
    const[usuarios, setUsuarios] = useState([]);
    const[responsableId, setResponsableId] = useState('');
    const[alertas, setAlertas] = useState('');
    const[mostrarFormulario, setMostrarFormulario] = useState(false);
    const[error, setError] = useState('');
    const[tipoInstalacion, setTipoInstalacion] = useState('');
    const[direccionInstalacion, setDireccionInstalacion] = useState('');
    const[codigoReferencia, setCodigoReferencia] = useState('');
    const router = useRouter();
    const[espacioDocker, setEspacioDocker] = useState([]);
        const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }

        return 'oscuro'
    });
    const colores = obtenerColores(tema);

    async function handleRegistrarInstalacion(e){
        e.preventDefault();
        try{
            const token = localStorage.getItem('token');
            await api.post('/instalaciones', {nombre, codigo, descripcion, ubicacion, responsable_id: responsableId, tipo_instalacion: tipoInstalacion || null, direccion_instalacion: direccionInstalacion || null, codigo_referencia: codigoReferencia || null}, { headers: { Authorization: `Bearer ${token}` }});
            
            const respuesta = await api.get('/instalaciones', { headers: { Authorization: `Bearer ${token}` } });
            setInstalaciones(respuesta.data.instalaciones);

            setNombreInstalacion('');
            setCodigoInstalacion('');
            setDescripcionInstalacion('');
            setUbicacionInstalacion('');    
            setTipoInstalacion('');
            setDireccionInstalacion('');
            setCodigoReferencia('');
        } catch (err) {
            console.log('Error en el registro de la instalación:', err);
            setError('Error en el registro');
        }  
    }
    
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
            setUsuario((usuarioGuardado));
            const respuestaAlertas = await api.get('/alertas-config', { headers: { Authorization: `Bearer ${token}` } });
            setAlertas(respuestaAlertas.data.alertas);
            
            const respuesta = await api.get('/instalaciones', {headers: {Authorization: `Bearer ${token}`}});
            const instalaciones = respuesta.data.instalaciones;
            const respuestaDispositivos = await api.get('/dispositivos', {headers:  {Authorization: `Bearer ${token}`}});
            const dispositivos = respuestaDispositivos.data.dispositivos;
            if(usuarioGuardado.role === 'ADMIN'){
                const respuestaUsuarios = await api.get('/usuarios', {headers:  {Authorization: `Bearer ${token}`}});
                const usuarios = respuestaUsuarios.data.usuarios;
                const responsables = usuarios.filter(function(u) { return u.role === 'RESPONSABLE'; });
                
                if(responsables.length > 0) {
                    setResponsableId(responsables[0].id);
                }

                setUsuarios(usuarios);

                try{
                    const respuestaDocker = await api.get('/docker/espacio', {headers: {Authorization: `Bearer ${token}`}});
                    setEspacioDocker(respuestaDocker.data.volumenes || []);
                } catch(err){
                    console.log('No se pudo obtener espacio Docker');
                }
            }
            
            setInstalaciones(instalaciones);
            setDispositivos(dispositivos);

        }
        cargarDatos();
    }, []) // [] indica que useEffect se ejecute solo una vez, es decir, cuando el componente se cargue por primera vez

    if(!usuario) {
        return <p>CARGANDO...</p>;
    }

    return (
        <>
            <Head>
                <title>
                    GranaSAT - Dashboard
                </title>
            </Head>

            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario = {usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{padding: '32px 40px'}}>
                    <h1 style={{color:colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>Dashboard</h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        Bienvenido de nuevo, {usuario.nombre}
                    </p>
                    {localStorage.getItem('ultimo_acceso') && (
                        <p style={{color: colores.textoSecundario, fontSize: '12px', margin: '0 0 32px 0'}}>
                            Último acceso: {new Date(localStorage.getItem('ultimo_acceso')).toLocaleString('es-ES', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    )}

                    {/* Tarjetas resumen de alertas e informes */}
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px'}}>
                        <div style={{backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                            <p style={{color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>INSTALACIONES</p>
                            <p style={{color: colores.texto, fontSize: '36px', fontWeight: '700', margin: '0 0 4px 0'}}>{instalaciones.length}</p>
                            <p style={{color: colores.textoSecundario, fontSize: '13px',margin: 0}}>REGISTRADAS</p>
                        </div>
                        <div style={{backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                            <p style={{color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>DISPOSITIVOS</p>
                            <p style={{color: colores.texto, fontSize: '36px', fontWeight: '700', margin: '0 0 4px 0'}}>{dispositivos.length}</p>
                            <p style={{color: colores.textoSecundario, fontSize: '13px',margin: 0}}>REGISTRADOS</p>
                        </div>
                        <div style={{backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                            <p style={{color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>ALERTAS </p>
                            <p style={{color: colores.texto, fontSize: '36px', fontWeight: '700', margin: '0 0 4px 0'}}>{alertas.length}</p>
                            <p style={{color: colores.textoSecundario, fontSize: '13px',margin: 0}}>CONFIGURADAS</p>
                        </div>
                    </div>

                    {/* Lista de instalaciones*/}
                    <div style={{ marginBottom: '24px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                            <h2 style={{color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: 0, borderLeft: `3px solid ${colores.acento} `, paddingLeft: '1px'}}>
                                INSTALACIONES
                            </h2>
                            {usuario.role === 'ADMIN' && (
                                <span onClick={function() {setMostrarFormulario(!mostrarFormulario); }} style={{color: colores.acento, fontSize: '13px', cursor: 'pointer'}}>{mostrarFormulario ? 'x Cancelar' : '+ Nueva Instalación'}</span>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
                            {instalaciones.map(function(instalacion){
                                return (
                                    <div key={instalacion.id} onClick={function() {router.push(`/instalaciones/${instalacion.id}`)}}
                                        style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}`, cursor: 'pointer'}}
                                    >
                                        <p style={{ color: colores.textoSecundario, fontSize: '11px', margin: '0 0 8px 0'}}>{instalacion.codigo}</p>
                                        <p style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0'}}>{instalacion.nombre}</p>
                                        <p style={{ color: colores.textoSecundario, fontSize: '13px', margin: 0}}>{instalacion.ubicacion}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                     {/*Formulario solo para ADMIN*/}
                    { mostrarFormulario && usuario.role === 'ADMIN' && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginTop: '24px'}}>
                            <h2 style={{color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0'}}> 
                                Nueva instalación
                            </h2>
                            <form onSubmit={handleRegistrarInstalacion}>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                    <div>
                                        <label htmlFor="nombre" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            Nombre
                                        </label>
                                        <input id="nombre" type="text" value={nombre} onChange={function(e) {setNombreInstalacion(e.target.value)}} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}} />
                                    </div>
                                <div>
                                    <label htmlFor="codigo" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Código
                                    </label>
                                    <input id="codigo" type="text" value={codigo} onChange={function(e) {setCodigoInstalacion(e.target.value)}} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}} />
                                </div>
                                <div>
                                    <label htmlFor="descripcion" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Descripción
                                    </label>
                                    <input id="descripcion" type="text" value={descripcion} onChange={function(e) {setDescripcionInstalacion(e.target.value)}} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}} />
                                </div>
                                <div>
                                    <label htmlFor="ubicacion" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Ubicación
                                    </label>
                                    <input id="ubicacion" type="text" value={ubicacion} onChange={function(e) {setUbicacionInstalacion(e.target.value)}} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}} />
                                </div>
                                <div>
                                    <label htmlFor="tipo_instalacion" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Tipo de instalación
                                    </label>
                                    <select id="tipo_instalacion" value={tipoInstalacion} onChange={function(e) {setTipoInstalacion(e.target.value)}} style={{width: '100%', backgroundColor: colores.fondo, border: `1px solic ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}>
                                        <option value="">
                                            Seleccionar tipo
                                        </option>
                                        <option value="IRA">
                                            IRA: Instalación Radiactiva Autorizada
                                        </option>
                                        <option value="IRD">
                                            IRD: Instalación de Radiodiagnóstico
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="codigo_referencia" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Código de referencia
                                    </label>
                                    <input id="codigo_referencia" type="text" value={codigoReferencia} onChange={function(e) {setCodigoReferencia(e.target.value)}} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}} />
                                </div>
                                <div style={{gridColumn: '1 / -1'}}>
                                    <label htmlFor="direccion_instalacion" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Dirección
                                    </label>
                                    <input id="direccion_instalacion" type="text" value={direccionInstalacion} onChange={function(e) {setDireccionInstalacion(e.target.value)}} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}} />
                                </div>
                                <div style={{gridColumn: '1 / -1'}}>
                                    <label htmlFor="responsable" style={{color: colores.texto, fontSize: '11px', fontWeight:'600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                        Responsable
                                    </label>
                                    <select id="responsable" value={responsableId} onChange={function(e) { setResponsableId(e.target.value); }} style={{width:'100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}>
                                        {usuarios.filter(function(u){
                                            return u.role === 'RESPONSABLE'
                                        }).map(function(u) {
                                            return (
                                                <option key={u.id} value={u.id}>
                                                    {u.nombre} {u.apellidos}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                </div>
                                {error && <p style={{color: '#e8550a', fontSize: '13px', margin: '0 0 16px 0'}}>
                                    {error}
                                </p>}
                                <div style={{display: 'flex', justifyContent: 'flex-end'}}> 
                                    <button type="submit" style={{backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
                                        Registrar Instalacion
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Espacio docker */}
                    {usuario.role === 'ADMIN' && espacioDocker.length > 0 && (
                        <div style={{ marginTop: '32px'}}>
                            <h2 style = {{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 16px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px'}}>
                                ESPACIO EN DISCO (DOCKER)
                            </h2>
                            <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px'}}>
                                {espacioDocker.map(function (vol,index){
                                    return(
                                        <div key={index} style={{backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`}}>
                                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>
                                                {vol.nombre.toUpperCase()}
                                            </p>
                                            <p style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: 0}}>
                                                {vol.tamanio}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}