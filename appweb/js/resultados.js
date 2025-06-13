// =====================
// Muestra un modal si no hay datos (UI amigable)
// =====================
function mostrarModal(mensaje) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = 1000;

  const modal = document.createElement("div");
  modal.style.backgroundColor = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  modal.style.maxWidth = "400px";
  modal.style.textAlign = "center";

  const msg = document.createElement("p");
  msg.textContent = mensaje;
  msg.style.marginBottom = "20px";
  msg.style.fontSize = "16px";
  msg.style.color = "#333";

  const btnCerrar = document.createElement("button");
  btnCerrar.textContent = "Cerrar";
  btnCerrar.style.padding = "8px 16px";
  btnCerrar.style.backgroundColor = "#06444d";
  btnCerrar.style.color = "white";
  btnCerrar.style.border = "none";
  btnCerrar.style.borderRadius = "4px";
  btnCerrar.style.cursor = "pointer";

  btnCerrar.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  modal.appendChild(msg);
  modal.appendChild(btnCerrar);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// =====================
// Obtiene los datos de simulación y promedios almacenados en localStorage en objeto
// =====================
function obtenerDatosSimulacion() {
  const resultados = localStorage.getItem("resultadosSimulacion");
  const promedios = localStorage.getItem("promediosSimulacion");
  if (!resultados || !promedios) {
    mostrarModal(
      "No se encontraron datos de simulación. Por favor, genere la simulación primero."
    );
    return null;
  }
  return {
    resultados: JSON.parse(resultados),
    promedios: JSON.parse(promedios),
  };
}

// =====================
// Calcula la distribución de llegadas nocturnas a partir de los resultados
// =====================

/*
Kattia revise:

function calcularDistribucionLlegadas(resultados) { //resultados es un objeto con los resultados de la función anterior
  const distribucion = [0, 0, 0, 0, 0, 0]; //de 0 a 5 (cada indice representa un numero de llegadas nocturnas, en la [0] es de cuantas veces hubo 0 llegadas...)
  resultados.forEach(dia => {
    const llegadas = dia.llegadasNocturnas;
    if (llegadas >= 0 && llegadas <= 5) {
      distribucion[llegadas]++; //contador (suma 1 en la posicion en base al numero de la llegada)
    }
  });
  return distribucion;
}
*/

// Versión actualizada para soportar más de 5 llegadas nocturnas
function calcularDistribucionLlegadas(resultados) {
  // Calcula el máximo de llegadas nocturnas para soportar cualquier rango
  let maxLlegadas = 5;
  if (resultados.length > 0) {
    maxLlegadas = resultados.reduce((max, dia) => Math.max(max, dia.llegadasNocturnas), 0);
    if (maxLlegadas < 5) maxLlegadas = 5;
  }
  const distribucion = Array(maxLlegadas + 1).fill(0);
  resultados.forEach(dia => {
    const llegadas = dia.llegadasNocturnas;
    if (llegadas >= 0 && llegadas <= maxLlegadas) {
      distribucion[llegadas]++;
    }
  });
  return distribucion;
}

// =====================
// Extrae los retrasos diarios de los resultados
// =====================
function extraerRetrasosDiarios(resultados) {
  return resultados.map((dia) => dia.retrasosDiaAnterior);
}

// =====================
// Extrae las descargas diarias de los resultados
// =====================
function extraerDescargasDiarias(resultados) {
  return resultados.map((dia) => dia.descargas);
}

// =====================
// Calcula la utilización diaria del servidor (descargas/capacidad máxima)
// =====================
function calcularUtilizacionServidor(resultados, capacidadMaxima = 5) {
  return resultados.map((dia) => dia.descargas / capacidadMaxima);
}

// =====================
// Calcula los tiempos promedio en cola y en el sistema por día
// =====================
function calcularTiemposColaSistema(resultados) {
  // Tiempo en cola: retrasos del día anterior
  // Tiempo en sistema: tiempo en cola + 1 (día de servicio)
  return resultados.map((dia) => ({
    cola: dia.retrasosDiaAnterior,
    sistema: dia.retrasosDiaAnterior + 1,
  }));
}

