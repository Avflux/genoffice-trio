# Guia de Execução — GenOffice Trio 🚀

Suite de escritório simplificada (Docs, Sheets e PDF) construída com **React 19**, **Vite**, **TypeScript** e **Electron**.

---

## 📋 Pré-requisitos

- **Node.js**: `>= 22.12.0`
- **npm**: `>= 10.0.0`
- **Windows / macOS / Linux**

---

## 🛠️ Comandos de Execução do APP

O projeto possui diferentes modos de execução configurados no [`package.json`](./package.json):

### 1. Modo Desenvolvimento Web (Suite Completa no Navegador)

Executa todos os microsserviços/renderers simultaneamente em portas dedicadas com Hot Module Replacement (HMR):

```bash
npm run dev
```

| Módulo                  | Porta Local                                    | Descrição                                                   |
| :---------------------- | :--------------------------------------------- | :---------------------------------------------------------- |
| **Shell (Hub Central)** | [http://localhost:5176](http://localhost:5176) | Interface principal com abas integradas (Docs, Sheets, PDF) |
| **Docs**                | [http://localhost:5173](http://localhost:5173) | Editor de documentos em texto rico                          |
| **Sheets**              | [http://localhost:5174](http://localhost:5174) | Editor de planilhas eletrônicas                             |
| **PDF**                 | [http://localhost:5175](http://localhost:5175) | Visualizador de arquivos PDF                                |

> Abra **[http://localhost:5176](http://localhost:5176)** no navegador para usar a suíte completa com alternância de abas e controle de tema.

---

### 2. Modo Desenvolvimento Desktop (Electron com Hot-Reload)

Inicia todos os servidores de desenvolvimento web e abre a janela desktop nativa do **Electron**:

```bash
npm run dev:electron
```

- Reconexão e retentativa automática configuradas caso os servidores Vite estejam iniciando.
- DevTools do Electron habilitado automaticamente.
- Suporte a HMR em tempo real nos editores.

---

### 3. Modo Produção Desktop (Build & Execução Nativa)

Gera a compilação otimizada de produção de todos os módulos (`out/`) e inicia o app desktop Electron:

```bash
npm run start
# ou
npm run shell
```

---

### 4. Execução Isolada de Aplicativos Individuais

Para testar ou desenvolver um app específico em sua própria janela dedicada do Electron:

```bash
# Executa apenas o editor Docs no Electron
npm run dev:docs

# Executa apenas a planilha Sheets no Electron
npm run dev:sheets

# Executa apenas o visualizador PDF no Electron
npm run dev:pdf

# Executa apenas o servidor web do Shell
npm run dev:shell
```

---

## 🏗️ Build e Qualidade de Código

Todos os comandos de validação e compilação foram configurados e testados:

```bash
# Compilar todos os apps e pacotes (docs, sheets, pdf, shell)
npm run build

# Validação de tipagem TypeScript em todo o monorepo
npm run typecheck

# Análise estática com ESLint (Zero erros / Zero warnings)
npm run lint

# Execução da suíte de testes com Vitest
npm run test

# Formatação automática de código com Prettier
npm run format

# Verificação de conformidade do Prettier
npm run format:check
```

---

## 🧩 Estrutura do Monorepo

```
genoffice-trio/
├── apps/
│   ├── docs/       # Editor de documentos (Vite + React + Electron)
│   ├── sheets/     # Editor de planilhas (Vite + React + Electron)
│   ├── pdf/        # Visualizador de PDF (Vite + React + Electron)
│   └── shell/      # Shell host que orquestra as abas e janelas
├── packages/
│   └── ui/         # Design tokens compartilhados (tokens.css), tipos e utilitários
├── eslint.config.mjs # Configuração do ESLint 9+
├── .prettierrc       # Regras de estilo do código
└── EXECUCAO.md       # Este documento
```

---

## ⚙️ Correções e Ajustes Realizados na Configuração

1. **Exports do pacote `@genoffice/ui`**: Configurado o mapeamento `exports` no [`packages/ui/package.json`](./packages/ui/package.json) para que os imports `@genoffice/ui/tokens.css` fossem resolvidos tanto no Vite quanto no Rollup.
2. **Declarações TypeScript Globais (`env.d.ts`)**: Adicionadas tipagens seguras para `window.desktop` e `window.pdfApi` em cada app, garantindo `npm run typecheck` com código 0.
3. **Caminho do Preload no Electron**: Corrigido o caminho do script preload para `path.join(__dirname, '../preload/index.js')`, compatível com a estrutura de saída do `electron-vite`.
4. **Shell Renderer**: Adicionado suporte de URL de desenvolvimento (`http://localhost:5176`), tolerância a reconexão automática e persistência das abas na renderização.
5. **Configuração de ESLint e Prettier**: Criados os arquivos `eslint.config.mjs` e `.prettierrc` para linting e formatação limpos em todo o repositório.
