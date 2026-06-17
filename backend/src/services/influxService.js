const { InfluxDB } = require('@influxdata/influxdb-client')

// Cliente de InfluxDB configurado con los credenciales del .env
const cliente = new InfluxDB({
    url: process.env.INFLUX_URL,
    token: process.env.INFLUX_TOKEN
});

const queryAPI = cliente.getQueryApi(process.env.INFLUX_ORG);
const BUCKET = process.env.INFLUX_BUCKET;

// Para poder usar async y await de forma consistente, debemos de envolver queryRows en un Promise ya que usa internamente callbacks
function ejecutarQuery(query){
    const resultados = [];

    return new Promise((resolve, reject) => {
        queryAPI.queryRows(query, {
            next(row, tableMeta){
                resultados.push(tableMeta.toObject(row));
            },
            error(err){
                reject(err);
            },
            complete(){
                resolve(resultados);
            }
        });
    });
}

/*
    Consulta el historial de lecturas de un dispositivo en InfluxDB
*/
async function obtenerLecturas(mac, rango = '-24h', variable = null){
    const filtroVariable = variable ? `|> filter(fn: (r) => r["_field"] == "${variable}")` : '';

    const query = `from(bucket: "${BUCKET}") |> range(start: ${rango}) |> filter(fn: (r) => r["_measurement"] == "radiacion_iot")
    |> filter(fn: (r) => r["mac"] == "${mac}") ${filtroVariable} |> sort(columns: ["_time"], desc: true)
    `;

    const filas = await ejecutarQuery(query);

    return filas.map(f => ({ 
            time: f._time, 
            variable: f._field, 
            valor: f._value, 
            mac: f.mac, 
            ip: f.ip, 
            hw_version: f.hw_version, 
            fw_version: f.fw_version
        })
    );
}


/*
    Devuelve el ultimo valor registrado de cada variable del dispositivo
*/
async function obtenerUltimaLectura(mac){
    const query = `from(bucket: "${BUCKET}") |> range(start: -24h) |> filter(fn: (r) => r["_measurement"] == "radiacion_iot")
        |> filter(fn: (r) => r["mac"] == "${mac}") |> last()`;
    
    const filas = await ejecutarQuery(query);

    const resultado = {};
    
    filas.forEach(f => 
        {
            resultado[f._field] = {
                valor: f._value, 
                time: f._time
            };
        }
    );

    return resultado;
}

/*
    Comprobar si el dispositivo esta activo según si ha enviado alguna lectura en los ultimos 10 minutos
 */
async function testConexionDispositivo(mac){
    try{
        const lecturas = await obtenerLecturas(mac, '-3m', 'radiacion');

        return {
            activo: lecturas.length > 0,
            ultimaLectura: lecturas.length > 0 ? lecturas[0].time : null
        };
    } catch(err){
        return { activo: false, ultimaLectura: null};
    }
}


module.exports = {obtenerLecturas, obtenerUltimaLectura,testConexionDispositivo};
