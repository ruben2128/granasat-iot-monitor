/**
 * Tests de configuración de alertas — /api/alertas-config
 *
 * Cubre control de acceso por rol, campos obligatorios
 * y validación del operador lógico.
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
jest.mock('../src/models/AlertaConfig', () => ({ findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() }));
jest.mock('../src/models/Dispositivo', () => ({ findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() }));

const AlertaConfig = require('../src/models/AlertaConfig');
const Instalacion  = require('../src/models/Instalacion');
const Dispositivo  = require('../src/models/Dispositivo');

const ID_ADMIN = 'admin-001';
const ID_RESP = 'resp-001';

function token(role, id) {
  return jwt.sign({ id, username: role, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const ALERTA = {
  id: 'alerta-001',
  nombre: 'Alerta temperatura',
  tipo: 'UMBRAL',
  campo: 'temperatura',
  operador: '>',
  umbral: 80,
  instalacion_id: 'inst-001',
  instalacion: { id: 'inst-001', responsable_id: ID_RESP },
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
};

const BODY_VALIDO = {
  instalacion_id: 'inst-001',
  dispositivo_id: 'disp-001',
  tipo: 'UMBRAL',
  nombre: 'Alerta temperatura',
  campo: 'temperatura',
  operador: '>',
  umbral: 80,
};

beforeEach(() => jest.clearAllMocks());

// Listar 
describe('GET /api/alertas-config', () => {

  test('ADMIN obtiene todas las alertas', async () => {
    AlertaConfig.findAll.mockResolvedValue([ALERTA]);
    
    const res = await request(app).get('/api/alertas-config').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/alertas-config');
    
    expect(res.status).toBe(401);
  });
});

// Detalle 
describe('GET /api/alertas-config/:id', () => {

  test('RESPONSABLE no puede ver alertas de instalaciones ajenas', async () => {
    AlertaConfig.findByPk.mockResolvedValue({ ...ALERTA, instalacion: { responsable_id: 'otro-resp' } });
    
    const res = await request(app).get(`/api/alertas-config/${ALERTA.id}`).set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`);
    
    expect(res.status).toBe(403);
  });

  test('devuelve 404 si la alerta no existe', async () => {
    AlertaConfig.findByPk.mockResolvedValue(null);
    
    const res = await request(app).get('/api/alertas-config/no-existe').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(404);
  });
});

// Crear 
describe('POST /api/alertas-config', () => {

  test('ADMIN crea una alerta con datos válidos', async () => {
    Instalacion.findByPk.mockResolvedValue({ id: 'inst-001' });
    Dispositivo.findByPk.mockResolvedValue({id: 'disp-001', instalacion_id: 'inst-001', medida_continuo: true });
    AlertaConfig.create.mockResolvedValue({ id: 'nueva', ...ALERTA });

    const res = await request(app)
      .post('/api/alertas-config')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send(BODY_VALIDO);

    expect(res.status).toBe(201);
  });

  test('RESPONSABLE no puede crear alertas', async () => {
    const res = await request(app)
      .post('/api/alertas-config')
      .set('Authorization', `Bearer ${token('RESPONSABLE', ID_RESP)}`)
      .send(BODY_VALIDO);
    
      expect(res.status).toBe(403);
  });

  test('devuelve 400 si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/alertas-config')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ nombre: 'Sin campos clave' });
    
      expect(res.status).toBe(400);
  });

  test('devuelve 400 si el operador es inválido', async () => {
    const res = await request(app)
      .post('/api/alertas-config')
      .set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`)
      .send({ ...BODY_VALIDO, operador: 'ENTRE' });
    
      expect(res.status).toBe(400);
  });
});

// Eliminar
describe('DELETE /api/alertas-config/:id', () => {

  test('ADMIN puede eliminar una alerta', async () => {
    AlertaConfig.findByPk.mockResolvedValue({ ...ALERTA, destroy: jest.fn().mockResolvedValue(true) });
    
    const res = await request(app).delete(`/api/alertas-config/${ALERTA.id}`).set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(200);
  });

  test('devuelve 404 si la alerta no existe', async () => {
    AlertaConfig.findByPk.mockResolvedValue(null);
    
    const res = await request(app).delete('/api/alertas-config/no-existe').set('Authorization', `Bearer ${token('ADMIN', ID_ADMIN)}`);
    
    expect(res.status).toBe(404);
  });
});