// Obtiene los datos de simulación y promedios almacenados en localStorage
function obtenerDatosSimulacion() {
    const resultados = localStorage.getItem('resultadosSimulacion');
    const promedios = localStorage.getItem('promediosSimulacion');
    if (!resultados || !promedios) {
        mostrarModal('No se encontraron datos de simulación. Por favor, genere la simulación primero.');
        return null;
    }

    // Función para mostrar un modal con mensaje
    function mostrarModal(mensaje) {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = 1000;

        // Crear modal
        const modal = document.createElement('div');
        modal.style.backgroundColor = '#fff';
        modal.style.padding = '20px';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        modal.style.maxWidth = '400px';
        modal.style.textAlign = 'center';

        // Crear mensaje
        const msg = document.createElement('p');
        msg.textContent = mensaje;
        msg.style.marginBottom = '20px';
        msg.style.fontSize = '16px';
        msg.style.color = '#333';

        // Crear botón cerrar
        const btnCerrar = document.createElement('button');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.style.padding = '8px 16px';
        btnCerrar.style.backgroundColor = '#06444d';
        btnCerrar.style.color = 'white';
        btnCerrar.style.border = 'none';
        btnCerrar.style.borderRadius = '4px';
        btnCerrar.style.cursor = 'pointer';

        btnCerrar.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        modal.appendChild(msg);
        modal.appendChild(btnCerrar);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
    return {
        resultados: JSON.parse(resultados),
        promedios: JSON.parse(promedios),
    };
}

// Calcula la distribución de llegadas nocturnas a partir de los resultados
function calcularDistribucionLlegadas(resultados) {
    const distribucion = [0, 0, 0, 0, 0, 0];
    resultados.forEach(dia => {
        const llegadas = dia.llegadasNocturnas;
        if (llegadas >= 0 && llegadas <= 5) {
            distribucion[llegadas]++;
        }
    });
    return distribucion;
}

// Extrae los retrasos diarios de los resultados
function extraerRetrasosDiarios(resultados) {
    return resultados.map(dia => dia.retrasosDiaAnterior);
}

// Extrae las descargas diarias de los resultados
function extraerDescargasDiarias(resultados) {
    return resultados.map(dia => dia.descargas);
}

// Inicializa los gráficos con los datos obtenidos y muestra los costos calculados
function inicializarGraficos() {
    const datos = obtenerDatosSimulacion();
    if (!datos) return;

    const { resultados, promedios } = datos;

    const distribucionLlegadas = calcularDistribucionLlegadas(resultados);
    const retrasosDiarios = extraerRetrasosDiarios(resultados);
    const descargasDiarias = extraerDescargasDiarias(resultados);

    const costoPorRetraso = 100; // Costo en USD por barcaza retrasada por día

    // Actualiza los valores promedio en la interfaz
    document.getElementById('promedioRetrasos').textContent = promedios.promedioRetrasos;
    document.getElementById('promedioLlegadas').textContent = promedios.promedioLlegadas;
    document.getElementById('promedioDescargas').textContent = promedios.promedioDescargas;

    // Gráfico de barras para los promedios diarios
    const ctxBar = document.getElementById('promediosBarChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Retrasos', 'Llegadas', 'Descargas'],
            datasets: [{
                label: 'Promedio Diario',
                data: [
                    parseFloat(promedios.promedioRetrasos),
                    parseFloat(promedios.promedioLlegadas),
                    parseFloat(promedios.promedioDescargas),
                ],
                backgroundColor: ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1,
            }],
        },
        options: {
            scales: {
                y: { beginAtZero: true },
            },
        },
    });

    // Gráfico de área para la distribución de llegadas 
    const ctxArea = document.getElementById('llegadasPieChart').getContext('2d');
    new Chart(ctxArea, {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5'],
            datasets: [{
                label: 'Distribución Llegadas',
                data: distribucionLlegadas,
                fill: true,
                backgroundColor: 'rgba(0, 128, 0, 0.3)',
                borderColor: 'rgba(0, 128, 0, 1)',
                tension: 0.3,
            }],
        },
        options: {
            scales: {
                y: { beginAtZero: true, stepSize: 1 },
            },
        },
    });

    // Gráfico de líneas para los retrasos diarios
    const ctxLine = document.getElementById('retrasosLineChart').getContext('2d');
    new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: Array.from({ length: retrasosDiarios.length }, (_, i) => i + 1),
            datasets: [{
                label: 'Retrasos Diarios',
                data: retrasosDiarios,
                fill: false,
                borderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.1,
            }],
        },
    });

    // Gráfico de barras para las descargas diarias
    const ctxColumn = document.getElementById('descargasColumnChart').getContext('2d');
    new Chart(ctxColumn, {
        type: 'bar',
        data: {
            labels: Array.from({ length: descargasDiarias.length }, (_, i) => i + 1),
            datasets: [{
                label: 'Descargas Diarias',
                data: descargasDiarias,
                backgroundColor: 'rgba(64, 224, 208, 0.7)',
                borderColor: 'rgba(64, 224, 208, 1)',
                borderWidth: 1,
            }],
        },
        options: {
            scales: {
                y: { beginAtZero: true },
            },
        },
    });

    // Muestra los costos calculados en la interfaz
    const costoRetrasosElem = document.getElementById('costoRetrasos');
    const costoTotalElem = document.getElementById('costoTotal');

    costoRetrasosElem.textContent = costoPorRetraso.toFixed(2);
    const costoTotal = parseFloat(promedios.promedioRetrasos) * costoPorRetraso * resultados.length;
    costoTotalElem.textContent = costoTotal.toFixed(2);
}

// Función para mostrar los gráficos al hacer scroll con animación 
function setupScrollAnimation() {
    const charts = document.querySelectorAll('.chart-container');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    charts.forEach(chart => {
        observer.observe(chart);
    });
}

// Inicializa los gráficos y la animación al cargar la página
window.onload = () => {
    inicializarGraficos();
    setupScrollAnimation();
};
