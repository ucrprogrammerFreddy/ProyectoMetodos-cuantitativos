// // =====================
// // Elimina una fila de una tabla de probabilidades
// // =====================
// function eliminarFila(btn) {
//   const fila = btn.parentNode.parentNode;
//   fila.remove();
// }

// // =====================
// // Agrega una fila editable a una tabla de probabilidades
// // =====================
// function agregarFila(tablaId) {
//   const tabla = document
//     .getElementById(tablaId)
//     .getElementsByTagName("tbody")[0];
//   const fila = tabla.insertRow();
//   for (let i = 0; i < 4; i++) {
//     const celda = fila.insertCell();
//     celda.contentEditable = true;
//     celda.innerText = "";
//   }
//   const celdaBoton = fila.insertCell();
//   const boton = document.createElement("button");
//   boton.innerText = "Eliminar";
//   boton.onclick = () => eliminarFila(boton);
//   celdaBoton.appendChild(boton);
// }

// =====================
// Habilita los botones para ver resultados
// =====================
function habilitarBotonesResultados() {
  document.getElementById("btnModalResultados").disabled = false;
  document.getElementById("btnVerResultados").disabled = false;
}

// =====================
// Deshabilita los botones para ver resultados
// =====================
function deshabilitarBotonesResultados() {
  document.getElementById("btnModalResultados").disabled = true;
  document.getElementById("btnVerResultados").disabled = true;
}

// =====================
// Esta función genera la simulación y actualiza la tabla principal y los costos
// =====================
function generarSimulacion() {
  const min = parseInt(document.getElementById("rangoMin").value);
  const max = parseInt(document.getElementById("rangoMax").value);
  const dias = parseInt(document.getElementById("dias").value);
  const tbody = document
    .getElementById("tablaSimulacion")
    .querySelector("tbody");
  tbody.innerHTML = "";

  let retrasosAnterior = 0;
  let totalRetrasos = 0,
    totalLlegadas = 0,
    totalDescargas = 0,
    totalADescargarSuma = 0;
  let totalCostoRetraso = 0,
    totalCostoEstadia = 0,
    totalCostoPerdida = 0;

  // Costos unitarios
  const costoPorRetraso = 800;
  const costoPorEstadia = 500;
  const costoPorPerdida = 25000;

  const resultadosDiarios = [];

  // Simulación día a día
  for (let i = 1; i <= dias; i++) {
    const rLlegada = Math.floor(Math.random() * (max - min + 1)) + min;
    const rDescarga = Math.floor(Math.random() * (max - min + 1)) + min;
    const llegadas = calcularLlegadas(rLlegada);
    const totalADescargar = retrasosAnterior + llegadas;

    //decargas sin afectacion aun
    let descargas = Math.min(totalADescargar, calcularDescargas(rDescarga));

    // Valores por defecto (se modificarán al cambiar evento después)
    let tipoEvento = "ninguno";
    let afectacion = 0;

    // Aplicar afectación aquí aunque no haya aún (x eso no esta "otro"), para mantener lógica centralizada
    if (tipoEvento === "tormenta") {
      descargas = Math.floor(descargas * (1 - afectacion / 100));
    } else if (tipoEvento === "huelga") {
      descargas = 0;
    }

    // Cálculo de costos por día
    const costoRetrasoDia = retrasosAnterior * costoPorRetraso;
    const costoEstadiaDia = totalADescargar * costoPorEstadia;
    const costoPerdidaDia =
      retrasosAnterior > 0 ? retrasosAnterior * costoPorPerdida : 0;

    // Agrega fila a la tabla visual
    const fila = document.createElement("tr");
    fila.innerHTML = `
            <td>
              <select class="evento-select">
                  <option value="ninguno" selected>Ninguno</option>
                  <option value="tormenta">Tormenta</option>
                  <option value="huelga">Huelga</option>
                  <option value="otro">Otro</option>
              </select>
            </td>
            <td><span contenteditable="false" class="afectacion-celda">0</span>%</td>
            <td>${i}</td>
            <td>${retrasosAnterior}</td>
            <td>${rLlegada}</td>
            <td contenteditable="true">${llegadas}</td>
            <td>${totalADescargar}</td>
            <td contenteditable="true">${rDescarga}</td>
            <td>${descargas}</td>
            <td class="costoRetraso">${costoRetrasoDia.toLocaleString()}</td>
            <td class="costoEstadia">${costoEstadiaDia.toLocaleString()}</td>
            <td class="costoPerdida">${costoPerdidaDia.toLocaleString()}</td>
            `;
    tbody.appendChild(fila);

    // Guarda los resultados de este día
    resultadosDiarios.push({
      dia: i,
      retrasosDiaAnterior: retrasosAnterior,
      numeroAleatorioLlegadas: rLlegada,
      llegadasNocturnas: llegadas,
      totalADescargar: totalADescargar,
      numeroAleatorioDescargas: rDescarga,
      descargas: descargas,
      costoRetraso: costoRetrasoDia,
      costoEstadia: costoEstadiaDia,
      costoPerdida: costoPerdidaDia,
    });

    // Suma totales para el resumen
    retrasosAnterior = totalADescargar - descargas;
    totalRetrasos += retrasosAnterior;
    totalLlegadas += llegadas;
    totalDescargas += descargas;
    totalADescargarSuma += totalADescargar;
    totalCostoRetraso += costoRetrasoDia;
    totalCostoEstadia += costoEstadiaDia;
    totalCostoPerdida += costoPerdidaDia;
  }

  // Actualiza los totales en la tabla de simulación
  actualizarTotales(
    totalRetrasos,
    totalLlegadas,
    totalDescargas,
    dias,
    totalADescargarSuma,
    totalCostoRetraso,
    totalCostoEstadia,
    totalCostoPerdida
  );

  // Actualiza la tabla de costos de operación
  actualizarTablaCostosOperacion(
    totalCostoRetraso,
    totalCostoEstadia,
    totalCostoPerdida
  );

  // Guarda promedios y resultados para otros usos (modal/resultados.html)
  const promedios = {
    promedioRetrasos: (totalRetrasos / dias).toFixed(2),
    promedioLlegadas: (totalLlegadas / dias).toFixed(2),
    promedioDescargas: (totalDescargas / dias).toFixed(2),
  };
  localStorage.setItem(
    "resultadosSimulacion",
    JSON.stringify(resultadosDiarios)
  );
  localStorage.setItem("promediosSimulacion", JSON.stringify(promedios));

  calcularPeriodosYGuardar(resultadosDiarios);
  observarCambios();
  calcularCostosSimulacion();
}

