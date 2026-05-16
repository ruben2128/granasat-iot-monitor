const temaOscuro = {
    fondo: '#0a0a0a', 
    tarjeta: '#1c1c1e',
    borde: '#2c2c2e',
    texto: '#a0a0a0', 
    textoSecundario: '#a0a0a0',
    acento: '#e8550a',
    acentoBoton: '#b33000',
    navbar: '#1c1c1e',
    textoNavbar: '#ffffff',
};

const temaClaro = {  
    fondo: '#f5f5f5',
    tarjeta: '#ffffff',
    borde: '#e0e0e0',
    texto: '#1a1a1a',
    textoSecundario: '#666666',
    acento: '#c93d00',
    acentoBoton: '#b33000',
    navbar: '#ffffff',
};

const temaAltoContraste = {
    fondo: '#000000',
    tarjeta: '#111111',
    navbar: '#111111',
    borde: '#ffffff',
    texto: '#ffffff',
    textoSecundario: '#ffffff',
    textoNavbar: '#ffffff',
    acento: '#ffff00',
    acentoBoton: '#1a1a1a'
}

const temaAzul = {
    fondo: '#0d1b2a',
    tarjeta: '#1b2838',
    navbar: '#1b2838',
    borde: '#2a4a6b',
    texto: '#e8f4fd',
    textoSecundario: '#a0c4e0',
    textoNavbar: '#e8f4fd',
    acento: '#4fc3f6',
    acentoBoton: '#01579b'
}

function obtenerColores(tema){
    if(tema === 'claro'){
        return temaClaro;
    }

    if(tema === 'altoContraste'){
        return temaAltoContraste;
    }

    if(tema === 'azul'){
        return temaAzul;
    }

    return temaOscuro;
}

module.exports = {temaOscuro, temaClaro, temaAltoContraste, temaAzul, obtenerColores};