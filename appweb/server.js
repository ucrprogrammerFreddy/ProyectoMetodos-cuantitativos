const express = require("express");
const sql = require("mssql");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Configuración de la base de datos
const dbConfig = {
  user: "sa",
  password: "123456",
  server: "DESKTOP-7VM6UQE",
  database: "simulacion_barcazas",
  options: {
    encrypt: false, // Cambiar a true si se usa SSL/TLS
    trustServerCertificate: true, // Permitir certificados no confiables en entornos locales
  },
};

// Probar la conexión a la base de datos
sql
  .connect(dbConfig)
  .then(() => {
    console.log("Conexión a la base de datos exitosa");
  })
  .catch((err) => {
    console.error("Error al conectar a la base de datos:", err.message);
  });

// Middleware
app.use(bodyParser.json());

// Ruta para guardar resultados de la simulación
app.post("/save-simulation", async (req, res) => {
  const { results, averages } = req.body;

  try {
    // Crear una nueva conexión con un pool
    const pool = await sql.connect(dbConfig);

    // Iniciar una transacción para garantizar la integridad de los datos
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Guardar resultados diarios
      for (const result of results) {
        const query = `
          INSERT INTO resultados_simulacion (dia, retrasos_dia_anterior, numero_aleatorio_llegadas, llegadas_nocturnas, total_a_descargar, numero_aleatorio_descargas, descargas)
          VALUES (@dia, @retrasosDiaAnterior, @numeroAleatorioLlegadas, @llegadasNocturnas, @totalADescargar, @numeroAleatorioDescargas, @descargas)
        `;
        await transaction
          .request()
          .input("dia", sql.Int, result.day)
          .input("retrasosDiaAnterior", sql.Int, result.previousDelays)
          .input("numeroAleatorioLlegadas", sql.Int, result.randomArrivalNumber)
          .input("llegadasNocturnas", sql.Int, result.nightlyArrivals)
          .input("totalADescargar", sql.Int, result.totalToUnload)
          .input("numeroAleatorioDescargas", sql.Int, result.randomUnloadNumber)
          .input("descargas", sql.Int, result.unloads)
          .query(query);
      }

      // Guardar promedios
      const avgQuery = `
        INSERT INTO promedios_simulacion (promedio_retrasos, promedio_llegadas_nocturnas, promedio_descargas_diarias)
        VALUES (@promedioRetrasos, @promedioLlegadasNocturnas, @promedioDescargasDiarias)
      `;
      await transaction
        .request()
        .input("promedioRetrasos", sql.Float, averages.averageDelays)
        .input("promedioLlegadasNocturnas", sql.Float, averages.averageArrivals)
        .input("promedioDescargasDiarias", sql.Float, averages.averageUnloads)
        .query(avgQuery);

      // Confirmar la transacción
      await transaction.commit();

      console.log("Datos guardados correctamente en la base de datos");
      res.status(200).send("Resultados guardados con éxito");
    } catch (err) {
      // Si ocurre un error, revertir la transacción
      await transaction.rollback();
      console.error(
        "Error al guardar los datos, se ha revertido la transacción:",
        err.message
      );
      res.status(500).send("Error al guardar los datos en la base de datos");
    }
  } catch (err) {
    console.error(
      "Error al conectar o procesar la base de datos:",
      err.message
    );
    res
      .status(500)
      .send("Error en la conexión o procesamiento de la base de datos");
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
