namespace APIColas.Models
{
    public class DiaSimulado
    {

        public int Id { get; set; }
        public int Dia { get; set; }
        public int RetrasosDiaAnterior { get; set; }
        public double NumeroAleatorioLlegadas { get; set; }
        public int LlegadasNocturnas { get; set; }
        public int TotalADescargar { get; set; }
        public double NumeroAleatorioDescargas { get; set; }
        public int Descargas { get; set; }

        // Relación con Simulacion
        public int SimulacionId { get; set; }
        public Simulacion Simulacion { get; set; }


    }
}
