// Obtiene los datos de simulación almacenados en localStorage
function getSimData() {
  const resultados = JSON.parse(localStorage.getItem("resultadosSimulacion") || "[]");
  const promedios = JSON.parse(localStorage.getItem("promediosSimulacion") || "{}");
  const periodos = JSON.parse(localStorage.getItem("periodosSimulacion") || "{}");
  const nombreEmpresa = localStorage.getItem("nombreEmpresa") || "";
  return { resultados, promedios, periodos, nombreEmpresa };
}

// Evento para alternar modo oscuro en el dashboard
document.addEventListener("DOMContentLoaded", function() {
  const darkBtn = document.getElementById('toggle-darkmode');
  if (darkBtn) {
    darkBtn.onclick = function () {
      document.body.classList.toggle('darkmode');
    };
  }
});

// Muestra los valores clave en las tarjetas principales del dashboard
function mostrarResumen() {
  const { promedios, resultados, nombreEmpresa } = getSimData();
  // Muestra el nombre de la empresa si existe
  document.getElementById("empresaNombre").textContent = nombreEmpresa ? `Empresa: ${nombreEmpresa}` : "";
  document.getElementById("promedioRetrasos").textContent = promedios.promedioRetrasos || "-";
  document.getElementById("promedioLlegadas").textContent = promedios.promedioLlegadas || "-";
  document.getElementById("promedioDescargas").textContent = promedios.promedioDescargas || "-";
  // Calcula el costo total y barcazas perdidas
  let costoGlobal = "-";
  let totalPerdidas = "-";
  if (resultados.length > 0) {
    const costoPorRetraso = 800, costoOperacion = 500, costoFijoDiario = 25000, costoPorPerdida = 5000;
    const totalRetrasos = resultados.reduce((acc, d) => acc + (d.retrasosDiaAnterior || 0), 0);
    const totalDescargas = resultados.reduce((acc, d) => acc + (d.descargas || 0), 0);
    const diasSimulados = resultados.length;
    // Calcula barcazas perdidas
    let cola = [], barcazasPerdidas = 0;
    resultados.forEach(dia => {
      for (let i = 0; i < dia.llegadasNocturnas; i++) cola.push(0);
      cola = cola.map(e => e + 1);
      cola = cola.slice(dia.descargas);
      const antes = cola.length;
      cola = cola.filter(e => e <= 3);
      barcazasPerdidas += (antes - cola.length);
    });
    totalPerdidas = barcazasPerdidas;
    costoGlobal = (totalRetrasos * costoPorRetraso) + (totalDescargas * costoOperacion) + (diasSimulados * costoFijoDiario) + (barcazasPerdidas * costoPorPerdida);
  }
  document.getElementById("costoGlobal").textContent = costoGlobal;
  document.getElementById("totalPerdidas").textContent = totalPerdidas;
}

// Muestra los riesgos detectados en la simulación
function mostrarRiesgos() {
  const { resultados } = getSimData();
  const riesgosDiv = document.getElementById("riesgosDetectados");
  riesgosDiv.innerHTML = "";
  if (!resultados.length) return;
  let riesgos = [];
  let diasRetraso = [];
  resultados.forEach((dia, idx) => {
    if (dia.retrasosDiaAnterior > 0) {
      diasRetraso.push(idx + 1);
    } else {
      if (diasRetraso.length >= 3) {
        riesgos.push(`⚠️ Congestión en días ${diasRetraso[0]} a ${diasRetraso[diasRetraso.length - 1]}`);
      }
      diasRetraso = [];
    }
  });
  if (diasRetraso.length >= 3) {
    riesgos.push(`⚠️ Congestión en días ${diasRetraso[0]} a ${diasRetraso[diasRetraso.length - 1]}`);
  }
  resultados.forEach((dia, idx) => {
    if (dia.llegadasNocturnas > 2 * dia.descargas) {
      riesgos.push(`⚠️ Día ${idx + 1}: Llegadas (${dia.llegadasNocturnas}) mucho mayores a descargas (${dia.descargas})`);
    }
  });
  if (riesgos.length === 0) {
    riesgosDiv.innerHTML = "<li>No se detectaron riesgos significativos.</li>";
  } else {
    riesgos.forEach(msg => {
      const li = document.createElement("li");
      li.textContent = msg;
      riesgosDiv.appendChild(li);
    });
  }
}

