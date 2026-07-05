import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {

  const [usuario, setUsuario] = useState("");
  const [pin, setPin] = useState("");
  const [rama, setRama] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaTablaPosiciones, setBusquedaTablaPosiciones] = useState("");
  const [datosConfirmados, setDatosConfirmados] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("Fecha 1");

  const [partidos, setPartidos] = useState([]);
  const [predicciones, setPredicciones] = useState({});
  const [prediccionesGuardadas, setPrediccionesGuardadas] = useState([]);

  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [tablaPorRama, setTablaPorRama] = useState({});
  const [ramaLider, setRamaLider] = useState("---");
  const [ramaPromedioLider, setRamaPromedioLider] = useState("---");
  const [mostrarReglas, setMostrarReglas] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resultadosReales, setResultadosReales] = useState({});

  const emojisRamas = {
    Castores: "🦫",
    Manada: "🐺",
    Unidad: "⚜️",
    Caminantes: "🏔️",
    Rovers: "🛶",
    Educadores: "🧭",
  };

  // FUNCIÓN PARA NORMALIZAR NOMBRES (ignorar tildes, mayúsculas, espacios)
  function normalizarNombre(nombre) {
    if (!nombre) return "";
    return nombre
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remover tildes
  }


  // FUNCION PARA VERIFICAR SI EL PARTIDO ESTA CERRADO
  const estaCerrado = (diaStr, horarioStr) => {
    if (!diaStr || !horarioStr) return false;
    
    try {
      // Formato esperado: "Jue 11/06" y "16:00"
      const [_, fechaPartes] = diaStr.split(" ");
      const [dia, mes] = fechaPartes.split("/").map(Number);
      const [hora, min] = horarioStr.split(":").map(Number);
      
      const fechaPartido = new Date(2026, mes - 1, dia, hora, min);
      return new Date() > fechaPartido;
    } catch (e) {
      return false;
    }
  };

  // FUNCION PARA OBTENER TIEMPO RESTANTE
  const obtenerTiempoRestante = (diaStr, horarioStr) => {
    if (!diaStr || !horarioStr) return null;
    try {
      const [_, fechaPartes] = diaStr.split(" ");
      const [dia, mes] = fechaPartes.split("/").map(Number);
      const [hora, min] = horarioStr.split(":").map(Number);
      const fechaPartido = new Date(2026, mes - 1, dia, hora, min);
      const dif = fechaPartido - new Date();
      
      if (dif <= 0) return "Cerrado";
      
      const horas = Math.floor(dif / (1000 * 60 * 60));
      const minutos = Math.floor((dif % (1000 * 60 * 60)) / (1000 * 60));
      
      if (horas > 24) return `Cierra en ${Math.floor(horas/24)}d`;
      if (horas > 0) return `Cierra en ${horas}h ${minutos}m`;
      return `Cierra en ${minutos}m`;
    } catch (e) {
      return null;
    }
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
    "Arabia Saudita": "sa", "Saudi Arabia": "sa", "Cabo Verde": "cv", "RD Congo": "cd", "Bosnia y Herzegovina": "ba", "Bosnia and Herzegovina": "ba"
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
      
      // Cargar los resultados reales en el estado del admin
      const resultadosActuales = {};
      data.forEach((partido) => {
        if (partido.goles_local !== null && partido.goles_visitante !== null) {
          resultadosActuales[partido.id] = {
            local: partido.goles_local,
            visitante: partido.goles_visitante
          };
        }
      });
      setResultadosReales(resultadosActuales);
    }
  }

  // OBTENER PREDICCIONES
  async function obtenerPredicciones() {

    let allData = [];
    let pageSize = 1000;
    let page = 0;
    let hasMore = true;

    // Paginación: obtener todos los registros sin límite
    while (hasMore) {
      const { data, error } = await supabase
        .from("predicciones")
        .select("*")
        .order("id", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.log("Error en página " + page + ":", error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = [...allData, ...data];
        page++;
      }
    }

    if (allData.length > 0) {
      // Normalizar nombres: ignorar tildes, mayúsculas y espacios
      const dataNormalizada = allData.map(p => ({

        ...p,
        usuario_normalizado: normalizarNombre(p.usuario)
      }));

      // Deduplicar: mantener solo la predicción más reciente (ID más alto) por usuario normalizado y partido
      const deduplicadas = {};
      dataNormalizada.forEach((prediccion) => {
        const clave = `${prediccion.usuario_normalizado}_${prediccion.partido_id}`;
        // Si no existe o el nuevo tiene ID más alto (más reciente), reemplazar
        if (!deduplicadas[clave] || prediccion.id > deduplicadas[clave].id) {
          deduplicadas[clave] = prediccion;
        }
      });
      
      const dataDeduplic = Object.values(deduplicadas);
      setPrediccionesGuardadas(dataDeduplic);
    }
  }

  // GUARDAR PREDICCIONES
async function guardarPredicciones() {

  if (!usuario || !rama || !pin) {
    setMensaje("⚠️ Completá nombre, rama y PIN");
    return;
  }

  if (pin.length !== 4) {
    setMensaje("⚠️ El PIN debe ser de 4 dígitos");
    return;
  }

  // Verificar si el usuario ya existe y si el PIN coincide
  const { data: usuarioExistente, error: errorCheck } = await supabase
    .from("predicciones")
    .select("pin")
    .eq("usuario", usuario)
    .limit(1)
    .single();

  if (usuarioExistente && usuarioExistente.pin !== pin) {
    setMensaje("❌ PIN incorrecto para este usuario");
    return;
  }

  // Recolectar todas las predicciones a guardar antes de procesarlas
  const prediccionesAGuardar = [];

  for (const partido of partidos) {
    // SEGURIDAD: No guardar si el partido ya empezó
    if (estaCerrado(partido.dia, partido.horario)) continue;

    const prediccion = predicciones[partido.id];

    if (!prediccion) continue;

    // VALIDACIÓN: Evitar guardar si falta algún gol
    if (prediccion.local === "" || prediccion.visitante === "" || 
        prediccion.local === undefined || prediccion.visitante === undefined) {
      continue; // Omitir este partido si está incompleto
    }

    prediccionesAGuardar.push({
      usuario: usuario,
      rama: rama,
      pin: pin,
      partido_id: partido.id,
      goles_local: Number(prediccion.local),
      goles_visitante: Number(prediccion.visitante),
    });
  }

  // Si hay predicciones a guardar, hacer un único upsert
  if (prediccionesAGuardar.length > 0) {
    const { error } = await supabase
      .from("predicciones")
      .upsert(prediccionesAGuardar, { onConflict: 'usuario,partido_id' });

    if (error) {
      setMensaje("❌ Error al guardar: " + error.message);
      return;
    }
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

    if (!partido) return 0;

    // Convertir a números forzosamente
    const golesLocalReal = parseInt(partido.goles_local) || 0;
    const golesVisitanteReal = parseInt(partido.goles_visitante) || 0;
    const golesLocalPred = parseInt(prediccion.goles_local) || 0;
    const golesVisitantePred = parseInt(prediccion.goles_visitante) || 0;

    // Si no hay resultado real cargado, no hay puntos
    if (
      partido.goles_local === null ||
      partido.goles_visitante === null
    ) {
      return 0;
    }

    // Acierto exacto: 3 puntos
    if (
      golesLocalPred === golesLocalReal &&
      golesVisitantePred === golesVisitanteReal
    ) {
      return 3;
    }

    // Calcular diferencias
    const diferenciaPred = golesLocalPred - golesVisitantePred;
    const diferenciaReal = golesLocalReal - golesVisitanteReal;

    // Acierto de resultado (ganador o empate): 1 punto
    if (
      (diferenciaPred > 0 && diferenciaReal > 0) ||
      (diferenciaPred < 0 && diferenciaReal < 0) ||
      (diferenciaPred === 0 && diferenciaReal === 0)
    ) {
      return 1;
    }

    // Sin acierto
    return 0;
  }

  // OBTENER PREDICCIÓN GUARDADA DE UN USUARIO
  function obtenerPrediccionGuardada(partidoId) {
    const prediccion = prediccionesGuardadas.find(
      (p) => normalizarNombre(p.usuario) === normalizarNombre(usuario) && p.partido_id === partidoId
    );
    return prediccion ? { local: prediccion.goles_local, visitante: prediccion.goles_visitante } : null;
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

      // Usar nombre normalizado como clave única (ignora PIN y variaciones)
      const usuarioNormalizado = normalizarNombre(prediccion.usuario);
      
      if (!tabla[usuarioNormalizado]) {
        tabla[usuarioNormalizado] = { 
          puntos: 0, 
          rama: prediccion.rama,
          usuarioOriginal: prediccion.usuario.trim()
        };
      }

      // Sumar puntos sin importar el PIN o variaciones del registro
      tabla[usuarioNormalizado].puntos += puntos;
      
      // Actualizar rama si es más reciente (por si cambió)
      if (prediccion.rama) {
        tabla[usuarioNormalizado].rama = prediccion.rama;
      }
    });

    const resultado = Object.entries(tabla).map(
      ([_, info]) => ({
        usuario: info.usuarioOriginal,
        puntos: info.puntos,
        rama: info.rama,
      })
    );

    resultado.sort((a, b) => b.puntos - a.puntos);

    // Aplicar bono de 5 puntos a partir del 3er puesto para aumentar competitividad
    const resultadoConBono = resultado.map((usuario, index) => ({
      ...usuario,
      puntos: index >= 2 ? usuario.puntos + 5 : usuario.puntos // Bono para puesto 3 en adelante
    }));

    // Re-ordenar después de aplicar el bono
    resultadoConBono.sort((a, b) => b.puntos - a.puntos);

    setTablaPosiciones(resultadoConBono);
  }

  // CONFIRMAR DATOS PERSONALES
  function confirmarDatos() {
    if (!usuario || !rama || !pin) {
      setMensaje("⚠️ Completá nombre, rama y PIN");
      return;
    }

    if (pin.length !== 4) {
      setMensaje("⚠️ El PIN debe ser de 4 dígitos");
      return;
    }

    setDatosConfirmados(true);
    setMensaje("✅ ¡Datos confirmados! Ya podés cargar tus pálpitos");
  }

  // CALCULAR ESTADÍSTICAS DE UN USUARIO
  function calcularEstadisticasUsuario(nombreUsuario) {
    // Búsqueda flexible: incluye coincidencias parciales
    const prediccionesUsuario = prediccionesGuardadas.filter(
      (p) => p.usuario && p.usuario.toLowerCase().includes(nombreUsuario.toLowerCase())
    );

    let aciertosExactos = 0;
    let aciertosResultado = 0;
    let totalPartidosConResultado = 0;
    let totalPartidosPronosticados = 0;

    prediccionesUsuario.forEach((prediccion) => {
      const partido = partidos.find((p) => p.id === prediccion.partido_id);
      if (!partido) return;

      // Contar todos los partidos pronosticados
      totalPartidosPronosticados++;

      // Si el partido tiene resultado, contar aciertos
      if (partido.goles_local !== null && partido.goles_visitante !== null) {
        totalPartidosConResultado++;
        const puntos = calcularPuntos(prediccion, partido);
        if (puntos === 3) aciertosExactos++;
        else if (puntos === 1) aciertosResultado++;
      }
    });

    const porcentaje =
      totalPartidosConResultado > 0
        ? Math.round(
            ((aciertosExactos * 3 + aciertosResultado * 1) /
              (totalPartidosConResultado * 3)) *
              100
          )
        : 0;

    return {
      aciertosExactos,
      aciertosResultado,
      totalPartidos: totalPartidosPronosticados,
      porcentaje,
    };
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

    // Normalizar nombre de usuario
    const usuarioNormalizado = prediccion.usuario.trim();

    if (!ramas[prediccion.rama]) {
      ramas[prediccion.rama] = {};
    }

    if (!ramas[prediccion.rama][usuarioNormalizado]) {
      ramas[prediccion.rama][usuarioNormalizado] = { 
        puntos: 0, 
        usuarioOriginal: usuarioNormalizado 
      };
    }

    ramas[prediccion.rama][usuarioNormalizado].puntos += puntos;

  });

  const resultado = {};

  Object.keys(ramas).forEach((rama) => {

    resultado[rama] = Object.entries(ramas[rama])
      .map(([_, info]) => ({
        usuario: info.usuarioOriginal,
        puntos: info.puntos,
      }))
      .sort((a, b) => b.puntos - a.puntos);

  });

  setTablaPorRama(resultado);

  // Calcular rama líder (Total y Promedio)
  const rankingRamas = Object.entries(resultado);
  if (rankingRamas.length > 0) {
    // Líder por Total
    const liderTotal = [...rankingRamas].sort((a, b) => {
      const sumaA = a[1].reduce((acc, curr) => acc + curr.puntos, 0);
      const sumaB = b[1].reduce((acc, curr) => acc + curr.puntos, 0);
      return sumaB - sumaA;
    })[0][0];
    setRamaLider(liderTotal);

    // Líder por Promedio
    const liderPromedio = [...rankingRamas].sort((a, b) => {
      const promA = a[1].reduce((acc, curr) => acc + curr.puntos, 0) / a[1].length;
      const promB = b[1].reduce((acc, curr) => acc + curr.puntos, 0) / b[1].length;
      return promB - promA;
    })[0][0];
    setRamaPromedioLider(liderPromedio);
  }

}


  // FUNCION PARA LOGUEARSE COMO ADMIN
  const loginAdmin = () => {
    const pass = prompt("Introduce la contraseña de administrador:");
    if (pass === "bruno.terry") {
      setIsAdmin(true);
      setMensaje("🔓 Modo administrador activado");
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // FUNCION PARA GUARDAR RESULTADOS REALES (ADMIN)
  async function guardarResultadosReales() {
    try {
      console.log("Iniciando guardado de resultados:", resultadosReales);
      let guardados = 0;
      let errores = 0;

      for (const partidoId in resultadosReales) {
        const res = resultadosReales[partidoId];
        
        // Validar que tenemos valores válidos
        if (!res || res.local === "" || res.local === undefined || res.visitante === "" || res.visitante === undefined) {
          console.log(`Saltando partido ${partidoId} - valores vacíos`);
          continue;
        }

        const golesLocal = Number(res.local);
        const golesVisitante = Number(res.visitante);

        // Obtener los nombres de los equipos del estado actual de partidos
        const partidoActual = partidos.find(p => p.id === Number(partidoId));
        const equipoLocal = partidoActual?.local || "";
        const equipoVisitante = partidoActual?.visitante || "";

        console.log(`Guardando partido ${partidoId}: ${equipoLocal} ${golesLocal} - ${golesVisitante} ${equipoVisitante}`);

        const { data, error } = await supabase
          .from("partidos")
          .update({
            goles_local: golesLocal,
            goles_visitante: golesVisitante,
            local: equipoLocal,
            visitante: equipoVisitante
          })
          .eq("id", Number(partidoId));

        if (error) {
          console.error(`Error al guardar partido ${partidoId}:`, error);
          errores++;
        } else {
          console.log(`Partido ${partidoId} guardado exitosamente`);
          guardados++;
        }
      }

      if (guardados === 0 && errores === 0) {
        setMensaje("⚠️ No hay resultados para guardar");
      } else if (errores > 0) {
        setMensaje(`⚠️ Se guardaron ${guardados} resultados. ${errores} con error.`);
      } else {
        setMensaje(`✅ ${guardados} resultados guardados correctamente`);
      }

      // Esperar un poco y luego recargar
      setTimeout(() => {
        console.log("Recargando partidos...");
        obtenerPartidos();
      }, 1000);
    } catch (err) {
      console.error("Error general:", err);
      setMensaje("❌ Error al guardar resultados: " + err.message);
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

  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 relative overflow-x-hidden">
    {/* LOGO DE FONDO DIFUMINADO */}
    <div 
      className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center opacity-[0.03] blur-[2px]"
      style={{
        backgroundImage: 'url("/logo.jpeg")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
      }}
    />

    <div className="max-w-5xl mx-auto relative z-10">



      {/* TITULO Y REGLAS */}
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-center tracking-tight mb-4">
          ⚽ Prode Mundial 2026
        </h1>
        <button 
          onClick={() => setMostrarReglas(!mostrarReglas)}
          className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all"
        >
          {mostrarReglas ? "🔼 Ocultar Reglas" : "📜 Ver Sistema de Puntos"}
        </button>

        {mostrarReglas && (
          <div className="mt-4 w-full max-w-md bg-white/5 border border-white/10 p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                <span>🎯 Resultado Exacto</span>
                <span className="font-bold text-green-400">+3 pts</span>
              </li>
              <li className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                <span>🏆 Ganador / Empate</span>
                <span className="font-bold text-blue-400">+1 pts</span>
              </li>
              <li className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5 text-slate-500">
                <span>❌ Sin aciertos</span>
                <span className="font-bold">0 pts</span>
              </li>
            </ul>
          </div>
        )}

        {/* MENSAJE DE BIENVENIDA */}
        <p className="mt-8 text-center text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          ¡Bienvenido al prode del Mundial 2026 de Remedios! Para comenzar, completá tu nombre, la rama en la que estás y cargá tus primeros resultados.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">👥 Participantes</p>
          <p className="text-4xl font-black text-white">{tablaPosiciones.length}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">⚽ Partidos</p>
          <p className="text-4xl font-black text-white">{partidos.length}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">🏆 Líder</p>
          <p className="text-2xl font-black text-yellow-400 truncate">{tablaPosiciones[0]?.usuario || "---"}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center shadow-xl hover:scale-105 transition-all">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">🔥 Rama Lider (Prom)</p>
          <p className="text-2xl font-black text-green-400 truncate">{emojisRamas[ramaPromedioLider]} {ramaPromedioLider}</p>
        </div>
      </div>

      {/* NOMBRE Y PIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <input
          type="text"
          placeholder="Tu nombre"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full p-4 rounded-2xl bg-white text-black text-lg font-semibold shadow-xl outline-none"
        />
        <input
          type="password"
          maxLength="4"
          placeholder="PIN (4 dígitos)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full p-4 rounded-2xl bg-white text-black text-lg font-semibold shadow-xl outline-none"
        />
      </div>

{/* RAMA */}
<select
  value={rama}
  onChange={(e) => setRama(e.target.value)}
  className="w-full p-4 rounded-2xl bg-white text-black mb-8 text-lg font-semibold shadow-xl"
>
  <option value="">Seleccionar rama</option>
  <option value="Castores">Castores</option>
  <option value="Manada">Manada</option>
  <option value="Unidad">Unidad</option>
  <option value="Caminantes">Caminantes</option>
  <option value="Rovers">Rovers</option>
  <option value="Educadores">Educadores</option>
</select>

{/* BOTÓN CONFIRMAR DATOS */}
<button
  onClick={confirmarDatos}
  className={`w-full p-4 rounded-2xl font-bold text-lg mb-8 transition-all ${
    datosConfirmados
      ? "bg-green-500/30 border-2 border-green-400 text-green-400 cursor-default"
      : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:scale-[1.02]"
  }`}
>
  {datosConfirmados ? "✅ Datos Confirmados" : "Confirmar Datos"}
</button>


      {/* SELECTOR DE JORNADAS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {Array.from(new Set(partidos.map((p) => p.fecha || "Sin Fecha")))
          .sort((a, b) => {
            const orden = ["Fecha 1", "Fecha 2", "Fecha 3", "16avos", "Octavos", "Cuartos", "Semis", "3er Puesto", "Final"];
            const indexA = orden.indexOf(a);
            const indexB = orden.indexOf(b);
            // Si no está en la lista, ponerlo al final
            return (indexA === -1 ? orden.length : indexA) - (indexB === -1 ? orden.length : indexB);
          })
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
            
            {partidosDia.map((partido) => {
              const cerrado = estaCerrado(partido.dia, partido.horario);
              const tiempo = obtenerTiempoRestante(partido.dia, partido.horario);
              
              return (
              <div
                key={partido.id}
                className={`relative border shadow-2xl p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${
                  cerrado ? "bg-black/20 border-white/5 opacity-75" : "bg-white/10 border-white/10 hover:scale-[1.01]"
                }`}
              >
                {/* HORARIO Y ESTADO */}
                <div className="absolute -top-3 left-6 flex gap-2 z-10">
                  <div className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter">
                    {partido.horario || "--:--"}
                  </div>
                  {tiempo && (
                    <div className={`${cerrado ? "bg-red-500" : "bg-blue-500"} text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter`}>
                      {cerrado ? "🔒 CERRADO" : `⏳ ${tiempo}`}
                    </div>
                  )}
                </div>

                {/* EQUIPO LOCAL */}
                <div className="flex items-center gap-3 w-full md:w-40 justify-between md:justify-start">
                  <div className="flex items-center gap-2">
                    {codigosBanderas[partido.local] ? (
                      <img src={`https://flagcdn.com/w40/${codigosBanderas[partido.local]}.png`} alt={partido.local} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    ) : "🏳️"} 
                    <span className={`font-bold text-base md:text-lg ${cerrado ? "text-slate-500" : ""}`}>{partido.local}</span>
                  </div>
	                  <input
	                    type="number"
	                    min="0"
	                    placeholder="0"
	                    disabled={cerrado}
	                    className={`w-14 md:w-20 p-2 md:p-3 rounded-xl text-center font-bold text-lg shadow-inner md:hidden ${
	                      cerrado ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-white text-black"
	                    }`}
	                    onChange={(e) => actualizarPrediccion(partido.id, "local", e.target.value)}
	                  />
	                </div>
	
	                {/* RESULTADO REAL MOBILE */}
	                {partido.goles_local !== null && partido.goles_visitante !== null && (
	                  <div className="md:hidden bg-yellow-400/20 text-yellow-400 text-xs font-black px-3 py-1 rounded-full border border-yellow-400/30">
	                    Resultado: {partido.goles_local} - {partido.goles_visitante}
	                  </div>
	                )}
	
	                {/* VS Y INPUTS DESKTOP */}
                <div className="hidden md:flex items-center gap-4">
                  {(() => {
                    const prediccionGuardada = obtenerPrediccionGuardada(partido.id);
                    return (
                      <input
                        type="number"
                        min="0"
                        value={prediccionGuardada?.local || predicciones[partido.id]?.local || ""}
                        disabled={cerrado}
                        className={`w-20 p-3 rounded-2xl text-center font-bold text-lg shadow-inner ${
                          cerrado ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-white text-black"
                        }`}
                        onChange={(e) => actualizarPrediccion(partido.id, "local", e.target.value)}
                      />
                    );
                  })()}
	                  <div className="flex flex-col items-center">
	                    <span className="font-black text-xl text-slate-300">{cerrado ? "🔒" : "VS"}</span>
	                    {partido.goles_local !== null && partido.goles_visitante !== null && (
	                      <div className="mt-1 bg-yellow-400/20 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-yellow-400/30">
	                        {partido.goles_local} - {partido.goles_visitante}
	                      </div>
	                    )}
	                  </div>
                  {(() => {
                    const prediccionGuardada = obtenerPrediccionGuardada(partido.id);
                    return (
                      <input
                        type="number"
                        min="0"
                        value={prediccionGuardada?.visitante || predicciones[partido.id]?.visitante || ""}
                        disabled={cerrado}
                        className={`w-20 p-3 rounded-2xl text-center font-bold text-lg shadow-inner ${
                          cerrado ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-white text-black"
                        }`}
                        onChange={(e) => actualizarPrediccion(partido.id, "visitante", e.target.value)}
                      />
                    );
                  })()}
                </div>

                {/* EQUIPO VISITANTE */}
                <div className="flex items-center gap-3 w-full md:w-40 justify-between md:justify-end">
                  {(() => {
                    const prediccionGuardada = obtenerPrediccionGuardada(partido.id);
                    return (
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={prediccionGuardada?.visitante || predicciones[partido.id]?.visitante || ""}
                        disabled={cerrado}
                        className={`w-14 md:w-20 p-2 md:p-3 rounded-xl text-center font-bold text-lg shadow-inner md:hidden ${
                          cerrado ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-white text-black"
                        }`}
                        onChange={(e) => actualizarPrediccion(partido.id, "visitante", e.target.value)}
                      />
                    );
                  })()}
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-base md:text-lg ${cerrado ? "text-slate-500" : ""}`}>{partido.visitante}</span>
                    {codigosBanderas[partido.visitante] ? (
                      <img src={`https://flagcdn.com/w40/${codigosBanderas[partido.visitante]}.png`} alt={partido.visitante} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    ) : "🏳️"}
                  </div>
                </div>
              </div>
            );})}
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
          <div className="space-y-6">
            {/* TARJETA DE ESTADÍSTICAS */}
            {(() => {
              const stats = calcularEstadisticasUsuario(busqueda);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-4 rounded-2xl border border-blue-400/30 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">📋 Partidos</p>
                    <p className="text-3xl font-black text-blue-400">{stats.totalPartidos}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-transparent p-4 rounded-2xl border border-green-400/30 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">🎯 Exactos</p>
                    <p className="text-3xl font-black text-green-400">{stats.aciertosExactos}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-transparent p-4 rounded-2xl border border-yellow-400/30 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">🏆 Resultado</p>
                    <p className="text-3xl font-black text-yellow-400">{stats.aciertosResultado}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-4 rounded-2xl border border-purple-400/30 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">📊 Precisión</p>
                    <p className="text-3xl font-black text-purple-400">{stats.porcentaje}%</p>
                  </div>
                </div>
              );
            })()}

            {/* TABLA DE PREDICCIONES */}
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-white/10">
                    <th className="text-left p-4">Usuario</th>
                    <th className="text-left p-4">Rama</th>
                    <th className="text-center p-4">Partido</th>
                    <th className="text-center p-4">Tu Predicción</th>
                    <th className="text-center p-4">Resultado Real</th>
                  </tr>
                </thead>
                <tbody>
                  {prediccionesGuardadas
                    .filter((p) =>
                      p.usuario && p.usuario.toLowerCase().includes(busqueda.toLowerCase())
                    )
                    .map((prediccion) => {
                      const partido = partidos.find(
                        (p) => p.id === prediccion.partido_id
                      );

                      // Si el partido no existe (fue eliminado de la base), saltar
                      if (!partido) return null;

                      const puntos = calcularPuntos(prediccion, partido);
                      const resultadoColor =
                        puntos === 3
                          ? "text-green-400"
                          : puntos === 1
                          ? "text-yellow-400"
                          : "text-red-400";
                      const resultadoEmoji =
                        puntos === 3 ? "✅" : puntos === 1 ? "⚠️" : "❌";

                      return (
                        <tr
                          key={prediccion.id}
                          className="border-b border-white/10 hover:bg-white/5 transition-all"
                        >
                          <td className="p-4 font-semibold">
                            {prediccion.usuario}
                          </td>
                          <td className="p-4 text-sm text-slate-300">
                            {emojisRamas[prediccion.rama]} {prediccion.rama}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {codigosBanderas[partido?.local] && (
                                <img
                                  src={`https://flagcdn.com/w40/${codigosBanderas[partido?.local]}.png`}
                                  className="w-5 h-3"
                                />
                              )}
                              {partido?.local} vs {partido?.visitante}
                              {codigosBanderas[partido?.visitante] && (
                                <img
                                  src={`https://flagcdn.com/w40/${codigosBanderas[partido?.visitante]}.png`}
                                  className="w-5 h-3"
                                />
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center font-black text-blue-400">
                            {prediccion.goles_local} - {prediccion.goles_visitante}
                          </td>
                          <td className={`p-4 text-center font-black ${resultadoColor}`}>
                            {partido?.goles_local !== null &&
                            partido?.goles_visitante !== null
                              ? `${resultadoEmoji} ${partido.goles_local} - ${partido.goles_visitante}`
                              : "⏳ Pendiente"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
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

        {/* PODIO DESTACADO */}
        {tablaPosiciones.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* SEGUNDO PUESTO */}
            <div className="order-2 md:order-1 bg-gradient-to-b from-slate-400/20 to-transparent p-6 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">🥈</span>
              <span className="text-xl font-bold">{tablaPosiciones[1].usuario}</span>
              <span className="text-slate-400 text-sm">{tablaPosiciones[1].rama}</span>
              <span className="text-2xl font-black text-slate-300 mt-2">{tablaPosiciones[1].puntos} pts</span>
            </div>
            {/* PRIMER PUESTO */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-yellow-400/20 to-transparent p-8 rounded-3xl border border-yellow-400/30 text-center flex flex-col items-center justify-center scale-105 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
              <span className="text-5xl mb-2">🥇</span>
              <span className="text-2xl font-black text-yellow-400">{tablaPosiciones[0].usuario}</span>
              <span className="text-yellow-400/60 text-sm">{tablaPosiciones[0].rama}</span>
              <span className="text-3xl font-black text-yellow-400 mt-2">{tablaPosiciones[0].puntos} pts</span>
            </div>
            {/* TERCER PUESTO */}
            <div className="order-3 md:order-3 bg-gradient-to-b from-amber-700/20 to-transparent p-6 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">🥉</span>
              <span className="text-xl font-bold">{tablaPosiciones[2].usuario}</span>
              <span className="text-slate-400 text-sm">{tablaPosiciones[2].rama}</span>
              <span className="text-2xl font-black text-amber-600 mt-2">{tablaPosiciones[2].puntos} pts</span>
            </div>
          </div>
        )}

        {/* BUSCADOR TABLA POSICIONES */}
        <input
          type="text"
          placeholder="🔍 Buscar en el ranking..."
          value={busquedaTablaPosiciones}
          onChange={(e) => setBusquedaTablaPosiciones(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white mb-6 outline-none focus:border-green-400 transition-all"
        />

        <div className="overflow-x-auto rounded-2xl max-h-[500px] overflow-y-auto">

          <table className="w-full min-w-[500px]">

            <thead className="sticky top-0 bg-white/10 z-10">

              <tr>

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

              {tablaPosiciones
                .filter((jugador) =>
                  jugador.usuario && jugador.usuario.toLowerCase().includes(busquedaTablaPosiciones.toLowerCase())
                )
                .map((jugador, index) => (

                <tr
                  key={jugador.usuario}
                  className="border-b border-white/10 hover:bg-white/5 transition-all"
                >

                  <td className="p-4 font-black text-lg">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
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

      {/* PANEL DE ADMINISTRADOR */}
      {isAdmin && (
        <div className="bg-slate-800/50 border-2 border-yellow-500/50 p-8 rounded-3xl mt-12 mb-12 shadow-2xl animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-yellow-400 flex items-center gap-3">
              🛡️ Panel de Control (Admin)
            </h2>
            <button 
              onClick={() => setIsAdmin(false)}
              className="text-slate-400 hover:text-white font-bold"
            >
              Cerrar X
            </button>
          </div>

          <div className="space-y-6">
            {partidos
              .sort((a, b) => a.id - b.id)
              .map((partido) => (
              <div key={partido.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <img src={`https://flagcdn.com/w40/${codigosBanderas[partido.local] || 'un'}.png`} className="w-6 h-4 object-cover rounded-sm" alt="" />
                  <input
                    type="text"
                    value={partido.local}
                    onChange={(e) => {
                      const updatedPartidos = partidos.map(p => 
                        p.id === partido.id ? {...p, local: e.target.value} : p
                      );
                      setPartidos(updatedPartidos);
                    }}
                    className="font-bold bg-slate-900 px-2 py-1 rounded border border-yellow-500/50 text-white outline-none focus:border-yellow-400 w-32"
                  />
                  <span className="text-slate-500 text-sm">vs</span>
                  <input
                    type="text"
                    value={partido.visitante}
                    onChange={(e) => {
                      const updatedPartidos = partidos.map(p => 
                        p.id === partido.id ? {...p, visitante: e.target.value} : p
                      );
                      setPartidos(updatedPartidos);
                    }}
                    className="font-bold bg-slate-900 px-2 py-1 rounded border border-yellow-500/50 text-white outline-none focus:border-yellow-400 w-32"
                  />
                  <img src={`https://flagcdn.com/w40/${codigosBanderas[partido.visitante] || 'un'}.png`} className="w-6 h-4 object-cover rounded-sm" alt="" />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={resultadosReales[partido.id]?.local}
                    onChange={(e) => setResultadosReales({...resultadosReales, [partido.id]: {...resultadosReales[partido.id], local: e.target.value}})}
                    className="w-14 p-2 rounded-xl bg-slate-900 text-center font-bold text-yellow-400 outline-none border border-white/10"
                    placeholder="L"
                  />
                  <span className="font-bold text-slate-500">-</span>
                  <input
                    type="number"
                    value={resultadosReales[partido.id]?.visitante}
                    onChange={(e) => setResultadosReales({...resultadosReales, [partido.id]: {...resultadosReales[partido.id], visitante: e.target.value}})}
                    className="w-14 p-2 rounded-xl bg-slate-900 text-center font-bold text-yellow-400 outline-none border border-white/10"
                    placeholder="V"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={guardarResultadosReales}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black p-5 rounded-3xl mt-8 shadow-xl transition-all"
          >
            GUARDAR RESULTADOS REALES Y ACTUALIZAR RANKING
          </button>
        </div>
      )}

      {/* TABLA POR RAMA */}
      {Object.keys(tablaPorRama).map((rama) => (

        <div
          key={rama}
          className="bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-4 md:p-6 rounded-3xl mt-12"
        >

          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">
              {emojisRamas[rama] || "🏕️"} Ranking {rama}
            </h2>
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <span className="text-slate-400 text-sm">Promedio: </span>
              <span className="font-bold text-green-400">
                {(tablaPorRama[rama].reduce((sum, j) => sum + j.puntos, 0) / tablaPorRama[rama].length).toFixed(1)} pts
              </span>
            </div>
          </div>

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

                  <td className="p-4 font-black text-lg">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
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

      <div className="mt-20 text-center text-slate-600 text-sm flex flex-col items-center gap-4">
        <p>Prode Mundial 2026 - Desarrollado para Remedios</p>
        {!isAdmin && (
          <button 
            onClick={loginAdmin}
            className="opacity-20 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest font-bold"
          >
            ⚙️ Acceso Admin
          </button>
        )}
      </div>

    </div>

  </div>
);
}