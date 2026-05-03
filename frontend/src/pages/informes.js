import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';
import Navbar from "../components/Navbar";
import { temaOscuro, temaClaro } from "../lib/temas";
import Head from "next/head";

export default function Informes(){
    const router = useRouter();
    const { id } = router.query;
    const [informes, setInformes] = useState([]);
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

            const respuestaInformes = await api.get('/informes', {headers: {Authorization: `Bearer ${token}`}});
            console.log("RESPUESTA INFORMES", respuestaInformes.data.informes);
            setInformes(respuestaInformes.data.informes);
        }
        cargarDatos();
    }, [])

    if (!informes) {
        return <p>Cargando...</p>;
    }

    function fueGenerado(informe){
        if(informe.generado == true){
            return "SI";
        } else {
            return "NO";
        }
    }

    function emaillEnviado(informe){
        if(informe.email_enviado == true){
            return "SI";
        } else {
            return "NO";
        }
    }

    return(
        <>  
            <Head>
                <title>GranaSAT - Informes</title>
            </Head>

            <div style={{backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario = {usuario} tema={tema} setTema={setTema} colores={colores}/>

                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{color: colores.acento, fontSize: '13px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 20px 0', borderLeft: `3px solid ${colores.acento}`, paddingLeft: '10px'}}>
                        Informes mensuales
                    </h1>
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
                                                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][informe.mes - 1]} {informe.anio}
                                            </p>
                                            <p style={{ color: colores.texto, fontSize: '12px', margin: '0 0 4px 0'}}>
                                                {informe.fecha_inicio} - {informe.fecha_fin}
                                            </p>
                                            <p style={{color: colores.texto, fontSize: '11px', fontFamily: 'monospace', margin: 0}}>
                                                {informe.ruta_pdf}
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