// =====================
// Traduce número aleatorio a cantidad de llegadas según reglas del negocio
// =====================
function calcularLlegadas(valor) {
  if (valor <= 13) return 0;
  if (valor <= 30) return 1;
  if (valor <= 45) return 2;
  if (valor <= 70) return 3;
  if (valor <= 90) return 4;
  return 5;
}

// =====================
// Traduce número aleatorio a cantidad de descargas según reglas del negocio
// =====================
function calcularDescargas(valor) {
  if (valor <= 5) return 1;
  if (valor <= 20) return 2;
  if (valor <= 70) return 3;
  if (valor <= 90) return 4;
  return 5;
}

// =====================
// Actualiza los totales en el pie de la tabla de simulación
// =====================
function actualizarTotales(
  retrasos,
  llegadas,
  descargas,
  dias,
  totalADescargarSuma = 0,
  totalCostoRetraso = 0,
  totalCostoEstadia = 0,
  totalCostoPerdida = 0
) {
  document.getElementById("totalRetrasos").textContent = retrasos;
  document.getElementById("totalLlegadas").textContent = llegadas;
  document.getElementById("totalDescargas").textContent = descargas;
  if (document.getElementById("totalADescargar"))
    document.getElementById("totalADescargar").textContent =
      totalADescargarSuma;
  if (document.getElementById("totalCostoRetraso"))
    document.getElementById("totalCostoRetraso").textContent =
      "$" + totalCostoRetraso.toLocaleString();
  if (document.getElementById("totalCostoEstadia"))
    document.getElementById("totalCostoEstadia").textContent =
      "$" + totalCostoEstadia.toLocaleString();
  if (document.getElementById("totalCostoPerdida"))
    document.getElementById("totalCostoPerdida").textContent =
      "$" + totalCostoPerdida.toLocaleString();
}

