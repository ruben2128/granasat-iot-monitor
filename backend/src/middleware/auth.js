const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
function authenticateToken(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        hint: 'Incluye el header: Authorization: Bearer <token>'
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          error: 'Token inválido o expirado'
        });
      }

      // Añadir información del usuario a req
      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Error en authenticateToken:', error);
    res.status(500).json({
      error: 'Error al verificar token'
    });
  }
}

/**
 * Middleware para verificar que el usuario sea ADMIN
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo administradores pueden realizar esta acción'
    });
  }
  next();
}

/**
 * Middleware para verificar que el usuario sea ADMIN o RESPONSABLE
 */
function requireAuth(req, res, next) {
  if (!['ADMIN', 'RESPONSABLE'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Acceso denegado'
    });
  }
  next();
}

module.exports = {authenticateToken, requireAdmin,requireAuth};
