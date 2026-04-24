import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';

export default function Alertas(){
    const router = useRouter();
    const { id } = router.query;
    const [alertas, setAlertas] = useState([]);

    useEffect(function(){
        async function cargarDatos(){
            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
                return;
            }

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

    return(
        <div>
            {alertas.map(
                function(alerta){
                    return (
                        <div key={alerta.id}>
                            <p>NOMBRE: {alerta.nombre}</p>
                            <p>TIPO: {alerta.tipo}</p>
                            <p>CAMPO: {alerta.campo}</p>
                            <p>OPERADOR: {alerta.operador}</p>
                            <p>UMBRAL: {alerta.umbral}</p>
                            <p>ACTIVA: {estaActivo(alerta)}</p>
                        </div>
                    );
                }
            )}
            

            <button onClick={function(){router.back()}}>VOLVER</button>
        </div>
    );
}