// =====================
// ACTUALIZA LOS COSTOS EN LA TABLA DE COSTOS DE OPERACIÓN (fuera y dentro del modal)
// =====================
function actualizarTablaCostosOperacion(
  totalCostoRetraso,
  totalCostoEstadia,
  totalCostoPerdida
) {
  if (document.getElementById("costoRetraso"))
    document.getElementById("costoRetraso").textContent =
      "$" + totalCostoRetraso.toLocaleString();
  if (document.getElementById("costoEstadia"))
    document.getElementById("costoEstadia").textContent =
      "$" + totalCostoEstadia.toLocaleString();
  if (document.getElementById("costoPerdida"))
    document.getElementById("costoPerdida").textContent =
      "$" + totalCostoPerdida.toLocaleString();
  if (document.getElementById("costoTotalOperacion"))
    document.getElementById("costoTotalOperacion").textContent =
      "$" +
      (
        totalCostoRetraso +
        totalCostoEstadia +
        totalCostoPerdida
      ).toLocaleString();

  // También para el modal (si existe)
  if (document.getElementById("costoRetrasoModal"))
    document.getElementById("costoRetrasoModal").textContent =
      "$" + totalCostoRetraso.toLocaleString();
  if (document.getElementById("costoEstadiaModal"))
    document.getElementById("costoEstadiaModal").textContent =
      "$" + totalCostoEstadia.toLocaleString();
  if (document.getElementById("costoPerdidaModal"))
    document.getElementById("costoPerdidaModal").textContent =
      "$" + totalCostoPerdida.toLocaleString();
  if (document.getElementById("costoTotalOperacionModal"))
    document.getElementById("costoTotalOperacionModal").textContent =
      "$" +
      (
        totalCostoRetraso +
        totalCostoEstadia +
        totalCostoPerdida
      ).toLocaleString();
}

// =====================
// Hace que las celdas editables de la tabla propaguen cambios
// =====================
function observarCambios() {
  const tbody = document.querySelector("#tablaSimulacion tbody");

  // Refrescar celdas editables
  tbody.querySelectorAll("td[contenteditable=true]").forEach((cell) => {
    const newCell = cell.cloneNode(true);
    cell.parentNode.replaceChild(newCell, cell);
  });

  // Escuchar cambios en celdas editables normales
  tbody.querySelectorAll("td[contenteditable=true]").forEach((cell) => {
    cell.addEventListener("input", recalcularYPropagar);
    cell.addEventListener("blur", recalcularYPropagar);
    cell.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.blur();
      }
    });
  });

  // Escuchar cambios en el select de evento
  tbody.querySelectorAll(".evento-select").forEach(select => {
    select.addEventListener("change", () => {
      const row = select.closest("tr");
      const celda = row.querySelector(".afectacion-celda");


      if (!celda) return;

      // Evento tormenta
      if (select.value === "tormenta") {
        celda.textContent = "50"; // solo el número
        celda.contentEditable = true;
      }
      // Evento huelga
      else if (select.value === "huelga") {
        celda.textContent = "100";
        celda.contentEditable = true;
      }
      // Evento otro (editable personalizado)
      else if (select.value === "otro") {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Nombre del evento";
        input.className = "form-control form-control-sm mt-1 nombre-evento-input";
        select.style.display = "none"; // ocultar el select
        select.parentNode.appendChild(input);
        input.focus();

        input.addEventListener("blur", () => {
          const nuevoNombre = input.value.trim();
          if (nuevoNombre) {
            const option = new Option(nuevoNombre, nuevoNombre, true, true); // text, value, selected, defaultSelected
            select.appendChild(option);
            select.value = nuevoNombre; //Establece como seleccionada esa nueva opción personalizada.
          } else {
            select.value = "ninguno";
          }
          select.style.display = "inline-block"; //hacemos q vuelva a aparecer el select, ya q lo ocultamos con none
          input.remove(); //ya no se necesita, se borra
          celda.textContent = ""; //limpiamos
          celda.contentEditable = true; //lo volvemos editable

          // Si el usuario presiona Enter estando en el select, mueve el foco a la celda de afectación
          const range = document.createRange();
          const sel = window.getSelection(); //permite manipular lo seleccionado en el doc
          range.selectNodeContents(celda); //le dice al rango q seleccione todo el contenido de la celda
          range.collapse(false); //coloco el cursor al final de la celda x false
          sel.removeAllRanges();
          sel.addRange(range);
          celda.focus(); //Le da el foco de entrada (input) a la celda, activando la edición.

          recalcularYPropagar();
        });

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            input.blur(); //dimos enter y ya esta listo, se calcula
          }
        });
      }
      // Evento ninguno
      else if (select.value === "ninguno") {
        celda.textContent = "0";
        celda.contentEditable = false;
      }

      recalcularYPropagar();
    });
  });

  // Escuchar cambios manuales en el % afectación
  tbody.querySelectorAll(".afectacion-celda").forEach(span => {

    //validamos valor ingresado
    span.addEventListener("input", () => {
      validarAfectacion(span)
      recalcularYPropagar();
    });
    
    // Evitar salto de línea con Enter
    span.addEventListener("keydown", (e) => {

      if (e.key === "Enter") {
        e.preventDefault(); // evita salto de línea
        validarAfectacion(span)
        span.blur(); // salir de la edicion
        recalcularYPropagar();
      }
    });
  });
}

