/**
 * EventoLayout.jsx
 * Layout para telas dentro de uma competição (com barra do evento).
 *
 * Resolve o :slug da URL para o eventoId e garante que o evento
 * está selecionado antes de renderizar o conteúdo.
 *
 * Será usado na Etapa 4/5 quando as rotas de competição migrarem.
 */

import React, { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useEvento } from "../contexts/EventoContext";

export default function EventoLayout({ children }) {
  const { slug } = useParams();
  const { eventos, eventoAtual, selecionarEvento } = useEvento();

  // Resolver slug → evento
  const evento = eventos.find(ev => ev.slug === slug || ev.id === slug);

  // Selecionar evento se ainda não está selecionado
  useEffect(() => {
    if (evento && (!eventoAtual || eventoAtual.id !== evento.id)) {
      selecionarEvento(evento.id);
    }
  }, [evento, eventoAtual, selecionarEvento]);

  // Eventos ainda carregando
  if (eventos.length === 0) {
    return <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Carregando...</div>;
  }

  // Slug inválido
  if (!evento) {
    return <Navigate to="/" replace />;
  }

  return children;
}
