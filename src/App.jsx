import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {

  const [usuario, setUsuario] = useState("");
  const [rama, setRama] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState("Jornada 1");

  const [partidos, setPartidos] = useState([]);
  const [predicciones, setPredicciones] = useState({});
  const [prediccionesGuardadas, setPrediccionesGuardadas] = useState([]);

  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [tablaPorRama, setTablaPorRama] = useState({});

  const emojisRamas = {
    Manada: "🐺",
    Unidad: "⚜️",
    Caminantes: "🏔️",
    Rovers: "🛶",
    Dirigentes: "🧭",
  };

  // OBTENER PARTIDOS
  async function obtenerPartidos() {

    const { data, error } = await supabase
      .from("partidos")
      .select("*");

    if (error) {
      console.log(error);
    } else {
      setPartidos(data);
    }
  }

  // OBTENER PREDICCIONES
  async function obtenerPredicciones() {

    const { data, error } = await supabase
      .from("predicciones")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setPrediccionesGuardadas(data);
    }
  }

  // GUARDAR PREDICCIONES
async function guardarPredicciones() {

  if (!usuario || !rama) {
    setMensaje("⚠️ Completá nombre y rama");
    return;
  }

  for (const partido of partidos) {

    const prediccion = predicciones[partido.id];

    if (!prediccion) continue;

    await supabase
      .from("predicciones")
      .insert([
        {
          usuario: usuario,
          rama: rama,
          partido_id: partido.id,
          goles_local: Number(prediccion.local),
          goles_visitante: Number(prediccion.visitante),
        },
      ]);
  }

  setMensaje("✅ Predicciones guardadas");

  obtenerPredicciones();
}

// ACTUALIZAR INPUTS
function actualizarPrediccion(id, equipo, valor) {

  setPredicciones({
    ...predicciones,
    [id]: {
      ...predicciones[id],
      [equipo]: valor,
    },
  });

}


  // CALCULAR PUNTOS
  function calcularPuntos(prediccion, partido) {

    if (
      prediccion.goles_local === partido.goles_local &&
      prediccion.goles_visitante === partido.goles_visitante
    ) {
      return 3;
    }

    const diferenciaPred =
      prediccion.goles_local -
      prediccion.goles_visitante;

    const diferenciaReal =
      partido.goles_local -
      partido.goles_visitante;

    if (
      (diferenciaPred > 0 && diferenciaReal > 0) ||
      (diferenciaPred < 0 && diferenciaReal < 0) ||
      (diferenciaPred === 0 && diferenciaReal === 0)
    ) {
      return 1;
    }

    return 0;
  }

  // CALCULAR TABLA
  function calcularTabla() {

    const tabla = {};

    prediccionesGuardadas.forEach((prediccion) => {

      const partido = partidos.find(
        (p) => p.id === prediccion.partido_id
      );

      if (!partido) return;

      const puntos = calcularPuntos(
        prediccion,
        partido
      );

      if (!tabla[prediccion.usuario]) {
        tabla[prediccion.usuario] = 0;
      }

      tabla[prediccion.usuario] += puntos;
    });

    const resultado = Object.entries(tabla).map(
      ([usuario, puntos]) => ({
        usuario,
        puntos,
      })
    );

    resultado.sort((a, b) => b.puntos - a.puntos);

    setTablaPosiciones(resultado);
  }

  //calcular tabla por rama
  function calcularTablaPorRama() {

  const ramas = {};

  prediccionesGuardadas.forEach((prediccion) => {

    const partido = partidos.find(
      (p) => p.id === prediccion.partido_id
    );

    if (!partido) return;

    const puntos = calcularPuntos(
      prediccion,
      partido
    );

    if (!ramas[prediccion.rama]) {
      ramas[prediccion.rama] = {};
    }

    if (!ramas[prediccion.rama][prediccion.usuario]) {
      ramas[prediccion.rama][prediccion.usuario] = 0;
    }

    ramas[prediccion.rama][prediccion.usuario] += puntos;

  });

  const resultado = {};

  Object.keys(ramas).forEach((rama) => {

    resultado[rama] = Object.entries(ramas[rama])
      .map(([usuario, puntos]) => ({
        usuario,
        puntos,
      }))
      .sort((a, b) => b.puntos - a.puntos);

  });

  setTablaPorRama(resultado);

}


  // INICIO
  useEffect(() => {
    obtenerPartidos();
    obtenerPredicciones();
  }, []);

  // RECALCULAR TABLA
  useEffect(() => {

    if (
  partidos.length > 0 &&
  prediccionesGuardadas.length > 0
) {
  calcularTabla();
  calcularTablaPorRama();
}

  }, [partidos, prediccionesGuardadas]);

   console.log(partidos);
  
