# FinLearn — Aprenda o Mercado Financeiro

App web pessoal para estudo do mercado financeiro com trilha de aprendizado, quizzes e simulador.

## Requisitos

- Node.js 16+

## Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor
node server.js

# 3. Acesse no navegador
# http://localhost:3000
```

## Funcionalidades

- **Trilha de Aprendizado** — 5 módulos com 18 lições completas
- **Sistema de Progresso** — marque lições como concluídas (salvo em data.json)
- **Quizzes** — 5 perguntas por módulo com feedback explicativo
- **Glossário** — 30 termos com busca em tempo real
- **Simulador de Juros Compostos** — gráfico + tabela ano a ano

## Estrutura

```
/
  server.js        ← Express server + API
  data.json        ← progresso e pontuações
  content.json     ← conteúdo das lições e quizzes
  package.json
  /public
    index.html     ← tela inicial
    trilha.html    ← lista de módulos/lições
    licao.html     ← lição individual
    quiz.html      ← quiz por módulo
    glossario.html ← glossário com busca
    simulador.html ← simulador de juros compostos
    style.css      ← estilos globais (dark theme)
    app.js         ← lógica frontend
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/progresso | Retorna progresso completo |
| POST | /api/progresso | Salva lição concluída |
| GET | /api/quiz/:modulo | Perguntas do quiz |
| POST | /api/quiz/:modulo | Salva pontuação do quiz |
| GET | /api/content/modules | Lista módulos e lições |
| GET | /api/content/lesson/:id | Conteúdo de uma lição |
| GET | /api/content/glossary | Lista do glossário |
