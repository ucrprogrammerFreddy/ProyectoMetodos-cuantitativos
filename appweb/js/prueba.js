/**
 * Elimina una fila de la tabla cuando se hace clic en el botón "Eliminar".
 * @param {HTMLElement} btn - El botón que fue clickeado.
 */
function eliminarFila(btn) {
    const fila = btn.parentNode.parentNode;
    fila.remove();
}

/**
 * Agrega una nueva fila editable a la tabla especificada.
 * @param {string} tablaId - El ID de la tabla donde se agregará la fila.
 */
function agregarFila(tablaId) {
    const tabla = document.getElementById(tablaId).getElementsByTagName("tbody")[0];
    const fila = tabla.insertRow();
    for (let i = 0; i < 4; i++) {
        const celda = fila.insertCell();
        celda.contentEditable = true;
        celda.innerText = "";
    }
    const celdaBoton = fila.insertCell();
    const boton = document.createElement("button");
    boton.innerText = "Eliminar";
    boton.onclick = () => eliminarFila(boton);
    celdaBoton.appendChild(boton);
}

/**
 * Muestra u oculta el mensaje de advertencia según el estado de la simulación.
 */
function actualizarMensajeAdvertencia() {
    const mensajeAdvertencia = document.getElementById('mensajeAdvertencia');
    const resultados = localStorage.getItem('resultadosSimulacion');
    const promedios = localStorage.getItem('promediosSimulacion');
    if (resultados && promedios) {
        mensajeAdvertencia.style.display = 'none';
    } else {
        mensajeAdvertencia.style.display = 'block';
    }
}

//mensaje
//const mensajeAdvertencia = `Por favor, genere primero la simulación para poder ver los resultados.`;

/**
 * Habilita los botones de resultados y oculta el mensaje de advertencia.
 */
function habilitarBotonesResultados() {
    document.getElementById('btnModalResultados').disabled = false;
    document.getElementById('btnVerResultados').disabled = false;
    actualizarMensajeAdvertencia();
}

/**
 * Deshabilita los botones de resultados y muestra el mensaje de advertencia.
 */
function deshabilitarBotonesResultados() {
    document.getElementById('btnModalResultados').disabled = true;
    document.getElementById('btnVerResultados').disabled = true;
    //actualizarMensajeAdvertencia();
}

/**
 * Genera la simulación de llegadas y descargas, actualizando la tabla y calculando promedios.
 */
