/**
 * getProvasCat
 *
 * Retorna o array de provas disponíveis para uma combinação
 * de sexo ("M" | "F") e categoria (ex: "adulto", "sub20").
 *
 * Extraído de App.jsx (linha 493) — Etapa 2 da refatoração.
 */
import PROVAS_DEF from "./provasDef.json";

export function getProvasCat(sexo, catId) {
  return (PROVAS_DEF[sexo] && PROVAS_DEF[sexo][catId])
    ? PROVAS_DEF[sexo][catId]
    : [];
}