// =====================
// valida el valor ingresado en la afectacion del evento
// =====================
function validarAfectacion(span) {
  const valor = parseInt(span.textContent.trim());

  //si no hay dato
  if (isNaN(valor) || valor < 0 || valor > 100) {
    span.textContent = "0";
  }
}

// =====================
// Recalcula totales y costos si se editan celdas manualmente
// =====================
function recalcularYPropagar() {
  const tbody = document.querySelector("#tablaSimulacion tbody");
  let totalRetrasos = 0,
    totalLlegadas = 0,
    totalDescargas = 0,
    totalADescargarSuma = 0;
  let totalCostoRetraso = 0,
    totalCostoEstadia = 0,
    totalCostoPerdida = 0;
  let retrasosAnterior = 0;
  const costoPorRetraso = 800;
  const costoPorEstadia = 500;
  const costoPorPerdida = 25000;

  // Array para reconstruir los resultados diarios editados
  const resultadosDiarios = [];

  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const prev = retrasosAnterior;
    const lleg = parseInt(row.cells[5].innerText) || 0;
    const rDesc = parseInt(row.cells[7].innerText) || 0;

    row.cells[3].textContent = prev;

    const total = prev + lleg;
    row.cells[6].textContent = total;

    // Leer tipo de evento y afectación
    const tipoEvento = row.querySelector(".evento-select")?.value || "ninguno";
    const afectacionRaw = row.querySelector(".afectacion-celda")?.textContent || "0";
    const afectacion = parseFloat(afectacionRaw.replace("%", "").trim()) || 0;

    // Calcular descargas base
    let descargas = total > 0 ? Math.min(total, calcularDescargas(rDesc)) : 0;

    // Aplicar efecto del evento
    if (tipoEvento === "huelga") {
      descargas = 0;
    } else if (tipoEvento !== "ninguno") {
      descargas = Math.floor(descargas * (1 - afectacion / 100));
    }



    row.cells[8].textContent = descargas;

    retrasosAnterior = total - descargas;

    // Costos día a día
    const costoRetrasoDia = prev * costoPorRetraso;
    const costoEstadiaDia = total * costoPorEstadia;
    const costoPerdidaDia = prev > 0 ? prev * costoPorPerdida : 0;

    row.cells[9].textContent = costoRetrasoDia.toLocaleString();
    row.cells[10].textContent = costoEstadiaDia.toLocaleString();
    row.cells[11].textContent = costoPerdidaDia.toLocaleString();

    totalRetrasos += prev;
    totalLlegadas += lleg;
    totalDescargas += descargas;
    totalADescargarSuma += total;
    totalCostoRetraso += costoRetrasoDia;
    totalCostoEstadia += costoEstadiaDia;
    totalCostoPerdida += costoPerdidaDia;

    // Reconstruir el objeto de resultados diarios editados
    resultadosDiarios.push({
      dia: i + 1,
      retrasosDiaAnterior: prev,
      numeroAleatorioLlegadas: parseInt(row.cells[4].innerText) || 0,
      llegadasNocturnas: lleg,
      totalADescargar: total,
      numeroAleatorioDescargas: rDesc,
      descargas: descargas,
      costoRetraso: costoRetrasoDia,
      costoEstadia: costoEstadiaDia,
      costoPerdida: costoPerdidaDia,
    });
  }
  // Actualiza los totales y la tabla de costos
  actualizarTotales(
    totalRetrasos,
    totalLlegadas,
    totalDescargas,
    tbody.rows.length,
    totalADescargarSuma,
    totalCostoRetraso,
    totalCostoEstadia,
    totalCostoPerdida
  );
  actualizarTablaCostosOperacion(
    totalCostoRetraso,
    totalCostoEstadia,
    totalCostoPerdida
  );
  calcularCostosSimulacion();

  // Actualiza localStorage con los datos editados
  const dias = tbody.rows.length;
  const promedios = {
    promedioRetrasos: dias ? (totalRetrasos / dias).toFixed(2) : "0.00",
    promedioLlegadas: dias ? (totalLlegadas / dias).toFixed(2) : "0.00",
    promedioDescargas: dias ? (totalDescargas / dias).toFixed(2) : "0.00",
  };
  localStorage.setItem("resultadosSimulacion", JSON.stringify(resultadosDiarios));
  localStorage.setItem("promediosSimulacion", JSON.stringify(promedios));
  calcularPeriodosYGuardar(resultadosDiarios);

  // Dispara manualmente el evento storage para la misma pestaña (para pruebas locales)
  window.dispatchEvent(new StorageEvent("storage", { key: "resultadosSimulacion" }));
  window.dispatchEvent(new StorageEvent("storage", { key: "promediosSimulacion" }));
  window.dispatchEvent(new StorageEvent("storage", { key: "periodosSimulacion" }));
}

