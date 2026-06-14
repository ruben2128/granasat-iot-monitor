import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import {obtenerColores} from '../lib/temas';

export default function Log() {
    const router = useRouter();
    const[usuario, setUsuario] = useState(null);
    const[registros, setRegistros] = useState([]);
    const[logCambios, setLogCambios] = useState([]);
    const[filtroTipo, setFiltroTipo] = useState('todos');
    const[dias, setDias] = useState(7);
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }
        return 'oscuro';
    });
    const colores = obtenerColores(tema);
    const textoSecundarioAccesible = tema === 'oscuro' ? '#a0a0a0' : '#696969';

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

            const respAccesos = await api.get(`/log?dias=${dias}`, { headers: { Authorization: `Bearer ${token}` }});
            
            setRegistros(respAccesos.data.registros);

            const respCambios = await api.get('/log-cambios', { headers: { Authorization: `Bearer ${token}` }});
            
            setLogCambios(respCambios.data.logs);
        }
        cargarDatos();
    }, [dias]);

    if(!usuario){
        return <p>Cargando...</p>;
    } 

    function formatearFecha(fecha){
        if(!fecha) return '-';
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    const todosLogs = [
        ...registros.map(function(r) {
            return {
                id: r.id,
                tipo: 'LOGIN',
                username: r.username,
                detalle: r.ip ? `IP: ${r.ip}` : '-',
                estado: r.exito,
                fecha: r.fecha
            };
        }),
        ...logCambios.map(function(l) {
            return {
                id: l.id,
                tipo: 'CAMBIO_PERFIL',
                username: l.username,
                detalle: `${l.valor_nuevo || '-'}`,
                estado: true,
                fecha: l.fecha
            };
        })
    ].sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });

    const logsFiltrados = filtroTipo === 'todos' ? todosLogs :
        filtroTipo === 'accesos' ? todosLogs.filter(function(l) { return l.tipo === 'LOGIN'; }) :
        todosLogs.filter(function(l) { return l.tipo === 'CAMBIO_PERFIL'; });

    return (
        <>
            <Head><title>GranaSAT - Logs</title></Head>
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores}/>
                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>
                        Logs del sistema
                    </h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        Accesos y cambios de perfil realizados por los usuarios
                    </p>

                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap'}}>
                        {[
                            {id: 'todos', label: 'Todos'},
                            {id: 'accesos', label: 'Accesos'},
                            {id: 'cambios', label: 'Cambios de perfil'}
                        ].map(function(f) {
                            return (
                                <button key={f.id} onClick={function() { setFiltroTipo(f.id); }} style={{ padding: '6px 16px', borderRadius: '6px', border: `1px solid ${colores.borde}`, cursor: 'pointer', fontSize: '13px', fontWeight: filtroTipo === f.id ? '700' : '400', backgroundColor: filtroTipo === f.id ? colores.acentoBoton : 'transparent', color: filtroTipo === f.id ? 'white' : colores.texto}}>
                                    {f.label}
                                </button>
                            );
                        })}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px'}}>
                            {[7, 15, 30].map(function(d) {
                                return (
                                    <button key={d} onClick={function() { setDias(d); }} style={{ padding: '6px 16px', borderRadius: '6px', border: `1px solid ${colores.borde}`, cursor: 'pointer', fontSize: '13px', fontWeight: dias === d ? '700' : '400', backgroundColor: dias === d ? colores.acentoBoton : 'transparent', color: dias === d ? 'white' : colores.texto}}>
                                        {d} días
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabla*/}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 2fr 1fr', padding: '12px 20px', borderBottom: `1px solid ${colores.borde}`}}>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Tipo
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Usuario
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Detalle
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Fecha
                            </p>
                        </div>
                        {logsFiltrados.map(function(log) {
                            return (
                                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 2fr 1fr', padding: '14px 20px', borderBottom: `1px solid ${colores.borde}`, alignItems: 'center'}}>
                                    <span style={{ backgroundColor: log.tipo === 'LOGIN' ? '#1a2a3a' : '#2a1a3a', color: log.tipo === 'LOGIN' ? '#7b9fc7' : '#c47bf9', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                        {log.tipo === 'LOGIN' ? 'LOGIN' : 'PERFIL'}
                                    </span>
                                    <p style={{ color: colores.texto, fontSize: '13px', margin: 0}}>
                                        {log.username || '-'}
                                    </p>
                                    <p style={{ color: textoSecundarioAccesible, fontSize: '12px', margin: 0, fontFamily: log.tipo === 'LOGIN' ? 'monospace' : 'inherit'}}>
                                        {log.tipo === 'LOGIN' && !log.estado ? (
                                            <span style={{ color: '#f87171'}}>
                                                {log.detalle} — Fallido
                                            </span>
                                        ) : log.detalle}
                                    </p>
                                    <p style={{ color: textoSecundarioAccesible, fontSize: '12px', margin: 0}}>
                                        {formatearFecha(log.fecha)}
                                    </p>
                                </div>
                            );
                        })}
                        {logsFiltrados.length === 0 && (
                            <p style={{ color: textoSecundarioAccesible, fontSize: '14px', textAlign: 'center', margin: '40px 0'}}>
                                No hay registros
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}