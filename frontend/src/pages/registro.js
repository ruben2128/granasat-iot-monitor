import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import Head from 'next/head';

export default function Registro() {
    const router = useRouter();
    const { token } = router.query;

    const [invitacion, setInvitacion] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [cargando, setCargando] = useState(true);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefonoMovil, setTelefonoMovil] = useState('');

    // Verificar token al cargar la página
    useEffect(function() {
        if (!token) return;

        async function verificarToken() {
            try {
                const respuesta = await api.get(`/invitaciones/verificar/${token}`);
                setInvitacion(respuesta.data);
            } catch(err) {
                setError('El enlace de invitación no es válido o ha caducado.');
            } finally {
                setCargando(false);
            }
        }

        verificarToken();
    }, [token]);

    async function handleRegistro(e) {
        e.preventDefault();
        setError('');

        try {
            await api.post('/invitaciones/registro', {
                token,
                username,
                password,
                nombre,
                apellidos,
                telefono_movil: telefonoMovil
            });

            setExito('Registro completado correctamente. Redirigiendo...');
            setTimeout(function() { router.push('/'); }, 2000);

        } catch(err) {
            setError(err.response?.data?.error || 'Error al completar el registro');
        }
    }

    if (cargando) {
        return <p style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Verificando invitación...</p>;
    }

    if (error && !invitacion) {
        return (
            <div style={{ backgroundColor: '#0f1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#1a1a2e', borderRadius: '12px', padding: '40px', maxWidth: '400px', textAlign: 'center' }}>
                    <p style={{ color: '#f87171', fontSize: '16px' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head><title>GranaSAT - Registro</title></Head>
            <div style={{ backgroundColor: '#0f1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#1a1a2e', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '480px', border: '1px solid #2a2a3e' }}>
                    <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 8px 0' }}>Completar registro</h1>
                    <p style={{ color: '#a0a0a0', fontSize: '13px', margin: '0 0 24px 0' }}>
                        Email: <strong style={{ color: 'white' }}>{invitacion?.email}</strong> · Rol: <strong style={{ color: 'white' }}>{invitacion?.role}</strong>
                    </p>

                    {exito && <p style={{ color: '#4ade80', fontSize: '13px', margin: '0 0 16px 0' }}>{exito}</p>}
                    {error && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 16px 0' }}>{error}</p>}

                    <form onSubmit={handleRegistro}>
                        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: 'NOMBRE', value: nombre, setter: setNombre, type: 'text' },
                                { label: 'APELLIDOS', value: apellidos, setter: setApellidos, type: 'text' },
                                { label: 'USUARIO', value: username, setter: setUsername, type: 'text', required: true },
                                { label: 'CONTRASEÑA', value: password, setter: setPassword, type: 'password', required: true },
                                { label: 'TELÉFONO MÓVIL', value: telefonoMovil, setter: setTelefonoMovil, type: 'text' }
                            ].map(function(campo) {
                                return (
                                    <div key={campo.label}>
                                        <label style={{ color: 'white', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                            {campo.label}
                                        </label>
                                        <input
                                            type={campo.type}
                                            value={campo.value}
                                            onChange={function(e) { campo.setter(e.target.value); }}
                                            required={campo.required || false}
                                            style={{ width: '100%', backgroundColor: '#0f1117', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <button type="submit" style={{ width: '100%', backgroundColor: '#e85d04', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                            Crear cuenta
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}