export type RiskCategory =
  | "Estratégico"
  | "Operativo"
  | "Financiero"
  | "Regulatorio"
  | "Global"
  | "Conflicto de interés";

export interface DafoItem {
  id: string;
  text: string;
  tipo: RiskCategory;
  probabilidad: number; // 1 to 5
  impacto: number;      // 1 to 5
}

export interface DafoMatrix {
  fortalezas: DafoItem[];
  oportunidades: DafoItem[];
  debilidades: DafoItem[];
  amenazas: DafoItem[];
}
