import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  FileDown,
  CheckCircle2,
  Target,
  ShieldAlert,
  ArrowRight,
  Activity,
  Check,
  AlertTriangle,
  Globe,
  DollarSign,
  Scale,
  Users,
  ShieldCheck,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DafoItem, DafoMatrix, RiskCategory } from "./types";

// Tipos de riesgo disponibles
const RISK_TYPES: RiskCategory[] = [
  "Estratégico",
  "Operativo",
  "Financiero",
  "Regulatorio",
  "Global",
  "Conflicto de interés",
];

// Normas ISO disponibles para selección
const ISO_STANDARDS = [
  { value: "ISO 9001:2018", label: "ISO 9001:2018 (Calidad)" },
  { value: "ISO 14001:2015", label: "ISO 14001:2015 (Ambiental)" },
  { value: "ISO 45001:2018", label: "ISO 45001:2018 (Seguridad y Salud)" },
  { value: "ISO 17020", label: "ISO 17020 (Inspección)" },
  { value: "ISO 17025", label: "ISO 17025 (Laboratorios)" },
  { value: "ISO 31000:2018", label: "ISO 31000:2018 (Gestión del Riesgo)" },
];

const DEFAULT_MATRIX: DafoMatrix = {
  fortalezas: [
    { id: "f1", text: "Equipo certificado en ISO 9001", tipo: "Operativo", probabilidad: 3, impacto: 4 },
    { id: "f2", text: "Experiencia consolidada en gestión de riesgos de procesos", tipo: "Estratégico", probabilidad: 2, impacto: 5 },
    { id: "f3", text: "Presencia internacional con dos plantas activas", tipo: "Global", probabilidad: 3, impacto: 3 },
    { id: "f4", text: "Cultura organizacional orientada a la calidad y mejora continua", tipo: "Estratégico", probabilidad: 1, impacto: 4 },
    { id: "f5", text: "Sistema integrado de gestión establecido", tipo: "Regulatorio", probabilidad: 2, impacto: 4 },
  ],
  oportunidades: [
    { id: "o1", text: "Crecimiento proyectado en el sector energético de la región", tipo: "Estratégico", probabilidad: 4, impacto: 4 },
    { id: "o2", text: "Digitalización acelerada de procesos industriales (Industria 4.0)", tipo: "Operativo", probabilidad: 3, impacto: 4 },
    { id: "o3", text: "Nuevas regulaciones ambientales que benefician servicios certificados", tipo: "Regulatorio", probabilidad: 4, impacto: 3 },
    { id: "o4", text: "Alianzas estratégicas con universidades de prestigio", tipo: "Global", probabilidad: 2, impacto: 2 },
    { id: "o5", text: "Alta demanda de certificaciones de calidad en Latinoamérica", tipo: "Global", probabilidad: 5, impacto: 4 },
  ],
  debilidades: [
    { id: "d1", text: "Limitación de recursos internos dedicados a ciberseguridad", tipo: "Financiero", probabilidad: 4, impacto: 4 },
    { id: "d2", text: "Alta dependencia de proveedores especializados externos", tipo: "Operativo", probabilidad: 3, impacto: 3 },
    { id: "d3", text: "Rotación frecuente en puestos clave de supervisión", tipo: "Conflicto de interés", probabilidad: 3, impacto: 4 },
    { id: "d4", text: "Documentación y procedimientos internos desactualizados", tipo: "Regulatorio", probabilidad: 4, impacto: 3 },
    { id: "d5", text: "Inversión moderada en investigación y desarrollo tecnológico", tipo: "Financiero", probabilidad: 2, impacto: 3 },
  ],
  amenazas: [
    { id: "a1", text: "Cambios drásticos e imprevistos en el marco regulatorio sectorial", tipo: "Regulatorio", probabilidad: 3, impacto: 5 },
    { id: "a2", text: "Competencia agresiva en precios por parte de firmas locales", tipo: "Financiero", probabilidad: 4, impacto: 3 },
    { id: "a3", text: "Impacto de eventos climáticos extremos en instalaciones físicas", tipo: "Global", probabilidad: 2, impacto: 5 },
    { id: "a4", text: "Incidencia creciente de ataques informáticos dirigidos", tipo: "Operativo", probabilidad: 3, impacto: 4 },
    { id: "a5", text: "Inestabilidad macroeconómica y fluctuaciones de divisas", tipo: "Financiero", probabilidad: 4, impacto: 3 },
  ],
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Estados del contexto organizacional
  const [selectedNormas, setSelectedNormas] = useState<string[]>(["ISO 9001:2018", "ISO 31000:2018"]);
  const [contextoOrg, setContextoOrg] = useState<string>(
    "Empresa de servicios industriales y certificación, con presencia en Latinoamérica. Clientes: sector energético, manufactura y gobierno. Equipo de 120 personas, dos plantas (Canadá, Colombia) y oficinas en Bruselas."
  );
  const [misionVision, setMisionVision] = useState<string>(
    "Crear valor mediante la gestión integral de riesgos y calidad, con enfoque sostenible."
  );

  // Estado de la matriz DAFO
  const [dafoMatrix, setDafoMatrix] = useState<DafoMatrix>(() => {
    const cached = localStorage.getItem("dafo_matrix_state");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Error al cargar la matriz DAFO del caché", e);
      }
    }
    return DEFAULT_MATRIX;
  });

  // Estado de carga para la generación con IA
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  // Guardar cambios en LocalStorage automáticamente
  useEffect(() => {
    localStorage.setItem("dafo_matrix_state", JSON.stringify(dafoMatrix));
  }, [dafoMatrix]);

  // Manejar selección múltiple de normas ISO
  const toggleNorma = (norma: string) => {
    if (selectedNormas.includes(norma)) {
      setSelectedNormas(selectedNormas.filter((n) => n !== norma));
    } else {
      setSelectedNormas([...selectedNormas, norma]);
    }
  };

  // Función para llamar a la API de generación automática por IA con tolerancia a fallos extrema
  const generarDafoAutomatico = async () => {
    if (!contextoOrg.trim()) {
      alert("Por favor, ingresa el contexto de la organización.");
      return;
    }

    setLoading(true);
    setLoadingStep("Analizando contexto organizativo...");

    const steps = [
      "Alineando con las normas ISO seleccionadas...",
      "Analizando misión y visión corporativa...",
      "Estructurando Fortalezas y Oportunidades...",
      "Detectando Debilidades y Amenazas críticas...",
      "Clasificando categorías de riesgo ISO 31000...",
      "Finalizando matriz DAFO..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1000);

    try {
      const response = await fetch("/api/generar-dafo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contexto: contextoOrg,
          normas: selectedNormas,
          misionVision: misionVision.trim() ? misionVision : null,
        }),
      });

      clearInterval(interval);

      let data;
      if (response.ok) {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (jsonErr) {
          console.warn("La respuesta del servidor no es un JSON válido. Usando generador de respaldo local.", jsonErr);
          data = getLocalFallbackDafo(contextoOrg, selectedNormas, misionVision);
        }
      } else {
        console.warn(`El servidor retornó un código de error ${response.status}. Usando generador de respaldo local.`);
        data = getLocalFallbackDafo(contextoOrg, selectedNormas, misionVision);
      }

      // Transformar la respuesta en nuestra estructura con ID único
      const transformedMatrix: DafoMatrix = {
        fortalezas: (data.fortalezas || []).map((item: any, i: number) => ({
          id: `f_gen_${Date.now()}_${i}`,
          text: item.text,
          tipo: validateRiskType(item.tipo, i),
          probabilidad: Math.floor(Math.random() * 3) + 2, // Default aleatorio razonable 2-4
          impacto: Math.floor(Math.random() * 3) + 2,
        })),
        oportunidades: (data.oportunidades || []).map((item: any, i: number) => ({
          id: `o_gen_${Date.now()}_${i}`,
          text: item.text,
          tipo: validateRiskType(item.tipo, i),
          probabilidad: Math.floor(Math.random() * 3) + 2,
          impacto: Math.floor(Math.random() * 3) + 2,
        })),
        debilidades: (data.debilidades || []).map((item: any, i: number) => ({
          id: `d_gen_${Date.now()}_${i}`,
          text: item.text,
          tipo: validateRiskType(item.tipo, i),
          probabilidad: Math.floor(Math.random() * 3) + 3, // Mayor probabilidad por defecto para debilidades
          impacto: Math.floor(Math.random() * 3) + 2,
        })),
        amenazas: (data.amenazas || []).map((item: any, i: number) => ({
          id: `a_gen_${Date.now()}_${i}`,
          text: item.text,
          tipo: validateRiskType(item.tipo, i),
          probabilidad: Math.floor(Math.random() * 3) + 2,
          impacto: Math.floor(Math.random() * 3) + 3, // Mayor impacto para amenazas
        })),
      };

      setDafoMatrix(transformedMatrix);
      setCurrentStep(2); // Avanzar automáticamente al paso 2
    } catch (error: any) {
      clearInterval(interval);
      console.warn("Error al intentar comunicarse con el servidor, activando generador de respaldo offline:", error);
      
      // Intentar generación de respaldo local inmediata
      try {
        const data = getLocalFallbackDafo(contextoOrg, selectedNormas, misionVision);
        const transformedMatrix: DafoMatrix = {
          fortalezas: (data.fortalezas || []).map((item: any, i: number) => ({
            id: `f_gen_${Date.now()}_${i}`,
            text: item.text,
            tipo: validateRiskType(item.tipo, i),
            probabilidad: Math.floor(Math.random() * 3) + 2,
            impacto: Math.floor(Math.random() * 3) + 2,
          })),
          oportunidades: (data.oportunidades || []).map((item: any, i: number) => ({
            id: `o_gen_${Date.now()}_${i}`,
            text: item.text,
            tipo: validateRiskType(item.tipo, i),
            probabilidad: Math.floor(Math.random() * 3) + 2,
            impacto: Math.floor(Math.random() * 3) + 2,
          })),
          debilidades: (data.debilidades || []).map((item: any, i: number) => ({
            id: `d_gen_${Date.now()}_${i}`,
            text: item.text,
            tipo: validateRiskType(item.tipo, i),
            probabilidad: Math.floor(Math.random() * 3) + 3,
            impacto: Math.floor(Math.random() * 3) + 2,
          })),
          amenazas: (data.amenazas || []).map((item: any, i: number) => ({
            id: `a_gen_${Date.now()}_${i}`,
            text: item.text,
            tipo: validateRiskType(item.tipo, i),
            probabilidad: Math.floor(Math.random() * 3) + 2,
            impacto: Math.floor(Math.random() * 3) + 3,
          })),
        };
        setDafoMatrix(transformedMatrix);
        setCurrentStep(2);
      } catch (fallbackError: any) {
        alert(`Ocurrió un error inesperado al procesar el análisis DAFO: ${fallbackError.message || fallbackError}`);
      }
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Función local robusta de generación para casos de fallo
  const getLocalFallbackDafo = (contexto: string, normas: string[], misionVision?: string) => {
    const normList = Array.isArray(normas) ? normas : ["ISO 9001:2018"];
    const isSGA = normList.some(n => n.includes("14001"));
    const isSST = normList.some(n => n.includes("45001"));
    
    const lowerCtx = (contexto || "").toLowerCase();
    
    let sector = "servicios industriales y certificación";
    if (lowerCtx.includes("energ")) {
      sector = "sector energético e industrial";
    } else if (lowerCtx.includes("manufactura") || lowerCtx.includes("planta") || lowerCtx.includes("fábrica")) {
      sector = "sector de manufactura y producción de alta precisión";
    } else if (lowerCtx.includes("tecnolog") || lowerCtx.includes("software") || lowerCtx.includes("digital")) {
      sector = "sector de tecnologías de la información y digitalización";
    } else if (lowerCtx.includes("laboratorio") || lowerCtx.includes("inspecc")) {
      sector = "servicios técnicos especializados de inspección y laboratorios de ensayo";
    } else if (lowerCtx.includes("salud") || lowerCtx.includes("clínica") || lowerCtx.includes("médic")) {
      sector = "sector de salud y servicios médicos especializados";
    } else if (lowerCtx.includes("alimento") || lowerCtx.includes("bebida") || lowerCtx.includes("restauran")) {
      sector = "sector alimentario y de bebidas de consumo masivo";
    }

    const mvPhrase = misionVision && misionVision.trim() 
      ? ` orientada bajo la directriz estratégica de "${misionVision.trim().replace(/[".]/g, "")}"` 
      : "";

    // 5 Fortalezas
    const fortalezas = [
      {
        text: `Equipo de trabajo de alta competencia técnica con entrenamiento certificado en normativas internacionales de referencia (${normList.join(", ") || "ISO 9001"})${mvPhrase}.`,
        tipo: "Estratégico" as const
      },
      {
        text: `Sólido prestigio corporativo y posicionamiento competitivo dentro del ${sector} a nivel regional.`,
        tipo: "Estratégico" as const
      },
      {
        text: lowerCtx.includes("planta") || lowerCtx.includes("fábrica")
          ? `Presencia de infraestructura productiva y logística robusta con plantas físicas que optimizan la cadena de valor.`
          : `Estandarización rigurosa de los flujos de procesos internos operativos y administrativos garantizando la calidad del servicio.`,
        tipo: "Operativo" as const
      },
      {
        text: `Cultura organizacional madura de mejora continua fundamentada en la gestión de riesgos y enfoque al cliente.`,
        tipo: "Operativo" as const
      },
      {
        text: isSGA || isSST 
          ? "Compromiso de la dirección con la sustentabilidad, seguridad industrial y el bienestar del capital humano."
          : "Estructura de costos optimizada y solvencia financiera sólida para apalancar proyectos de expansión.",
        tipo: "Financiero" as const
      }
    ];

    // 5 Oportunidades
    const oportunidades = [
      {
        text: `Creciente demanda de certificaciones y evaluaciones externas bajo la norma ${normList[1] || normList[0] || "ISO 9001:2018"} en la región.`,
        tipo: "Estratégico" as const
      },
      {
        text: `Implementación y aprovechamiento de herramientas de digitalización avanzada e Industria 4.0 para optimizar el servicio en el ${sector}.`,
        tipo: "Operativo" as const
      },
      {
        text: `Desarrollo y penetración en nuevos nichos de mercado emergentes o expansión geográfica hacia mercados internacionales de Latinoamérica.`,
        tipo: "Global" as const
      },
      {
        text: `Cambios de políticas gubernamentales y licitaciones públicas que otorgan puntaje preferencial a empresas con sistemas de gestión certificados.`,
        tipo: "Regulatorio" as const
      },
      {
        text: `Suscripción de alianzas estratégicas o convenios de exclusividad técnica con proveedores clave o instituciones de educación superior.`,
        tipo: "Estratégico" as const
      }
    ];

    // 5 Debilidades
    const debilidades = [
      {
        text: `Dependencia operativa de subcontratistas acreditados o consultores técnicos muy especializados para alcances específicos de la norma ${normList[0]}.`,
        tipo: "Operativo" as const
      },
      {
        text: `Oportunidades de mayor automatización en el flujo documental y en la integración de plataformas de gestión internas.`,
        tipo: "Operativo" as const
      },
      {
        text: `Presupuesto limitado o asignación moderada de inversión interna en actividades formales de innovación, investigación y desarrollo (I+D+i).`,
        tipo: "Financiero" as const
      },
      {
        text: `Rotación natural de talento en posiciones de supervisión intermedia que demanda esfuerzos constantes de capacitación y transferencia de conocimiento.`,
        tipo: "Conflicto de interés" as const
      },
      {
        text: `Necesidad de actualizar y robustecer las políticas, protocolos y auditorías internas de seguridad cibernética y de la información.`,
        tipo: "Regulatorio" as const
      }
    ];

    // 5 Amenazas
    const amenazas = [
      {
        text: `Modificaciones imprevistas o endurecimiento de los marcos regulatorios y fiscales locales que afecten las operaciones del ${sector}.`,
        tipo: "Regulatorio" as const
      },
      {
        text: `Guerra de precios agresiva desatada por nuevos competidores locales que operan bajo estructuras informales o de menor costo operativo.`,
        tipo: "Financiero" as const
      },
      {
        text: `Eventuales riesgos asociados al cambio climático o desastres naturales que interrumpan la continuidad del negocio en sedes corporativas.`,
        tipo: "Global" as const
      },
      {
        text: `Incremento de ciberataques sofisticados, hackeo o fugas de datos que vulneren información sensible de clientes e informes certificados.`,
        tipo: "Operativo" as const
      },
      {
        text: `Incertidumbre económica, inflación de insumos y fluctuaciones cambiarias en transacciones con sedes u oficinas internacionales.`,
        tipo: "Financiero" as const
      }
    ];

    return { fortalezas, oportunidades, debilidades, amenazas };
  };

  const validateRiskType = (type: string, index: number): RiskCategory => {
    if (RISK_TYPES.includes(type as RiskCategory)) {
      return type as RiskCategory;
    }
    // Fallback cíclico si el modelo retorna un tipo no válido
    return RISK_TYPES[index % RISK_TYPES.length];
  };

  // Agregar un ítem manual a una categoría
  const addDafoItem = (cat: keyof DafoMatrix) => {
    const newItem: DafoItem = {
      id: `${cat.charAt(0)}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: "Nuevo ítem de análisis",
      tipo: "Operativo",
      probabilidad: 3,
      impacto: 3,
    };
    setDafoMatrix({
      ...dafoMatrix,
      [cat]: [...dafoMatrix[cat], newItem],
    });
  };

  // Modificar el texto de un ítem
  const updateItemText = (cat: keyof DafoMatrix, id: string, text: string) => {
    setDafoMatrix({
      ...dafoMatrix,
      [cat]: dafoMatrix[cat].map((item) => (item.id === id ? { ...item, text } : item)),
    });
  };

  // Modificar el tipo de riesgo de un ítem
  const updateItemTipo = (cat: keyof DafoMatrix, id: string, tipo: RiskCategory) => {
    setDafoMatrix({
      ...dafoMatrix,
      [cat]: dafoMatrix[cat].map((item) => (item.id === id ? { ...item, tipo } : item)),
    });
  };

  // Eliminar un ítem
  const removeItem = (cat: keyof DafoMatrix, id: string) => {
    setDafoMatrix({
      ...dafoMatrix,
      [cat]: dafoMatrix[cat].filter((item) => item.id !== id),
    });
  };

  // Modificar probabilidad o impacto (Paso 3)
  const updateItemRating = (cat: keyof DafoMatrix, id: string, field: "probabilidad" | "impacto", value: number) => {
    setDafoMatrix({
      ...dafoMatrix,
      [cat]: dafoMatrix[cat].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    });
  };

  // Obtener el total de ítems DAFO
  const getTotalItemsCount = () => {
    return (
      dafoMatrix.fortalezas.length +
      dafoMatrix.oportunidades.length +
      dafoMatrix.debilidades.length +
      dafoMatrix.amenazas.length
    );
  };

  // Calcular nivel de riesgo basado en probabilidad e impacto
  const getRiskLevel = (prob: number, imp: number): { label: "Alto" | "Medio" | "Bajo"; color: string } => {
    const score = prob * imp;
    if (score > 12) {
      return { label: "Alto", color: "bg-rose-100 text-rose-800 border-rose-200" };
    } else if (score > 6) {
      return { label: "Medio", color: "bg-amber-100 text-amber-800 border-amber-200" };
    } else {
      return { label: "Bajo", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
  };

  // Obtener estilo de color según el tipo de riesgo
  const getRiskTypeBadgeStyles = (tipo: RiskCategory) => {
    switch (tipo) {
      case "Estratégico":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "Operativo":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Financiero":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Regulatorio":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "Global":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "Conflicto de interés":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  // Obtener icono según tipo de riesgo
  const getRiskTypeIcon = (tipo: RiskCategory) => {
    switch (tipo) {
      case "Estratégico":
        return <Target className="w-3.5 h-3.5" />;
      case "Operativo":
        return <Activity className="w-3.5 h-3.5" />;
      case "Financiero":
        return <DollarSign className="w-3.5 h-3.5" />;
      case "Regulatorio":
        return <Scale className="w-3.5 h-3.5" />;
      case "Global":
        return <Globe className="w-3.5 h-3.5" />;
      case "Conflicto de interés":
        return <Users className="w-3.5 h-3.5" />;
    }
  };

  // Exportación del reporte a un PDF con alta calidad de presentación
  const exportarReportePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 15;
    let currentY = 20;

    // Encabezado principal
    doc.setFillColor(30, 79, 122);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MATRIZ DAFO + RIESGOS ISO 31000", margin, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Reporte integrado de análisis de contexto y evaluación de riesgos de certificación", margin, 26);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, margin, 32);

    currentY = 50;

    // Información del contexto
    doc.setTextColor(11, 43, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("1. Contexto de la Organización y Normas de Referencia", margin, currentY);
    currentY += 8;

    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Normas ISO Seleccionadas:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(selectedNormas.join(", ") || "Ninguna seleccionada", margin + 50, currentY);
    currentY += 6;

    if (misionVision.trim()) {
      doc.setFont("helvetica", "bold");
      doc.text("Misión / Visión:", margin, currentY);
      doc.setFont("helvetica", "normal");
      const splitMision = doc.splitTextToSize(misionVision, 130);
      doc.text(splitMision, margin + 50, currentY);
      currentY += splitMision.length * 5 + 2;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Contexto Organizacional:", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    const splitContexto = doc.splitTextToSize(contextoOrg, 180);
    doc.text(splitContexto, margin, currentY);
    currentY += splitContexto.length * 5 + 15;

    // Sección 2: Detalle de Matriz DAFO
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(11, 43, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("2. Matriz de Análisis DAFO", margin, currentY);
    currentY += 8;

    const printDafoCategoryTable = (title: string, items: DafoItem[]) => {
      const rows = items.map((item, idx) => [`${idx + 1}`, item.text, item.tipo]);
      autoTable(doc, {
        startY: currentY,
        head: [["#", title, "Tipo de Riesgo Asociado"]],
        body: rows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 79, 122], textColor: [255, 255, 255] },
        theme: "striped"
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    };

    printDafoCategoryTable("FORTALEZAS (Internas)", dafoMatrix.fortalezas);

    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    printDafoCategoryTable("OPORTUNIDADES (Externas)", dafoMatrix.oportunidades);

    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    printDafoCategoryTable("DEBILIDADES (Internas)", dafoMatrix.debilidades);

    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    printDafoCategoryTable("AMENAZAS (Externas)", dafoMatrix.amenazas);

    // Sección 3: Evaluación del Riesgo según ISO 31000
    doc.addPage();
    currentY = 20;

    doc.setTextColor(11, 43, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("3. Evaluación de Riesgos (ISO 31000)", margin, currentY);
    currentY += 6;

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Evaluación basada en la fórmula de nivel de riesgo: Probabilidad (1-5) x Impacto (1-5).",
      margin,
      currentY
    );
    currentY += 8;

    // Recopilar todos los riesgos
    const riskRows: any[] = [];
    const collectForTable = (catName: string, items: DafoItem[]) => {
      items.forEach((item) => {
        const score = item.probabilidad * item.impacto;
        const level = score > 12 ? "Alto" : score > 6 ? "Medio" : "Bajo";
        riskRows.push([item.text, catName, item.tipo, item.probabilidad, item.impacto, `${score} (${level})`]);
      });
    };

    collectForTable("Fortaleza", dafoMatrix.fortalezas);
    collectForTable("Oportunidad", dafoMatrix.oportunidades);
    collectForTable("Debilidad", dafoMatrix.debilidades);
    collectForTable("Amenaza", dafoMatrix.amenazas);

    autoTable(doc, {
      startY: currentY,
      head: [["Elemento Analizado", "Categoría DAFO", "Tipo de Riesgo", "Prob (1-5)", "Imp (1-5)", "Nivel de Riesgo"]],
      body: riskRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [24, 60, 92], textColor: [255, 255, 255] },
      theme: "grid"
    });

    doc.save("Reporte_DAFO_Riesgos_ISO31000.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-10 px-4 md:px-8 flex justify-center items-start">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden" id="app-container">
        
        {/* Cabecera Principal */}
        <div className="bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">
              <Brain className="w-3.5 h-3.5 text-blue-400" />
              Sistemas de Gestión &amp; Riesgos Integrados
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              🧩 Matriz DAFO &amp; Evaluación de Riesgos ISO 31000
            </h1>
            <p className="mt-3 text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
              Analiza las fortalezas, oportunidades, debilidades y amenazas de tu organización alineado a normas internacionales. Clasifica y valora el nivel de riesgo en tiempo real con soporte de IA.
            </p>
          </div>
        </div>

        {/* Stepper Interactiva */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto py-1">
            <button
              id="step-tab-1"
              onClick={() => goToStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                currentStep === 1
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-blue-500 text-white font-bold">1</span>
              📌 Contexto de Certificación
            </button>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <button
              id="step-tab-2"
              onClick={() => goToStep(2)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                currentStep === 2
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-blue-500 text-white font-bold">2</span>
              📋 Matriz DAFO
            </button>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <button
              id="step-tab-3"
              onClick={() => goToStep(3)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                currentStep === 3
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-200/60 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-blue-500 text-white font-bold">3</span>
              📊 Evaluación de Riesgos
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Ítems en Matriz: <strong className="text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded-full">{getTotalItemsCount()}</strong>
            </span>
          </div>
        </div>

        {/* Pantalla de Carga de IA */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 z-50 flex flex-col justify-center items-center text-white p-6 backdrop-blur-sm"
              id="ai-loading-screen"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold mt-8 tracking-tight text-center">Generando Análisis DAFO mediante IA</h3>
              <p className="text-slate-400 text-sm mt-2 text-center max-w-md">
                Gemini está redactando 5 fortalezas, 5 oportunidades, 5 debilidades y 5 amenazas personalizadas alineadas con las normas seleccionadas y clasificando sus riesgos.
              </p>
              <div className="mt-6 px-4 py-2 bg-slate-800 rounded-full border border-slate-700/60 text-xs font-semibold text-blue-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-bounce" />
                <span>Paso actual: {loadingStep}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Área de Contenido Principal */}
        <div className="p-6 md:p-10">
          
          {/* PASO 1: Contexto de Certificación */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              id="step-1-content"
              className="space-y-8"
            >
              <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-5 flex items-start gap-4">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Establece el Contexto de Referencia</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Define la norma ISO correspondiente y las características principales de tu organización. Esto permite que el sistema y la Inteligencia Artificial ajusten los ejemplos para que sean 100% realistas y directamente aplicables a tus auditorías o revisiones de gestión de riesgos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Selección de Normas ISO */}
                <div className="lg:col-span-5 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm">🏷️ Norma(s) de referencia</h3>
                  </div>
                  <p className="text-xs text-slate-500">Selecciona las normas internacionales que guiarán el análisis estratégico:</p>
                  
                  <div className="space-y-2 pt-2">
                    {ISO_STANDARDS.map((iso) => {
                      const isSelected = selectedNormas.includes(iso.value);
                      return (
                        <button
                          key={iso.value}
                          id={`iso-btn-${iso.value.replace(/[^a-zA-Z0-9]/g, "")}`}
                          onClick={() => toggleNorma(iso.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>{iso.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contexto Organizacional & Misión/Visión */}
                <div className="lg:col-span-7 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Target className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm">🏢 Contexto de la organización</h3>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="context-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Descripción de la Organización y Operaciones
                    </label>
                    <textarea
                      id="context-input"
                      value={contextoOrg}
                      onChange={(e) => setContextoOrg(e.target.value)}
                      rows={4}
                      placeholder="Ej. Empresa certificadora de servicios industriales en Latinoamérica..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs leading-relaxed focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="mission-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Misión y Visión Corporativa (Opcional)
                    </label>
                    <input
                      id="mission-input"
                      type="text"
                      value={misionVision}
                      onChange={(e) => setMisionVision(e.target.value)}
                      placeholder="Ej. Crear valor con servicios eficientes y de alta calidad técnica..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Acciones del Paso 1 */}
              <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-slate-100">
                <button
                  id="btn-generate-ai"
                  onClick={generarDafoAutomatico}
                  className="px-6 py-3.5 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/10 flex items-center gap-2.5 transition-all group active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
                  ⚡ Generar DAFO Automático con IA
                </button>

                <button
                  id="btn-next-step-1"
                  onClick={() => goToStep(2)}
                  className="px-6 py-3.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-2 transition-all"
                >
                  Continuar a Matriz DAFO
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Vista Previa de DAFO */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6" id="preview-dafo-box">
                <h4 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Vista previa de la matriz DAFO guardada en caché
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(["fortalezas", "oportunidades", "debilidades", "amenazas"] as const).map((cat) => {
                    const label = {
                      fortalezas: "Fortalezas",
                      oportunidades: "Oportunidades",
                      debilidades: "Debilidades",
                      amenazas: "Amenazas",
                    }[cat];
                    const color = {
                      fortalezas: "text-emerald-700 bg-emerald-50 border-emerald-100",
                      oportunidades: "text-blue-700 bg-blue-50 border-blue-100",
                      debilidades: "text-amber-700 bg-amber-50 border-amber-100",
                      amenazas: "text-rose-700 bg-rose-50 border-rose-100",
                    }[cat];

                    return (
                      <div key={cat} className={`rounded-xl border p-4 space-y-2 bg-white`}>
                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block ${color}`}>
                          {label}
                        </div>
                        <ul className="space-y-1.5 pt-1">
                          {dafoMatrix[cat].slice(0, 3).map((item, idx) => (
                            <li key={item.id} className="text-[11px] text-slate-600 line-clamp-2 border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                              • {item.text}
                            </li>
                          ))}
                          {dafoMatrix[cat].length > 3 && (
                            <li className="text-[10px] text-slate-400 font-medium italic">
                              + {dafoMatrix[cat].length - 3} elementos adicionales
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PASO 2: Matriz DAFO editable y clasificación de riesgos */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              id="step-2-content"
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">📋 Edición de la Matriz DAFO</h3>
                  <p className="text-xs text-slate-500 mt-1">Escribe, ajusta y asigna el tipo de riesgo ISO 31000 correspondiente a cada variable.</p>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  Mínimo recomendado: 5 ítems por categoría
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fortalezas */}
                <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100 space-y-4" id="col-fortalezas">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <span className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                      ✅ Fortalezas <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Internas</span>
                    </span>
                    <button
                      id="btn-add-fortaleza"
                      onClick={() => addDafoItem("fortalezas")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {dafoMatrix.fortalezas.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm"
                        >
                          <input
                            type="text"
                            id={`input-fortaleza-${idx}`}
                            value={item.text}
                            onChange={(e) => updateItemText("fortalezas", item.id, e.target.value)}
                            className="flex-1 text-xs px-2 py-1.5 border-b border-transparent focus:border-emerald-500 focus:bg-slate-50 rounded outline-none text-slate-700 transition-all font-medium"
                          />
                          <select
                            id={`select-fortaleza-tipo-${idx}`}
                            value={item.tipo}
                            onChange={(e) => updateItemTipo("fortalezas", item.id, e.target.value as RiskCategory)}
                            className="text-[10px] bg-emerald-50/50 border border-emerald-200 text-emerald-800 rounded-lg px-2 py-1.5 outline-none font-bold shrink-0"
                          >
                            {RISK_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            id={`btn-del-fortaleza-${idx}`}
                            onClick={() => removeItem("fortalezas", item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Oportunidades */}
                <div className="bg-blue-50/20 p-5 rounded-2xl border border-blue-100 space-y-4" id="col-oportunidades">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <span className="font-bold text-blue-900 text-sm flex items-center gap-2">
                      🚀 Oportunidades <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Externas</span>
                    </span>
                    <button
                      id="btn-add-oportunidad"
                      onClick={() => addDafoItem("oportunidades")}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {dafoMatrix.oportunidades.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm"
                        >
                          <input
                            type="text"
                            id={`input-oportunidad-${idx}`}
                            value={item.text}
                            onChange={(e) => updateItemText("oportunidades", item.id, e.target.value)}
                            className="flex-1 text-xs px-2 py-1.5 border-b border-transparent focus:border-blue-500 focus:bg-slate-50 rounded outline-none text-slate-700 transition-all font-medium"
                          />
                          <select
                            id={`select-oportunidad-tipo-${idx}`}
                            value={item.tipo}
                            onChange={(e) => updateItemTipo("oportunidades", item.id, e.target.value as RiskCategory)}
                            className="text-[10px] bg-blue-50/50 border border-blue-200 text-blue-800 rounded-lg px-2 py-1.5 outline-none font-bold shrink-0"
                          >
                            {RISK_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            id={`btn-del-oportunidad-${idx}`}
                            onClick={() => removeItem("oportunidades", item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Debilidades */}
                <div className="bg-amber-50/20 p-5 rounded-2xl border border-amber-100 space-y-4" id="col-debilidades">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <span className="font-bold text-amber-900 text-sm flex items-center gap-2">
                      ⚠️ Debilidades <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Internas</span>
                    </span>
                    <button
                      id="btn-add-debilidad"
                      onClick={() => addDafoItem("debilidades")}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {dafoMatrix.debilidades.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-amber-100 shadow-sm"
                        >
                          <input
                            type="text"
                            id={`input-debilidad-${idx}`}
                            value={item.text}
                            onChange={(e) => updateItemText("debilidades", item.id, e.target.value)}
                            className="flex-1 text-xs px-2 py-1.5 border-b border-transparent focus:border-amber-500 focus:bg-slate-50 rounded outline-none text-slate-700 transition-all font-medium"
                          />
                          <select
                            id={`select-debilidad-tipo-${idx}`}
                            value={item.tipo}
                            onChange={(e) => updateItemTipo("debilidades", item.id, e.target.value as RiskCategory)}
                            className="text-[10px] bg-amber-50/50 border border-amber-200 text-amber-800 rounded-lg px-2 py-1.5 outline-none font-bold shrink-0"
                          >
                            {RISK_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            id={`btn-del-debilidad-${idx}`}
                            onClick={() => removeItem("debilidades", item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Amenazas */}
                <div className="bg-rose-50/20 p-5 rounded-2xl border border-rose-100 space-y-4" id="col-amenazas">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                    <span className="font-bold text-rose-900 text-sm flex items-center gap-2">
                      ⚡ Amenazas <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">Externas</span>
                    </span>
                    <button
                      id="btn-add-amenaza"
                      onClick={() => addDafoItem("amenazas")}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {dafoMatrix.amenazas.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-rose-100 shadow-sm"
                        >
                          <input
                            type="text"
                            id={`input-amenaza-${idx}`}
                            value={item.text}
                            onChange={(e) => updateItemText("amenazas", item.id, e.target.value)}
                            className="flex-1 text-xs px-2 py-1.5 border-b border-transparent focus:border-rose-500 focus:bg-slate-50 rounded outline-none text-slate-700 transition-all font-medium"
                          />
                          <select
                            id={`select-amenaza-tipo-${idx}`}
                            value={item.tipo}
                            onChange={(e) => updateItemTipo("amenazas", item.id, e.target.value as RiskCategory)}
                            className="text-[10px] bg-rose-50/50 border border-rose-200 text-rose-800 rounded-lg px-2 py-1.5 outline-none font-bold shrink-0"
                          >
                            {RISK_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            id={`btn-del-amenaza-${idx}`}
                            onClick={() => removeItem("amenazas", item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Acciones Paso 2 */}
              <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                <button
                  id="btn-back-step-2"
                  onClick={() => goToStep(1)}
                  className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Contexto
                </button>

                <button
                  id="btn-next-step-2"
                  onClick={() => goToStep(3)}
                  className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all"
                >
                  Continuar a Evaluación de Riesgos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* PASO 3: Evaluación de riesgos Probability vs Impact */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              id="step-3-content"
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">📊 Evaluación Integral de Riesgos (ISO 31000)</h3>
                  <p className="text-xs text-slate-500 mt-1">Valora el impacto y la probabilidad de cada factor analizado para calcular el nivel de riesgo en tiempo real.</p>
                </div>
                <div className="bg-slate-900 text-white text-xs px-4 py-2 rounded-full font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Matriz de Probabilidad x Impacto
                </div>
              </div>

              {/* Tabla de Riesgos */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white" id="risk-table-container">
                <table className="w-full border-collapse text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-4 font-bold text-xs tracking-wider border-b border-slate-800 rounded-tl-2xl">Elemento Analizado</th>
                      <th className="p-4 font-bold text-xs tracking-wider border-b border-slate-800">Categoría DAFO</th>
                      <th className="p-4 font-bold text-xs tracking-wider border-b border-slate-800">Clasificación de Riesgo</th>
                      <th className="p-4 font-bold text-xs tracking-wider border-b border-slate-800 text-center w-48">Probabilidad (1-5)</th>
                      <th className="p-4 font-bold text-xs tracking-wider border-b border-slate-800 text-center w-48">Impacto (1-5)</th>
                      <th className="p-4 font-bold text-xs tracking-wider border-b border-slate-800 text-center rounded-tr-2xl w-32">Nivel de Riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(["fortalezas", "oportunidades", "debilidades", "amenazas"] as const).map((cat) => {
                      const label = {
                        fortalezas: "Fortaleza",
                        oportunidades: "Oportunidad",
                        debilidades: "Debilidad",
                        amenazas: "Amenaza",
                      }[cat];
                      
                      const categoryBadgeColor = {
                        fortalezas: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        oportunidades: "bg-blue-50 text-blue-700 border-blue-200",
                        debilidades: "bg-amber-50 text-amber-700 border-amber-200",
                        amenazas: "bg-rose-50 text-rose-700 border-rose-200",
                      }[cat];

                      return dafoMatrix[cat].map((item, idx) => {
                        const riskLevel = getRiskLevel(item.probabilidad, item.impacto);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-all">
                            <td className="p-4">
                              <input
                                type="text"
                                id={`risk-item-text-${cat}-${idx}`}
                                value={item.text}
                                onChange={(e) => updateItemText(cat, item.id, e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-slate-400 outline-none font-medium text-slate-800 py-1"
                              />
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryBadgeColor}`}>
                                {label}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${getRiskTypeBadgeStyles(item.tipo)}`}>
                                  {getRiskTypeIcon(item.tipo)}
                                  {item.tipo}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <input
                                  type="range"
                                  id={`risk-slider-prob-${cat}-${idx}`}
                                  min="1"
                                  max="5"
                                  value={item.probabilidad}
                                  onChange={(e) => updateItemRating(cat, item.id, "probabilidad", parseInt(e.target.value))}
                                  className="w-28 accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                                />
                                <span id={`risk-val-prob-${cat}-${idx}`} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 border border-slate-200 shadow-sm text-[11px]">
                                  {item.probabilidad}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <input
                                  type="range"
                                  id={`risk-slider-imp-${cat}-${idx}`}
                                  min="1"
                                  max="5"
                                  value={item.impacto}
                                  onChange={(e) => updateItemRating(cat, item.id, "impacto", parseInt(e.target.value))}
                                  className="w-28 accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                                />
                                <span id={`risk-val-imp-${cat}-${idx}`} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 border border-slate-200 shadow-sm text-[11px]">
                                  {item.impacto}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span id={`risk-badge-lvl-${cat}-${idx}`} className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-sm ${riskLevel.color}`}>
                                {item.probabilidad * item.impacto} - {riskLevel.label}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>

              {/* Leyenda de Tipos de Riesgo */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
                <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider">Leyenda y Tipos de Riesgo Asociados (ISO 31000)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {RISK_TYPES.map((tipo) => (
                    <div key={tipo} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center text-center space-y-1 shadow-sm">
                      <div className={`p-2 rounded-lg ${getRiskTypeBadgeStyles(tipo)}`}>
                        {getRiskTypeIcon(tipo)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">{tipo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones Paso 3 */}
              <div className="pt-6 flex flex-wrap gap-4 items-center justify-between border-t border-slate-100">
                <button
                  id="btn-back-step-3"
                  onClick={() => goToStep(2)}
                  className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Matriz DAFO
                </button>

                <div className="flex items-center gap-3">
                  <button
                    id="btn-export-pdf"
                    onClick={exportarReportePDF}
                    className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    <FileDown className="w-4 h-4 text-emerald-200" />
                    📄 Exportar reporte PDF
                  </button>

                  <button
                    id="btn-finish"
                    onClick={() => alert("¡Matriz DAFO y riesgos completada de manera exitosa! Se han guardado sus cambios de forma local.")}
                    className="px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2"
                  >
                    Finalizar Evaluación
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );

  function goToStep(step: number) {
    if (step < 1 || step > 3) return;
    setCurrentStep(step);
  }
}
