const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, path.join(__dirname, '../../uploads/avatares'));
    },
    filename: function(req, file, cb){
        // Nombre unico: timestamp + id usuario + extensión original
        const extension = path.extname(file.originalname);
        cb(null, `avatar_${req.params.id}_${Date.now()}${extension}`);
    }
});

const fileFilter = function(req, file, cb){
    // Solo imagenes
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if(tiposPermitidos.includes(file.mimetype)){
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'), false);
    }
};

const upload = multer({storage,fileFilter,limits: { fileSize: 2 * 1024 * 1024 } /* 2MB máximo*/ });

module.exports = upload;