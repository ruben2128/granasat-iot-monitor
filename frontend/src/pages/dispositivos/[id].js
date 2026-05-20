import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../lib/api';
import Navbar from "../../components/Navbar";
import Head from "next/head";
import {obtenerColores} from '../../lib/temas';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";

const ZONAS_RADIOLOGICAS = [
    {value: 'LIBRE_PASO', label: 'Libre paso', color: '#a0a0a0'},
    {value: 'VIGILADA', label: 'Zona vigilada', color: '#7b9fc7'},
    {value: 'CONTROLADA', label: 'Zona controlada', color: '#4ade80'},
    {value: 'CONTROLADA_LIMITADA', label: 'Zona controlada: Permanencia limitada', color: '#fbbf24'},
    {value: 'CONTROLADA_REGLAMENTADA', label: 'Zona controlada: Permanencia reglamentada', color: '#f97316'},
    {value: 'ACCESO_PROHIBIDO', label: 'Zona de acceso prohibido', color: '#f87171'},
];

function obtenerInfoZona(valor){
    return ZONAS_RADIOLOGICAS.find(function (z) {return z.value == valor;}) || null;
}

export default function Dispositivo(){
     const router = useRouter();
    const { id } = router.query;
    const [dispositivo, setDispositivo] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [lecturas, setLecturas] = useState([]);
    const [rango, setRango] = useState('-1h');
    const [testResultado, setTestResultado] = useState(null);
    const [testCargando, setTestCargando] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [tema, setTema] = useState('oscuro');
    const colores = obtenerColores(tema);
    const [editNombre, setEditNombre] = useState('');
    const [editDescripcion, setEditDescripcion] = useState('');
    const [editHwVersion, setEditHwVersion] = useState('');
    const [editFwVersion, setEditFwVersion] = useState('');
    const [editFechaInstalacion, setEditFechaInstalacion] = useState('');
    const [editNotas, setEditNotas] = useState('');
    const [editNivelBateria, setEditNivelBateria] = useState('');
    const [editLatitud, setEditLatitud] = useState('');
    const [editLongitud, setEditLongitud] = useState('');
    const [editAltura, setEditAltura] = useState('');
    const [editIpRegistro, setEditIpRegistro] = useState('');
    const [editFechaCaducidadIp, setEditFechaCaducidadIp] = useState('');
    const [editMarcaComercial, setEditMarcaComercial] = useState('');
    const [editModeloElectronica, setEditModeloElectronica] = useState('');
    const [editNumSerieElectronica, setEditNumSerieElectronica] = useState('');
    const [editNumSerieSonda, setEditNumSerieSonda] = useState('');
    const [editTipoDetector, setEditTipoDetector] = useState('');
    const [editCalibrado, setEditCalibrado] = useState(false);
    const [editFechaUltimaCalibracion, setEditFechaUltimaCalibracion] = useState('');
    const [editFechaProximaCalibracion, setEditFechaProximaCalibracion] = useState('');
    const [editVerificacionPeriodica, setEditVerificacionPeriodica] = useState(false);
    const [editPeriodicidadVerificacion, setEditPeriodicidadVerificacion] = useState('');
    const [editMedidaContinuo, setEditMedidaContinuo] = useState(false);
    const [editUnidadesMedida, setEditUnidadesMedida] = useState('µSv/h');
    const [editFactorCorreccion, setEditFactorCorreccion] = useState('1.0');
    const [editZonaRadiologica, setEditZonaRadiologica] = useState('');

    useEffect(function () {
        const temaGuardado = localStorage.getItem('tema');
        if (temaGuardado) setTema(temaGuardado);
    }, []);
 
    useEffect(function(){
        async function cargarDatos(){
            if(!id)
                return;

            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
            }

            const usuarioGuardado = localStorage.getItem('usuario');
            setUsuario(JSON.parse(usuarioGuardado));

            const respuesta = await api.get(`/dispositivos/${id}`, {headers: {Authorization: `Bearer ${token}`}}); 
            setDispositivo(respuesta.data);

            const d = respuesta.data;
            setDispositivo(d);
 
            setEditNombre(d.nombre || '');
            setEditDescripcion(d.descripcion || '');
            setEditHwVersion(d.hw_version || '');
            setEditFwVersion(d.fw_version || '');
            setEditFechaInstalacion(d.fecha_instalacion || '');
            setEditNotas(d.notas || '');
            setEditNivelBateria(d.nivel_bateria !== null ? String(d.nivel_bateria) : '');
            setEditLatitud(d.latitud !== null ? String(d.latitud) : '');
            setEditLongitud(d.longitud !== null ? String(d.longitud) : '');
            setEditAltura(d.altura !== null ? String(d.altura) : '');
            setEditIpRegistro(d.ip_registro || '');
            setEditFechaCaducidadIp(d.fecha_caducidad_ip || '');
            setEditMarcaComercial(d.marca_comercial || '');
            setEditModeloElectronica(d.modelo_electronica || '');
            setEditNumSerieElectronica(d.num_serie_electronica || '');
            setEditNumSerieSonda(d.num_serie_sonda || '');
            setEditTipoDetector(d.tipo_detector || '');
            setEditCalibrado(d.calibrado || false);
            setEditFechaUltimaCalibracion(d.fecha_ultima_calibracion || '');
            setEditFechaProximaCalibracion(d.fecha_proxima_calibracion || '');
            setEditVerificacionPeriodica(d.verificacion_periodica || false);
            setEditPeriodicidadVerificacion(d.periodicidad_verificacion || '');
            setEditMedidaContinuo(d.medida_continuo || false);
            setEditUnidadesMedida(d.unidades_medida || 'µSv/h');
            setEditFactorCorreccion(d.factor_correccion !== null ? String(d.factor_correccion) : '1.0');
            setEditZonaRadiologica(d.zona_radiologica || '');
 
            const respuestaLecturas = await api.get(`/dispositivos/${id}/lecturas?rango=${rango}`, { headers: { Authorization: `Bearer ${token}` } });
            setLecturas(respuestaLecturas.data.lecturas);
        }
        cargarDatos();
    }, [id, rango]) // Ejecutar cuando id esté disponible

    async function handleTestConexion() {
        setTestCargando(true);
        setTestResultado(null);

        try{
            const token = localStorage.getItem('token');
            const respuesta = await api.get(`/dispositivos/${id}/test`, {headers: {Authorization: `Bearer ${token}`}});

            setTestResultado(respuesta.data);
        } catch (err){
            setTestResultado({ activo: false, mensaje: 'Error al conectar con el servidor'});
        } finally {
            setTestCargando(false);
        }
    }

    async function handleGuardarEdicion(e) {
        e.preventDefault();
        setGuardando(true);
        setErrorEdicion('');
        try {
            const token = localStorage.getItem('token');
            await api.put(`/dispositivos/${id}`, {
                nombre: editNombre,
                descripcion: editDescripcion,
                hw_version: editHwVersion,
                fw_version: editFwVersion,
                fecha_instalacion: editFechaInstalacion || null,
                notas: editNotas,
                nivel_bateria: editNivelBateria ? parseInt(editNivelBateria) : null,
                latitud: editLatitud ? parseFloat(editLatitud) : null,
                longitud: editLongitud ? parseFloat(editLongitud) : null,
                altura: editAltura ? parseFloat(editAltura) : null,
                ip_registro: editIpRegistro || null,
                fecha_caducidad_ip: editFechaCaducidadIp || null,
                marca_comercial: editMarcaComercial || null,
                modelo_electronica: editModeloElectronica || null,
                num_serie_electronica: editNumSerieElectronica || null,
                num_serie_sonda: editNumSerieSonda || null,
                tipo_detector: editTipoDetector || null,
                calibrado: editCalibrado,
                fecha_ultima_calibracion: editFechaUltimaCalibracion || null,
                fecha_proxima_calibracion: editFechaProximaCalibracion || null,
                verificacion_periodica: editVerificacionPeriodica,
                periodicidad_verificacion: editPeriodicidadVerificacion || null,
                medida_continuo: editMedidaContinuo,
                unidades_medida: editUnidadesMedida || 'µSv/h',
                factor_correccion: editFactorCorreccion ? parseFloat(editFactorCorreccion) : 1.0,
                zona_radiologica: editZonaRadiologica || null,
            }, { headers: { Authorization: `Bearer ${token}` } });
            const respuesta = await api.get(`/dispositivos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            
            setDispositivo(respuesta.data);
            setModoEdicion(false);
        } catch (err) {
            setErrorEdicion(err.response?.data?.error || 'Error al guardar los cambios');
        } finally {
            setGuardando(false);
        }
    }

    if (!dispositivo) {
        return <p>Cargando...</p>;
    }

    //Obtener último valor de cara variable
    function ultimoValor(variable){
        const lectura = lecturas.find(function(lectura){return lectura.variable === variable;});
        
        return lectura ? lectura.valor : null;
    }

    //Calcular los días restantes a la caducidad de la IP y establecer un estilo 
    function obtenerEstadoCaducidad(fechaCaducidad){
        if(!fechaCaducidad){
            return null;
        }

        const ahora = new Date();
        const caducidad = new Date(fechaCaducidad);
        const diasRestantes = Math.floor((caducidad - ahora) / (1000*60*60*24));

        if(diasRestantes < 0){
            return {color: '#f87171', texto: `Caducado hace ${Math.abs(diasRestantes)} días`};
        } else if(diasRestantes < 30){
            return {color: '#fbbf24', texto: `Caduca en ${diasRestantes} días`};
        } else {
            return { color: '#4ade80', texto: `Caduca en ${diasRestantes} días`};
        }
    }

    // Solo las lecturas de radiación
    const lecturasRadiacion = lecturas.filter(function(l) { 
        return l.variable === 'radiacion'; 
    });

    // Invertir para que vayan de más antigua a más reciente
    const lecturasOrdenadas = lecturasRadiacion.reverse();

    // Transformar al formato que necesita la gráfica
    const datosRadiacion = lecturasOrdenadas.map(function(lectura) {
        return {
            hora: new Date(lectura.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            valor: parseFloat(lectura.valor.toFixed(2))
        };
    });

    function formatearFecha(fechaISO){
        if(!fechaISO) return '-';
        return new Date(fechaISO).toLocaleString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric',hour: '2-digit',minute: '2-digit'});
    }

    function formatearFechaSolo(fechaISO) {
        if (!fechaISO) return '-';
        return new Date(fechaISO).toLocaleDateString('es-ES');
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
        letterSpacing: '1px',
        display: 'block',
        marginBottom: '6px'
    };
 
    const estiloSeccion = {
        borderTop: `1px solid ${colores.borde}`,
        paddingTop: '20px',
        marginTop: '20px'
    };
 
    const estiloTituloSeccion = {
        color: colores.acento,
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1px',
        margin: '0 0 16px 0',
        borderLeft: `3px solid ${colores.acento}`,
        paddingLeft: '8px'
    };

    const puedeEditar = usuario?.role === 'ADMIN' || usuario?.role === 'RESPONSABLE';
    const zonaInfo = obtenerInfoZona(dispositivo.zona_radiologica);

    return (
        <>
            <Head><title>GranaSAT - {dispositivo.nombre}</title></Head>

            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh' }}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores} />

                <main style={{ padding: '32px 40px' }}>
                    <button onClick={function () { router.back(); }} style={{ background: 'none', border: 'none', color: colores.texto, fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
                        Volver
                    </button>

                    {/* Tarjeta principal */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: colores.textoSecundario, fontSize: '11px', margin: '0 0 8px 0' }}>
                                    {dispositivo.mac_address}
                                </p>
                                <h1 style={{ color: colores.texto, fontSize: '22px', fontWeight: '700', margin: '0 0 8px 0' }}>
                                    {dispositivo.nombre}
                                </h1>
                                <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: 0 }}>
                                    {dispositivo.descripcion}
                                </p>
                                {zonaInfo && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                        {dispositivo.zona_radiologica !== 'LIBRE_PASO' && (
                                            <img 
                                                src={`/zonas-radiologicas/${dispositivo.zona_radiologica.toLowerCase().replace(/_/g, '-')}.png`}
                                                width={48}
                                                height={48}
                                                alt={zonaInfo.label}
                                                style={{ borderRadius:'4px'}}
                                            />
                                        )}
                                        <span style={{ color: zonaInfo.color, fontSize: '12px', fontWeight: '600' }}>{zonaInfo.label}</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                <span style={{ backgroundColor: dispositivo.activo ? '#1a3a2a' : '#2a2a2a', color: dispositivo.activo ? '#4ade80' : '#a0a0a0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
                                    {dispositivo.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                {puedeEditar && (
                                    <button onClick={function () { setModoEdicion(!modoEdicion); setErrorEdicion(''); }} style={{ background: 'none', border: `1px solid ${colores.borde}`, color: colores.texto, borderRadius: '8px', padding: '4px 14px', fontSize: '12px', cursor: 'pointer' }}>
                                        {modoEdicion ? 'Cerrar' : 'Editar'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {modoEdicion && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px' }}>
                            <h2 style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0' }}>Editar dispositivo</h2>

                            {errorEdicion && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{errorEdicion}</p>}

                            <form onSubmit={handleGuardarEdicion}>
                                {/* Datos básicos */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={estiloLabel}>
                                            NOMBRE
                                        </label>
                                        <input type="text" value={editNombre} onChange={function (e) { setEditNombre(e.target.value); }} required style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            DESCRIPCIÓN
                                        </label>
                                        <input type="text" value={editDescripcion} onChange={function (e) { setEditDescripcion(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            VERSIÓN HARDWARE
                                        </label>
                                        <input type="text" value={editHwVersion} onChange={function (e) { setEditHwVersion(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            VERSIÓN FIRMWARE
                                        </label>
                                        <input type="text" value={editFwVersion} onChange={function (e) { setEditFwVersion(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            FECHA DE INSTALACIÓN
                                        </label>
                                        <input type="date" value={editFechaInstalacion} onChange={function (e) { setEditFechaInstalacion(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            NIVEL DE BATERÍA (%)
                                        </label>
                                        <input type="number" min="0" max="100" value={editNivelBateria} onChange={function (e) { setEditNivelBateria(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            LATITUD
                                        </label>
                                        <input type="number" step="any" value={editLatitud} onChange={function (e) { setEditLatitud(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            LONGITUD
                                        </label>
                                        <input type="number" step="any" value={editLongitud} onChange={function (e) { setEditLongitud(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            ALTURA (m)
                                        </label>
                                        <input type="number" step="any" value={editAltura} onChange={function (e) { setEditAltura(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            IP REGISTRO UGR
                                        </label>
                                        <input type="text" value={editIpRegistro} onChange={function (e) { setEditIpRegistro(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>
                                            FECHA CADUCIDAD IP
                                        </label>
                                        <input type="date" value={editFechaCaducidadIp} onChange={function (e) { setEditFechaCaducidadIp(e.target.value); }} style={estiloInput} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={estiloLabel}>
                                            NOTAS
                                        </label>
                                        <textarea value={editNotas} onChange={function (e) { setEditNotas(e.target.value); }} rows={3} style={{ ...estiloInput, resize: 'vertical' }} />
                                    </div>
                                </div>
                                <div style={estiloSeccion}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={estiloLabel}>
                                                MARCA COMERCIAL
                                            </label>
                                            <input type="text" value={editMarcaComercial} placeholder="Ej: Ludlum, Thermo Scientific" onChange={function (e) { setEditMarcaComercial(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div>
                                            <label style={estiloLabel}>
                                                MODELO DE LA ELECTRÓNICA
                                            </label>
                                            <input type="text" value={editModeloElectronica} onChange={function (e) { setEditModeloElectronica(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div>
                                            <label style={estiloLabel}>
                                                Nº SERIE ELECTRÓNICA
                                            </label>
                                            <input type="text" value={editNumSerieElectronica} onChange={function (e) { setEditNumSerieElectronica(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div>
                                            <label style={estiloLabel}>
                                                Nº SERIE SONDA
                                            </label>
                                            <input type="text" value={editNumSerieSonda} onChange={function (e) { setEditNumSerieSonda(e.target.value); }} style={estiloInput} />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={estiloLabel}>TIPO DE DETECTOR</label>
                                            <select value={editTipoDetector} onChange={function (e) { setEditTipoDetector(e.target.value); }} style={estiloInput}>
                                                <option value="">Seleccionar tipo</option>
                                                <option value="Centellador NaI(Tl)">Centellador NaI(Tl)</option>
                                                <option value="Cámara de ionización">Cámara de ionización</option>
                                                <option value="Geiger-Müller">Geiger-Müller</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={estiloSeccion}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="checkbox" id="edit_calibrado" checked={editCalibrado} onChange={function (e) { setEditCalibrado(e.target.checked); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            <label htmlFor="edit_calibrado" style={{ ...estiloLabel, margin: 0 }}>
                                                EQUIPO CALIBRADO
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="checkbox" id="edit_verificacion" checked={editVerificacionPeriodica} onChange={function (e) { setEditVerificacionPeriodica(e.target.checked); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            <label htmlFor="edit_verificacion" style={{ ...estiloLabel, margin: 0 }}>
                                                VERIFICACIÓN PERIÓDICA
                                            </label>
                                        </div>
                                        {editCalibrado && (
                                            <>
                                                <div>
                                                    <label style={estiloLabel}>
                                                        FECHA ÚLTIMA CALIBRACIÓN
                                                    </label>
                                                    <input type="date" value={editFechaUltimaCalibracion} onChange={function (e) { setEditFechaUltimaCalibracion(e.target.value); }} style={estiloInput} />
                                                </div>
                                                <div>
                                                    <label style={estiloLabel}>
                                                        FECHA PRÓXIMA CALIBRACIÓN
                                                    </label>
                                                    <input type="date" value={editFechaProximaCalibracion} onChange={function (e) { setEditFechaProximaCalibracion(e.target.value); }} style={estiloInput} />
                                                </div>
                                            </>
                                        )}
                                        {editVerificacionPeriodica && (
                                            <div>
                                                <label style={estiloLabel}>
                                                    PERIODICIDAD
                                                </label>
                                                <select value={editPeriodicidadVerificacion} onChange={function (e) { setEditPeriodicidadVerificacion(e.target.value); }} style={estiloInput}>
                                                    <option value="">
                                                        Seleccionar
                                                    </option>
                                                    <option value="mensual">
                                                        Mensual
                                                    </option>
                                                    <option value="trimestral">
                                                        Trimestral
                                                    </option>
                                                    <option value="semestral">
                                                        Semestral
                                                    </option>
                                                    <option value="anual">
                                                        Anual
                                                    </option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={estiloSeccion}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <input type="checkbox" id="edit_medida_continuo" checked={editMedidaContinuo} onChange={function (e) { setEditMedidaContinuo(e.target.checked); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                        <label htmlFor="edit_medida_continuo" style={{ ...estiloLabel, margin: 0 }}>
                                            EQUIPO DE MEDIDA EN CONTINUO
                                        </label>
                                    </div>
                                    {editMedidaContinuo && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={estiloLabel}>UNIDADES DE MEDIDA</label>
                                                <input type="text" value={editUnidadesMedida} onChange={function (e) { setEditUnidadesMedida(e.target.value); }} style={estiloInput} />
                                            </div>
                                            <div>
                                                <label style={estiloLabel}>FACTOR DE CORRECCIÓN</label>
                                                <input type="number" step="any" value={editFactorCorreccion} onChange={function (e) { setEditFactorCorreccion(e.target.value); }} style={estiloInput} />
                                                {editUnidadesMedida !== 'µSv/h' && (
                                                    <p style={{ color: '#fbbf24', fontSize: '11px', marginTop: '4px' }}>Las unidades no son µSv/h — revisa el factor de corrección</p>
                                                )}
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={estiloLabel}>ZONA RADIOLÓGICA</label>
                                                <select value={editZonaRadiologica} onChange={function (e) { setEditZonaRadiologica(e.target.value); }} style={estiloInput}>
                                                    <option value="">Seleccionar zona</option>
                                                    {ZONAS_RADIOLOGICAS.map(function (z) {
                                                        return <option key={z.value} value={z.value}>{z.label}</option>;
                                                    })}
                                                </select>
                                                {editZonaRadiologica && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                                        {editZonaRadiologica !== 'LIBRE_PASO' && (
                                                            <img
                                                                src={`/zonas-radiologicas/${editZonaRadiologica.toLowerCase().replace(/_/g, '-')}.png`}
                                                                width={48}
                                                                height={48}
                                                                alt={obtenerInfoZona(editZonaRadiologica)?.label}
                                                                style={{ borderRadius: '4px' }}
                                                            />
                                                        )}
                                                        <span style={{ color: colores.textoSecundario, fontSize: '12px' }}>
                                                            {obtenerInfoZona(editZonaRadiologica)?.label}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                    <button type="submit" disabled={guardando} style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Botón test conexión */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button onClick={handleTestConexion} disabled={testCargando} style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: testCargando ? 'wait' : 'pointer', opacity: testCargando ? 0.7 : 1 }}>
                            {testCargando ? 'Probando...' : 'Test de conexión'}
                        </button>
                        {testResultado && (
                            <span style={{ backgroundColor: testResultado.activo ? '#1a3a2a' : '#3a1a1a', color: testResultado.activo ? '#4ade80' : '#f87171', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px' }}>
                                {testResultado.mensaje}
                            </span>
                        )}
                    </div>

                    {/* Tarjetas de lecturas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}` }}>
                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0' }}>
                                RADIACIÓN ({dispositivo.unidades_medida || 'µSv/h'})
                            </p>
                            <p style={{ color: colores.acento, fontSize: '32px', fontWeight: '700', margin: 0 }}>
                                {ultimoValor('radiacion') !== null ? ultimoValor('radiacion').toFixed(1) : '-'}
                            </p>
                        </div>
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}` }}>
                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0' }}>
                                SUMINISTRO
                            </p>
                            <p style={{ color: ultimoValor('suministro') === 1 ? '#4ade80' : '#a0a0a0', fontSize: '32px', fontWeight: '700', margin: 0 }}>
                                {ultimoValor('suministro') !== null ? (ultimoValor('suministro') === 1 ? 'ON' : 'OFF') : '-'}
                            </p>
                        </div>
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}` }}>
                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0' }}>
                                ELEMENTO ACTIVO
                            </p>
                            <p style={{ color: ultimoValor('elemento_activo') === 1 ? '#4ade80' : '#a0a0a0', fontSize: '32px', fontWeight: '700', margin: 0 }}>
                                {ultimoValor('elemento_activo') !== null ? (ultimoValor('elemento_activo') === 1 ? 'ON' : 'OFF') : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Gráfica */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: 0, borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px' }}>
                                RADIACIÓN ({dispositivo.unidades_medida || 'µSv/h'})
                            </h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['-1h', '-6h', '-24h', '-7d', '-30d'].map(function (r) {
                                    return (
                                        <button key={r} onClick={function () { setRango(r); }} style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${colores.borde}`, cursor: 'pointer', fontSize: '12px', fontWeight: rango === r ? '700' : '400', backgroundColor: rango === r ? colores.acentoBoton : 'transparent', color: rango === r ? 'white' : colores.texto }}>
                                            {r.replace('-', '')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={datosRadiacion}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colores.borde} />
                                <XAxis dataKey="hora" stroke={colores.textoSecundario} fontSize={11} />
                                <YAxis stroke={colores.textoSecundario} fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: colores.tarjeta, border: `1px solid ${colores.borde}`, borderRadius: '8px', color: colores.texto }} />
                                <Line type="monotone" dataKey="valor" stroke={colores.acento} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Información técnica solo lecura */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}` }}>
                        <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 20px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '10px' }}>
                            INFORMACIÓN TÉCNICA
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {[
                                { label: 'Versión hardware', value: dispositivo.hw_version },
                                { label: 'Versión firmware', value: dispositivo.fw_version },
                                { label: 'Última conexión', value: formatearFecha(dispositivo.ultima_conexion) },
                                { label: 'Fecha de instalación', value: formatearFechaSolo(dispositivo.fecha_instalacion) },
                                { label: 'Nivel de batería', value: dispositivo.nivel_bateria !== null ? `${dispositivo.nivel_bateria}%` : '-' },
                                { label: 'IP de registro UGR', value: dispositivo.ip_registro },
                                { label: 'Latitud', value: dispositivo.latitud },
                                { label: 'Longitud', value: dispositivo.longitud },
                                { label: 'Altura (m)', value: dispositivo.altura },
                            ].map(function (item) {
                                return (
                                    <div key={item.label}>
                                        <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                                            {item.label}
                                        </p>
                                        <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>
                                            {item.value || '-'}
                                        </p>
                                    </div>
                                );
                            })}
                            {dispositivo.fecha_caducidad_ip && (
                                <div>
                                    <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                                        CADUCIDAD IP
                                    </p>
                                    <p style={{ color: colores.texto, fontSize: '14px', margin: '0 0 4px 0' }}>
                                        {formatearFechaSolo(dispositivo.fecha_caducidad_ip)}
                                    </p>
                                    <span style={{ color: obtenerEstadoCaducidad(dispositivo.fecha_caducidad_ip)?.color, fontSize: '12px', fontWeight: '600' }}>
                                        {obtenerEstadoCaducidad(dispositivo.fecha_caducidad_ip)?.texto}
                                    </span>
                                </div>
                            )}
                        </div>

                        {(dispositivo.marca_comercial || dispositivo.modelo_electronica || dispositivo.num_serie_electronica || dispositivo.num_serie_sonda || dispositivo.tipo_detector) && (
                            <div style={estiloSeccion}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {[
                                        { label: 'Marca comercial', value: dispositivo.marca_comercial },
                                        { label: 'Modelo electrónica', value: dispositivo.modelo_electronica },
                                        { label: 'Nº serie electrónica', value: dispositivo.num_serie_electronica },
                                        { label: 'Nº serie sonda', value: dispositivo.num_serie_sonda },
                                        { label: 'Tipo de detector', value: dispositivo.tipo_detector },
                                    ].map(function (item) {
                                        return (
                                            <div key={item.label}>
                                                <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>{item.label.toUpperCase()}</p>
                                                <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>{item.value || '-'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(dispositivo.calibrado || dispositivo.verificacion_periodica) && (
                            <div style={estiloSeccion}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                                            ESTADO CALIBRACIÓN
                                        </p>
                                        <span style={{ color: dispositivo.calibrado ? '#4ade80' : '#a0a0a0', fontSize: '14px', fontWeight: '600' }}>
                                            {dispositivo.calibrado ? 'Calibrado' : 'No calibrado'}
                                        </span>
                                    </div>
                                    {dispositivo.calibrado && (
                                        <>
                                            <div>
                                                <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>ÚLTIMA CALIBRACIÓN</p>
                                                <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>{formatearFechaSolo(dispositivo.fecha_ultima_calibracion)}</p>
                                            </div>
                                            <div>
                                                <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>PRÓXIMA CALIBRACIÓN</p>
                                                <p style={{ color: colores.texto, fontSize: '14px', margin: '0 0 4px 0' }}>{formatearFechaSolo(dispositivo.fecha_proxima_calibracion)}</p>
                                                {dispositivo.fecha_proxima_calibracion && (
                                                    <span style={{ color: obtenerEstadoCaducidad(dispositivo.fecha_proxima_calibracion)?.color, fontSize: '12px', fontWeight: '600' }}>
                                                        {obtenerEstadoCaducidad(dispositivo.fecha_proxima_calibracion)?.texto}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {dispositivo.verificacion_periodica && (
                                        <div>
                                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>PERIODICIDAD VERIFICACIÓN</p>
                                            <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>{dispositivo.periodicidad_verificacion || '-'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {dispositivo.medida_continuo && (
                            <div style={estiloSeccion}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>UNIDADES DE MEDIDA</p>
                                        <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>{dispositivo.unidades_medida || 'µSv/h'}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                                            FACTOR DE CORRECCIÓN
                                        </p>
                                        <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>
                                            {dispositivo.factor_correccion || '1.0'}
                                        </p>
                                    </div>
                                    {dispositivo.zona_radiologica && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0' }}>ZONA RADIOLÓGICA</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {dispositivo.zona_radiologica !== 'LIBRE_PASO' && (
                                                    <img
                                                        src={`/zonas-radiologicas/${dispositivo.zona_radiologica.toLowerCase().replace(/_/g, '-')}.png`}
                                                        width={48}
                                                        height={48}
                                                        alt={zonaInfo?.label}
                                                        style={{ borderRadius: '4px' }}
                                                    />
                                                )}
                                                <span style={{ color: zonaInfo?.color, fontSize: '14px', fontWeight: '600' }}>{zonaInfo?.label}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {dispositivo.notas && (
                            <div style={estiloSeccion}>
                                <p style={estiloTituloSeccion}>NOTAS</p>
                                <p style={{ color: colores.texto, fontSize: '14px', margin: 0 }}>{dispositivo.notas}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}