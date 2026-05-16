import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../lib/api';
import Navbar from "../../components/Navbar";
import Head from "next/head";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../../lib/temas';


export default function Instalacion(){
    const router = useRouter();
    const{ id } = router.query;
    const[instalacion, setInstalacion] = useState(null);
    const[usuario, setUsuario] = useState(null);
    const[dispositivos, setDispositivos] = useState([]);
    const[nombre, setNombreDispositivo] = useState('');
    const[mac_address, setDireccionMacDispositivo] = useState('');
    const[descripcion, setDescripcionDispositivo] = useState('');
    const[fw_version, setVersionFirmware] = useState('');
    const[hw_version, setVersionHardware] = useState('');
    const[fecha_instalacion, setFechaInstalacion] = useState('');
    const[mostrarFormulario, setMostrarFormulario] = useState(false);
    const[latitud, setLatitud] = useState('');
    const[longitud, setLongitud] = useState('');
    const[altura, setAltura] = useState('');
    const[titulares, setTitulares] = useState([]);
    const[titularId, setTitularId] = useState('');
    const[nivel_bateria, setNivelBateria] = useState('');
    const[error, setError] = useState('');
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }

        return 'oscuro'
    });
    const colores = obtenerColores(tema);
    const[ipRegistro, setIpRegistro] = useState('');
    const[fechaCaducidadIp, setFechaCaducidadIp] = useState('');

    useEffect(function(){
        async function cargarDatos(){
            if(!id)
                return;

            const token = localStorage.getItem('token');
            const usuarioGuardado = localStorage.getItem('usuario');

            setUsuario(JSON.parse(usuarioGuardado));

            if(!token){
                router.push('/');
                return;
            }

            const respuesta = await api.get(`/instalaciones/${id}`, {headers: {Authorization: `Bearer ${token}`}}); 
            setInstalacion(respuesta.data);

            const respuestaDispositivos = await api.get(`/dispositivos?instalacion_id=${id}`, {headers: {Authorization: `Bearer ${token}`}});
            const todos = respuestaDispositivos.data.dispositivos;
            
            const soloDeEstaInstalacion = todos.filter(function(d) {
                return d.instalacion_id === id;
            });
            setDispositivos(soloDeEstaInstalacion);

            const respuestaTitulares = await api.get('/usuarios/titulares', {headers: {Authorization: `Bearer ${token}`}});
            setTitulares(respuestaTitulares.data.titulares);
        }
        cargarDatos();
    }, [id])

    async function handleRegistrarDispositivo(e){
        e.preventDefault();
        try{
            const token = localStorage.getItem('token');
            await api.post('/dispositivos', {nombre, descripcion, mac_address, hw_version, fw_version, fecha_instalacion, instalacion_id: id, latitud: latitud || null, longitud: longitud || longitud, altura: altura || null, nivel_bateria: nivel_bateria ? parseInt(nivel_bateria) : null, titular_id: titularId || null, ip_registro: ipRegistro || null, fecha_caducidad_ip: fechaCaducidadIp || null}, { headers: { Authorization: `Bearer ${token}` }});
            
            const respuestaDispositivos = await api.get(`/dispositivos?instalacion_id=${id}`, {headers: {Authorization: `Bearer ${token}`}});
            const todos = respuestaDispositivos.data.dispositivos;
            
            const soloDeEstaInstalacion = todos.filter(function(d) {
                return d.instalacion_id === id;
            });
            setDispositivos(soloDeEstaInstalacion);

            setNombreDispositivo('');
            setDireccionMacDispositivo('');
            setDescripcionDispositivo('');
            setVersionFirmware('');    
            setVersionHardware('');
        } catch (err) {
            console.log('Error en el registro del dispositivo:', err.response.data);
            setError('Error en el registro del dispositivo');
        }  
    }

    if (!instalacion) {
        return <p>Cargando...</p>;
    }

    function estaActivo(){
        if(instalacion.activa == true){
            return "SI";
        } else {
            return "NO";
        }
    }

    return(
        <>
            <Head>
                <title>
                    GranaSAT - Dispositivo
                </title>
            </Head>

            <div style={{ backgroundColor: colores.fondo , minHeight: '100vh'}}>
                <Navbar usuario = {usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{ padding: '32px 40px'}}>
                    {/* Botón volver */}
                    <button onClick={function() {router.back();}} style={{ background:'none', border: 'none', color: colores.texto, fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0}}>
                        Volver al dashboard
                    </button>

                    {/* Tarjeta de la instalación */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: '1px solid #2c2c2e', marginBottom: '32px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                                <p style={{ color: colores.texto, fontSize: '11px', margin: '0 0 8px 0'}}>{instalacion.codigo}</p>
                                <p style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0'}}>{instalacion.nombre}</p>
                                <p style={{ color: colores.texto, fontSize: '13px', margin: 0}}>{instalacion.ubicacion}</p> 
                                <div style={{ display: 'flex', gap: '32px'}}>
                                    <span style={{color: colores.texto, fontSize: '13px'}}> Ubicación: {instalacion.ubicacion}</span>
                                    <span style={{color: colores.texto, fontSize: '13px'}}> Responsable: {instalacion.responsable.nombre} {instalacion.responsable.apellidos}</span>
                                </div>
                            </div>
                            <span style={{backgroundColor: instalacion.activa ? '#1a3a2a' : '#2a2a2a', color: instalacion.activa ? '#4ade80' : colores.texto, fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px'}}>
                                {instalacion.activa ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h1 style={{color: colores.acento, fontSize: '13px', cursor: 'pointer'}}>
                            DISPOSITIVOS ({dispositivos.length})
                        </h1>

                        { (usuario.role === 'ADMIN' || usuario.role === 'RESPONSABLE') && (
                            <span onClick={function() { setMostrarFormulario(!mostrarFormulario);}} style={{color:colores.acento, fontSize:'13px', cursor: 'pointer'}}>
                                {mostrarFormulario ? 'Cancelar' : '+ Nuevo dispositivo'}
                            </span>
                        )}
                    </div>

                    {/*Formulario para crear un dispositivo nuevo*/}
                    {mostrarFormulario && (usuario.role === 'ADMIN' || usuario.role === 'RESPONSABLE') && (
                        <div style={{backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: '1px solid #2c2c2e', marginBottom: '24px'}}> 
                            <h2 style={{color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0'}}>
                                Nuevo dispositivo
                            </h2>

                            <form onSubmit={handleRegistrarDispositivo}>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                    <div>
                                        <label htmlFor="nombre" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>NOMBRE</label>
                                        <input id="nombre" type="text" value={nombre} onChange={function(e) {setNombreDispositivo(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="direccion_mac" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>DIRECCIÓN MAC</label>
                                        <input id="direccion_mac" type="text" value={mac_address} placeholder="AA:BB:CC:DD:EE:FF" onChange={function(e) {setDireccionMacDispositivo(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="descripcion" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>DESCRIPCIÓN</label>
                                        <input id="descripcion" type="text" value={descripcion} onChange={function(e) {setDescripcionDispositivo(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="fecha_instalacion" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>FECHA DE INSTALACIÓN</label>
                                        <input id="fecha_instalacion" type="date" value={fecha_instalacion} onChange={function(e) {setFechaInstalacion(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="hw_version" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>VERSIÓN DEL HARDWARE</label>
                                        <input id="hw_version" type="text" value={hw_version} onChange={function(e) {setVersionHardware(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="fw_version" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>VERSIÓN DEL FIRMWARE</label>
                                        <input id="fw_version" type="text" value={fw_version} onChange={function(e) {setVersionFirmware(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div style={{girdColumn: '1 / -1'}}>
                                        <label htmlFor="titular" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            TITULAR
                                        </label>
                                        <select id="titular" value={titularId} onChange={function(e) {setTitularId(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}>
                                            <option value ="">
                                                Sin titular asignado
                                            </option>
                                            {titulares.map(function(t){
                                                return (
                                                    <option key={t.id} value={t.id}>
                                                        {t.nombre}{t.apellidos}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="nivel_bateria" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            NIVEL DE BATERÍA (%)
                                        </label>
                                        <input id="nivel_bateria" type="number" min="0" max="100" value={nivel_bateria} onChange={function(e) {setNivelBateria(e.target.value);}} placeholder="0-100" style={{width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="latitud" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            LATITUD
                                        </label>
                                        <input id="latitud" type="number" value={latitud} onChange={function(e) {setLatitud(e.target.value);}} placeholder="Ej: 37.1773" style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="longitud" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            LONGITUD
                                        </label>
                                        <input id="longitud" type="number" value={longitud} onChange={function(e) {setLongitud(e.target.value);}} placeholder="Ej: -3.5986" style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="altura" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            ALTURA
                                        </label>
                                        <input id="altura" type="number" value={altura} onChange={function(e) {setAltura(e.target.value);}} placeholder="Ej: 680" style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>
                                    </div>
                                    <div>
                                        <label htmlFor="ip_registro" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            IP REGISTRO UGR
                                        </label>
                                        <input id="ip_registro" type="text" value={ipRegistro} onChange={function(e) {setIpRegistro(e.target.value);}} placeholder="150.214.X.X" style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>                                        
                                    </div>
                                    <div>
                                        <label htmlFor="fecha_caducidad_ip" style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                                            FECHA CADUCIDAD IP
                                        </label>
                                        <input id="fecha_caducidad_ip" type="date" value={fechaCaducidadIp} onChange={function(e) {setFechaCaducidadIp(e.target.value);}} style={{width: '100%', backgroundColor: colores.fondo, border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box'}}/>                                        
                                    </div>
                                </div>
                                <div style={{display: 'flex', justifyContent:'flex-end'}}>
                                    <button type="submit" style={{backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
                                        Registrar dispositivo
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Lista de dispositivos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        {dispositivos.map(function(dispositivo){
                            return (
                                <div key={dispositivo.id} onClick={function() {router.push(`/dispositivos/${dispositivo.id}`);}} style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '16px 20px', border: '1px solid #2c2c2e', cursor: 'pointer', display: 'flex',  alignItems: 'center', justifyContent: 'space-between'}}>
                                    <div>
                                        <p style={{ color: colores.texto, fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0'}}> {dispositivo.nombre}</p> 
                                        <p style={{ color: colores.texto, fontSize: '12px', margin: 0}}>{dispositivo.mac_address}</p>   
                                    </div> 
                                    <span style={{backgroundColor: dispositivo.activo ? '#1a3a2a' : '#2a2a2a', color: dispositivo.activo ? '#4ade80' : '#a0a0a0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px'}}>
                                        {dispositivo.activo ? 'Activo' : 'No activo'}
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