// =====================
// Guarda los datos de periodos para otros análisis
// =====================
function calcularPeriodosYGuardar(resultadosDiarios, costoPorRetraso = 100) {
  const totalDias = resultadosDiarios.length;
  const mitad = Math.ceil(totalDias / 2);

  const periodo1 = resultadosDiarios.slice(0, mitad);
  const periodo2 = resultadosDiarios.slice(mitad);

  function calcularMetrica(periodo) {
    let llegadas = 0,
      descargas = 0,
      retrasos = 0;
    periodo.forEach((dia) => {
      llegadas += dia.llegadasNocturnas;
      descargas += dia.descargas;
      retrasos += dia.retrasosDiaAnterior;
    });
    return {
      llegadas,
      descargas,
      retrasos,
      costo: retrasos * costoPorRetraso,
    };
  }

  const metrica1 = calcularMetrica(periodo1);
  const metrica2 = calcularMetrica(periodo2);

  localStorage.setItem(
    "periodosSimulacion",
    JSON.stringify({
      periodo1: metrica1,
      periodo2: metrica2,
      rango1: { inicio: 1, fin: mitad },
      rango2: { inicio: mitad + 1, fin: totalDias },
    })
  );
}

// =====================
// Calcula y actualiza costos para el modal de resultados
// =====================
function calcularCostosSimulacion() {
  const tbody = document.querySelector("#tablaSimulacion tbody");
  let costoRetraso = 0;
  let costoEstadia = 0;
  let costoPerdida = 0;
  const costoPorRetraso = 800;
  const costoPorEstadia = 500;
  const costoPorPerdida = 25000;

  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const retrasos = parseInt(row.cells[3].innerText) || 0;
    const totalADescargar = parseInt(row.cells[6].innerText) || 0;

    costoRetraso += retrasos * costoPorRetraso;
    costoEstadia += totalADescargar * costoPorEstadia;
    costoPerdida += retrasos > 0 ? retrasos * costoPorPerdida : 0;
  }

  // Actualiza los elementos del modal (incluido el total)
  if (document.getElementById("costoRetrasoModal")) {
    document.getElementById("costoRetrasoModal").textContent =
      "$" + costoRetraso.toLocaleString();
    document.getElementById("costoEstadiaModal").textContent =
      "$" + costoEstadia.toLocaleString();
    document.getElementById("costoPerdidaModal").textContent =
      "$" + costoPerdida.toLocaleString();
    if (document.getElementById("costoTotalOperacionModal"))
      document.getElementById("costoTotalOperacionModal").textContent =
        "$" + (costoRetraso + costoEstadia + costoPerdida).toLocaleString();
  }
}

// =====================
// Evento para mostrar el modal de resultados promedio
// =====================
document.getElementById("btnModalResultados").addEventListener("click", () => {
  const promedios = JSON.parse(localStorage.getItem("promediosSimulacion"));
  if (promedios) {
    document.getElementById("promedioRetrasos").textContent =
      promedios.promedioRetrasos;
    document.getElementById("promedioLlegadas").textContent =
      promedios.promedioLlegadas;
    document.getElementById("promedioDescargas").textContent =
      promedios.promedioDescargas;
    calcularCostosSimulacion();
    const modalElement = document.getElementById("staticBackdrop");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  } else {
    document.getElementById("promedioRetrasos").textContent = "";
    document.getElementById("promedioLlegadas").textContent = "";
    document.getElementById("promedioDescargas").textContent = "";
    alert(
      "Por favor, genere primero la simulación para poder ver los resultados."
    );
  }
});

// =====================
// Evento para ver los resultados en otra página (resultados.html)
// =====================
document.getElementById("btnVerResultados").addEventListener("click", () => {
  const resultados = localStorage.getItem("resultadosSimulacion");
  const promedios = localStorage.getItem("promediosSimulacion");
  if (resultados && promedios) {
    window.open("resultados.html", "_blank");
  } else {
    alert(
      "Por favor, genere primero la simulación para poder ver los resultados."
    );
  }
});

// =====================
// Deshabilita los botones de resultados al cargar la página
// =====================
window.onload = () => {
  deshabilitarBotonesResultados();
};
// =====================
// Evento para generar la simulación y habilitar botones
// =====================
document.getElementById("btnGenerar").addEventListener("click", () => {
  generarSimulacion();
  habilitarBotonesResultados();
  const mensajeAdvertencia = document.getElementById("mensajeAdvertencia");
  mensajeAdvertencia.style.display = "none";
});
