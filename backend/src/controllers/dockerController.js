const {exec} = require('child_process');

async function obtenerEspacioDocker(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({error: 'No tienes permiso'});
        }
        const rutaData = process.env.HOME + '/Escritorio/tig/data';  // TO-DO ADAPTAR A PROD

        exec(`du -sh ${rutaData}/*`, function(error,stdout, stderr){           

            if(!stdout || stdout.trim === ''){
                return res.json({volumenes: [], error: 'No se pudo obtener el espacio'});
            }

            const volumenes = stdout.trim().split('\n').map(function(linea){
                const partes = linea.split('\t');
                return {
                    nombre: partes[1] ? partes[1].split('/').pop().replace('/', '') : '-',
                    tamanio: partes[0] || '-'
                };
            });

            res.json({ volumenes });
        });
    } catch (error){
        console.error('Error al obtener espacio Docker:', error);
        res.status(500).json({ error: 'Error al obtener el espacio'});
    }
}

module.exports = { obtenerEspacioDocker };