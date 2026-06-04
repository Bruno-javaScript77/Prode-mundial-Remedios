import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {

  const [usuario, setUsuario] = useState("");
  const [rama, setRama] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("Fecha 1");

  const [partidos, setPartidos] = useState([]);
  const [predicciones, setPredicciones] = useState({});
  const [prediccionesGuardadas, setPrediccionesGuardadas] = useState([]);

  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [tablaPorRama, setTablaPorRama] = useState({});
  const [ramaLider, setRamaLider] = useState("---");

  const emojisRamas = {
    Manada: "🐺",
    Unidad: "⚜️",
    Caminantes: "🏔️",
    Rovers: "🛶",
    Dirigentes: "🧭",
  };

  const codigosBanderas = {
    "México": "mx", "Mexico": "mx",
    "Sudáfrica": "za", "South Africa": "za",
    "Corea del Sur": "kr", "Korea Republic": "kr",
    "República Checa": "cz", "Czechia": "cz",
    "Canadá": "ca", "Canada": "ca",
    "Bosnia y Herzegovina": "ba", "Bosnia and Herzegovina": "ba",
    "Estados Unidos": "us", "USA": "us",
    "Paraguay": "py",
    "Haití": "ht", "Haiti": "ht",
    "Escocia": "gb-sct", "Scotland": "gb-sct",
    "España": "es", "Spain": "es",
    "Cabo Verde": "cv",
    "Argentina": "ar",
    "Argelia": "dz", "Algeria": "dz",
    "Brasil": "br", "Brazil": "br",
    "Marruecos": "ma", "Morocco": "ma",
    "Qatar": "qa",
    "Suiza": "ch", "Switzerland": "ch",
    "Australia": "au",
    "Turquía": "tr", "Türkiye": "tr",
    "Ghana": "gh",
    "Panamá": "pa", "Panama": "pa",
    "Inglaterra": "gb-eng", "England": "gb-eng",
    "Croacia": "hr", "Croatia": "hr",
    "Portugal": "pt",
    "Congo DR": "cd",
    "Uzbekistán": "uz", "Uzbekistan": "uz",
    "Colombia": "co",
    "Francia": "fr", "France": "fr",
    "Senegal": "sn",
    "Irak": "iq", "Iraq": "iq",
    "Noruega": "no", "Norway": "no",
    "Austria": "at",
    "Jordania": "jo", "Jordan": "jo",
    "Alemania": "de", "Germany": "de",
    "Japón": "jp", "Japan": "jp",
    "Curaçao": "cw", "Curazao": "cw", "Curacao": "cw",
    "Países Bajos": "nl", "Netherlands": "nl", "Paises Bajos": "nl",
    "Suecia": "se", "Sweden": "se",
    "Costa de Marfil": "ci", "Ivory Coast": "ci",
    "Ecuador": "ec",
    "Túnez": "tn", "Tunisia": "tn",
    "Bélgica": "be", "Belgium": "be",
    "Irán": "ir", "Iran": "ir",
    "Uruguay": "uy",
    "Nueva Zelanda": "nz", "New Zealand": "nz",
    "Egipto": "eg", "Egypt": "eg",
    "Arabia Saudita": "sa", "Saudi Arabia": "sa"
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
      .upsert(
        [
          {
            usuario: usuario,
            rama: rama,
            partido_id: partido.id,
            goles_local: Number(prediccion.local),
            goles_visitante: Number(prediccion.visitante),
          },
        ],
        { onConflict: 'usuario,partido_id' }
      );
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
      partido.goles_local === null ||
      partido.goles_visitante === null
    ) {
      return 0;
    }

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
        tabla[prediccion.usuario] = { puntos: 0, rama: prediccion.rama };
      }

      tabla[prediccion.usuario].puntos += puntos;
    });

    const resultado = Object.entries(tabla).map(
      ([usuario, info]) => ({
        usuario,
        puntos: info.puntos,
        rama: info.rama,
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

  // Calcular rama líder
  const rankingRamas = Object.entries(resultado);
  if (rankingRamas.length > 0) {
    const lider = rankingRamas.sort((a, b) => {
      const sumaA = a[1].reduce((acc, curr) => acc + curr.puntos, 0);
      const sumaB = b[1].reduce((acc, curr) => acc + curr.puntos, 0);
      return sumaB - sumaA;
    })[0][0];
    setRamaLider(lider);
  }

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

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">👥 Participantes</p>
          <p className="text-4xl font-black text-white mt-1">{tablaPosiciones.length}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">⚽ Partidos</p>
          <p className="text-4xl font-black text-white mt-1">{partidos.length}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">🏆 Líder Actual</p>
          <p className="text-2xl font-black text-yellow-400 mt-2 truncate">
            {tablaPosiciones[0]?.usuario || "---"}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">🔥 Rama Líder</p>
          <p className="text-2xl font-black text-green-400 mt-2 truncate">
            {ramaLider}
          </p>
        </div>
      </div>

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
        {Array.from(new Set(partidos.map((p) => p.fecha || "Sin Fecha")))
          .sort()
          .map((j) => (
            <button
              key={j}
              onClick={() => setFechaSeleccionada(j)}
              className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                fechaSeleccionada === j
                  ? "bg-green-500 text-white shadow-lg scale-105"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              {j}
            </button>
          ))}
      </div>

      {/* PARTIDOS */}
      <div className="space-y-12">
        {Object.entries(
          partidos
            .filter((p) => (p.fecha || "Sin Fecha") === fechaSeleccionada)
            .reduce((acc, p) => {
              const dia = p.dia || "Fecha por confirmar";
              if (!acc[dia]) acc[dia] = [];
              acc[dia].push(p);
              return acc;
            }, {})
        ).map(([dia, partidosDia]) => (
          <div key={dia} className="space-y-4">
            <h3 className="text-lg md:text-xl font-bold text-slate-400 border-b border-white/10 pb-2 flex items-center gap-2">
              📅 {dia}
            </h3>
            
            {partidosDia.map((partido) => (
              <div
                key={partido.id}
                className="relative bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 hover:scale-[1.01] transition-all duration-300"
              >
                <div className="absolute -top-3 left-6 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter z-10">
                  {partido.horario || "--:--"}
                </div>

                <div className="flex items-center gap-3 w-full md:w-40 justify-between md:justify-start">
                  <div className="flex items-center gap-2">
                    {codigosBanderas[partido.local] ? (
                      <img src={`https://flagcdn.com/w40/${codigosBanderas[partido.local]}.png`} alt={partido.local} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    ) : "🏳️"} 
                    <span className="font-bold text-base md:text-lg">{partido.local}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-14 md:w-20 p-2 md:p-3 rounded-xl bg-white text-black text-center font-bold text-lg shadow-inner md:hidden"
                    onChange={(e) => actualizarPrediccion(partido.id, "local", e.target.value)}
                  />
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <input
                    type="number"
                    min="0"
                    className="w-20 p-3 rounded-2xl bg-white text-black text-center font-bold text-lg shadow-inner"
                    onChange={(e) => actualizarPrediccion(partido.id, "local", e.target.value)}
                  />
                  <span className="font-black text-xl text-slate-300">VS</span>
                  <input
                    type="number"
                    min="0"
                    className="w-20 p-3 rounded-2xl bg-white text-black text-center font-bold text-lg shadow-inner"
                    onChange={(e) => actualizarPrediccion(partido.id, "visitante", e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-40 justify-between md:justify-end">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-14 md:w-20 p-2 md:p-3 rounded-xl bg-white text-black text-center font-bold text-lg shadow-inner md:hidden"
                    onChange={(e) => actualizarPrediccion(partido.id, "visitante", e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base md:text-lg">{partido.visitante}</span>
                    {codigosBanderas[partido.visitante] ? (
                      <img src={`https://flagcdn.com/w40/${codigosBanderas[partido.visitante]}.png`} alt={partido.visitante} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    ) : "🏳️"}
                  </div>
                </div>
              </div>
            ))}
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
      <div className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-4 md:p-6 rounded-3xl mt-12">

        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
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
          <div className="overflow-x-auto rounded-2xl">

            <table className="w-full min-w-[500px]">

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
                      <div className="flex items-center justify-center gap-2">
                        {codigosBanderas[partido?.local] && (
                          <img src={`https://flagcdn.com/w40/${codigosBanderas[partido?.local]}.png`} className="w-5 h-3" />
                        )}
                        {partido?.local} vs {partido?.visitante}
                        {codigosBanderas[partido?.visitante] && (
                          <img src={`https://flagcdn.com/w40/${codigosBanderas[partido?.visitante]}.png`} className="w-5 h-3" />
                        )}
                      </div>
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
      <div className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-4 md:p-6 rounded-3xl mt-12">

        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
          🏆 Tabla de Posiciones
        </h2>

        <div className="overflow-x-auto rounded-2xl">

          <table className="w-full min-w-[500px]">

            <thead>

              <tr className="bg-white/10">

                <th className="text-left p-4">
                  Posición
                </th>

                <th className="text-left p-4">
                  Usuario
                </th>

                <th className="text-left p-4">
                  Rama
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

                  <td className="p-4">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      {emojisRamas[jugador.rama]} {jugador.rama}
                    </span>
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
          className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-4 md:p-6 rounded-3xl mt-12"
        >

          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
            {emojisRamas[rama] || "🏕️"} Ranking {rama}
          </h2>

          <div className="overflow-x-auto rounded-2xl">

            <table className="w-full min-w-[500px]">

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

        </div>

      ))}

    </div>

  </div>
);
}