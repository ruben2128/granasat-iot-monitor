import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';

export default function Informes(){
    const router = useRouter();
    const { id } = router.query;
    const [informes, setInformes] = useState([]);

    useEffect(function(){
        async function cargarDatos(){

            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
                return;
            }

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
        <div>
            {informes.map(
                function(informe){
                    return (
                        <div key={informe.id}>
                            <p>MES: {informe.mes}</p>
                            <p>AÑO: {informe.anio}</p>
                            <p>FECHA GENERACION: {informe.fecha_generacion}</p>
                            <p>FECHA INICIO: {informe.fecha_inicio}</p>
                            <p>FECHA FIN: {informe.fecha_fin}</p>
                            <p>RUTA: {informe.ruta_pdf}</p>
                            <p>¿SE GENERO EL INFORME?: {fueGenerado(informe)}</p>
                            <p>¿SE ENVIO EL EMAIL?: {emaillEnviado(informe)}</p>
                        </div>
                    );
                }
            )}

            <button onClick={function(){router.back()}}>VOLVER</button>
        </div>
    );
}