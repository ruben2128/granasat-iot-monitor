import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../lib/api';
import Navbar from "../../components/Navbar";
import Head from "next/head";
import {obtenerColores} from '../../lib/temas';

const ZONAS_RADIOLOGICAS = [
    {value: 'LIBRE_PASO', label: 'Libre paso', color: '#a0a0a0'},
    {value: 'VIGILADA', label: 'Zona vigilada', color: '#7b9fc7'},
    {value: 'CONTROLADA', label: 'Zona controlada', color: '#4ade80'},
    {value: 'CONTROLADA_LIMITADA', label: 'Zona controlada: Permanencia limitada', color: '#fbbf24'},
    {value: 'CONTROLADA_REGLAMENTADA', label: 'Zona controlada: Permanencia reglamentada', color: '#f97316'},
    {value: 'ACCESO_PROHIBIDO', label: 'Zona de acceso prohibido', color: '#f87171'},
];

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
    const[marca_comercial, setMarcaComercial] = useState('');
    const[modelo_electronica, setModeloElectronica] = useState('');
    const[num_serie_electronica, setNumSerieElectronica] = useState('');
    const[num_serie_sonda, setNumSerieSonda] = useState('');
    const[tipo_detector, setTipoDetector] = useState('');
    const[calibrado, setCalibrado] = useState(false);
    const[fecha_ultima_calibracion, setFechaUltimaCalibracion] = useState('');
    const[fecha_proxima_calibracion, setFechaProximaCalibracion] = useState('');
    const[verificacion_periodica, setVerificacionPeriodica] = useState(false);
    const[periodicidad_verificacion, setPeriodicidadVerificacion] = useState('');
    const[medida_continuo, setMedidaContinuo] = useState(false);
    const[unidades_medida, setUnidadesMedida] = useState('µSv/h');
    const[factor_correccion, setFactorCorreccion] = useState('1.0');
    const[zona_radiologica, setZonaRadiologica] = useState('');

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
            await api.post('/dispositivos', {
                nombre, 
                descripcion, 
                mac_address, 
                hw_version, 
                fw_version, 
                fecha_instalacion, 
                instalacion_id: id, 
                latitud: latitud || null, 
                longitud: longitud || longitud, 
                altura: altura || null, 
                nivel_bateria: nivel_bateria ? parseInt(nivel_bateria) : null, 
                titular_id: titularId || null, 
                ip_registro: ipRegistro || null, 
                fecha_caducidad_ip: fechaCaducidadIp || null,
                marca_comercial: marca_comercial || null,
                modelo_electronica: modelo_electronica || null,
                num_serie_electronica: num_serie_electronica || null,
                num_serie_sonda: num_serie_sonda || null,
                tipo_detector: tipo_detector || null,
                calibrado,
                fecha_ultima_calibracion: fecha_ultima_calibracion || null,
                fecha_proxima_calibracion: fecha_proxima_calibracion || null,
                verificacion_periodica,
                periodicidad_verificacion: periodicidad_verificacion || null,
                medida_continuo,
                unidades_medida: unidades_medida || 'µSv/h',
                factor_correccion: factor_correccion ? parseFloat(factor_correccion) : 1.0,
                zona_radiologica: zona_radiologica || null,
            }, { headers: { Authorization: `Bearer ${token}` }});
            
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
            setFechaInstalacion(''); 
            setTitularId(''); 
            setNivelBateria(''); 
            setLatitud('');
            setLongitud(''); 
            setAltura(''); 
            setIpRegistro(''); 
            setFechaCaducidadIp('');
            setMarcaComercial(''); 
            setModeloElectronica(''); 
            setNumSerieElectronica('');
            setNumSerieSonda(''); 
            setTipoDetector(''); 
            setCalibrado(false);
            setFechaUltimaCalibracion(''); 
            setFechaProximaCalibracion('');
            setVerificacionPeriodica(false); 
            setPeriodicidadVerificacion('');
            setMedidaContinuo(false); 
            setUnidadesMedida('µSv/h'); 
            setFactorCorreccion('1.0');
            setZonaRadiologica('');
            setMostrarFormulario(false);
        } catch (err) {
            console.log('Error en el registro del dispositivo:', err.response.data);
            setError('Error en el registro del dispositivo');
        }  
    }

    if (!instalacion) {
        return <p>Cargando...</p>;
    }

    // Estilos reutilizables para los inputs
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
        color: colores.texto,
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '1px',
        display: 'block',
        marginBottom: '6px'
    };

    const estiloSeccion = {
        borderTop: `1px solid ${colores.borde}`,
        paddingTop: '20px',
        marginTop: '20px'
    };

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
                                        <label htmlFor="nombre" style={estiloLabel}>NOMBRE</label>
                                        <input id="nombre" type="text" value={nombre} onChange={function(e) {setNombreDispositivo(e.target.value);}} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="direccion_mac" style={estiloLabel}>DIRECCIÓN MAC</label>
                                        <input id="direccion_mac" type="text" value={mac_address} placeholder="AA:BB:CC:DD:EE:FF" onChange={function(e) {setDireccionMacDispositivo(e.target.value);}} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="descripcion" style={estiloLabel}>DESCRIPCIÓN</label>
                                        <input id="descripcion" type="text" value={descripcion} onChange={function(e) {setDescripcionDispositivo(e.target.value);}} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="fecha_instalacion" style={estiloLabel}>FECHA DE INSTALACIÓN</label>
                                        <input id="fecha_instalacion" type="date" value={fecha_instalacion} onChange={function(e) {setFechaInstalacion(e.target.value);}} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="hw_version" style={estiloLabel}>VERSIÓN DEL HARDWARE</label>
                                        <input id="hw_version" type="text" value={hw_version} onChange={function(e) {setVersionHardware(e.target.value);}} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="fw_version" style={estiloLabel}>VERSIÓN DEL FIRMWARE</label>
                                        <input id="fw_version" type="text" value={fw_version} onChange={function(e) {setVersionFirmware(e.target.value);}} style={estiloInput}/>
                                    </div>
                                </div>
                                <div style={estiloSeccion}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{girdColumn: '1 / -1'}}>
                                            <label htmlFor="titular" style={estiloLabel}>
                                                TITULAR
                                            </label>
                                            <select id="titular" value={titularId} onChange={function(e) {setTitularId(e.target.value);}} style={estiloInput}>
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
                                            <label htmlFor="nivel_bateria" style={estiloLabel}>
                                                NIVEL DE BATERÍA (%)
                                            </label>
                                            <input id="nivel_bateria" type="number" min="0" max="100" value={nivel_bateria} onChange={function(e) {setNivelBateria(e.target.value);}} placeholder="0-100" style={estiloInput}/>
                                        </div>
                                        <div>
                                            <label htmlFor="latitud" style={estiloLabel}>
                                                LATITUD
                                            </label>
                                            <input id="latitud" type="number" value={latitud} onChange={function(e) {setLatitud(e.target.value);}} placeholder="Ej: 37.1773" style={estiloInput}/>
                                        </div>
                                        <div>
                                            <label htmlFor="longitud" style={estiloLabel}>
                                                LONGITUD
                                            </label>
                                            <input id="longitud" type="number" value={longitud} onChange={function(e) {setLongitud(e.target.value);}} placeholder="Ej: -3.5986" style={estiloInput}/>
                                        </div>
                                        <div>
                                            <label htmlFor="altura" style={estiloLabel}>
                                                ALTURA
                                            </label>
                                            <input id="altura" type="number" value={altura} onChange={function(e) {setAltura(e.target.value);}} placeholder="Ej: 680" style={estiloInput}/>
                                        </div>
                                        <div>
                                            <label htmlFor="ip_registro" style={estiloLabel}>
                                                IP REGISTRO UGR
                                            </label>
                                            <input id="ip_registro" type="text" value={ipRegistro} onChange={function(e) {setIpRegistro(e.target.value);}} placeholder="150.214.X.X" style={estiloInput}/>                                        
                                        </div>
                                        <div>
                                            <label htmlFor="fecha_caducidad_ip" style={estiloLabel}>
                                                FECHA CADUCIDAD IP
                                            </label>
                                            <input id="fecha_caducidad_ip" type="date" value={fechaCaducidadIp} onChange={function(e) {setFechaCaducidadIp(e.target.value);}} style={estiloInput}/>                                        
                                        </div>
                                    </div>
                                </div>
                                <div style={estiloSeccion}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={estiloLabel}>MARCA COMERCIAL</label>
                                            <input type="text" value={marca_comercial} placeholder="Ej: Ludlum, Thermo Scientific" onChange={function (e) { setMarcaComercial(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div>
                                            <label style={estiloLabel}>MODELO DE LA ELECTRÓNICA</label>
                                            <input type="text" value={modelo_electronica} onChange={function (e) { setModeloElectronica(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div>
                                            <label style={estiloLabel}>Nº SERIE ELECTRÓNICA</label>
                                            <input type="text" value={num_serie_electronica} onChange={function (e) { setNumSerieElectronica(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div>
                                            <label style={estiloLabel}>Nº SERIE SONDA</label>
                                            <input type="text" value={num_serie_sonda} onChange={function (e) { setNumSerieSonda(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={estiloLabel}>
                                                TIPO DE DETECTOR
                                            </label>
                                            <select value={tipo_detector} onChange={function (e) { setTipoDetector(e.target.value); }} style={estiloInput}>
                                                <option value="">
                                                    Seleccionar tipo
                                                </option>
                                                <option value="Centellador NaI(Tl)">
                                                    Centellador NaI(Tl)
                                                </option>
                                                <option value="Cámara de ionización">
                                                    Cámara de ionización
                                                </option>
                                                <option value="Geiger-Müller">
                                                    Geiger-Müller
                                                </option>
                                                <option value="Otro">
                                                    Otro
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div style={estiloSeccion}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="checkbox" id="calibrado" checked={calibrado} onChange={function (e) { setCalibrado(e.target.checked); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            <label htmlFor="calibrado" style={{ ...estiloLabel, margin: 0 }}>EQUIPO CALIBRADO</label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="checkbox" id="verificacion_periodica" checked={verificacion_periodica} onChange={function (e) { setVerificacionPeriodica(e.target.checked); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            <label htmlFor="verificacion_periodica" style={{ ...estiloLabel, margin: 0 }}>VERIFICACIÓN PERIÓDICA</label>
                                        </div>
                                        {calibrado && (
                                            <>
                                                <div>
                                                    <label style={estiloLabel}>FECHA ÚLTIMA CALIBRACIÓN</label>
                                                    <input type="date" value={fecha_ultima_calibracion} onChange={function (e) { setFechaUltimaCalibracion(e.target.value); }} style={estiloInput} />
                                                </div>
                                                <div>
                                                    <label style={estiloLabel}>FECHA PRÓXIMA CALIBRACIÓN</label>
                                                    <input type="date" value={fecha_proxima_calibracion} onChange={function (e) { setFechaProximaCalibracion(e.target.value); }} style={estiloInput} />
                                                </div>
                                            </>
                                        )}
                                        {verificacion_periodica && (
                                            <div>
                                                <label style={estiloLabel}>PERIODICIDAD</label>
                                                <select value={periodicidad_verificacion} onChange={function (e) { setPeriodicidadVerificacion(e.target.value); }} style={estiloInput}>
                                                    <option value="">Seleccionar</option>
                                                    <option value="mensual">Mensual</option>
                                                    <option value="trimestral">Trimestral</option>
                                                    <option value="semestral">Semestral</option>
                                                    <option value="anual">Anual</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={estiloSeccion}>
                                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="checkbox" id="medida_continuo" checked={medida_continuo} onChange={function (e) { setMedidaContinuo(e.target.checked); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                        <label htmlFor="medida_continuo" style={{ ...estiloLabel, margin: 0 }}>EQUIPO DE MEDIDA EN CONTINUO</label>
                                    </div>

                                    {medida_continuo && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={estiloLabel}>UNIDADES DE MEDIDA</label>
                                                <input type="text" value={unidades_medida} onChange={function (e) { setUnidadesMedida(e.target.value); }} style={estiloInput} />
                                            </div>
                                            <div>
                                                <label style={estiloLabel}>FACTOR DE CORRECCIÓN</label>
                                                <input type="number" step="any" value={factor_correccion} onChange={function (e) { setFactorCorreccion(e.target.value); }} style={estiloInput} />
                                                {unidades_medida !== 'µSv/h' && (
                                                    <p style={{ color: '#fbbf24', fontSize: '11px', marginTop: '4px' }}>
                                                        Las unidades no son µSv/h — revisa el factor de corrección
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={estiloLabel}>ZONA RADIOLÓGICA</label>
                                                <select value={zona_radiologica} onChange={function (e) { setZonaRadiologica(e.target.value); }} style={estiloInput}>
                                                    <option value="">Seleccionar zona</option>
                                                    {ZONAS_RADIOLOGICAS.map(function (z) {
                                                        return <option key={z.value} value={z.value}>{z.label}</option>;
                                                    })}
                                                </select>
                                                {zona_radiologica && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                                        {zona_radiologica !== 'LIBRE_PASO' && (
                                                            <img
                                                                src={`/zonas-radiologicas/${zona_radiologica.toLowerCase().replace(/_/g, '-')}.png`}
                                                                width={48}
                                                                height={48}
                                                                alt={ZONAS_RADIOLOGICAS.find(function (z) { return z.value === zona_radiologica; })?.label}
                                                                style={{ borderRadius: '4px' }}
                                                            />
                                                        )}
                                                        <span style={{ color: colores.textoSecundario, fontSize: '12px' }}>
                                                            {ZONAS_RADIOLOGICAS.find(function (z) { return z.value === zona_radiologica; })?.label}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{display: 'flex', justifyContent:'flex-end', paddingTop: '8px'}}>
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