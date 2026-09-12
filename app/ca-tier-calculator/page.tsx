import type { Metadata } from "next";
import CaTierCalculator from "@/components/CaTierCalculator";
import { STORE } from "@/lib/config";

export const metadata: Metadata = {
  title: `Calculadora CA | ${STORE.name}`,
  description:
    "Calculadora interactiva de Combat Achievements para Old School RuneScape. Analiza tu progreso, puntos faltantes, costo estimado en GP y las tareas sugeridas para tu tier objetivo.",
};

export const dynamic = "force-static";

export default function CaTierCalculatorPage() {
  return (
    <>
      <div className="ca-header">
        <h1 className="ca-title">
          Calculadora de <span className="highlight">Combat Achievements</span>
        </h1>
        <p className="section-sub">
          Ingresa tu nombre de usuario para obtener la lista de logros de combate completados,
          puntos faltantes, costo estimado en GP y las tareas sugeridas para tu tier objetivo.
        </p>
      </div>

      <CaTierCalculator />
    </>
  );
}