return (

  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6">

    <div className="max-w-5xl mx-auto">

      <h1 className="text-6xl font-extrabold text-center mb-12 tracking-tight">
        ⚽ Prode Mundial 2026
      </h1>

      {/* NOMBRE */}
<input
  type="text"
  placeholder="Tu nombre"
  value={usuario}
  onChange={(e) => setUsuario(e.target.value)}
  className="w-full p-4 rounded-2xl bg-white text-black mb-8 text-lg font-semibold shadow-xl outline-none"
/>

{/* RAMA */}
<select
  value={rama}
  onChange={(e) => setRama(e.target.value)}
  className="w-full p-4 rounded-2xl bg-white text-black mb-8 text-lg font-semibold shadow-xl"
>
  <option value="">Seleccionar rama</option>
  <option value="Manada">Manada</option>
  <option value="Unidad">Unidad</option>
  <option value="Caminantes">Caminantes</option>
  <option value="Rovers">Rovers</option>
  <option value="Dirigentes">Dirigentes</option>
</select>


      {/* SELECTOR DE JORNADAS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {Array.from(new Set(partidos.map((p) => p.jornada || "Sin Jornada")))
          .sort()
          .map((j) => (
            <button
              key={j}
              onClick={() => setJornadaSeleccionada(j)}
              className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                jornadaSeleccionada === j
                  ? "bg-green-500 text-white shadow-lg scale-105"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              {j}
            </button>
          ))}
      </div>

      {/* PARTIDOS */}
      <div className="space-y-6">

        {partidos
          .filter((p) => (p.jornada || "Sin Jornada") === jornadaSeleccionada)
          .map((partido) => (

          <div
            key={partido.id}
            className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 rounded-3xl flex items-center justify-between gap-4 hover:scale-[1.01] transition-all duration-300"
          >

            <span className="font-bold text-lg w-36">
              {partido.local}
            </span>

            <input
              type="number"
              min="0"
              className="w-20 p-3 rounded-2xl bg-white text-black text-center font-bold text-lg shadow-inner"
              onChange={(e) =>
                actualizarPrediccion(
                  partido.id,
                  "local",
                  e.target.value
                )
              }
            />

            <span className="font-black text-xl text-slate-300">
              VS
            </span>

            <input
              type="number"
              min="0"
              className="w-20 p-3 rounded-2xl bg-white text-black text-center font-bold text-lg shadow-inner"
              onChange={(e) =>
                actualizarPrediccion(
                  partido.id,
                  "visitante",
                  e.target.value
                )
              }
            />

            <span className="font-bold text-lg w-36 text-right">
              {partido.visitante}
            </span>

          </div>
        ))}

      </div>

      {/* BOTON */}
      <button
        onClick={guardarPredicciones}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] hover:from-green-400 hover:to-emerald-500 transition-all duration-300 p-5 rounded-3xl font-bold mt-10 shadow-2xl text-xl"
      >
        Guardar Predicciones
      </button>

      {/* MENSAJE */}
      <p className="text-center mt-6 text-2xl font-bold text-green-400">
        {mensaje}
      </p>

      {/* TABLA PREDICCIONES */}
      <div className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 rounded-3xl mt-12">

        <h2 className="text-3xl font-bold mb-6">
          📋 Predicciones Guardadas
        </h2>

        {/* BUSCADOR */}
        <input
          type="text"
          placeholder="🔍 Buscar participante..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white mb-6 outline-none focus:border-green-400 transition-all"
        />

        {busqueda ? (
          <div className="overflow-hidden rounded-2xl">

            <table className="w-full">

              <thead>

                <tr className="bg-white/10">

                  <th className="text-left p-4">
                    Usuario
                  </th>

                  <th className="text-center p-4">
                    Partido
                  </th>

                  <th className="text-center p-4">
                    Predicción
                  </th>

                </tr>

              </thead>

              <tbody>

                {prediccionesGuardadas
                  .filter((p) =>
                    p.usuario.toLowerCase().includes(busqueda.toLowerCase())
                  )
                  .map((prediccion) => {

                  const partido = partidos.find(
                    (p) => p.id === prediccion.partido_id
                  );

                  return (

                    <tr
                      key={prediccion.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-all"
                    >

                      <td className="p-4 font-semibold">
                        {prediccion.usuario}
                      </td>

                      <td className="p-4 text-center">
                        {partido?.local} vs {partido?.visitante}
                      </td>

                      <td className="p-4 text-center font-black text-green-400">
                        {prediccion.goles_local}
                        {" - "}
                        {prediccion.goles_visitante}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        ) : (
          <p className="text-center text-slate-400 py-8 italic">
            Escribe un nombre para ver sus predicciones...
          </p>
        )}

      </div>

      {/* TABLA POSICIONES */}
      <div className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 rounded-3xl mt-12">

        <h2 className="text-3xl font-bold mb-6">
          🏆 Tabla de Posiciones
        </h2>

        <div className="overflow-hidden rounded-2xl">

          <table className="w-full">

            <thead>

              <tr className="bg-white/10">

                <th className="text-left p-4">
                  Posición
                </th>

                <th className="text-left p-4">
                  Usuario
                </th>

                <th className="text-right p-4">
                  Puntos
                </th>

              </tr>

            </thead>

            <tbody>

              {tablaPosiciones.map((jugador, index) => (

                <tr
                  key={jugador.usuario}
                  className="border-b border-white/10 hover:bg-white/5 transition-all"
                >

                  <td className="p-4 font-black text-yellow-400">
                    #{index + 1}
                  </td>

                  <td className="p-4 font-semibold">
                    {jugador.usuario}
                  </td>

                  <td className="p-4 text-right font-black text-green-400">
                    {jugador.puntos}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* RANKING POR RAMA */}
      {Object.keys(tablaPorRama).map((rama) => (

        <div
          key={rama}
          className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 rounded-3xl mt-12"
        >

          <h2 className="text-3xl font-bold mb-6">
            {emojisRamas[rama] || "🏕️"} Ranking {rama}
          </h2>

          <table className="w-full">

            <thead>
              <tr className="bg-white/10">
                <th className="p-4 text-left">Posición</th>
                <th className="p-4 text-left">Usuario</th>
                <th className="p-4 text-right">Puntos</th>
              </tr>
            </thead>

            <tbody>

              {tablaPorRama[rama].map((jugador, index) => (

                <tr
                  key={jugador.usuario}
                  className="border-b border-white/10"
                >

                  <td className="p-4">
                    #{index + 1}
                  </td>

                  <td className="p-4">
                    {jugador.usuario}
                  </td>

                  <td className="p-4 text-right font-bold text-green-400">
                    {jugador.puntos}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      ))}

    </div>

  </div>
);
}