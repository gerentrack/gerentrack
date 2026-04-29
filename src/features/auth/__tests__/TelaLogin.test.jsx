// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';

vi.mock('../../../firebase');

import TelaLogin from '../TelaLogin';

describe('TelaLogin', () => {
  const defaultProps = {
    adminConfig: {},
    setOrganizadores: vi.fn(),
    setAtletasUsuarios: vi.fn(),
    setFuncionarios: vi.fn(),
    setTreinadores: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza formulário com campos de identificação e senha', () => {
    renderWithProviders(<TelaLogin {...defaultProps} />);

    expect(screen.getByText('Entrar no Sistema')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite seu e-mail, CPF ou CNPJ')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });

  it('renderiza subtítulo explicativo', () => {
    renderWithProviders(<TelaLogin {...defaultProps} />);
    expect(screen.getByText(/use seu e-mail, cpf ou cnpj para acessar/i)).toBeInTheDocument();
  });

  it('exibe erro quando campos estão vazios', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelaLogin {...defaultProps} />);

    await user.click(screen.getByText('Entrar'));

    await waitFor(() => {
      expect(screen.getByText('Preencha o identificador e a senha.')).toBeInTheDocument();
    });
  });

  it('exibe link de recuperação de senha', () => {
    renderWithProviders(<TelaLogin {...defaultProps} />);
    expect(screen.getByText('Esqueci minha senha')).toBeInTheDocument();
  });

  it('alterna para modo de recuperação de senha', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelaLogin {...defaultProps} />);

    await user.click(screen.getByText('Esqueci minha senha'));

    await waitFor(() => {
      expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('seuemail@exemplo.com')).toBeInTheDocument();
    });
  });

  it('volta do modo recuperação para login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelaLogin {...defaultProps} />);

    await user.click(screen.getByText('Esqueci minha senha'));
    await waitFor(() => expect(screen.getByText('Recuperar Senha')).toBeInTheDocument());

    await user.click(screen.getByText(/voltar ao login/i));
    await waitFor(() => expect(screen.getByText('Entrar no Sistema')).toBeInTheDocument());
  });
});
