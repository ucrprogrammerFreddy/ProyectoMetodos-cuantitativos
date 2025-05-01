namespace APIColas.Models
{
    public class Simulacion
    {

        public int Id { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        public ICollection<DiaSimulado> Dias { get; set; }
        public PromediosSimulacion Promedios { get; set; }

    }
}
