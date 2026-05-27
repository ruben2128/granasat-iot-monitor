import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import {obtenerColores} from '../lib/temas';
import dynamic from "next/dynamic";

const MapaLeaflet = dynamic(function(){return import('../components/MapaLeaflet');}, {ssr: false, loading: function() {return <p>Cargando mapa...</p>}});

export default function Mapa() {
    const router = useRouter();
    const[usuario, setUsuario] = useState(null);
    const[dispositivos, setDispositivos] = useState([]);
    const[tema, setTema] = useState(function() {
        if(typeof window !== 'undefined'){
            return localStorage.getItem('tema') || 'oscuro';
        }
        return 'oscuro';
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

            const respuesta = await api.get('/dispositivos', { headers: { Authorization: `Bearer ${token}` }});
            const todosDispositivos = respuesta.data.dispositivos;
            
            // Solo los que tienen coordenadas
            const conCoordenadas = todosDispositivos.filter(function(d) {
                return d.latitud && d.longitud;
            });
            setDispositivos(conCoordenadas);
        }
        cargarDatos();
    }, []);

    if(!usuario) {
        return <p>Cargando...</p>;
    }

    return (
        <>
            <Head>
                <title>GranaSAT - Mapa</title>
            </Head>
            <div style={{ backgroundColor: colores.fondo, minHeight: '100vh'}}>
                <Navbar usuario={usuario} tema={tema} setTema={setTema} colores={colores}/>
                <main style={{ padding: '32px 40px'}}>
                    <h1 style={{ color: colores.texto, fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>Mapa de dispositivos</h1>
                    <p style={{ color: colores.textoSecundario, fontSize: '14px', margin: '0 0 32px 0'}}>
                        {dispositivos.length} dispositivos con ubicación registrada
                    </p>
                    <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', border: `1px solid ${colores.borde}`, overflow: 'hidden', height: '600px'}}>
                        <MapaLeaflet dispositivos={dispositivos} />
                    </div>
                </main>
            </div>
        </>
    );
}
