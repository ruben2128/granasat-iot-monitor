import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [imagenActual ,setImagenActual] = useState(0);
  const router = useRouter();

  const imagenes = [
    '/edificios/edificio1.jpg',
    '/edificios/edificio2.jpg',
    '/edificios/edificio3.jpg',
    '/edificios/edificio4.jpg',
    '/edificios/edificio5.jpg',
    '/edificios/edificio6.jpg',
  ];

  async function handleSubmit(e){
    e.preventDefault();
    try{
      const respuesta = await api.post('/auth/login', {username, password});
      const token = respuesta.data.token;
      const usuario = respuesta.data.usuario;
      const ultimoAcceso = respuesta.data.ultimo_acceso;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario))
      localStorage.setItem('ultimo_acceso', ultimoAcceso || '');

      router.push('/dashboard');
    } catch (err) {
      console.log('Error en el login:', err);
      setError('Usuario o contraseña incorrectos');
    }
  }

  function handleUsernameChange(e) {
    setUsername(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  useEffect(function() {
    const intervalo = setInterval(function() {
      setImagenActual(function(actual){
        return (actual+1) % imagenes.length;
      });
    }, 5000);

    return function(){
      clearInterval(intervalo);
    };
    
  }, []);

  return (
    <>
      <Head>
        <title>GranaSAT IoT - Iniciar Sesión</title>
      </Head>

      <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a'}}>
        
        {/* Imágenes de fondo */}
        {imagenes.map(function(imagen, index){
          return(
            <div key={imagen} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${imagen})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: index === imagenActual ? 1 : 0, transition: 'opacity 1.5s ease-in-out', zIndex: 0}}/>
          );
        })}

        {/* Degradado */}
        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.75))', zIndex: 1}}/>

        {/* Contenido */}
        <div style={{position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>

          {/* Navbar */}
          <nav style={{backgroundColor: 'rgba(0,0,0,0.4)', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <img src="/granasat-logo.png" alt="GranaSAT" width={36} height={36} style={{borderRadius: '50%'}}/>
              <span style={{color: 'white', fontWeight: '600', fontSize: '15px'}}>
                GranaSAT
              </span>
            </div>
          </nav>

          {/* Contenido centrado */}
          <main style={{flex: 1, display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            
            <img src="/granasat-logo.png" alt="GranaSAT" width={64} height={64} style={{borderRadius: '50%', marginBottom: '16px'}}/>
            <h1 style={{color: '#e8550a', fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>
              GranaSAT
            </h1>
            <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', margin: '0 0 32px 0'}}>
              Electronics Aerospace Group
            </p>

            <div style={{backgroundColor: 'rgba(28,28,30,0.85)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '32px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '400px'}}>
              <h2 style={{color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0'}}>
                Iniciar Sesión
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '16px'}}>
                  <label htmlFor="usuario" style={{color: '#a0a0a0', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display:'block', marginBottom: '6px'}}>
                    USUARIO
                  </label>
                  <input id="usuario" type="text" value={username} onChange={handleUsernameChange} placeholder='Nombre de usuario' style={{width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box'}}/>
                </div>
                <div style={{marginBottom: '24px'}}>
                  <label htmlFor="contraseña" style={{color: '#a0a0a0', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                    CONTRASEÑA
                  </label>
                  <input id="contraseña" type="password" value={password} onChange={handlePasswordChange} placeholder='Contraseña' style={{width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box'}}/>
                </div>
                {error && error.length>0 && <p style={{color: '#e8550a', fontSize: '13px', margin: '0 0 16px 0'}}>{error}</p>}
                <button type="submit" style={{width: '100%', backgroundColor: '#b33000', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer'}}>
                  Entrar
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}