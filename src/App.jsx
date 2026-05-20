import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {

  const [usuario, setUsuario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [partidos, setPartidos] = useState([]);
  const [predicciones, setPredicciones] = useState({});
  const [prediccionesGuardadas, setPrediccionesGuardadas] = useState([]);

  const [tablaPosiciones, setTablaPosiciones] = useState([]);

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

    for (const partido of partidos) {

      const prediccion = predicciones[partido.id];

      if (!prediccion) continue;

      await supabase
        .from("predicciones")
        .insert([
          {
            usuario: usuario,
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

    // resultado exacto
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

    // ganador correcto
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
    }

  }, [partidos, prediccionesGuardadas]);

  return (

    <div className="min-h-screen bg-slate-900 text-white p-6">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-bold text-center mb-10">
          ⚽ Prode Mundial
        </h1>

        {/* NOMBRE */}
        <input
          type="text"
          placeholder="Tu nombre"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full p-4 rounded-xl text-black mb-8"
        />

        {/* PARTIDOS */}
        <div className="space-y-6">

          {partidos.map((partido) => (

            <div
              key={partido.id}
              className="bg-slate-800 p-6 rounded-2xl flex items-center justify-between gap-4"
            >

              <span className="font-bold w-32">
                {partido.local}
              </span>

              <input
                type="number"
                min="0"
                className="w-20 p-3 rounded-xl text-black text-center"
                onChange={(e) =>
                  actualizarPrediccion(
                    partido.id,
                    "local",
                    e.target.value
                  )
                }
              />

              <span className="font-bold">
                VS
              </span>

              <input
                type="number"
                min="0"
                className="w-20 p-3 rounded-xl text-black text-center"
                onChange={(e) =>
                  actualizarPrediccion(
                    partido.id,
                    "visitante",
                    e.target.value
                  )
                }
              />

              <span className="font-bold w-32 text-right">
                {partido.visitante}
              </span>

            </div>
          ))}

        </div>

        {/* BOTON */}
        <button
          onClick={guardarPredicciones}
          className="w-full bg-green-600 hover:bg-green-700 p-4 rounded-2xl font-bold mt-8"
        >
          Guardar Predicciones
        </button>

        {/* MENSAJE */}
        <p className="text-center mt-6 text-xl font-bold">
          {mensaje}
        </p>

        {/* TABLA PREDICCIONES */}
        <div className="bg-slate-800 p-6 rounded-2xl mt-10">

          <h2 className="text-2xl font-bold mb-6">
            Predicciones Guardadas
          </h2>

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-600">

                <th className="text-left p-3">
                  Usuario
                </th>

                <th className="text-center p-3">
                  Partido
                </th>

                <th className="text-center p-3">
                  Predicción
                </th>

              </tr>

            </thead>

            <tbody>

              {prediccionesGuardadas.map((prediccion) => {

                const partido = partidos.find(
                  (p) => p.id === prediccion.partido_id
                );

                return (

                  <tr
                    key={prediccion.id}
                    className="border-b border-slate-700"
                  >

                    <td className="p-3">
                      {prediccion.usuario}
                    </td>

                    <td className="p-3 text-center">
                      {partido?.local} vs {partido?.visitante}
                    </td>

                    <td className="p-3 text-center font-bold">
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

        {/* TABLA POSICIONES */}
        <div className="bg-slate-800 p-6 rounded-2xl mt-10">

          <h2 className="text-2xl font-bold mb-6">
            🏆 Tabla de Posiciones
          </h2>

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-600">

                <th className="text-left p-3">
                  Posición
                </th>

                <th className="text-left p-3">
                  Usuario
                </th>

                <th className="text-right p-3">
                  Puntos
                </th>

              </tr>

            </thead>

            <tbody>

              {tablaPosiciones.map((jugador, index) => (

                <tr
                  key={jugador.usuario}
                  className="border-b border-slate-700"
                >

                  <td className="p-3 font-bold">
                    #{index + 1}
                  </td>

                  <td className="p-3">
                    {jugador.usuario}
                  </td>

                  <td className="p-3 text-right font-bold">
                    {jugador.puntos}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}