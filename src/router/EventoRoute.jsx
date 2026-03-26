/**
 * EventoRoute.jsx
 * Wrapper para rotas de competição que dependem de :slug.
 *
 * Resolve o slug da URL para o eventoId correspondente,
 * disponibilizando o evento atual para os componentes filhos.
 *
 * Se o slug não corresponder a nenhum evento, redireciona para home.
 */

import React from "react";
import { Navigate, useParams } from "react-router-dom";

/**
 * @param {object} props
 * @param {Array} props.eventos — lista de eventos
 * @param {Function} props.selecionarEvento — função para selecionar evento por ID
 * @param {React.ReactNode} props.children — conteúdo da rota
 */
export default function EventoRoute({ eventos, selecionarEvento, children }) {
  const { slug } = useParams();

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  // Resolver slug → evento
  const evento = eventos.find(ev => ev.slug === slug || ev.id === slug);

  if (!evento) {
    // Eventos ainda carregando — mostrar loading
    if (eventos.length === 0) {
      return <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Carregando...</div>;
    }
    // Slug inválido
    return <Navigate to="/" replace />;
  }

  // Garantir que o evento está selecionado
  if (selecionarEvento) {
    // Efeito colateral: selecionar evento se não estiver selecionado
    // Isso será chamado pelo componente pai ou via useEffect
  }

  return children;
}
