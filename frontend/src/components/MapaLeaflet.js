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
            attribution: 'OpenStreetMap contributors'
        }).addTo(mapa);

        const coordsDiv = L.control({position: 'bottomleft'});
        
        coordsDiv.onAdd = function() {
            const div = L.DomUtil.create('div');

            div.style.cssText = 'background: rgba(0,0,0,0.75); color: #e8550a; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;';
            return div;
        };
        coordsDiv.addTo(mapa);

        const searchDiv = L.control({position: 'topright'});
        
        searchDiv.onAdd = function(){
            const div = L.DomUtil.create('div');

            div.style.cssText = 'background: rgba(0,0,0,0.75); padding: 8px; border-radius: 6px; display: flex; gap: 6px';
            div.innerHTML = `
                <input id="mapa-busqueda" type="text" placeholder="Buscar dirección" style="padding: 6px 10px; border-radius: 4px; border: none; font-size: 12px; width: 220px; background: #1a1a1a; color: white;" />
                <button id="mapa-buscar-btn" style="padding: 6px 10px; border-radius: 4px; border: none; background: #e8550a; color: white; font-size: 12px; cursor: pointer; font-weight: bold;">
                    Buscar
                </button>
            `;

            L.DomEvent.disableClickPropagation(div);
            
            return div;
        };

        searchDiv.addTo(mapa);

        let mapaDestruido = false;

        //Lógica de búsqueda usando la libreria Nominatim
        setTimeout(function(){
            const input = document.getElementById('mapa-busqueda');
            const btn = document.getElementById('mapa-buscar-btn');

            async function buscarDireccion(){
                const query = input.value.trim();

                if(!query){
                    return;
                }

                btn.textContent = '...';

                try{
                    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=es`);
                    const data = await resp.json();

                    if(data.length > 0){
                        const latitud = parseFloat(data[0].lat);
                        const longitud = parseFloat(data[0].lon);
                        console.log("DATOS: ", data[0].lat);

                        if(!mapaDestruido) {
                            mapa.setView([latitud, longitud], 17);
                        }
                            
                    } else {
                        alert('Dirección no encontrada');
                    }
                } catch (err) {
                    console.log('Error Nominatim:', err);
                    alert('Error al buscar la dirección');
                } finally {
                    btn.textContent = 'Buscar';
                }
            }

            btn.addEventListener('click', function(e){
                e.preventDefault();
                buscarDireccion();
            });
                
                
            input.addEventListener('keydown', function(e){
                if(e.key === 'Enter'){
                    e.preventDefault();
                    buscarDireccion();
                }
            });
        }, 100);

        // Click en el mapa para asignar coordenadas a un dispositivo
        mapa.on('click', async function(e) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            const opciones = dispositivos.map(function(d) {
                return `<option value="${d.id}">${d.nombre}</option>`;
            }).join('');

            const contenido = document.createElement('div');
            contenido.innerHTML = `
                <strong style="font-size:13px">
                    Asignar posición
                </strong><br/>
                <small>
                    Lat: ${lat}, Lng: ${lng}
                </small><br/><br/>
                <select id="popup-dispositivo-select" style="width:100%; padding:4px; margin-bottom:8px; border-radius:4px;">
                    <option value="">
                        Seleccionar dispositivo
                    </option>
                    ${opciones}
                </select><br/>
                <button id="popup-confirmar-btn" style="background:#e8550a; color:white; border:none; padding:6px 14px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">
                    Confirmar
                </button>
            `;

            const popup = L.popup().setLatLng(e.latlng).setContent(contenido).openOn(mapa);

            setTimeout(function() {
                const btn = document.getElementById('popup-confirmar-btn');
                if(!btn){
                    return;
                } 
                btn.addEventListener('click', async function() {
                    const select = document.getElementById('popup-dispositivo-select');
                    const dispositivoId = select.value;
                    if(!dispositivoId) { a
                        lert('Selecciona un dispositivo'); 
                        return; 
                    }

                    const token = localStorage.getItem('token');
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dispositivos/${dispositivoId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ latitud: parseFloat(lat), longitud: parseFloat(lng) })
                        });
                        mapa.closePopup();
                        alert(`Posición actualizada`);
                    } catch(err) {
                        alert('Error al guardar la posición');
                    }
                });
            }, 50);
        });

        mapa.on('mousemove', function(e){
            coordsDiv.getContainer().innerHTML =
                'Lat:' + e.latlng.lat.toFixed(6) + ' &nbsp; Lng: ' + e.latlng.lng.toFixed(6);
        });

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
            mapaDestruido = true;
            mapa.remove();
        };
    }, [dispositivos]);

    return <div id="mapa-container" style={{ width: '100%', height: '600px' }}/>;

}