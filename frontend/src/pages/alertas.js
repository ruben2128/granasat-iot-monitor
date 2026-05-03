import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';
import Navbar from "../components/Navbar";
import {temaOscuro, temaClaro} from '../lib/temas';
import Head from 'next/head';

export default function Alertas(){
    const router = useRouter();
    const { id } = router.query;
    const [alertas, setAlertas] = useState([]);
    const[usuario, setUsuario] = useState([]);
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }

        return 'oscuro'
    });
    const colores = tema === 'oscuro' ? temaOscuro : temaClaro;

    useEffect(function(){
        async function cargarDatos(){
            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
                return;
            }

            const usuarioGuardado = localStorage.getItem('usuario');
            setUsuario(JSON.parse(usuarioGuardado));

            const respuestaAlertas = await api.get('/alertas-config', {headers: {Authorization: `Bearer ${token}`}});
            setAlertas(respuestaAlertas.data.alertas);
        }
        cargarDatos();
    }, [])

    if (!alertas) {
        return <p>Cargando...</p>;
    }

    function estaActivo(alerta){
        if(alerta.activa == true){
            return "SI";
        } else {
            return "NO";
        }
    }

    const textoSecundarioAccesible = tema === 'oscuro' ? '#a0a0a0' : '#696969';

    return(
        <> 
            <Head>
                <title>GranaSAT - Alertas</title>
            </Head>
        
            <div style={{backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario = {usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 20px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '10px'}}>
                        Configuración de alertas
                    </h1>
                    {/*Tabla de las alertas*/}
                    <div style ={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: '1px solid #2c2c2e'}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #2c2c2e'}}>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Nombre</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Tipo</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Campo</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Condición</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Umbral</p>
                            <p style={{ color: colores.texto, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', margin: 0}}>Estado</p>
                        </div>
                        {/*Filas*/}
                        {alertas.map(function(alerta){
                            return (
                                <div key={alerta.id} style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px 20px', borderBottom: '1px solid #2c2c2e', alignItems: 'center'}}>
                                    <p style={{color: colores.texto, fontSize: '14px', margin: 0}}>{alerta.nombre}</p> 
                                    <div style={{ display: 'flex'}}> 
                                        <span style={{backgroundColor: colores.fondo , color: textoSecundarioAccesible, fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                            {alerta.tipo}
                                        </span>
                                    </div>
                                    <p style={{ color: colores.texto, fontSize: '13px', fontFamily:'monospace', margin: 0}}>{alerta.campo}</p>
                                    <p style={{color: colores.texto, fontSize: '13px', margin: 0}}>{alerta.operador}</p>
                                    <p style={{ color: colores.texto, fontSize: '14px', margin: 0}}>{alerta.umbral}</p>
                                    <div style={{ display: 'flex'}}> 
                                        <span style={{backgroundColor: alerta.activa ? '#1a3a2a' : colores.fondo, color: alerta.activa ? '#4ade80' : textoSecundarioAccesible, fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', display: 'inline-block'}}>
                                            {alerta.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })} 
                    </div>
                </main>
            </div>
        </>
    );
}