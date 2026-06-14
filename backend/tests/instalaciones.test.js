/**
 * Tests de instalaciones — /api/instalaciones
 *
 * Control de acceso por rol y validaciones de negocio.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('../src/models/index', () => ({}));
jest.mock('../src/models/AlertaHistorial', () => ({ findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), belongsTo: jest.fn() }));
jest.mock('../src/services/alertaService', () => ({ procesarAlertas: jest.fn() }));
jest.mock('../src/services/emailService', () => ({ enviarEmailBienvenida: jest.fn(), enviarEmailAlerta: jest.fn() }));
jest.mock('../src/models/LogAcceso', () => ({ create: jest.fn().mockResolvedValue(true), findOne: jest.fn().mockResolvedValue(null) }));
jest.mock('../src/models/Usuario', () => ({ findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() }));
jest.mock('../src/models/Instalacion', () => ({ findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() }));

const Instalacion = require('../src/models/Instalacion');
const Usuario = require('../src/models/Usuario');

const ID_ADMIN = 'admin-001';
const ID_RESP = 'resp-001';

function token(role, id) {
  return jwt.sign({ id, username: role, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const INST = {
  id: 'inst-001',
  nombre: 'Lab A',
  categoria: 'LABORATORIO',
  responsable_id: ID_RESP,
  update:  jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
};

beforeEach(() => jest.clearAllMocks());

// Listar
describe('GET /api/instalaciones', () => {

  test('ADMIN obtiene todas las instalaciones', async () => {
    Instalacion.findAll.mockResolvedValue([INST]);
    
    const res = await request(app).get('/api/instalaciones').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/instalaciones');
    
    expect(res.status).toBe(401);
  });
});

// Detalle
describe('GET /api/instalaciones/:id', () => {

  test('RESPONSABLE no puede ver instalaciones ajenas', async () => {
    Instalacion.findByPk.mockResolvedValue({ ...INST, responsable_id: 'otro-resp' });
    
    const res = await request(app).get(`/api/instalaciones/${INST.id}`).set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });

  test('devuelve 404 si la instalación no existe', async () => {
    Instalacion.findByPk.mockResolvedValue(null);
    
    const res = await request(app).get('/api/instalaciones/no-existe').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(404);
  });
});

// Crear 
describe('POST /api/instalaciones', () => {

  test('ADMIN puede crear una instalación válida', async () => {
    Instalacion.findOne.mockResolvedValue(null);
    Usuario.findByPk.mockResolvedValue({ id: ID_RESP, role: 'RESPONSABLE' });
    Instalacion.create.mockResolvedValue({ id: 'nueva', ...INST });
    Instalacion.findByPk.mockResolvedValue({ id: 'nueva', ...INST });

    const res = await request(app)
      .post('/api/instalaciones')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ nombre: 'Lab B', categoria: 'LABORATORIO', responsable_id: ID_RESP });

    expect(res.status).toBe(201);
  });

  test('RESPONSABLE no puede crear instalaciones', async () => {
    const res = await request(app)
      .post('/api/instalaciones')
      .set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`)
      .send({ nombre: 'Lab B', categoria: 'LABORATORIO', responsable_id: ID_RESP });
    
      expect(res.status).toBe(403);
  });

  test('devuelve 400 si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/instalaciones')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ nombre: 'Solo nombre' });
    
      expect(res.status).toBe(400);
  });
});

// Eliminar 
describe('DELETE /api/instalaciones/:id', () => {

  test('ADMIN puede eliminar una instalación', async () => {
    Instalacion.findByPk.mockResolvedValue({ ...INST, destroy: jest.fn().mockResolvedValue(true) });
    
    const res = await request(app).delete(`/api/instalaciones/${INST.id}`).set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
  });

  test('RESPONSABLE no puede eliminar instalaciones', async () => {
    const res = await request(app).delete(`/api/instalaciones/${INST.id}`).set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });
});