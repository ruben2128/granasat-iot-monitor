import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';
import Navbar from "../components/Navbar";
import {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores} from '../lib/temas';
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
    const colores = obtenerColores(tema);
    const[mostrarFormulario, setMostrarFormulario] = useState(false);
    const[instalaciones, setInstalaciones] = useState([]);
    const[error, setError] = useState('');
    const[exito, setExito] = useState('');
    const[alertaNombre, setAlertaNombre] = useState('');
    const[alertaTipo, setAlertaTipo] = useState('RADIACION');
    const[alertaInstalacionId, setAlertaInstalacionId] = useState('');
    const[alertaCampo, setAlertaCampo] = useState('radiacion');
    const[alertaOperador, setAlertaOperador] = useState('>');
    const[alertaUmbral, setAlertaUmbral] = useState('');
    const[alertaEmails, setAlertaEmails] = useState('');
    const[alertaDescripcion, setAlertaDescripcion] = useState('');
    const[alertaMensaje, setAlertaMensaje] = useState('');
    const[editandoId, setEditandoId] = useState(null);

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

            const respuestaInstalaciones = await api.get('/instalaciones', {headers: {Authorization: `Bearer ${token}`}});
            setInstalaciones(respuestaInstalaciones.data.instalaciones);
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

    async function handleCrearAlerta(e){
        e.preventDefault();

        setError('');
        setExito('');

        try {
            const token = localStorage.getItem('token');

            if(editandoId){
                await api.put(`/alertas-config/${editandoId}`, {
                    nombre: alertaNombre,
                    tipo: alertaTipo,
                    instalacion_id: alertaInstalacionId,
                    campo: alertaCampo,
                    operador: alertaOperador,
                    umbral: parseFloat(alertaUmbral),
                    emails_destino: alertaEmails ? alertaEmails.split(',').map(e => e.trim()) : [],
                    descripcion : alertaDescripcion || null,
                    mensaje_personalizado: alertaMensaje || null,
                }, {headers: {Authorization: `Bearer ${token}`}});
                
                setExito('Alerta creada correctamente');
            } else {
                 await api.post('/alertas-config', {
                    nombre: alertaNombre,
                    tipo: alertaTipo,
                    instalacion_id: alertaInstalacionId,
                    campo: alertaCampo,
                    operador: alertaOperador,
                    umbral: parseFloat(alertaUmbral),
                    emails_destino: alertaEmails ? alertaEmails.split(',').map(e => e.trim()) : [],
                    descripcion : alertaDescripcion || null,
                    mensaje_personalizado: alertaMensaje || null,
                }, {headers: {Authorization: `Bearer ${token}`}});
                
                setExito('Alerta creada correctamente');
            }

            setMostrarFormulario(false);
            setAlertaNombre('');
            setAlertaTipo('');
            setAlertaInstalacionId('');
            setAlertaCampo('');
            setAlertaOperador('>');
            setAlertaUmbral('');
            setAlertaEmails('');
            setAlertaDescripcion('');
            setAlertaMensaje('');

            const respuestaAlertas = await api.get('/alertas-config', {headers: {Authorization: `Bearer ${token}`}});
            
            setAlertas(respuestaAlertas.data.alertas);
        } catch(err){
            setError(err.response?.data?.error || 'Error al crear la alerta');
        }
    }

    function handleEditar(alerta){
        setExito('');
        setError('');
        setMostrarFormulario(true);
        setEditandoId(alerta.id);
        setAlertaNombre(alerta.nombre);
        setAlertaTipo(alerta.tipo);
        setAlertaInstalacionId(alerta.instalacion_id);
        setAlertaCampo(alerta.campo);
        setAlertaOperador(alerta.operador);
        setAlertaUmbral(String(alerta.umbral));
        setAlertaEmails(alerta.emails_destino ? alerta.emails_destino.join(', ') : '');
        setAlertaDescripcion(alerta.descripcion || '');
        setAlertaMensaje(alerta.mensaje_personalizado || '');
    }

    async function handleCambiarEstadoAlerta(id, activa){
        try{
            const token = localStorage.getItem('token');
            await api.put(`/alertas-config/${id}`,
                {activa: !activa},
                {headers: {Authorization: `Bearer ${token}`}}
            );

            const respuestaAlertas = await api.get('/alertas-config', {headers: {Authorization: `Bearer ${token}`}});
            
            setAlertas(respuestaAlertas.data.alertas);

        }catch(err){
            setError('Error al cambiar el estado de la alerta');
        }
    }

    async function handleEliminarAlerta(id){
        if(!confirm('¿Seguro que quiere eliminar esta alerta?')){
            return;
        }

        try{
            const token = localStorage.getItem('token');

            await api.delete(`/alertas-config/${id}`, {headers: {Authorization: `Bearer ${token}`}});

            const respuestaAlertas = await api.get('/alertas-config',  {headers: {Authorization: `Bearer ${token}`}});

            setAlertas(respuestaAlertas.data.alertas);
            setExito('Alerta eliminada correctamente');
        
        }catch(err){
            setError('Error al eliminar la alerta');
        }
    }

    const estiloInput = {
        width: '100%',
        backgroundColor: colores.fondo,
        border: `1px solid ${colores.borde}`,
        borderRadius: '8px',
        padding: '10px 12px',
        color: colores.texto,
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const estiloLabel = {
        color: colores.texto,
        fontSize: '11px',
        fontWeight: '600',
        display: 'block',
        marginBottom: '6px'
    };

    const estiloTitulosTabla = {
        color: colores.texto, 
        fontSize: '11px', 
        fontWeight: '600', 
        margin: 0
    }

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

                    {exito && <p style={{color: '#4ade80', fontSize: '13px', margin: '0 0 16px 0'}}>
                                {exito}
                            </p>
                    }
                    {error && <p style={{color: '#f87171', fontSize: '13px', margin: '0 0 16px 0'}}>
                                {error}
                            </p>
                    }

                    {/* Boton nueva alerta */}
                    <div style={{display:'flex', justifyContent: 'flex-end', marginBottom: '16px'}}>
                        <span onClick={function () { setMostrarFormulario(!mostrarFormulario); setEditandoId(null); setError(''); setExito('');}} style={{color: colores.acento, fontSize: '13px', cursor: 'pointer'}}>
                            {mostrarFormulario ? 'Cancelar' : 'Crear alerta'}
                        </span>
                    </div>

                    {mostrarFormulario && (
                        <div style={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: `1px solid ${colores.borde}`, maxWidth: '600px', marginBottom: '16px'}}>
                            <h2 style={{ color: colores.texto, fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0'}}>
                               {editandoId ? 'Editar alerta' : 'Nueva alerta'} 
                            </h2>
                            <form onSubmit={handleCrearAlerta}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px', marginBottom: '16px'}}>
                                    <div>
                                        <label htmlFor="alerta_nombre" style={estiloLabel}>
                                            NOMBRE
                                        </label>
                                        <input id="alerta_nombre" type="text" value={alertaNombre} onChange={function(e){ setAlertaNombre(e.target.value); }} required style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="alerta_instalacion" style={estiloLabel}>
                                            INSTALACIÓN
                                        </label>
                                        <select id="alerta_instalacion" value={alertaInstalacionId} onChange={function(e){ setAlertaInstalacionId(e.target.value); }} required style={estiloInput}>
                                            <option value="">
                                                Seleccionar instalación
                                            </option>
                                            {instalaciones.map(function(i){
                                                return <option key={i.id} value={i.id}>
                                                    {i.nombre}
                                                </option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="alerta_tipo" style={estiloLabel}>
                                            TIPO
                                        </label>
                                        <input id="alerta_tipo" type="text" value={alertaTipo} onChange={function(e){ setAlertaTipo(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="alerta_campo" style={estiloLabel}>
                                            CAMPO
                                        </label>
                                        <input id="alerta_campo" type="text" value={alertaCampo} onChange={function(e){ setAlertaCampo(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div>
                                        <label htmlFor="alerta_operador" style={estiloLabel}>
                                            OPERADOR
                                        </label>
                                        <select id="alerta_operador" value={alertaOperador} onChange={function(e){setAlertaOperador(e.target.value); }} style={estiloInput}>
                                            <option value=">">
                                                {'>'} Mayor que
                                            </option>
                                            <option value="<">
                                                {'<'} Menor que
                                            </option>
                                            <option value=">=">
                                                {'>='} Mayor o igual
                                            </option>
                                            <option value="<=">
                                                {'<='} Menor o igual
                                            </option>
                                            <option value="==">
                                                {'=='} Igual a 
                                            </option>
                                        </select>
                                    </div>
                                     <div>
                                        <label htmlFor="alerta_umbral" style={estiloLabel}>
                                            UMBRAL
                                        </label>
                                        <input id="alerta_umbral" type="number" value={alertaUmbral} step="any" onChange={function(e){ setAlertaUmbral(e.target.value); }} required placeholder="Ej: 1.5" style={estiloInput}/>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1'}}>
                                        <label htmlFor="alerta_emails" style={estiloLabel}>
                                            EMAILS DESTINATARIOS
                                        </label>
                                        <input id="alerta_emails" type="text" value={alertaEmails} onChange={function(e){ setAlertaEmails(e.target.value); }} style={estiloInput}/>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1'}}>
                                        <label htmlFor="alerta_mensaje" style={estiloLabel}>
                                            MENSAJE PERSONALIZADO
                                        </label>
                                        <textarea id="alerta_mensaje" value={alertaMensaje} onChange={function(e){ setAlertaMensaje(e.target.value); }} rows={3} style={{...estiloInput, resize:'vertical'}}/>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px'}}>
                                    <button type="submit" style={{ backgroundColor: colores.acentoBoton, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
                                        {editandoId ? 'Guardar cambios' : 'Crear alerta'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {/*Tabla de las alertas*/}
                    <div style ={{ backgroundColor: colores.tarjeta, borderRadius: '12px', padding: '24px', border: '1px solid #2c2c2e'}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 0.5fr 0.5fr 1fr', padding: '12px 20px', borderBottom: '1px solid #2c2c2e'}}>
                            <p style={estiloTitulosTabla}>
                                Nombre
                            </p>
                            <p style={estiloTitulosTabla}>
                                Instalación
                            </p>
                            <p style={estiloTitulosTabla}>
                                Tipo
                            </p>
                            <p style={estiloTitulosTabla}>
                                Campo
                            </p>
                            <p style={estiloTitulosTabla}>
                                Condición
                            </p>
                            <p style={estiloTitulosTabla}>
                                Umbral
                            </p>
                            <p style={estiloTitulosTabla}>
                                Estado
                            </p>
                        </div>
                        {/*Filas*/}
                        {alertas.map(function(alerta){
                            return (
                                <div key={alerta.id} style={{display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 0.5fr 0.5fr 1fr', padding: '16px 20px', borderBottom: '1px solid #2c2c2e', alignItems: 'center'}}>
                                    <p style={{color: colores.texto, fontSize: '14px', margin: 0}}>
                                        {alerta.nombre}
                                    </p> 
                                    <p style={{color: colores.texto, fontSize: '14px', margin: 0}}>
                                        {alerta.instalacion.nombre}
                                    </p> 
                                    <div style={{ display: 'flex'}}> 
                                        <span style={{backgroundColor: colores.fondo , color: textoSecundarioAccesible, fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                            {alerta.tipo}
                                        </span>
                                    </div>
                                    <p style={{ color: colores.texto, fontSize: '13px', margin: 0}}>
                                        {alerta.campo}
                                    </p>
                                    <p style={{color: colores.texto, fontSize: '13px', margin: 0}}>
                                        {alerta.operador}
                                    </p>
                                    <p style={{ color: colores.texto, fontSize: '14px', margin: 0}}>
                                        {alerta.umbral}
                                    </p>
                                    <div style={{ display: 'flex'}}> 
                                        <span style={{backgroundColor: alerta.activa ? '#1a3a2a' : colores.fondo, color: alerta.activa ? '#4ade80' : textoSecundarioAccesible, fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', display: 'inline-block'}}>
                                            {alerta.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                        <button onClick={function(){handleCambiarEstadoAlerta(alerta.id, alerta.activa)}} style={{background: 'none', border: `1px solid ${alerta.activa ? '#f87171' : '#4ade80'}`, color: alerta.activa ? '#f87171' : '#4ade80', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer'}}>
                                            {alerta.activa ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button onClick={function() {handleEditar(alerta); }} style={{background: 'none', border: `1px solid ${colores.borde}`, color: colores.texto, borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer'}}>
                                            Editar
                                        </button>
                                        <button type="button" onClick={function(){handleEliminarAlerta(alerta.id)}} style={{background: 'none', border: '1px solid #f87171', color: '#f87171', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer'}}>
                                            Eliminar
                                        </button>
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