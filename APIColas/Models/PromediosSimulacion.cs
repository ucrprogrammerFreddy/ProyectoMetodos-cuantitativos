namespace APIColas.Models
{
    public class PromediosSimulacion
    {
        public int Id { get; set; }
        public double PromedioRetrasos { get; set; }
        public double PromedioLlegadasNocturnas { get; set; }
        public double PromedioDescargasDiarias { get; set; }

        // Relación con Simulacion
        public int SimulacionId { get; set; }
        public Simulacion Simulacion { get; set; }
    }
}
