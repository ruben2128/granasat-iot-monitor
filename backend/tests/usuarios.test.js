/**
 * Tests de gestión de usuarios — /api/usuarios
 *
 * Cubre solo ADMIN puede listar/ver usuarios,
 * y la restricción de no poder desactivarse a uno mismo.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('../src/models/index',() => ({}));
jest.mock('../src/models/AlertaHistorial', () => ({ findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), belongsTo: jest.fn() }));
jest.mock('../src/services/alertaService', () => ({ procesarAlertas: jest.fn() }));
jest.mock('../src/services/emailService', () => ({ enviarEmailBienvenida: jest.fn(), enviarEmailAlerta: jest.fn() }));
jest.mock('../src/models/LogAcceso', () => ({ create: jest.fn().mockResolvedValue(true), findOne: jest.fn().mockResolvedValue(null) }));
jest.mock('../src/models/Usuario', () => ({ findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() }));

const Usuario = require('../src/models/Usuario');

const ID_ADMIN = 'admin-001';
const ID_RESP = 'resp-001';

function token(role, id) {
  return jwt.sign({ id, username: role, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const USUARIO_RESP = {
  id: ID_RESP,
  username: 'responsable1',
  role: 'RESPONSABLE',
  activo: true,
  update: jest.fn().mockResolvedValue(true),
};

beforeEach(() => jest.clearAllMocks());

// Listar 
describe('GET /api/usuarios', () => {

  test('ADMIN puede listar todos los usuarios', async () => {
    Usuario.findAll.mockResolvedValue([USUARIO_RESP]);
    
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('RESPONSABLE no puede listar usuarios', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });
});

//  Activar/Desactivar 
describe('PATCH /api/usuarios/:id/estado', () => {

  test('ADMIN puede desactivar a otro usuario', async () => {
    Usuario.findByPk.mockResolvedValue({ ...USUARIO_RESP, update: jest.fn().mockResolvedValue(true) });

    const res = await request(app)
      .patch(`/api/usuarios/${ID_RESP}/estado`)
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);

    expect(res.status).toBe(200);
  });

  test('ADMIN no puede desactivarse a sí mismo', async () => {
    // El id del token y el del parámetro coinciden
    Usuario.findByPk.mockResolvedValue({ id: ID_ADMIN, activo: true, update: jest.fn() });

    const res = await request(app)
      .patch(`/api/usuarios/${ID_ADMIN}/estado`)
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ti mismo/i);
  });

  test('RESPONSABLE no puede cambiar el estado de usuarios', async () => {
    const res = await request(app)
      .patch(`/api/usuarios/${ID_ADMIN}/estado`)
      .set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });

  test('devuelve 404 si el usuario no existe', async () => {
    Usuario.findByPk.mockResolvedValue(null);
   
    const res = await request(app)
      .patch('/api/usuarios/no-existe/estado')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);

    expect(res.status).toBe(404);
  });
});