import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../lib/api';
import Navbar from "../../components/Navbar";
import Head from "next/head";
import { temaOscuro, temaClaro } from "@/lib/temas";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dispositivo(){
    const router = useRouter();
    const{ id } = router.query;
    const[dispositivo, setDispositivo] = useState(null);
    const[usuario, setUsuario] = useState([]);
    const[lecturas, setLecturas] = useState([]);
    const[rango, setRango] = useState('-1h');
    const[tema, setTema] = useState(function(){
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }

        return 'oscuro';
    })
    const colores = tema === 'oscuro' ? temaOscuro : temaClaro;

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

            const respuestaLecturas = await api.get(`/dispositivos/${id}/lecturas?rango=${rango}`, {headers: {Authorization: `Bearer ${token}`}});
            setLecturas(respuestaLecturas.data.lecturas);

            console.log('LECTURAS', respuestaLecturas.data.lecturas);
        }
        cargarDatos();
    }, [id, rango]) // Ejecutar cuando id esté disponible

    if (!dispositivo) {
        return <p>Cargando...</p>;
    }

    //Obtener último valor de cara variable
    function ultimoValor(variable){
        const lectura = lecturas.find(function(lectura){return lectura.variable === variable;});
        
        return lectura ? lectura.valor : null;
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

    console.log("DATOS RADIACION", datosRadiacion);

    function formatearFecha(fechaISO){
        if(!fechaISO) return '-';
        return new Date(fechaISO).toLocaleString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric',hour: '2-digit',minute: '2-digit'});
    }

    return(
        <>
            <Head>
                <title>GranaSAT - Dispositivo</title>
            </Head>

            <div style={{backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario = {usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{ padding: '32px 40px'}}>
                    <button onClick={ function() { router.back();}} style={{ background: 'none', border: 'none', color: colores.texto, fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0}}>
                        Volver
                    </button>

                    {/* Tarjeta principal */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px'}}>
                        <div style= {{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                                <p style={{ color: colores.texto, fontSize: '11px', margin: '0 0 8px 0'}}>{dispositivo.mac_address}</p>
                                <h1 style={{color: colores.texto, fontSize: '22px', fontWeight: '700', margin: '0 0 8px 0'}}>{dispositivo.nombre}</h1>
                                <p style={{ color: colores.texto, fontSize: '14px', margin: '0'}}>{dispositivo.descripcion}</p>
                            </div>
                            <span style={{backgroundColor: dispositivo.activo ? '#1a3a2a' : '#2a2a2a', color: dispositivo.activo ? '#4ade80' : '#a0a0a0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px'}}>
                                {dispositivo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>

                    {/*Tarjetas de las lecturas*/}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px'}}>
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}`}}>
                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>RADIACIÓN</p>
                            <p style={{ color: colores.acento, fontSize: '32px', fontWeight: '700', margin: 0}}>
                                {ultimoValor('radiacion') !== null ? ultimoValor('radiacion').toFixed(1) : '-'}
                            </p>
                        </div>
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}`}}>
                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>SUMINISTRO</p>
                            <p style={{ color: ultimoValor('suministro') === 1 ? '#4ade80' : '#a0a0a0', fontSize: '32px', fontWeight: '700', margin: 0}}>
                                {ultimoValor('suministro') !== null ? (ultimoValor('suministro') === 1 ? 'ON' : 'OFF') : '-'}
                            </p>
                        </div>
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px', border: `1px solid ${colores.borde}`}}>
                            <p style={{ color: colores.textoSecundario, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 8px 0'}}>ELEMENTO ACTIVO</p>
                            <p style={{ color: ultimoValor('elemento_activo') === 1 ? '#4ade80' : '#a0a0a0', fontSize: '32px', fontWeight: '700', margin: 0}}>
                                {ultimoValor('elemento_activo') !== null ? (ultimoValor('elemento_activo') === 1 ? 'ON' : 'OFF') : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Gráfica de radiación */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px'}}>                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h2 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: 0, borderLeft: `3px solid ${colores.acento}`, paddingLeft: '8px'}}>
                                RADIACIÓN
                            </h2>
                            <div style={{ display: 'flex', gap: '8px'}}>
                                {['-1h', '-6h', '-24h', '-7d', '-30d'].map(function(r) {
                                    return (
                                        <button key={r} onClick={function() { setRango(r); }} style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${colores.borde}`, cursor: 'pointer', fontSize: '12px', fontWeight: rango === r ? '700' : '400', backgroundColor: rango === r ? colores.acentoBoton : 'transparent', color: rango === r ? 'white' : colores.texto}}>
                                            {r.replace('-', '')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={datosRadiacion}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colores.borde}/>
                                <XAxis dataKey="hora" stroke={colores.textoSecundario} fontSize={11}/>
                                <YAxis stroke={colores.textoSecundario} fontSize={11}/>
                                <Tooltip contentStyle={{ backgroundColor: colores.tarjeta, border: `1px solid ${colores.borde}`, borderRadius: '8px', color: colores.texto}}/>
                                <Line type="monotone" dataKey="valor" stroke={colores.acento} strokeWidth={2} dot={false}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detalles técnicos del dispositivo */}
                    <div style ={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                        <h2 style={{color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 20px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '10px'}}>
                            Información técnica
                        </h2>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>{[
                            {label: 'Versión hardware', value: dispositivo.hw_version},
                            {label: 'Versión firmware', value: dispositivo.fw_version},
                            {label: 'Última conexión', value: formatearFecha(dispositivo.ultima_conexion)},
                            {label: 'Fecha de instalación', value: dispositivo.fecha_instalacion},
                        ].map(function(item) {
                            return (
                                <div key={item.label}> 
                                    <p style={{color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: '0 0 6px 0'}}>{item.label}</p>
                                    <p style={{color: colores.texto, fontSize: '14px', margin: 0}}>{item.value || '-'}</p>
                                </div>
                            )
                            })
                        }
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}