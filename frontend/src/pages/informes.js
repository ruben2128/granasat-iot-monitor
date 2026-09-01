import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';
import Navbar from "../components/Navbar";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';
import Head from "next/head";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Informes(){
    const router = useRouter();
    const { id } = router.query;
    const [informes, setInformes] = useState([]);
    const [instalaciones, setInstalaciones] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [usuario, setUsuario] = useState([]);
    const [instalacionId, setInstalacionId] = useState('');
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }

        return 'oscuro'
    });
    const colores = obtenerColores(tema);

    useEffect(function(){
        async function cargarDatos(){

            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
                return;
            }

            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            setUsuario(usuarioGuardado);

            const respuestaInformes = await api.get('/informes', {headers: {Authorization: `Bearer ${token}`}});
            setInformes(respuestaInformes.data.informes);

            //Solo los administradores pueden generar un informe
            if(usuarioGuardado.role === 'ADMIN'){
                const respuestaInstalaciones = await api.get('/instalaciones', {headers: {Authorization: `Bearer ${token}`}});
                setInstalaciones(respuestaInstalaciones.data.instalaciones);
            }
        }
        cargarDatos();
    }, [])

    async function handleGenerarInforme(e) {
        e.preventDefault();
        setError('');
        setExito('');

        if (!instalacionId) {
            setError('Selecciona una instalacion');
            return;
        }

        setGenerando(true);
        try {
            const token = localStorage.getItem('token');
            const respuesta = await api.post('/informes/generar',
                { instalacion_id: instalacionId, mes: parseInt(mes), anio: parseInt(anio) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setExito(`Informe de ${MESES[mes - 1]} ${anio} generado correctamente`);
            setMostrarFormulario(false);

            // Recargar la lista
            const respuestaInformes = await api.get('/informes', { headers: { Authorization: `Bearer ${token}` } });
            setInformes(respuestaInformes.data.informes);

            // Descargar automaticamente el informe recien generado
            const informeGenerado = respuestaInformes.data.informes.find(function(i) {
                return i.mes === parseInt(mes) && i.anio === parseInt(anio) && i.instalacion_id === instalacionId;
            });

            if (informeGenerado) {
                handleDescargar(informeGenerado);
            }

        } catch (err) {
            setError(err.response?.data?.error || 'Error al generar el informe');
        } finally {
            setGenerando(false);
        }
    }

    async function handleDescargar(informe) {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/informes/${informe.id}/descargar`, {headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'});
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', `informe_${informe.mes}_${informe.anio}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Error al descargar el informe');
        }
    }

    if (!informes) {
        return <p>Cargando...</p>;
    }

    return(
        <>  
            <Head>
                <title>GranaSAT - Informes</title>
            </Head>

            <div style={{backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario = {usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{ padding: '32px 40px'}}>
                    {/* Cabecera */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h1 style={{ color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: 0, paddingLeft: '10px' }}>
                            INFORMES MENSUALES ({informes.length})
                        </h1>
                        {usuario.role === 'ADMIN' && (
                            <span onClick={function () { setMostrarFormulario(!mostrarFormulario); setError(''); setExito(''); }} style={{ color: colores.acento, fontSize: '13px', cursor: 'pointer' }}>
                                {mostrarFormulario ? 'Cancelar' : 'Generar informe'}
                            </span>
                        )}
                    </div>

                    {/* Mensajes */}
                    {exito && 
                        <p style={{ color: '#4ade80', fontSize: '13px', margin: '0 0 16px 0' }}>
                            {exito}
                        </p>
                    }
                    {error && 
                        <p style={{ color: colores.acento, fontSize: '13px', margin: '0 0 16px 0' }}>
                            {error}
                        </p>
                    }

                    {/* Formulario de generacion */}
                    {mostrarFormulario && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, marginBottom: '24px' }}>
                            <h2 style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0' }}>
                                Generar nuevo informe
                            </h2>
                            <form onSubmit={handleGenerarInforme}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                            INSTALACION
                                        </label>
                                        <select value={instalacionId} onChange={function (e) { setInstalacionId(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box' }}>
                                            <option value="">Selecciona una instalacion</option>
                                            {instalaciones.map(function (i) {
                                                return <option key={i.id} value={i.id}>{i.nombre} ({i.codigo})</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                            MES
                                        </label>
                                        <select value={mes} onChange={function (e) { setMes(e.target.value); }} style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box' }} >
                                            {MESES.map(function (m, i) {
                                                return <option key={i + 1} value={i + 1}>{m}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                            AÑO
                                        </label>
                                        <input type="number" value={anio} onChange={function (e) { setAnio(e.target.value); }} min="2024" max="2030" style={{ width: '100%', backgroundColor: colores.fondo, border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '10px 12px', color: colores.texto, fontSize: '14px', boxSizing: 'border-box' }}/>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={generando} style={{ backgroundColor: generando ? colores.borde : colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: generando ? 'not-allowed' : 'pointer' }}>
                                        {generando ? 'Generando...' : 'Generar informe'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Lista de informes */}
                    <div style={{display: 'flex', flexDirection: 'column', gap:'12px'}}>
                        {informes.map(function (informe){
                            return(
                                <div key={informe.id} style ={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '20px 24px', border: '1px solid #2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap:'20px'}}>
                                        <div style={{backgroundColor: colores.tarjeta, borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '48px'}}>
                                            <p style={{color: colores.acento, fontSize: '18px', fontWeight: '700', margin: 0}}> {String(informe.mes).padStart(2, '0')}</p>
                                            <p style={{color: colores.texto, fontSize: '11px', margin: 0}}>{informe.anio}</p>
                                        </div>
                                        <div>
                                            <p style={{color:colores.texto, fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>
                                                {MESES[informe.mes - 1]} {informe.anio}
                                            </p>
                                            {informe.instalacion && (
                                                <p style={{ color: colores.acento, fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                                                    {informe.instalacion.nombre} · {informe.instalacion.codigo_referencia}
                                                </p>
                                            )}
                                            <p style={{ color: colores.texto, fontSize: '12px', margin: '0 0 4px 0'}}>
                                                {informe.fecha_inicio} - {informe.fecha_fin}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end'}}>
                                        <span style={{backgroundColor: informe.generado ? '#1a3a2a' : '#2a2a2a', color: informe.generado ? '#4ade80' : '#a0a0a0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px'}}>
                                            {informe.generado ? 'Generado' : 'No generado'}
                                        </span>
                                        <span style={{backgroundColor: informe.email_enviado ? '#1a3a2a' : '#2a2a2a', color: informe.email_enviado ? '#4ade80' : '#a0a0a0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px'}}>
                                            {informe.email_enviado ? 'Email enviado' : 'Sin enviar'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </>
    );
}