// Renderiza los gráficos principales del dashboard
function mostrarGraficos() {
  const { resultados, promedios, periodos } = getSimData();
  const totalDias = resultados.length;
  // Limpia los gráficos antes de renderizar
  ['barChart', 'pieChart', 'retrasosChart', 'utilizacionChart'].forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      const parent = canvas.parentNode;
      parent.innerHTML = `<canvas id="${id}"></canvas>`;
    }
  });
  if (!resultados.length) {
    ['barChart', 'pieChart', 'retrasosChart', 'utilizacionChart'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        canvas.parentNode.innerHTML = '<p class="no-data-msg">No hay datos disponibles.</p>';
      }
    });
    return;
  }
  // Gráfico de barras: Promedios diarios
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: ['Retrasos', 'Llegadas', 'Descargas'],
      datasets: [{
        label: 'Promedio Diario',
        data: [
          parseFloat(promedios.promedioRetrasos || 0),
          parseFloat(promedios.promedioLlegadas || 0),
          parseFloat(promedios.promedioDescargas || 0)
        ],
        backgroundColor: ['#ff6384', '#36a2eb', '#4fd1c5']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Promedios Diarios de Retrasos, Llegadas y Descargas' },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Categoría (Tipo de Métrica)' }
        },
        y: { 
          beginAtZero: true, 
          title: { display: true, text: 'Valor Promedio por Día' },
          ticks: {
            precision: 2
          }
        }
      }
    }
  });

  // Gráfico de líneas: Llegadas nocturnas por día 
  const llegadasNocturnasPorDia = resultados.map(dia => dia.llegadasNocturnas);
  new Chart(document.getElementById('pieChart'), {
    type: 'line',
    data: {
      labels: resultados.map((_, i) => `Día ${i + 1}`),
      datasets: [{
        label: 'Llegadas Nocturnas',
        data: llegadasNocturnasPorDia,
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54,162,235,0.13)',
        fill: true,
        tension: 0.2,
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Llegadas Nocturnas por Día' },
        tooltip: {
          callbacks: {
            label: ctx => ` Día ${ctx.label}: ${ctx.parsed.y} llegadas nocturnas`
          }
        }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Día de Simulación' }
        },
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'Cantidad de Llegadas Nocturnas' },
          ticks: { stepSize: 1 }
        }
      }
    }
  });

  // Gráfico de líneas: Retrasos diarios
  const retrasosDiarios = resultados.map(d => d.retrasosDiaAnterior);
  const maxRetrasos = Math.max(...retrasosDiarios, 0);
  new Chart(document.getElementById('retrasosChart'), {
    type: 'line',
    data: {
      labels: resultados.map((_, i) => `Día ${i + 1}`),
      datasets: [{
        label: 'Retrasos',
        data: retrasosDiarios,
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255,99,132,0.13)',
        fill: true,
        tension: 0.2,
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Retrasos Diarios por Día' },
        tooltip: {
          callbacks: {
            label: ctx => ` Día ${ctx.label}: ${ctx.parsed.y} barcazas retrasadas`
          }
        }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Día de Simulación' }
        },
        y: {
          beginAtZero: true,
          max: maxRetrasos > 0 ? Math.max(maxRetrasos, 5) : undefined,
          title: { display: true, text: 'Cantidad de Barcazas Retrasadas' },
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Gráfico de líneas: Utilización del servidor diaria
  const utilizacion = resultados.map(d => d.descargas / 5);
  new Chart(document.getElementById('utilizacionChart'), {
    type: 'line',
    data: {
      labels: resultados.map((_, i) => `Día ${i + 1}`),
      datasets: [{
        label: 'Utilización',
        data: utilizacion,
        borderColor: '#4fd1c5',
        backgroundColor: 'rgba(79,209,197,0.18)',
        fill: true,
        tension: 0.2,
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Utilización del Servidor por Día' },
        tooltip: {
          callbacks: {
            label: ctx => ` Día ${ctx.label}: ${(ctx.parsed.y * 100).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Día de Simulación' }
        },
        y: {
          beginAtZero: true,
          max: 1,
          title: { display: true, text: 'Porcentaje de Utilización (%)' },
          ticks: {
            callback: function (value) {
              return (value * 100).toFixed(0) + "%";
            }
          }
        }
      }
    }
  });
}

// Muestra la recomendación final y el resumen ejecutivo
function mostrarDecisionYResumen() {
  const { resultados, promedios } = getSimData();
  let decision = "No hay suficientes datos para una recomendación.";
  let resumen = "No hay datos de simulación cargados.";
  let sugerencias = [];

  if (resultados.length) {
    // Calcula barcazas perdidas
    const perdidas = (() => {
      let cola = [], barcazasPerdidas = 0;
      resultados.forEach(dia => {
        for (let i = 0; i < dia.llegadasNocturnas; i++) cola.push(0);
        cola = cola.map(e => e + 1);
        cola = cola.slice(dia.descargas);
        const antes = cola.length;
        cola = cola.filter(e => e <= 3);
        barcazasPerdidas += (antes - cola.length);
      });
      return barcazasPerdidas;
    })();

    const promedioUtil = resultados.reduce((acc, d) => acc + (d.descargas / 5), 0) / resultados.length;
    const promedioRetrasos = parseFloat(promedios.promedioRetrasos || 0);
    const promedioLlegadas = parseFloat(promedios.promedioLlegadas || 0);
    const promedioDescargas = parseFloat(promedios.promedioDescargas || 0);

    // Lógica de recomendación automática
    if (perdidas === 0 && promedioUtil > 0.85 && promedioRetrasos < 1) {
      decision = `<span style="color:#36a2eb;font-weight:700;"><i class="fas fa-check-circle"></i> El sistema está funcionando de manera óptima.</span><br>
      <span style="color:#4fd1c5;">Mantenga la configuración actual y monitoree periódicamente.</span>`;
    } else if (perdidas > 0) {
      decision = `<span style="color:#d9534f;font-weight:700;"><i class="fas fa-exclamation-triangle"></i> Se detectan pérdidas de barcazas.</span><br>
      <span style="color:#fbbf24;">Aumente la capacidad de descarga o reduzca la variabilidad de llegadas.</span>`;
    } else if (promedioRetrasos > 2) {
      decision = `<span style="color:#fbbf24;font-weight:700;"><i class="fas fa-clock"></i> Retrasos elevados detectados.</span><br>
      <span style="color:#36a2eb;">Optimice la programación de descargas o aumente recursos.</span>`;
    } else {
      decision = `<span style="color:#4fd1c5;font-weight:700;"><i class="fas fa-info-circle"></i> Revise los parámetros de operación.</span><br>
      <span style="color:#888;">Realice simulaciones adicionales para encontrar el equilibrio óptimo.</span>`;
    }

    // Resumen ejecutivo con formato
    resumen = `
      <div>
        <span style="color:#4fd1c5;font-weight:600;">Promedio de llegadas:</span> <span style="font-weight:700;">${promedioLlegadas.toFixed(2)}</span><br>
        <span style="color:#4fd1c5;font-weight:600;">Promedio de descargas:</span> <span style="font-weight:700;">${promedioDescargas.toFixed(2)}</span><br>
        <span style="color:#4fd1c5;font-weight:600;">Promedio de retrasos:</span> <span style="font-weight:700;">${promedioRetrasos.toFixed(2)}</span><br>
        <span style="color:#4fd1c5;font-weight:600;">Utilización promedio del sistema:</span> <span style="font-weight:700;">${(promedioUtil * 100).toFixed(1)}%</span><br>
        <span style="color:#4fd1c5;font-weight:600;">Total de barcazas perdidas:</span> <span style="font-weight:700;">${perdidas}</span>
      </div>
    `;

    // Sugerencias de mejora adaptativas
    if (perdidas > 0) {
      sugerencias.push("🔺 <b>Revisar la capacidad de descarga</b>: Considere aumentar el número de descargas diarias o mejorar la eficiencia del proceso.");
      sugerencias.push("🔺 <b>Reducir la variabilidad de llegadas</b>: Coordine mejor la programación de barcazas para evitar picos.");
    }
    if (promedioRetrasos > 2) {
      sugerencias.push("⏳ <b>Optimizar la programación</b>: Ajuste los turnos o recursos para reducir los retrasos.");
    }
    if (promedioUtil < 0.7) {
      sugerencias.push("📉 <b>Servidor subutilizado</b>: Reduzca recursos o aumente la demanda para mejorar la eficiencia.");
    }
    if (promedioUtil > 0.95) {
      sugerencias.push("⚠️ <b>Servidor al límite</b>: Considere agregar redundancia o capacidad para evitar saturaciones.");
    }
    if (promedioLlegadas > promedioDescargas + 1) {
      sugerencias.push("📈 <b>Desbalance entre llegadas y descargas</b>: Ajuste la logística para equilibrar el flujo.");
    }
    if (sugerencias.length === 0) {
      sugerencias.push("✅ <b>El sistema opera eficientemente.</b> Mantenga la supervisión y ajuste solo si cambian las condiciones.");
    }
  }

  const decDiv = document.getElementById("mejorDecision") || document.getElementById("recomendacion");
  if (decDiv) decDiv.innerHTML = decision;
  const resumenDiv = document.getElementById("resumenEjecutivo");
  if (resumenDiv) resumenDiv.innerHTML = resumen;
  const sugList = document.getElementById("sugerenciasMejora");
  if (sugList) {
    sugList.innerHTML = "";
    sugerencias.forEach(s => {
      const li = document.createElement("li");
      li.innerHTML = s;
      sugList.appendChild(li);
    });
  }
}

// Exporta el resumen ejecutivo y visualización del dashboard a PDF
window.exportarPDF = function() {
  const empresa = document.getElementById("empresaNombre")?.textContent || "";
  const kpis = [
    { label: "Promedio Retrasos", value: document.getElementById("promedioRetrasos")?.textContent || "-" },
    { label: "Promedio Llegadas", value: document.getElementById("promedioLlegadas")?.textContent || "-" },
    { label: "Promedio Descargas", value: document.getElementById("promedioDescargas")?.textContent || "-" },
    { label: "Barcazas Perdidas", value: document.getElementById("totalPerdidas")?.textContent || "-" },
    { label: "Costo Total", value: document.getElementById("costoGlobal")?.textContent || "-" }
  ];
  const resumen = document.getElementById("resumenEjecutivo");
  const decision = document.getElementById("mejorDecision");
  const sugerencias = document.getElementById("sugerenciasMejora");
  const riesgos = document.getElementById("riesgosDetectados");
  // Gráficos principales
  function getChartImg(id) {
    const canvas = document.getElementById(id);
    if (canvas && canvas.toDataURL) {
      return `<img src="${canvas.toDataURL('image/png')}" class="pdf-chart-img" alt="Gráfico">`;
    }
    return "";
  }
  // KPIs visuales
  function kpiCard(label, value, icon, color) {
    return `
      <div class="pdf-kpi-card" style="border-left:5px solid ${color};">
        <div class="pdf-kpi-icon" style="color:${color};">${icon}</div>
        <div class="pdf-kpi-label">${label}</div>
        <div class="pdf-kpi-value">${value}</div>
      </div>
    `;
  }
  // PDF ventana
  const win = window.open('', '', 'width=1000,height=800');
  win.document.write(`
    <html>
    <head>
      <title>Resumen Ejecutivo - Dashboard Barcazas</title>
      <link rel="stylesheet" href="/appweb/css/dashboard.css">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fa; color: #1a2636; margin: 0; padding: 2rem; }
        .pdf-header { text-align: center; margin-bottom: 2.5rem; }
        .pdf-header h1 { color: #4fd1c5; font-size: 2.2rem; margin-bottom: 0.2rem; }
        .pdf-header .pdf-subtitle { color: #888; font-size: 1.1rem; margin-bottom: 0.8rem; }
        .pdf-section { background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 1.5rem 2rem; margin-bottom: 2rem; }
        .pdf-section h2 { color: #4fd1c5; font-size: 1.2rem; margin-bottom: 1rem; border-bottom: 1px solid #e0f7fa; padding-bottom: 0.5rem; }
        .pdf-section ul { color: #1a2636; font-size: 1.05rem; margin-left: 1.2rem; }
        .pdf-section .decision-text { color: #36a2eb; font-size: 1.1rem; margin-top: 0.7rem; margin-bottom: 0.7rem; }
        .pdf-footer { text-align: right; color: #888; font-size: 0.95rem; margin-top: 2.5rem; }
        .pdf-kpi-row { display: flex; flex-wrap: wrap; gap: 1.5em; justify-content: center; margin-bottom: 1.5rem; }
        .pdf-kpi-card { background:#f7fafc; border-radius:12px; box-shadow:0 2px 8px #0001; padding:1.1em 2em 1em 1.2em; min-width:160px; max-width:220px; display:flex; flex-direction:column; align-items:center; margin-bottom:0.5em; }
        .pdf-kpi-icon { font-size:2.1em; margin-bottom:0.2em; }
        .pdf-kpi-label { color:#888; font-size:1.01em; margin-bottom:0.2em; }
        .pdf-kpi-value { color:#1a2636; font-size:1.35em; font-weight:700; }
        .pdf-chart-title { color:#4fd1c5; font-size:1.08rem; margin:1.2rem 0 0.5rem 0; font-weight:600;}
        .pdf-chart-img { max-width:100%; margin-bottom:1.2rem; border-radius:12px; box-shadow:0 2px 8px #4fd1c522; }
        .pdf-riesgos-list { color:#d9534f; font-size:1.05em; margin:0.5em 0 0.5em 1.2em; }
        .pdf-sugerencias-list { color:#1a2636; font-size:1.05em; margin:0.5em 0 0.5em 1.2em; }
        .pdf-resumen-ejecutivo { background:#f7fafc; border-radius:8px; padding:1rem 1.3rem; border-left:4px solid #4fd1c5; box-shadow:0 1px 4px #4fd1c522; font-weight:500; line-height:1.7; color:#1a2636; }
        .pdf-section .decision-text { background:#f0f8ff; border-left:4px solid #36a2eb; border-radius:6px; box-shadow:0 1px 4px #36a2eb22; padding:0.7rem 1.1rem; }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    </head>
    <body>
      <div class="pdf-header">
        <h1>Resumen Ejecutivo</h1>
        <div class="pdf-subtitle">Panel de Control - Barcazas y Logística</div>
        <div style="color:#36a2eb;font-size:1.08em;margin-bottom:0.5em;">${empresa}</div>
      </div>
      <div class="pdf-section">
        <h2>Indicadores Clave (KPIs)</h2>
        <div class="pdf-kpi-row">
          ${kpiCard("Promedio Retrasos", kpis[0].value, '<i class="fas fa-clock"></i>', "#ff6384")}
          ${kpiCard("Promedio Llegadas", kpis[1].value, '<i class="fas fa-ship"></i>', "#36a2eb")}
          ${kpiCard("Promedio Descargas", kpis[2].value, '<i class="fas fa-arrow-down"></i>', "#4fd1c5")}
          ${kpiCard("Barcazas Perdidas", kpis[3].value, '<i class="fas fa-exclamation-triangle"></i>', "#fbbf24")}
          ${kpiCard("Costo Total", kpis[4].value, '<i class="fas fa-dollar-sign"></i>', "#4fd1c5")}
        </div>
      </div>
      <div class="pdf-section">
        <h2>Visualización de Gráficos</h2>
        <div class="pdf-chart-title">Promedios Diarios</div>
        ${getChartImg('barChart')}
        <div class="pdf-chart-title">Llegadas Nocturnas</div>
        ${getChartImg('pieChart')}
        <div class="pdf-chart-title">Retrasos Diarios</div>
        ${getChartImg('retrasosChart')}
        <div class="pdf-chart-title">Utilización Servidor</div>
        ${getChartImg('utilizacionChart')}
      </div>
      <div class="pdf-section">
        <h2>Riesgos Detectados</h2>
        <ul class="pdf-riesgos-list">
          ${riesgos && riesgos.children.length
            ? Array.from(riesgos.children).map(li => `<li>${li.textContent}</li>`).join('')
            : '<li>No se detectaron riesgos significativos.</li>'}
        </ul>
      </div>
      <div class="pdf-section">
        <h2>Recomendación Final</h2>
        <div class="decision-text">${decision ? decision.innerHTML : ''}</div>
      </div>
      <div class="pdf-section">
        <h2>Resumen Ejecutivo</h2>
        <div class="pdf-resumen-ejecutivo">${resumen ? resumen.innerHTML : ''}</div>
      </div>
      <div class="pdf-section">
        <h2>Sugerencias de Mejora</h2>
        <ul class="pdf-sugerencias-list">
          ${sugerencias ? Array.from(sugerencias.children).map(li => `<li>${li.textContent}</li>`).join('') : ''}
        </ul>
      </div>
      <div class="pdf-footer">
        Generado por el sistema de simulación - ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `);
  win.document.close();
  win.print();
};

// Actualización automática al detectar cambios en localStorage (evento storage)
window.addEventListener("storage", function (e) {
  if (
    e.key === "resultadosSimulacion" ||
    e.key === "promediosSimulacion" ||
    e.key === "periodosSimulacion"
  ) {
    mostrarResumen();
    mostrarRiesgos();
    mostrarGraficos();
    mostrarDecisionYResumen();
  }
});

// Inicializa el dashboard al cargar la página
window.onload = function() {
  mostrarResumen();
  mostrarRiesgos();
  mostrarGraficos();
  mostrarDecisionYResumen();
};
