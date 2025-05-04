using APIColas.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;


[ApiController]
[Route("api/[controller]")]
public class SimulacionController : ControllerBase
{
    private readonly ColasDbContext _context;

    public SimulacionController(ColasDbContext context)
    {
        _context = context;
    }

    [HttpPost("guardar")] //guarda dias y promedios
    public async Task<IActionResult> GuardarSimulacion([FromBody] SimulacionRequest request) //request es la tabla y promedios
    {
        //asegura que todos los datos se guarden juntos, o ninguno si hay error (consistencia de la base de datos).
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Crear entidad principal Simulacion
            var simulacion = new Simulacion();
            await _context.Simulaciones.AddAsync(simulacion);
            await _context.SaveChangesAsync();

            // Asignar relación a cada día simulado
            foreach (var dia in request.Results)
            {
                dia.SimulacionId = simulacion.Id; //Asignale al objeto de dia el ID de la simulación que acabamos de crear”
            }
            request.Averages.SimulacionId = simulacion.Id; //Asignale al objeto de promedios el ID de la simulación que acabamos de crear”
            //anteriormente se asigno el id que faltaba (SimulacionId)

            //ahora si, ya tenemos el id faltante, guardamos en BD
            await _context.ResultadosSimulacion.AddRangeAsync(request.Results);
            await _context.PromediosSimulacion.AddAsync(request.Averages);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok("Simulación guardada correctamente.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Error al guardar: {ex.Message}");
        }
    }

    [HttpGet("resultados")]
    public async Task<IActionResult> ObtenerResultados()
    {
        var resultados = await _context.ResultadosSimulacion
            .OrderBy(r => r.Dia)
            .ToListAsync();

        return Ok(resultados);
    }

    [HttpGet("promedios")]
    public async Task<IActionResult> ObtenerPromedios()
    {
        var promedios = await _context.PromediosSimulacion
            .OrderByDescending(p => p.Id)
            .ToListAsync();

        return Ok(promedios);
    }

    [HttpGet("listaSimulacion")]
    public async Task<IActionResult> ListarSimulaciones()
    {
        var simulaciones = await _context.Simulaciones
            .Include(s => s.Dias)
            .Include(s => s.Promedios)
            .ToListAsync();

        return Ok(simulaciones);
    }


    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarSimulacion(int id)
    {
        // Buscar la simulación por ID, incluyendo los días y promedios
        var simulacion = await _context.Simulaciones
            .Include(s => s.Dias)
            .Include(s => s.Promedios)
            .FirstOrDefaultAsync(s => s.Id == id);

        // Si no existe, devolver error 404
        if (simulacion == null)
        {
            return NotFound("Simulación no encontrada.");
        }

        // Eliminar los días relacionados
        _context.ResultadosSimulacion.RemoveRange(simulacion.Dias);

        // Eliminar el promedio relacionado si existe
        if (simulacion.Promedios != null)
        {
            _context.PromediosSimulacion.Remove(simulacion.Promedios);
        }

        // Eliminar la simulación principal
        _context.Simulaciones.Remove(simulacion);

        // Guardar cambios en la base de datos
        await _context.SaveChangesAsync();

        // Devolver respuesta de éxito
        return Ok("Simulación eliminada correctamente.");
    }

}
