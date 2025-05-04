using Microsoft.EntityFrameworkCore;

namespace APIColas.Models
{
    public class ColasDbContext : DbContext
    {
        public ColasDbContext(DbContextOptions<ColasDbContext> options) : base(options) { }


        //Crea una tabla llamada Simulaciones.
        public DbSet<Simulacion> Simulaciones { get; set; }
        public DbSet<DiaSimulado> ResultadosSimulacion { get; set; }
        public DbSet<PromediosSimulacion> PromediosSimulacion { get; set; }
    }
}