// =====================
// LLENA LA SECCIÓN DE COSTOS ASOCIADOS CON LOS DATOS DE 'prueba' Y LOS MISMOS COSTOS
// =====================
function llenarCostosAsociados() {
  const datos = obtenerDatosSimulacion();
  if (!datos) return;
  const { resultados } = datos;

  // Ahora los costos son los mismos que en prueba.js
  const costoPorRetraso = 800; // Por barcaza retrasada por día
  const costoOperacion = 500; // Por operación de descarga
  const costoFijoDiario = 25000; // Costo fijo diario

  // Cálculos a partir de los datos simulados
  const totalRetrasos = resultados.reduce(
    (acc, dia) => acc + (dia.retrasosDiaAnterior || 0),
    0
  );
  const totalDescargas = resultados.reduce(
    (acc, dia) => acc + (dia.descargas || 0),
    0
  );
  const diasSimulados = resultados.length;

  const costoTotalRetrasos = totalRetrasos * costoPorRetraso;
  const costoTotalOperacion = totalDescargas * costoOperacion;
  const costoFijoTotal = diasSimulados * costoFijoDiario;
  const costoGlobal = costoTotalRetrasos + costoTotalOperacion + costoFijoTotal;

  document.getElementById("costoRetrasos").textContent =
    costoPorRetraso.toFixed(2);
  document.getElementById("costoTotal").textContent =
    costoTotalRetrasos.toFixed(2);
  document.getElementById("costoOperacion").textContent =
    costoOperacion.toFixed(2);
  document.getElementById("costoTotalOperacion").textContent =
    costoTotalOperacion.toFixed(2);
  document.getElementById("costoFijo").textContent = costoFijoDiario.toFixed(2);
  document.getElementById("costoFijoTotal").textContent =
    costoFijoTotal.toFixed(2);
  document.getElementById("costoGlobal").textContent = costoGlobal.toFixed(2);
}

