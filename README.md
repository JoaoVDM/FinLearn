# FinLearn — Aprenda o Mercado Financeiro

App web pessoal para estudo do mercado financeiro com trilha de aprendizado, quizzes e ferramentas financeiras.

## Requisitos

- Node.js 18+

## Como rodar

```bash
# 1. Instale as dependências do servidor
npm install

# 2. Instale as dependências do frontend
npm install --prefix client

# 3. Rode tudo com um único comando
npm run dev
```

Acesse em `http://localhost:5173`

## Funcionalidades

- **Trilha de Aprendizado** — 6 módulos com 27 lições completas
- **Sistema de Progresso** — marque lições como concluídas (salvo em data.json)
- **Quizzes** — questões por módulo com tela de intro e feedback explicativo
- **Glossário** — 38 termos com busca em tempo real
- **Simulador de Juros Compostos** — gráfico + tabela ano a ano com presets
- **Calculadora de Metas** — descubra quanto poupar por mês
- **Fluxo de Caixa** — registre gastos e investimentos com filtros por tipo e mês

## Estrutura

```
/
  server.js        ← Express server + API
  data.json        ← progresso e pontuações
  content.json     ← conteúdo das lições, quizzes e glossário
  package.json
  /client          ← frontend React + Vite
    src/
      pages/       ← Dashboard, Trilha, Licao, Quiz, Glossario, Simulador, Meta, Fluxo
      components/  ← Layout, ProgressBar, Toast, Spinner, Badge
      context/     ← ProgressContext, ThemeContext
      utils/       ← cálculos financeiros e formatação
  /public          ← build gerado pelo Vite (servido pelo Express)
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/progresso | Retorna progresso completo |
| POST | /api/progresso | Salva lição concluída |
| DELETE | /api/progresso | Reseta todo o progresso |
| GET | /api/quiz/:modulo | Perguntas do quiz |
| POST | /api/quiz/:modulo | Salva pontuação do quiz |
| GET | /api/content/modules | Lista módulos e lições |
| GET | /api/content/lesson/:id | Conteúdo de uma lição |
| GET | /api/content/glossary | Lista do glossário |
| GET | /api/fluxo | Lista transações |
| POST | /api/fluxo | Adiciona transação |
| DELETE | /api/fluxo/:id | Remove transação |
