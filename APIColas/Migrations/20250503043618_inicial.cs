using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace APIColas.Migrations
{
    /// <inheritdoc />
    public partial class inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Simulaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Simulaciones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PromediosSimulacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PromedioRetrasos = table.Column<double>(type: "float", nullable: false),
                    PromedioLlegadasNocturnas = table.Column<double>(type: "float", nullable: false),
                    PromedioDescargasDiarias = table.Column<double>(type: "float", nullable: false),
                    SimulacionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromediosSimulacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromediosSimulacion_Simulaciones_SimulacionId",
                        column: x => x.SimulacionId,
                        principalTable: "Simulaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResultadosSimulacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Dia = table.Column<int>(type: "int", nullable: false),
                    RetrasosDiaAnterior = table.Column<int>(type: "int", nullable: false),
                    NumeroAleatorioLlegadas = table.Column<double>(type: "float", nullable: false),
                    LlegadasNocturnas = table.Column<int>(type: "int", nullable: false),
                    TotalADescargar = table.Column<int>(type: "int", nullable: false),
                    NumeroAleatorioDescargas = table.Column<double>(type: "float", nullable: false),
                    Descargas = table.Column<int>(type: "int", nullable: false),
                    SimulacionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResultadosSimulacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResultadosSimulacion_Simulaciones_SimulacionId",
                        column: x => x.SimulacionId,
                        principalTable: "Simulaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PromediosSimulacion_SimulacionId",
                table: "PromediosSimulacion",
                column: "SimulacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResultadosSimulacion_SimulacionId",
                table: "ResultadosSimulacion",
                column: "SimulacionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PromediosSimulacion");

            migrationBuilder.DropTable(
                name: "ResultadosSimulacion");

            migrationBuilder.DropTable(
                name: "Simulaciones");
        }
    }
}
