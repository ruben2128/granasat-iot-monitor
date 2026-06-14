/**
 * Tests de dispositivos — /api/dispositivos
 *
 * Cubre control de acceso por rol y las validaciones
 * más importantes del negocio (formato MAC, duplicados).
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('../src/models/index',  () => ({}));
jest.mock('../src/models/AlertaHistorial', () => ({ findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), belongsTo: jest.fn() }));
jest.mock('../src/services/alertaService', () => ({ procesarAlertas: jest.fn() }));
jest.mock('../src/services/emailService', () => ({ enviarEmailBienvenida: jest.fn(), enviarEmailAlerta: jest.fn() }));
jest.mock('../src/services/influxService', () => ({ testConexionDispositivo: jest.fn(), obtenerLecturas: jest.fn() }));
jest.mock('../src/models/LogAcceso', () => ({ create: jest.fn().mockResolvedValue(true), findOne: jest.fn().mockResolvedValue(null) }));
jest.mock('../src/models/Usuario', () => ({ findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() }));
jest.mock('../src/models/Instalacion', () => ({ findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() }));
jest.mock('../src/models/Dispositivo', () => ({ findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() }));

const Dispositivo = require('../src/models/Dispositivo');
const Instalacion = require('../src/models/Instalacion');

const ID_ADMIN = 'admin-001';
const ID_RESP  = 'resp-001';
const MAC      = 'AA:BB:CC:DD:EE:FF';

function token(role, id) {
  return jwt.sign({ id, username: role, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const DISP = {
  id: 'disp-001',
  nombre: 'Sensor A',
  mac_address: MAC,
  instalacion_id: 'inst-001',
  instalacion: { id: 'inst-001', responsable_id: ID_RESP },
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
};

beforeEach(() => jest.clearAllMocks());

// Listar
describe('GET /api/dispositivos', () => {

  test('ADMIN obtiene todos los dispositivos', async () => {
    Dispositivo.findAll.mockResolvedValue([DISP]);

    const res = await request(app).get('/api/dispositivos').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/dispositivos');
    
    expect(res.status).toBe(401);
  });
});

// Detalle
describe('GET /api/dispositivos/:id', () => {

  test('RESPONSABLE no puede ver dispositivos de instalaciones ajenas', async () => {
    Dispositivo.findByPk.mockResolvedValue({ ...DISP, instalacion: { responsable_id: 'otro-resp' } });
    
    const res = await request(app).get(`/api/dispositivos/${DISP.id}`).set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });

  test('devuelve 404 si el dispositivo no existe', async () => {
    Dispositivo.findByPk.mockResolvedValue(null);
    
    const res = await request(app).get('/api/dispositivos/no-existe').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(404);
  });
});

// Crear
describe('POST /api/dispositivos', () => {

  test('ADMIN crea un dispositivo con datos válidos', async () => {
    Dispositivo.findOne.mockResolvedValue(null);
    Instalacion.findByPk.mockResolvedValue({ id: 'inst-001', responsable_id: ID_RESP });
    Dispositivo.create.mockResolvedValue({ id: 'nuevo', ...DISP });
    Dispositivo.findByPk.mockResolvedValue({ id: 'nuevo', ...DISP });

    const res = await request(app)
      .post('/api/dispositivos')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ mac_address: MAC, nombre: 'Sensor B', instalacion_id: 'inst-001' });

    expect(res.status).toBe(201);
  });

  test('devuelve 400 si el formato de MAC es inválido', async () => {
    const res = await request(app)
      .post('/api/dispositivos')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ mac_address: 'mac-invalida', nombre: 'Sensor' });
    expect(res.status).toBe(400);
  });

  test('devuelve 409 si la MAC ya está registrada', async () => {
    Dispositivo.findOne.mockResolvedValue(DISP);
    const res = await request(app)
      .post('/api/dispositivos')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ mac_address: MAC, nombre: 'Duplicado' });
    expect(res.status).toBe(409);
  });
});

// Eliminar
describe('DELETE /api/dispositivos/:id', () => {

  test('ADMIN puede eliminar un dispositivo', async () => {
    Dispositivo.findByPk.mockResolvedValue({ ...DISP, destroy: jest.fn().mockResolvedValue(true) });
    
    const res = await request(app).delete(`/api/dispositivos/${DISP.id}`).set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
  });

  test('RESPONSABLE no puede eliminar dispositivos', async () => {
    const res = await request(app).delete(`/api/dispositivos/${DISP.id}`).set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });
});