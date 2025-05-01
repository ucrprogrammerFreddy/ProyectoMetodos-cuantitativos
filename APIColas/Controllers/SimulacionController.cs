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

    [HttpPost("guardar")]
    public async Task<IActionResult> GuardarSimulacion([FromBody] SimulacionRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Crear entidad principal Simulacion
            var simulacion = new Simulacion();
            await _context.Simulaciones.AddAsync(simulacion);
            await _context.SaveChangesAsync();

            // Asignar relación a cada día simulado
            foreach (var dia in request.Results)
                dia.SimulacionId = simulacion.Id;

            request.Averages.SimulacionId = simulacion.Id;

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

    [HttpGet]
    public async Task<IActionResult> ListarSimulaciones()
    {
        var simulaciones = await _context.Simulaciones
            .Include(s => s.Dias)
            .Include(s => s.Promedios)
            .ToListAsync();

        return Ok(simulaciones);
    }
}