// =====================
// Inicializa los gráficos con los datos obtenidos y muestra los costos calculados
// =====================
function inicializarGraficos() {
  // Obtener datos de simulación y promedios desde localStorage
  const datos = obtenerDatosSimulacion();
  if (!datos) return;

  const { resultados, promedios } = datos;
  const totalDias = resultados.length;

  // Llenar sección "Costos Asociados"
  llenarCostosAsociados();

  // Calcular métricas para gráficos y promedios
  const distribucionLlegadas = calcularDistribucionLlegadas(resultados);
  const sumaFrecuenciasLlegadas = distribucionLlegadas.reduce((a, b) => a + b, 0);
  const retrasosDiarios = extraerRetrasosDiarios(resultados);
  const descargasDiarias = extraerDescargasDiarias(resultados);

  // Mostrar promedios en la tarjeta de resultados promedio
  document.getElementById("promedioRetrasos").textContent =
    promedios.promedioRetrasos;
  document.getElementById("promedioLlegadas").textContent =
    promedios.promedioLlegadas;
  document.getElementById("promedioDescargas").textContent =
    promedios.promedioDescargas;

  // --- Gráficos ---
  //Gráfico de barras para los promedios diarios
  const ctxBar = document.getElementById("promediosBarChart").getContext("2d");
  new Chart(ctxBar, { //Crea un nuevo gráfico sobre el canvas(en html).
    type: "bar",
    data: {
      // Eje X: Tipos de métricas
      labels: ["Retrasos", "Llegadas", "Descargas"],
      datasets: [
        {
          label: "Promedio Diario",
          data: [ //valores de las barras
            parseFloat(promedios.promedioRetrasos),
            parseFloat(promedios.promedioLlegadas),
            parseFloat(promedios.promedioDescargas),
          ],
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(75, 192, 192, 0.7)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Promedios Diarios de Retrasos, Llegadas y Descargas",
          font: { size: 18 }
        },
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Categoría",
            font: { size: 15 }
          }
        },
        y: {
          beginAtZero: true, // beginAtZero: true, hace que las barras empiecen desde 0.
          title: {
            display: true,
            text: "Cantidad Promedio",
            font: { size: 15 }
          }
        }
      },
    },
  });

  // --- Gráfico de líneas: Llegadas nocturnas por día 
  const llegadasNocturnasPorDia = resultados.map(dia => dia.llegadasNocturnas);
  const ctxArea = document.getElementById("llegadasPieChart").getContext("2d");
  new Chart(ctxArea, {
    type: "line",
    data: {
      labels: resultados.map((_, i) => `Día ${i + 1}`),
      datasets: [
        {
          label: "Llegadas Nocturnas",
          data: llegadasNocturnasPorDia,
          fill: true,
          backgroundColor: "rgba(0, 128, 0, 0.3)",
          borderColor: "rgba(0, 128, 0, 1)",
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Llegadas Nocturnas por Día",
          font: { size: 18 }
        },
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: ctx => ` Día ${ctx.label}: ${ctx.parsed.y} llegadas nocturnas`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Día de Simulación",
            font: { size: 15 }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Cantidad de Llegadas Nocturnas",
            font: { size: 15 }
          },
          ticks: { stepSize: 1 }
        }
      },
    },
  });
  // Mostrar info debajo del gráfico
  if (!document.getElementById("infoDistribucionLlegadas")) {
    const info = document.createElement("div");
    info.id = "infoDistribucionLlegadas";
    info.style = "margin-top:8px;font-size:14px;color:#06444d;text-align:center;";
    ctxArea.canvas.parentNode.appendChild(info);
  }
  document.getElementById("infoDistribucionLlegadas").textContent =
    `Total de días simulados: ${totalDias} | Suma de frecuencias: ${sumaFrecuenciasLlegadas}`;

  // --- Gráfico de líneas para los retrasos diarios 
  const ctxLine = document.getElementById("retrasosLineChart").getContext("2d");
  const maxRetrasos = Math.max(...retrasosDiarios, 0);
  new Chart(ctxLine, {
    type: "line",
    data: {
      labels: Array.from({ length: retrasosDiarios.length }, (_, i) => i + 1),
      datasets: [
        {
          label: "Retrasos Diarios",
          data: retrasosDiarios,
          fill: false,
          borderColor: "rgba(255, 99, 132, 1)",
          tension: 0.1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Retrasos Diarios",
          font: { size: 18 }
        },
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Día",
            font: { size: 15 }
          }
        },
        y: {
          beginAtZero: true,
          max: maxRetrasos > 0 ? Math.max(maxRetrasos, 5) : undefined,
          title: {
            display: true,
            text: "Cantidad de Barcazas Retrasadas",
            font: { size: 15 }
          }
        }
      },
    },
  });
  // Info debajo del gráfico
  if (!document.getElementById("infoRetrasosDiarios")) {
    const info = document.createElement("div");
    info.id = "infoRetrasosDiarios";
    info.style = "margin-top:8px;font-size:14px;color:#06444d;text-align:center;";
    ctxLine.canvas.parentNode.appendChild(info);
  }
  document.getElementById("infoRetrasosDiarios").textContent =
    `Total de días simulados: ${totalDias}`;

  // --- Gráfico de barras para las descargas diarias 
  const ctxColumn = document
    .getElementById("descargasColumnChart")
    .getContext("2d");
  const maxDescargas = Math.max(...descargasDiarias, 0);
  new Chart(ctxColumn, {
    type: "bar",
    data: {
      labels: Array.from({ length: descargasDiarias.length }, (_, i) => i + 1),
      datasets: [
        {
          label: "Descargas Diarias",
          data: descargasDiarias,
          backgroundColor: "rgba(64, 224, 208, 0.7)",
          borderColor: "rgba(64, 224, 208, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Descargas Diarias",
          font: { size: 18 }
        },
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Día",
            font: { size: 15 }
          }
        },
        y: {
          beginAtZero: true,
          max: maxDescargas > 0 ? Math.max(maxDescargas, 5) : undefined,
          title: {
            display: true,
            text: "Cantidad de Barcazas Descargadas",
            font: { size: 15 }
          }
        }
      },
    },
  });
  if (!document.getElementById("infoDescargasDiarias")) {
    const info = document.createElement("div");
    info.id = "infoDescargasDiarias";
    info.style = "margin-top:8px;font-size:14px;color:#06444d;text-align:center;";
    ctxColumn.canvas.parentNode.appendChild(info);
  }
  document.getElementById("infoDescargasDiarias").textContent =
    `Total de días simulados: ${totalDias}`;

  // --- Utilización del servidor diaria
  const utilizacionDiaria = calcularUtilizacionServidor(resultados, 5);
  const ctxUtil = document
    .getElementById("utilizacionServidorChart")
    .getContext("2d");
  new Chart(ctxUtil, {
    type: "line",
    data: {
      labels: Array.from({ length: utilizacionDiaria.length }, (_, i) => i + 1),
      datasets: [
        {
          label: "Utilización del Servidor",
          data: utilizacionDiaria,
          fill: true,
          backgroundColor: "rgba(79,209,197,0.18)",
          borderColor: "#4fd1c5",
          tension: 0.2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Utilización del Servidor Diaria",
          font: { size: 18 }
        },
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Día",
            font: { size: 15 }
          }
        },
        y: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: "Porcentaje de Utilización",
            font: { size: 15 }
          },
          ticks: {
            callback: function (value) {
              return (value * 100).toFixed(0) + "%";
            },
          },
        },
      },
    },
  });
  if (!document.getElementById("infoUtilizacionServidor")) {
    const info = document.createElement("div");
    info.id = "infoUtilizacionServidor";
    info.style = "margin-top:8px;font-size:14px;color:#06444d;text-align:center;";
    ctxUtil.canvas.parentNode.appendChild(info);
  }
  document.getElementById("infoUtilizacionServidor").textContent =
    `Total de días simulados: ${totalDias}`;

  // --- Tiempos promedio en cola y en el sistema 
  const tiempos = calcularTiemposColaSistema(resultados);
  const tiemposCola = tiempos.map((t) => t.cola);
  const tiemposSistema = tiempos.map((t) => t.sistema);
  const ctxTiempos = document
    .getElementById("tiemposPromedioChart")
    .getContext("2d");
  const maxTiempos = Math.max(...tiemposCola.concat(tiemposSistema), 0);
  new Chart(ctxTiempos, {
    type: "line",
    data: {
      labels: Array.from({ length: tiemposCola.length }, (_, i) => i + 1),
      datasets: [
        {
          label: "Tiempo en Cola",
          data: tiemposCola,
          borderColor: "#ff6384",
          backgroundColor: "rgba(255,99,132,0.13)",
          fill: true,
          tension: 0.2,
          pointRadius: 3,
        },
        {
          label: "Tiempo en el Sistema",
          data: tiemposSistema,
          borderColor: "#2b6cb0",
          backgroundColor: "rgba(43,108,176,0.10)",
          fill: true,
          tension: 0.2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Tiempos Promedio en Cola y en el Sistema",
          font: { size: 18 }
        },
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Día",
            font: { size: 15 }
          }
        },
        y: {
          beginAtZero: true,
          max: maxTiempos > 0 ? Math.max(maxTiempos, 5) : undefined,
          title: {
            display: true,
            text: "Tiempo (días)",
            font: { size: 15 }
          }
        }
      },
    },
  });
  if (!document.getElementById("infoTiemposPromedio")) {
    const info = document.createElement("div");
    info.id = "infoTiemposPromedio";
    info.style = "margin-top:8px;font-size:14px;color:#06444d;text-align:center;";
    ctxTiempos.canvas.parentNode.appendChild(info);
  }
  document.getElementById("infoTiemposPromedio").textContent =
    `Total de días simulados: ${totalDias}`;
}

