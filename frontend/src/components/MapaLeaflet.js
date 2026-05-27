import { useEffect } from "react";
import 'leaflet/dist/leaflet.css';

export default function MapaLeaflet({ dispositivos }) {
    useEffect(function() {
        if(typeof window === 'undefined') 
            return;

        const L = require('leaflet');

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const mapa = L.map('mapa-container').setView([37.1773, -3.5986], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapa);

        dispositivos.forEach(function(dispositivo) {
            const marker = L.marker(
                [parseFloat(dispositivo.latitud), parseFloat(dispositivo.longitud)],
                { draggable: true }
            );

            marker.bindPopup(`
                <strong>${dispositivo.nombre}</strong><br/>
                ${dispositivo.mac_address}<br/>
                ${dispositivo.altura ? `Altura: ${dispositivo.altura}m` : ''}
            `);

            marker.on('dragend', async function(e) {
                const nuevaPos = e.target.getLatLng();
                const token = localStorage.getItem('token');
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dispositivos/${dispositivo.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            latitud: nuevaPos.lat,
                            longitud: nuevaPos.lng
                        })
                    });
                    marker.bindPopup(`
                        <strong>${dispositivo.nombre}</strong><br/>
                        ${dispositivo.mac_address}<br/>
                        ${nuevaPos.lat.toFixed(6)}, ${nuevaPos.lng.toFixed(6)}<br/>
                        <em style="color: green">Posición actualizada</em>
                    `).openPopup();
                } catch(err) {
                    marker.bindPopup(`
                        <strong>${dispositivo.nombre}</strong><br/>
                        <em style="color: red">Error al guardar la posición</em>
                    `).openPopup();
                }
            });

            marker.addTo(mapa);
        });

        return function() {
            mapa.remove();
        };
    }, [dispositivos]);

    return <div id="mapa-container" style={{ width: '100%', height: '600px' }}/>;
}