import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar({ usuario, tema, setTema, colores }){
    const router = useRouter();
    const rutaActual = router.pathname;
    const rutasNav = ['dashboard', 'alertas', 'informes', 'mapa'];
    const [menuAbierto, setMenuAbierto] = useState(false);

    function logout(){
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        router.push('/');
    }

    if(usuario && usuario.role === 'ADMIN'){
        rutasNav.push('usuarios');
        rutasNav.push('log');
        rutasNav.push('email-historial');
        rutasNav.push('config-email');
    }

    return(
        <nav style={{backgroundColor: colores ? colores.navbar : '#1c1c1e',padding: '0 24px',height: '56px',display: 'flex',alignItems: 'center',justifyContent: 'space-between', borderBottom: `1px solid ${colores ? colores.borde : '#2c2c2e'}`, }}>
            {/* Logo */}
            <div style= {{ display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Image src="/granasat-logo.png" alt="GranaSAT" width={36} height={36} style={{borderRadius: '50%'}} />
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
                                        src={`${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${usuario.avatar}`}
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
                                    <div style={{ height: '1px', backgroundColor: colores.borde, margin: '4px 0' }}/>
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