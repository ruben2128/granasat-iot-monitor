import { useState } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';

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
      console.log('Token guardado: ', token);
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
    <div>
      <h1>GranaSAT IoT</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuario</label>
          <input type="text" value={username} onChange={handleUsernameChange}/>
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={handlePasswordChange}/>
        </div>
        {error && <p>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );

}