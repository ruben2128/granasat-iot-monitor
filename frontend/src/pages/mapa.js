import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';

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

function MapaLeaflet({ dispositivos }) {
    useEffect(function() {
        // Importar Leaflet solo en el cliente
        if(typeof window === 'undefined') return;

        const L = require('leaflet');

        // Fix para los iconos de Leaflet con Next.js
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Inicializar el mapa
        const mapa = L.map('mapa-container').setView([37.1773, -3.5986], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapa);

        // Añadir marcadores
        dispositivos.forEach(function(dispositivo) {
            const marker = L.marker([parseFloat(dispositivo.latitud), parseFloat(dispositivo.longitud)]);
            marker.bindPopup(`
                <strong>${dispositivo.nombre}</strong><br/>
                ${dispositivo.mac_address}<br/>
                ${dispositivo.altura ? `Altura: ${dispositivo.altura}m` : ''}
            `);
            marker.addTo(mapa);
        });

        return function() {
            mapa.remove();
        };
    }, [dispositivos]);

    return <div id="mapa-container" style={{ width: '100%', height: '600px' }}/>;
}