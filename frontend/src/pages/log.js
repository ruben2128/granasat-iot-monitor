import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';

export default function Log() {
    const router = useRouter();
    const[usuario, setUsuario] = useState(null);
    const[registros, setRegistros] = useState([]);
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

            const respuesta = await api.get(`/log?dias=${dias}`, { headers: { Authorization: `Bearer ${token}` }});
            setRegistros(respuesta.data.registros);
        }
        cargarDatos();
    }, [dias]);

    if(!usuario) {
        return <p>Cargando...</p>;
    }

    function formatearFecha(fecha){
        if(!fecha) return '-';
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    return (
        <>
            <Head>
                <title>GranaSAT - Log de accesos</title>
            </Head>
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores}/>
                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>Log de accesos</h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        Historial de accesos al sistema
                    </p>

                    {/* Selector de rango */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px'}}>
                        {[7, 15, 30].map(function(d) {
                            return (
                                <button key={d} onClick={function() { setDias(d); }} style={{ padding: '6px 16px', borderRadius: '6px', border: `1px solid ${colores.borde}`, cursor: 'pointer', fontSize: '13px', fontWeight: dias === d ? '700' : '400', backgroundColor: dias === d ? colores.acentoBoton : 'transparent', color: dias === d ? 'white' : colores.texto}}>
                                    Últimos {d} días
                                </button>
                            );
                        })}
                    </div>

                    {/* Tabla */}
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `1px solid ${colores.borde}`}}>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Usuario</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>IP</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Fecha</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Estado</p>
                        </div>
                        {registros.map(function(registro) {
                            return (
                                <div key={registro.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: `1px solid ${colores.borde}`, alignItems: 'center'}}>
                                    <p style={{ color: colores.texto, fontSize: '14px', margin: 0}}>{registro.username}</p>
                                    <p style={{ color: textoSecundarioAccesible, fontSize: '13px', fontFamily: 'monospace', margin: 0}}>{registro.ip || '-'}</p>
                                    <p style={{ color: textoSecundarioAccesible, fontSize: '13px', margin: 0}}>{formatearFecha(registro.fecha)}</p>
                                    <span style={{ backgroundColor: registro.exito ? '#1a3a2a' : '#3a1a1a', color: registro.exito ? '#4ade80' : '#f87171', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', display: 'inline-block'}}>
                                        {registro.exito ? 'Exitoso' : 'Fallido'}
                                    </span>
                                </div>
                            );
                        })}
                        {registros.length === 0 && (
                            <p style={{ color: textoSecundarioAccesible, fontSize: '14px', textAlign: 'center', margin: '40px 0'}}>No hay registros para este período</p>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}