// =====================
// Mostrar comparación de periodos en gráfico de barras
// =====================
function mostrarComparacionPeriodos() {
  //preparamos los datos 
  const periodos = JSON.parse(
    localStorage.getItem("periodosSimulacion") || "{}"
  );
  if (!periodos.periodo1 || !periodos.periodo2) return;

  const labels = ["Llegadas", "Descargas", "Retrasos", "Costos"];
  const data1 = [ // creacion de arreglos
    periodos.periodo1.llegadas,
    periodos.periodo1.descargas,
    periodos.periodo1.retrasos,
    periodos.periodo1.costo,
  ];
  const data2 = [
    periodos.periodo2.llegadas,
    periodos.periodo2.descargas,
    periodos.periodo2.retrasos,
    periodos.periodo2.costo,
  ];

  //creacion del grafico
  const ctx = document
    .getElementById("comparacionPeriodosChart")
    .getContext("2d");
    new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Periodo 1 (${periodos.rango1.inicio} - ${periodos.rango1.fin})`,
          data: data1,
          backgroundColor: "rgba(54, 162, 235, 0.7)",
        },
        {
          label: `Periodo 2 (${periodos.rango2.inicio} - ${periodos.rango2.fin})`,
          data: data2,
          backgroundColor: "rgba(255, 99, 132, 0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "Comparación por Periodos",
          font: { size: 20 }
        },
        subtitle: {
          display: true,
          text: `Compara el total de cada métrica entre dos periodos definidos. Pase el cursor sobre las barras para ver los valores exactos.`,
          font: { size: 14 }
        },
        tooltip: {
          callbacks: {
            title: ctx => {
              // Muestra la métrica y el periodo
              const metric = ctx[0].label;
              const datasetLabel = ctx[0].dataset.label;
              return `${metric} - ${datasetLabel}`;
            },
            label: ctx => {
              // Formatea el valor con separador de miles y etiqueta
              let val = ctx.parsed.y;
              if (ctx.label === "Costos") {
                val = "$" + val.toLocaleString();
              }
              return ` Total: ${val}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Métrica" }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Valor Total" }
        }
      }
    }
  });

  // Mejor presentación de rangos y resumen debajo del gráfico, usando clases para estilos en CSS
  document.getElementById("infoPeriodos").innerHTML = `
    <div class="periodos-comparacion-resumen">
      <div class="periodo-bloque periodo1">
        <div class="periodo-titulo">Periodo 1: <span class="periodo-rango">Días ${periodos.rango1.inicio} a ${periodos.rango1.fin}</span></div>
        <div class="periodo-metricas">
          <span class="metrica-label">Llegadas:</span> <span class="metrica-valor">${data1[0]}</span>
          <span class="metrica-label">Descargas:</span> <span class="metrica-valor">${data1[1]}</span>
          <span class="metrica-label">Retrasos:</span> <span class="metrica-valor">${data1[2]}</span>
          <span class="metrica-label">Costos:</span> <span class="metrica-valor">$${data1[3].toLocaleString()}</span>
        </div>
      </div>
      <div class="periodo-bloque periodo2">
        <div class="periodo-titulo">Periodo 2: <span class="periodo-rango">Días ${periodos.rango2.inicio} a ${periodos.rango2.fin}</span></div>
        <div class="periodo-metricas">
          <span class="metrica-label">Llegadas:</span> <span class="metrica-valor">${data2[0]}</span>
          <span class="metrica-label">Descargas:</span> <span class="metrica-valor">${data2[1]}</span>
          <span class="metrica-label">Retrasos:</span> <span class="metrica-valor">${data2[2]}</span>
          <span class="metrica-label">Costos:</span> <span class="metrica-valor">$${data2[3].toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div class="periodos-comparacion-ayuda">
      Esta comparación ayuda a identificar tendencias o cambios significativos entre los periodos seleccionados.
    </div>
  `;
}

// =====================
// Función para mostrar los gráficos al hacer scroll con animación
// =====================
function setupScrollAnimation() {
  const charts = document.querySelectorAll(".chart-container");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  charts.forEach((chart) => {
    observer.observe(chart);
  });
}

// =====================
// Inicializa los gráficos y la animación al cargar la página
// =====================
window.onload = () => {
  inicializarGraficos();
  setupScrollAnimation();
  mostrarComparacionPeriodos();
};

// =====================
// Actualización automática al detectar cambios en localStorage (evento storage)
// =====================
window.addEventListener("storage", function (e) {
  if (
    e.key === "resultadosSimulacion" ||
    e.key === "promediosSimulacion" ||
    e.key === "periodosSimulacion"
  ) {
    // Recarga los gráficos y métricas si los datos cambian en otra pestaña
    inicializarGraficos();
    mostrarComparacionPeriodos();
  }
});
