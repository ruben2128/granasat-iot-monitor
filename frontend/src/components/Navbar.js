import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navbar({ usuario, tema, setTema, colores }){
    const router = useRouter();
    const rutaActual = router.pathname;
    const rutasNav = ['dashboard', 'alertas', 'informes', 'mapa'];
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [adminMenuAbierto, setAdminMenuAbierto] = useState(false);

    const rutasAdmin = [
        {ruta: 'usuarios', label: 'Usuarios'},
        {ruta: 'log', label: 'Logs'},
        {ruta: 'config-email', label: 'Config. Email'},
        {ruta: 'email-historial', label: 'Historial Email'},
        {ruta: 'configuracion', label: 'Configuración'} 
    ];

    //Comprobar si la ruta actual es una ruta de admin
    const enRutaAdmin = rutasAdmin.some(function(r) {return rutaActual === '/' + r.ruta;});

    function logout(){
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        router.push('/');
    }

    function cerrarMenus(){
        setMenuAbierto(false);
        setAdminMenuAbierto(false);
    }

    return(
        <nav style={{backgroundColor: colores ? colores.navbar : '#1c1c1e',padding: '0 24px',height: '56px',display: 'flex',alignItems: 'center',justifyContent: 'space-between', borderBottom: `1px solid ${colores ? colores.borde : '#2c2c2e'}`, position: 'relative', zIndex: 1000 }}>
            {/* Logo */}
            <div style= {{ display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img src="/granasat-logo.png" alt="GranaSAT" width={36} height={36} style={{borderRadius: '50%'}} />
                <span style ={{ color: colores.acento, fontWeight: '600', fontSize: '15px'}} >
                    GranaSAT
                </span>
            </div>

            {/* Navegación */}
            <div style={{display: 'flex', gap: '4px'}}>
                {rutasNav.map(function(ruta) {
                    const activa = rutaActual === '/' + ruta;
                    
                    return(
                        <button key={ruta} onClick={function() {router.push('/' + ruta);}} style={{padding: '6px 14px',borderRadius: '6px',border: 'none',cursor: 'pointer',fontSize: '14px',fontWeight: activa ? '600' : '400',backgroundColor: activa ? colores.acentoBoton : 'transparent',color: activa ? 'white' : colores.texto}}>
                            {ruta.charAt(0).toUpperCase() + ruta.slice(1)}
                        </button>
                    );
                })}
            
                {/* Menu desplegable de Administracion */}
                {usuario && usuario.role === 'ADMIN' &&  (
                    <div style={{position: 'relative'}}>
                        <button onClick={function() {setAdminMenuAbierto(!adminMenuAbierto); setMenuAbierto(false);}} style={{padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: enRutaAdmin ? '600' : '400', backgroundColor: enRutaAdmin ? colores.acentoBoton : 'transparent', color: enRutaAdmin ? 'white' : colores.texto, display: 'flex', alignItems: 'center', gap: '4px'}}>
                            Administración
                        </button>

                        {adminMenuAbierto && (
                            <div style={{position: 'absolute', top: '40px', left: 0, backgroundColor: colores.tarjeta, border: `1px solid ${colores.border}`, borderRadius: '10px', padding: '8px', minWidth: '180px', zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.3'}}>                                {rutasAdmin.map(function(item){
                                    const activa = rutaActual === '/' + item.ruta;
                                    return (
                                        <button key={item.ruta} onClick={function() {setAdminMenuAbierto(false); router.push('/' + item.ruta);}} style ={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activa ? '600' : '400', backgroundColor: activa ? colores.acentoBoton : 'transparent', color: activa ? 'white' : colores.texto, textAlign: 'left'}}>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/*Usuario y logout*/}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{ display: 'flex', gap: '4px', border: `1px solid ${colores.borde}`, borderRadius: '8px', padding: '3px'}}>
                    {[
                        {id: 'oscuro', label: 'Oscuro'},
                        {id: 'claro', label: 'Claro'},
                        {id: 'altoContraste', label: 'Contraste'},
                        {id: 'azul', label: 'Azul'}
                    ].map(function(t) {
                        return (
                            <button key={t.id} onClick={function() {setTema(t.id); localStorage.setItem('tema', t.id); }} style={{padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: tema === t.id ? '700' : '400', backgroundColor: tema === t.id ? colores.acentoBoton : 'transparent', color: tema === t.id ? 'white' : colores.texto}}>
                                {t.label}
                            </button>
                        );
                    })}
                </div>
                {usuario && (
                    <>
                        <span style={{ color: colores.texto, fontSize: '14px'}}>
                            {usuario.username}
                        </span>
                        <span style={{backgroundColor: colores.acentoBoton, color: 'white', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px'}}>
                            {usuario.role}
                        </span>

                        {/* Avatar con menú desplegable */}
                        <div style={{ position: 'relative' }}>
                            {/* Avatar — al hacer click abre/cierra el menú */}
                            <div onClick={function() { setMenuAbierto(!menuAbierto); }} style={{ cursor: 'pointer' }}>
                                {usuario.avatar ? (
                                    <img
                                        src={`${usuario.avatar}`}
                                        alt={usuario.nombre}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: colores.borde, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colores.textoSecundario, fontSize: '13px', fontWeight: '600' }}>
                                        {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>

                            {/* Menú desplegable */}
                            {menuAbierto && (
                                <div style={{ position: 'absolute', top: '40px', right: 0, backgroundColor: colores.tarjeta, border: `1px solid ${colores.borde}`, borderRadius: '10px', padding: '8px', minWidth: '160px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                    <p style={{ color: colores.texto, fontSize: '13px', fontWeight: '600', margin: '0 0 2px 8px' }}>
                                        {usuario.nombre} {usuario.apellidos}
                                    </p>
                                    <p style={{ color: colores.textoSecundario, fontSize: '11px', margin: '0 0 8px 8px' }}>
                                        {usuario.email || usuario.username}
                                    </p>
                                    <button onClick={function()  {cerrarMenus(); router.push('/perfil'); }} style={{width: '100%', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', backgroundColor: 'transparent', color: colores.texto, textAlign: 'left'}}>
                                        Mi perfil
                                    </button>
                                    <div style={{height: '1px', backgroundColor: colores.borde, margin: '4px 0'}}/>
                                    <button onClick={logout} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', backgroundColor: 'transparent', color: colores.acento, textAlign: 'left' }}>
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
}