/**
 * Tests de autenticación — POST /api/auth/login
 *
 * Cubre los casos de login:
 * credenciales correctas, incorrectas y usuario inactivo.
 */
const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/models/index', () => ({}));
jest.mock('../src/services/alertaService', () => ({ procesarAlertas: jest.fn() }));
jest.mock('../src/services/emailService', () => ({ enviarEmailBienvenida: jest.fn(), enviarEmailAlerta: jest.fn() }));
jest.mock('../src/models/LogAcceso', () => ({ create: jest.fn().mockResolvedValue(true), findOne: jest.fn().mockResolvedValue(null) }));
jest.mock('../src/models/Usuario', () => ({ findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() }));

const Usuario = require('../src/models/Usuario');

const USUARIO_MOCK = {
  id: 'uuid-admin-001',
  username: 'admin',
  role: 'ADMIN',
  activo: true,
  comparePassword: jest.fn(),
  update: jest.fn().mockResolvedValue(true),
};

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/login', () => {

  test('devuelve token cuando las credenciales son correctas', async () => {
    Usuario.findOne.mockResolvedValue({ ...USUARIO_MOCK, comparePassword: jest.fn().mockResolvedValue(true) });

    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario).not.toHaveProperty('password_hash');
  });

  test('devuelve 401 cuando la contraseña es incorrecta', async () => {
    Usuario.findOne.mockResolvedValue({ ...USUARIO_MOCK, comparePassword: jest.fn().mockResolvedValue(false) });

    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'incorrecta' });

    expect(res.status).toBe(401);
  });

  test('devuelve 401 cuando el usuario no existe', async () => {
    Usuario.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({ username: 'noexiste', password: '123' });

    expect(res.status).toBe(401);
  });

  test('devuelve 400 cuando faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
    
    expect(res.status).toBe(400);
  });

  test('devuelve 403 cuando el usuario está desactivado', async () => {
    Usuario.findOne.mockResolvedValue({ ...USUARIO_MOCK, activo: false, comparePassword: jest.fn().mockResolvedValue(true) });

    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/health', () => {
  test('devuelve 200 con status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});