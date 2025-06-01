// Obtiene los datos de simulación y promedios almacenados en localStorage en objeto
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
function calcularDistribucionLlegadas(resultados) { //resultados es un objeto con los resultados de la función anterior
    const distribucion = [0, 0, 0, 0, 0, 0]; //de 0 a 5 (cada indice representa un numero de llegadas nocturnas, en la [0] es de cuantas veces hubo 0 llegadas...)
    resultados.forEach(dia => {
        const llegadas = dia.llegadasNocturnas;
        if (llegadas >= 0 && llegadas <= 5) {
            distribucion[llegadas]++; //contador (suma 1 en la posicion en base al numero de la llegada). el dice> sumele 1 a esa posicion
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

// Calcula la utilización diaria del servidor (descargas/capacidad máxima)
function calcularUtilizacionServidor(resultados, capacidadMaxima = 5) {
    return resultados.map(dia => (dia.descargas / capacidadMaxima));
}

// Calcula los tiempos promedio en cola y en el sistema por día
function calcularTiemposColaSistema(resultados) {
    // Tiempo en cola: retrasos del día anterior
    // Tiempo en sistema: tiempo en cola + 1 (día de servicio)
    return resultados.map(dia => ({
        cola: dia.retrasosDiaAnterior,
        sistema: dia.retrasosDiaAnterior + 1
    }));
}

// Inicializa los gráficos con los datos obtenidos y muestra los costos calculados
function inicializarGraficos() {
    // Obtener datos de simulación y promedios desde localStorage
    const datos = obtenerDatosSimulacion();
    if (!datos) return;

    const { resultados, promedios } = datos;

    // Calcular métricas para gráficos
    const distribucionLlegadas = calcularDistribucionLlegadas(resultados);
    const retrasosDiarios = extraerRetrasosDiarios(resultados);
    const descargasDiarias = extraerDescargasDiarias(resultados);

    // Definición de costos asociados (quedan sujetos a cambio si se prefiere)
    const costoPorRetraso = 100; // Costo en USD por barcaza retrasada por día
    const costoOperacion = 50;   // Costo en USD por cada operación de descarga
    const costoFijoDiario = 200; // Costo fijo diario (personal, energía, etc.)

    // Calcular costos totales
    const totalRetrasos = resultados.reduce((acc, dia) => acc + dia.retrasosDiaAnterior, 0);
    const totalDescargas = resultados.reduce((acc, dia) => acc + dia.descargas, 0);
    const diasSimulados = resultados.length;

    const costoTotalRetrasos = totalRetrasos * costoPorRetraso;
    const costoTotalOperacion = totalDescargas * costoOperacion;
    const costoFijoTotal = diasSimulados * costoFijoDiario;
    const costoGlobal = costoTotalRetrasos + costoTotalOperacion + costoFijoTotal;

    // Actualiza los valores promedio en la interfaz
    document.getElementById('promedioRetrasos').textContent = promedios.promedioRetrasos;
    document.getElementById('promedioLlegadas').textContent = promedios.promedioLlegadas;
    document.getElementById('promedioDescargas').textContent = promedios.promedioDescargas;

    // Actualiza los valores de costos asociados en la interfaz
    document.getElementById('costoRetrasos').textContent = costoPorRetraso.toFixed(2);
    document.getElementById('costoTotal').textContent = costoTotalRetrasos.toFixed(2);
    document.getElementById('costoOperacion').textContent = costoOperacion.toFixed(2);
    document.getElementById('costoTotalOperacion').textContent = costoTotalOperacion.toFixed(2);
    document.getElementById('costoFijo').textContent = costoFijoDiario.toFixed(2);
    document.getElementById('costoFijoTotal').textContent = costoFijoTotal.toFixed(2);
    document.getElementById('costoGlobal').textContent = costoGlobal.toFixed(2);

    // --- Gráficos ---
    // Gráfico de barras para los promedios diarios
    const ctxBar = document.getElementById('promediosBarChart').getContext('2d');
    new Chart(ctxBar, { //Crea un nuevo gráfico sobre el canvas(en html).
        type: 'bar',
        data: {
            // Eje X: Tipos de métricas
            labels: ['Retrasos', 'Llegadas', 'Descargas'],
            datasets: [{
                label: 'Promedio Diario',
                data: [ //valores de las barras
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
                y: { beginAtZero: true }, // beginAtZero: true, hace que las barras empiecen desde 0.
            },
        },
    });

    // Gráfico de área para la distribución de llegadas nocturnas
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

    // --- NUEVO: Utilización del servidor diaria ---
    const utilizacionDiaria = calcularUtilizacionServidor(resultados, 5);
    const ctxUtil = document.getElementById('utilizacionServidorChart').getContext('2d');
    new Chart(ctxUtil, {
        type: 'line',
        data: {
            labels: Array.from({ length: utilizacionDiaria.length }, (_, i) => i + 1),
            datasets: [{
                label: 'Utilización del Servidor',
                data: utilizacionDiaria,
                fill: true,
                backgroundColor: 'rgba(79,209,197,0.18)',
                borderColor: '#4fd1c5',
                tension: 0.2,
                pointRadius: 3
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1, // Límite superior: 100%
                    ticks: {
                        callback: function(value) { return (value * 100).toFixed(0) + '%'; } // convierte 0.6 → 60%, etc.
                    }
                }
            }
        }
    });

    // --- NUEVO: Tiempos promedio en cola y en el sistema ---
    const tiempos = calcularTiemposColaSistema(resultados);
    const tiemposCola = tiempos.map(t => t.cola);
    const tiemposSistema = tiempos.map(t => t.sistema);
    const ctxTiempos = document.getElementById('tiemposPromedioChart').getContext('2d');
    new Chart(ctxTiempos, {
        type: 'line',
        data: {
            labels: Array.from({ length: tiemposCola.length }, (_, i) => i + 1),
            datasets: [
                {
                    label: 'Tiempo en Cola',
                    data: tiemposCola,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255,99,132,0.13)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 3
                },
                {
                    label: 'Tiempo en el Sistema',
                    data: tiemposSistema,
                    borderColor: '#2b6cb0',
                    backgroundColor: 'rgba(43,108,176,0.10)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 3
                }
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Mostrar comparación de periodos en gráfico de barras
function mostrarComparacionPeriodos() {
    //preparamos los datos 
    const periodos = JSON.parse(localStorage.getItem('periodosSimulacion') || '{}');
    if (!periodos.periodo1 || !periodos.periodo2) return;

    const labels = ['Llegadas', 'Descargas', 'Retrasos', 'Costos'];
    const data1 = [ // creacion de arreglos 
        periodos.periodo1.llegadas,
        periodos.periodo1.descargas,
        periodos.periodo1.retrasos,
        periodos.periodo1.costo
    ];
    const data2 = [
        periodos.periodo2.llegadas,
        periodos.periodo2.descargas,
        periodos.periodo2.retrasos,
        periodos.periodo2.costo
    ];

    //creacion del grafico
    const ctx = document.getElementById('comparacionPeriodosChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Periodo 1 (${periodos.rango1.inicio}-${periodos.rango1.fin})`,
                    data: data1,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)'
                },
                {
                    label: `Periodo 2 (${periodos.rango2.inicio}-${periodos.rango2.fin})`,
                    data: data2,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Mostrar rangos de días
    document.getElementById('infoPeriodos').innerHTML =
        `<strong>Periodo 1:</strong> Días ${periodos.rango1.inicio} a ${periodos.rango1.fin} &nbsp; | &nbsp; 
         <strong>Periodo 2:</strong> Días ${periodos.rango2.inicio} a ${periodos.rango2.fin}`;
}

// Función para mostrar los gráficos al hacer scroll con animación 
function setupScrollAnimation() {
    const charts = document.querySelectorAll('.chart-container');

    const observer = new IntersectionObserver(entries => { //detecta cuándo un elemento entra en la vista del usuario (cuando hacemos scroll).
        entries.forEach(entry => { //Esto asigna el observador a cada uno de los elementos .chart-container.
            if (entry.isIntersecting) { //¿Está siendo visible en pantalla?
                entry.target.classList.add('visible'); //le agrega la clase visible al gráfico para que se anime o se muestre.
                observer.unobserve(entry.target); //Deja de observar ese gráfico después de que ya apareció para no repetir la animacion.
            }
        });
    }, {
        threshold: 0.1  //Ejecuta la función de observación cuando al menos el 10% del elemento esté visible en pantalla
    });

    charts.forEach(chart => {
        observer.observe(chart); //le dice al navegador QUÉ elementos observar
    });
}

// Inicializa los gráficos y la animación al cargar la página
window.onload = () => {
    inicializarGraficos();
    setupScrollAnimation();
    mostrarComparacionPeriodos();
};
