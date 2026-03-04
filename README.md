# GERENTRACK — Deploy na Vercel

## Pré-requisitos
- Conta no GitHub: https://github.com (gratuito)
- Conta na Vercel: https://vercel.com (gratuito, entre com GitHub)

---

## Passo a Passo

### 1. Criar conta no GitHub (se não tem)
1. Acesse **github.com** → clique **Sign Up**
2. Crie com seu e-mail e confirme

### 2. Criar repositório no GitHub
1. Logado no GitHub, clique no **+** (canto superior direito) → **New repository**
2. Nome: `gerentrack` (ou o nome que preferir)
3. Deixe **Public** ou **Private** (ambos funcionam na Vercel)
4. **NÃO** marque "Add a README" nem nada — deixe vazio
5. Clique **Create repository**

### 3. Subir o código para o GitHub

#### Opção A — Pelo site do GitHub (mais fácil)
1. No repositório recém-criado, clique **"uploading an existing file"**
2. Arraste TODA a pasta do projeto (todos os arquivos e pasta `src/`)
3. Clique **Commit changes**

#### Opção B — Pelo terminal (se tem Git instalado)
```bash
cd gerentrack
git init
git add .
git commit -m "Primeiro deploy GERENTRACK"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gerentrack.git
git push -u origin main
```

### 4. Conectar na Vercel
1. Acesse **vercel.com** → **Sign Up** → **Continue with GitHub**
2. Autorize o acesso ao GitHub
3. Clique **"Add New..."** → **Project**
4. Encontre o repositório `gerentrack` na lista → clique **Import**
5. Nas configurações que aparecem:
   - **Framework Preset**: Vite (deve detectar automaticamente)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Clique **Deploy**
7. Aguarde ~1 minuto. Pronto! ✅

### 5. Seu site estará no ar em:
```
https://gerentrack.vercel.app
```
(ou nome similar, a Vercel gera automaticamente)

---

## Domínio Próprio (opcional)

### Registrar domínio .com.br
1. Acesse **registro.br**
2. Pesquise o nome desejado (ex: `gerentrack.com.br`)
3. Registre (~R$40/ano)

### Apontar para Vercel
1. Na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio (ex: `gerentrack.com.br`)
3. A Vercel mostrará os DNS que você precisa configurar
4. No Registro.br, vá em **DNS** do seu domínio e adicione:
   - Tipo: **CNAME** → Valor: `cname.vercel-dns.com`
5. Aguarde propagação (até 48h, geralmente minutos)

---

## Atualizando o Site

Após o primeiro deploy, para atualizar basta:

1. Edite os arquivos no GitHub (ou faça `git push`)
2. A Vercel detecta automaticamente e faz novo deploy
3. O site atualiza em ~30 segundos

---

## Estrutura do Projeto

```
gerentrack/
├── index.html          ← Página HTML principal
├── package.json        ← Dependências (React, Vite)
├── vite.config.js      ← Configuração do Vite
├── .gitignore          ← Arquivos ignorados pelo Git
├── README.md           ← Este arquivo
└── src/
    ├── main.jsx        ← Ponto de entrada React
    └── App.jsx         ← Todo o sistema GERENTRACK
```

## Observações Importantes

- **Os dados ficam no navegador** (localStorage) de cada usuário
- Cada pessoa que acessar o site terá seus próprios dados independentes
- Se limpar os dados do navegador, os dados do sistema são perdidos
- Use a função de **Backup/Exportar** regularmente para salvar os dados
- O plano gratuito da Vercel suporta até 100GB de banda/mês (mais que suficiente)