function generarSimulacion() {
    const min = parseInt(document.getElementById("rangoMin").value);
    const max = parseInt(document.getElementById("rangoMax").value);
    const dias = parseInt(document.getElementById("dias").value);
    const tbody = document.getElementById("tablaSimulacion").querySelector("tbody");
    tbody.innerHTML = "";

    let retrasosAnterior = 0;
    let totalRetrasos = 0, totalLlegadas = 0, totalDescargas = 0;

    const resultadosDiarios = [];

    for (let i = 1; i <= dias; i++) {
        const rLlegada = Math.floor(Math.random() * (max - min + 1)) + min;
        const rDescarga = Math.floor(Math.random() * (max - min + 1)) + min;
        const llegadas = calcularLlegadas(rLlegada);
        const totalADescargar = retrasosAnterior + llegadas;
        const descargas = Math.min(totalADescargar, calcularDescargas(rDescarga));

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${i}</td>
            <td contenteditable="true">${retrasosAnterior}</td>
            <td>${rLlegada}</td>
            <td contenteditable="true">${llegadas}</td>
            <td>${totalADescargar}</td>
            <td contenteditable="true">${rDescarga}</td>
            <td>${descargas}</td>
            `;
        tbody.appendChild(fila);

        resultadosDiarios.push({
            dia: i,
            retrasosDiaAnterior: retrasosAnterior,
            numeroAleatorioLlegadas: rLlegada,
            llegadasNocturnas: llegadas,
            totalADescargar: totalADescargar,
            numeroAleatorioDescargas: rDescarga,
            descargas: descargas,
        });

        retrasosAnterior = totalADescargar - descargas;
        totalRetrasos += retrasosAnterior;
        totalLlegadas += llegadas;
        totalDescargas += descargas;
    }
    actualizarTotales(totalRetrasos, totalLlegadas, totalDescargas, dias);

    // Guardar resultados y promedios en localStorage para resultados.html
    const promedios = {
        promedioRetrasos: (totalRetrasos / dias).toFixed(2),
        promedioLlegadas: (totalLlegadas / dias).toFixed(2),
        promedioDescargas: (totalDescargas / dias).toFixed(2),
    };
    localStorage.setItem('resultadosSimulacion', JSON.stringify(resultadosDiarios));
    localStorage.setItem('promediosSimulacion', JSON.stringify(promedios));

    // Calcular y guardar métricas por periodo para comparación
    calcularPeriodosYGuardar(resultadosDiarios);

    // Habilitar botones y ocultar mensaje de advertencia
    habilitarBotonesResultados();

    observarCambios();
}

/**
 * Calcula el número de llegadas basado en un valor aleatorio.
 * @param {number} valor - Valor aleatorio para determinar llegadas.
 * @returns {number} Número de llegadas.
 */
function calcularLlegadas(valor) {
    if (valor <= 13) return 0;
    if (valor <= 30) return 1;
    if (valor <= 45) return 2;
    if (valor <= 70) return 3;
    if (valor <= 90) return 4;
    return 5;
}

/**
 * Calcula el número de descargas basado en un valor aleatorio.
 * @param {number} valor - Valor aleatorio para determinar descargas.
 * @returns {number} Número de descargas.
 */
function calcularDescargas(valor) {
    if (valor <= 5) return 1;
    if (valor <= 20) return 2;
    if (valor <= 70) return 3;
    if (valor <= 90) return 4;
    return 5;
}

/**
 * Actualiza los totales y promedios en la tabla y modal.
 * @param {number} retrasos - Total de retrasos.
 * @param {number} llegadas - Total de llegadas.
 * @param {number} descargas - Total de descargas.
 * @param {number} dias - Número de días simulados.
 */
function actualizarTotales(retrasos, llegadas, descargas, dias) {
    document.getElementById("totalRetrasos").textContent = retrasos;
    document.getElementById("totalLlegadas").textContent = llegadas;
    document.getElementById("totalDescargas").textContent = descargas;
    // document.getElementById("promedioRetrasos").textContent = (retrasos / dias).toFixed(2);   esto se llena en el evento q tiene el click del boton q abre el mmodal
    // document.getElementById("promedioLlegadas").textContent = (llegadas / dias).toFixed(2);
    // document.getElementById("promedioDescargas").textContent = (descargas / dias).toFixed(2);
}

/**
 * Observa cambios en las celdas editables para recalcular totales.
 */
function observarCambios() {
    const tbody = document.querySelector("#tablaSimulacion tbody");

    tbody.querySelectorAll("td[contenteditable=true]").forEach(cell => {
        cell.addEventListener("input", recalcular);
        cell.addEventListener("blur", recalcular);
        cell.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.blur(); // Forzar salida para disparar evento
            }
        });
    });
}

/**
 * Recalcula los totales y actualiza la tabla y modal.
 */
function recalcular() {
    const tbody = document.querySelector("#tablaSimulacion tbody");
    let totalRetrasos = 0, totalLlegadas = 0, totalDescargas = 0;

    Array.from(tbody.rows).forEach(row => {

        //se convierten los textos de las celdas en numero
        const prev  = parseInt(row.cells[1].innerText) || 0; // Retrasos día anterior
        const lleg  = parseInt(row.cells[3].innerText) || 0; // Llegadas nocturnas
        const rDesc = parseInt(row.cells[5].innerText) || 0; // Número aleatorio de descargas

        const total = prev + lleg; //total que hay q descargar ese dia
        const descargas = total > 0 ? Math.min(total, calcularDescargas(rDesc)) : 0;

        row.cells[4].textContent = total;      // se pone en la celda el Total a descargar 
        row.cells[6].textContent = descargas;  // se pone en la celda Número de descargas


        totalRetrasos += prev;
        totalLlegadas += lleg;
        totalDescargas += descargas;
    });

    actualizarTotales(totalRetrasos, totalLlegadas, totalDescargas, tbody.rows.length);
}

/**
 * Divide los resultados diarios en dos periodos y calcula métricas por periodo.
 * Guarda los datos en localStorage para su uso en resultados.html.
 */
function calcularPeriodosYGuardar(resultadosDiarios, costoPorRetraso = 100) {
    const totalDias = resultadosDiarios.length;
    const mitad = Math.ceil(totalDias / 2);

    const periodo1 = resultadosDiarios.slice(0, mitad); //inicio, fin-1
    const periodo2 = resultadosDiarios.slice(mitad); //de la mitad en adelante

    function calcularMetrica(periodo) {
        let llegadas = 0, descargas = 0, retrasos = 0;
        periodo.forEach(dia => {
            llegadas += dia.llegadasNocturnas;
            descargas += dia.descargas;
            retrasos += dia.retrasosDiaAnterior;
        });
        return {
            llegadas,
            descargas,
            retrasos,
            costo: retrasos * costoPorRetraso
        };
    }

    const metrica1 = calcularMetrica(periodo1);
    const metrica2 = calcularMetrica(periodo2);

    localStorage.setItem('periodosSimulacion', JSON.stringify({
        periodo1: metrica1,
        periodo2: metrica2,
        rango1: { inicio: 1, fin: mitad },
        rango2: { inicio: mitad + 1, fin: totalDias }
    }));
}

// // Eventos para botones y modal
// document.getElementById('btnGenerar').addEventListener('click', () => {
//     generarSimulacion();
// });

// Control del modal para mostrar resultados promedio
document.getElementById('btnModalResultados').addEventListener('click', () => {
    const promedios = JSON.parse(localStorage.getItem('promediosSimulacion')); //guarda un objeto con los promedios
    if (promedios) {
        document.getElementById('promedioRetrasos').textContent = promedios.promedioRetrasos;
        document.getElementById('promedioLlegadas').textContent = promedios.promedioLlegadas;
        document.getElementById('promedioDescargas').textContent = promedios.promedioDescargas;
        const modalElement = document.getElementById('staticBackdrop');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        // Limpiar datos numéricos si no hay simulación
        document.getElementById('promedioRetrasos').textContent = '';
        document.getElementById('promedioLlegadas').textContent = '';
        document.getElementById('promedioDescargas').textContent = '';
        alert('Por favor, genere primero la simulación para poder ver los resultados.');
    }
});

// Control para abrir la página de resultados solo si hay datos válidos
document.getElementById('btnVerResultados').addEventListener('click', () => {
    const resultados = localStorage.getItem('resultadosSimulacion');
    const promedios = localStorage.getItem('promediosSimulacion');
    if (resultados && promedios) {
        window.open('resultados.html', '_blank');
    } else {
        alert('Por favor, genere primero la simulación para poder ver los resultados.');
    }
});

// Inicialmente deshabilitar botones y mostrar mensaje de advertencia
window.onload = () => {
    deshabilitarBotonesResultados();
};

// Habilitar botones y ocultar mensaje de advertencia al generar simulación
document.getElementById('btnGenerar').addEventListener('click', () => {
    generarSimulacion();
    document.getElementById('btnModalResultados').disabled = false;
    document.getElementById('btnVerResultados').disabled = false;
    const mensajeAdvertencia = document.getElementById('mensajeAdvertencia');
    mensajeAdvertencia.style.display = 'none';
});
