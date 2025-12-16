import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import "jspdf-autotable"

const hoy = new Date().toISOString().split("T")[0]

export default function App() {
  const [vistaActual, setVistaActual] = useState("listar")
  const [viajes, setViajes] = useState([])
  const [nuevoViaje, setNuevoViaje] = useState({
    fecha: hoy,
    descripcion: "",
    ingreso: "",
    gasto: "",
  })

  /* =========================
     LocalStorage
  ==========================*/
  useEffect(() => {
    const guardados = localStorage.getItem("viajes")
    if (guardados) {
      setViajes(JSON.parse(guardados))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("viajes", JSON.stringify(viajes))
  }, [viajes])

  /* =========================
     Handlers
  ==========================*/
  const agregarViaje = () => {
    if (!nuevoViaje.descripcion) return

    setViajes([
      ...viajes,
      {
        ...nuevoViaje,
        ingreso: Number(nuevoViaje.ingreso) || 0,
        gasto: Number(nuevoViaje.gasto) || 0,
      },
    ])

    setNuevoViaje({
      fecha: hoy,
      descripcion: "",
      ingreso: "",
      gasto: "",
    })

    setVistaActual("listar")
  }

  const borrarViaje = (i) => {
    setViajes(viajes.filter((_, idx) => idx !== i))
  }

  const exportarPDF = () => {
    const doc = new jsPDF()

    doc.text("Registro de Viajes", 14, 16)

    doc.autoTable({
      startY: 22,
      head: [["Fecha", "Descripción", "Ingreso", "Gasto"]],
      body: viajes.map((v) => [
        v.fecha,
        v.descripcion,
        `$${v.ingreso}`,
        `$${v.gasto}`,
      ]),
    })

    doc.save("viajes.pdf")
  }

  const totalIngreso = viajes.reduce((a, v) => a + v.ingreso, 0)
  const totalGasto = viajes.reduce((a, v) => a + v.gasto, 0)
  const saldo = totalIngreso - totalGasto

  /* =========================
     UI
  ==========================*/
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className="bg-blue-600 text-white p-4 text-lg font-semibold text-center">
        Gestor de Viajes
      </header>

      {/* Content */}
      <main className="flex-1 p-4">

        {vistaActual === "listar" && (
          <>
            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <p className="text-sm text-gray-500">Saldo</p>
              <p
                className={`text-2xl font-bold ${
                  saldo >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${saldo}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <div className="flex justify-between text-sm">
                <span>Ingresos</span>
                <span className="text-green-600">${totalIngreso}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Gastos</span>
                <span className="text-red-600">${totalGasto}</span>
              </div>
            </div>

            <div className="space-y-2">
              {viajes.map((v, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{v.descripcion}</p>
                    <p className="text-xs text-gray-500">{v.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600">+${v.ingreso}</p>
                    <p className="text-red-600">-${v.gasto}</p>
                  </div>
                  <button
                    onClick={() => borrarViaje(i)}
                    className="ml-3 text-red-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {viajes.length > 0 && (
              <button
                onClick={exportarPDF}
                className="mt-4 w-full bg-gray-800 text-white py-2 rounded-xl"
              >
                Exportar PDF
              </button>
            )}
          </>
        )}

        {vistaActual === "agregar" && (
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <input
              type="date"
              value={nuevoViaje.fecha}
              onChange={(e) =>
                setNuevoViaje({ ...nuevoViaje, fecha: e.target.value })
              }
              className="w-full border rounded-lg p-2"
            />

            <input
              placeholder="Descripción"
              value={nuevoViaje.descripcion}
              onChange={(e) =>
                setNuevoViaje({ ...nuevoViaje, descripcion: e.target.value })
              }
              className="w-full border rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Ingreso"
              value={nuevoViaje.ingreso}
              onChange={(e) =>
                setNuevoViaje({ ...nuevoViaje, ingreso: e.target.value })
              }
              className="w-full border rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Gasto"
              value={nuevoViaje.gasto}
              onChange={(e) =>
                setNuevoViaje({ ...nuevoViaje, gasto: e.target.value })
              }
              className="w-full border rounded-lg p-2"
            />

            <button
              onClick={agregarViaje}
              className="w-full bg-blue-600 text-white py-2 rounded-xl"
            >
              Guardar
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t flex justify-around p-2">
        <button
          onClick={() => setVistaActual("listar")}
          className={`flex-1 ${
            vistaActual === "listar" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          Inicio
        </button>

        <button
          onClick={() => setVistaActual("agregar")}
          className={`flex-1 ${
            vistaActual === "agregar" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          Agregar
        </button>
      </nav>
    </div>
  )
}

