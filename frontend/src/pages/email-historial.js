import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';

export default function EmailHistorial(){
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [tema, setTema] = useState(function(){
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

            const respuestaHistorial = await api.get('/email-historial', { headers: { Authorization: `Bearer ${token}`}});
            setHistorial(respuestaHistorial.data.historial);

            console.log('Primer email del historial:', historial[0]);
        }
        cargarDatos();
    }, []);

    if(!usuario){
        return <p>Cargando...</p>;
    }

    function formatearFecha(fecha){
        if(!fecha){
            return '-';
        }

        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    return (
        <>
            <Head>
                <title>GranaSAT - Historial de emails</title>
            </Head>
            
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores}/>
                <main style={{ padding: '32px 40px'}} >
                    <h1 style={{color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>
                        Historial de emails
                    </h1>

                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        {historial.length} emails enviados
                    </p>

                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr 1fr', padding: '12px 20px', borderBottom: `1px solid ${colores.borde}`}}>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Tipo
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Asunto
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Instalación
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Destinatarios
                            </p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>
                                Fecha
                            </p>
                        </div>

                        {historial.map(function(email, index) {
                            return (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr', padding: '14px 20px', borderBottom: `1px solid ${colores.borde}`, alignItems: 'center'}}>
                                    <span style={{ backgroundColor: email.tipo === 'ALERTA' ? '#3a1a1a' : '#1a2a3a', color: email.tipo === 'ALERTA' ? '#f87171' : '#60a5fa', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginRight: '12px'}}>
                                        {email.tipo}
                                    </span>
                                    <div>
                                        <p style={{ color: colores.texto, fontSize: '13px', margin: '0 0 2px 0'}}>
                                            {email.asunto}
                                        </p>
                                        <p style={{ color: textoSecundarioAccesible, fontSize: '11px', margin: 0}}>
                                            {email.detalle}
                                        </p>
                                    </div>
                                    <p style={{ color: colores.texto, fontSize: '13px', margin: 0}}>
                                        {email.instalacion}
                                    </p>
                                    <p style={{ color: textoSecundarioAccesible, fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                        {Array.isArray(email.destinatarios) ? email.destinatarios.join(', ') : email.destinatarios}
                                    </p>
                                    <p style={{ color: textoSecundarioAccesible, fontSize: '12px', margin: 0}}>
                                        {formatearFecha(email.fecha)}
                                    </p>
                                </div>
                            );
                        })}

                        {historial.length === 0 && (
                            <p style={{ color: textoSecundarioAccesible, fontSize: '14px', textAlign: 'center', margin: '40px 0'}}>No hay emails enviados</p>
                        )}
                    </div>
                </main>
            </div>
        </>   
    );

}