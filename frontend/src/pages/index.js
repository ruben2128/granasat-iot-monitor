import { useState } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e){
    e.preventDefault();
    try{
      const respuesta = await api.post('/auth/login', {username, password});
      const token = respuesta.data.token;
      const usuario = respuesta.data.usuario;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario))
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

  return (
    <>
      <Head>
        <title>GranaSAT IoT - Iniciar Sesión</title>
      </Head>

      <div style={{backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
        
        {/*Navbar simple sin usuario*/}
        <nav style={{backgroundColor: '#1c1c1e', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #2c2c2e'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <img src="/granasat-logo.png" alt="GranaSAT" width={36} height={36} style={{borderRadius: '50%'}}/>
            <span style={{color: 'white', fontWeight: '600', fontSize: '15px'}}>
              GranaSAT
            </span>
          </div>
        </nav>

        {/*Contenido centrado*/}
        <main style={{flex: 1, display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          
          {/*Logo y título*/}
          <img src="/granasat-logo.png" alt="GranaSAT" width={64} height={64} style={{borderRadius: '50%', marginBottom: '16px'}}/>
          <h1 style={{color: '#c93d00', fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0'}}>
            GranaSAT
          </h1>
          <p style={{color: '#a0a0a0', fontSize: '12px', fontWeight: '700' ,letterSpacing: '2px', margin: '0 0 32px 0'}}>
            Electronics Aerospace Group
          </p>

          {/*Formulario*/}
          <div style={{backgroundColor: '#1c1c1e', borderRadius: '12px', padding: '32px', border: '1px solid #2c2c2e', width: '100%', maxWidth: '400px'}}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0'}}> 
              Iniciar Sesión
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{marginBottom: '16px'}}>
                <label htmlFor="usuario" style={{color: '#a0a0a0', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display:'block', marginBottom: '6px'}}>
                  USUARIO
                </label>
                <input id="usuario" type="text" value={username} onChange={handleUsernameChange} placeholder='Nombre de usuario' style={{width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box'}}/>
              </div>
              <div style={{marginBottom: '24px'}}>
                <label htmlFor="contraseña" style={{color: '#a0a0a0', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px'}}>
                  CONTRASEÑA
                </label>
                <input id="contraseña" type="password" value={password} onChange={handlePasswordChange} placeholder='Contraseña' style={{width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #2c2c2e', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box'}}/>
              </div>
              {error && error.length>0 && <p style={{color: '#c93d00', fontSize: '13px', margin: '0 0 16px 0'}}>{error}</p>}
              <button type="submit" style={{width: '100%', backgroundColor: '#c93d00', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer'}}>
                Entrar
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );

}