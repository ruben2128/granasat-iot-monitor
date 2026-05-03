import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar({ usuario, tema, setTema, colores }){
    const router = useRouter();
    const rutaActual = router.pathname;
    const rutasNav = ['dashboard', 'alertas', 'informes'];

    function cambiarTema(){
        const nuevoTema = tema === 'oscuro' ? 'claro' : 'oscuro';
        setTema(nuevoTema);
        localStorage.setItem('tema', nuevoTema);
    }

    function logout(){
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        router.push('/');
    }

    if(usuario && usuario.role === 'ADMIN'){
        rutasNav.push('usuarios');
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
                {usuario && (
                    <>
                        <span style={{ color: colores.texto, fontSize: '14px'}}>
                            {usuario.username}
                        </span>
                        <span style={{backgroundColor: colores.acentoBoton ,color: 'white',fontSize: '11px',fontWeight: '700',padding: '2px 8px',borderRadius: '4px'}}>
                            {usuario.role}
                        </span>
                    </>
                )}
                <button onClick={cambiarTema} style={{padding: '6px 10px', borderRadius: '6px', border: '1px solid #3c3c3e', cursor: 'pointer', fontSize: '14px', backgroundColor: 'transparent', color: colores.texto}}>
                    {tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
                </button>

                <button onClick={logout} style={{padding: '6px 14px',borderRadius: '6px',border: '1px solid #3c3c3e',cursor: 'pointer',fontSize: '14px',backgroundColor: 'transparent',color: colores.texto}}> 
                    Salir 
                </button>
            </div>
        </nav>
    );
}