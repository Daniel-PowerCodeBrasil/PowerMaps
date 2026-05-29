# 🗺️ PowerMaps — HeatMapControl

> Um componente de mapa de calor para **Power Apps Canvas Apps**, feito com Leaflet. Sem chave de API, sem complicação: você joga um JSON de ocorrências e ele mostra onde as coisas mais acontecem.

[![Power Platform](https://img.shields.io/badge/Power%20Platform-PCF-742774?logo=powerapps&logoColor=white)](https://learn.microsoft.com/power-apps/developer/component-framework/overview)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![React](https://img.shields.io/badge/React-16.14-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Versão](https://img.shields.io/badge/vers%C3%A3o-1.1.5-success)](CHANGELOG.md)

---

## O que ele faz

Imagine que você tem uma tabela de ocorrências — chamados, incidentes, vendas, denúncias, o que for — cada uma com latitude e longitude. O **HeatMapControl** pega esses pontos e responde a uma pergunta simples e visual:

> **"Onde isso está se concentrando?"**

- 🔴 **Regiões com muitas ocorrências próximas** acendem em vermelho.
- 🟡 **Pontos mais espalhados** aparecem em tons de amarelo/laranja.
- 📍 Pode alternar para o **modo de marcadores** (pins clicáveis com rótulo) quando você precisa ver cada ocorrência individualmente.

Tudo isso dentro de um Canvas App, sem servidor de mapas próprio e sem chave de API (usa OpenStreetMap por padrão).

| Modo Mapa de Calor | Modo Marcadores |
|:---:|:---:|
| `enableHeatmap = true` | `enableHeatmap = false` |
| Densidade de ocorrências por cor | Pin individual com popup de rótulo |

> 📸 *Dica: adicione aqui capturas de tela do componente rodando no seu app — vale mais que mil palavras no README.*

---

## Instalação rápida

1. Baixe o pacote gerenciado mais recente:
   👉 **[`releases/PowerMaps_HeatMapControl_latest_managed.zip`](releases/)**
2. No [Power Apps](https://make.powerapps.com) → **Soluções** → **Importar solução** → selecione o `.zip`.
3. Aguarde aparecer **"Os componentes de código foram atualizados com êxito"**.
4. No seu Canvas App: **Inserir → Obter mais componentes → aba Código → HeatMapControl**.

📖 Passo a passo completo (com prints e dicas de ambiente): **[docs/INSTALACAO.md](docs/INSTALACAO.md)**

---

## Como usar (o mínimo para ver funcionando)

Depois de inserir o controle na tela, selecione-o e, na **barra de fórmulas** (não no painel direito — veja a nota abaixo ⚠️), defina a propriedade `occurrencesJson`:

```powerfx
"[
  {""lat"":-22.2171,""lng"":-49.9501,""weight"":1,""label"":""Centro""},
  {""lat"":-22.2210,""lng"":-49.9450,""weight"":1,""label"":""Bairro A""},
  {""lat"":-22.2130,""lng"":-49.9560,""weight"":1,""label"":""Bairro B""}
]"
```

E para preencher a tela inteira, defina também:

```powerfx
HeatMapControl1.Width  = Parent.Width
HeatMapControl1.Height = Parent.Height
```

> ⚠️ **As propriedades customizadas do PCF não aparecem no painel "Propriedades" da direita** — isso é uma limitação da plataforma, não um bug. Sempre configure pelo **dropdown da barra de fórmulas** no topo.

📖 Exemplos reais com `Collection`, integração com Dataverse/SharePoint e Power Fx dinâmico: **[docs/USO.md](docs/USO.md)**

---

## Propriedades

| Propriedade | Tipo | Padrão | O que faz |
|---|---|---|---|
| `occurrencesJson` | `Multiple` (texto) | — | Array JSON com os pontos. Veja o formato abaixo. |
| `enableHeatmap` | `TwoOptions` | `true` | `true` = mapa de calor · `false` = marcadores |
| `heatRadius` | `Whole.None` | `50` | Raio (px) do halo de cada ponto. Maior = manchas maiores |
| `heatBlur` | `Whole.None` | `25` | Suavização das bordas. Maior = mais difuso |
| `heatIntensity` | `Whole.None` | `3` | Nº de pontos sobrepostos para atingir o vermelho máximo. Menor = satura mais rápido |
| `heatMaxZoom` | `Whole.None` | `17` | Zoom em que a intensidade do calor é máxima |
| `initialLat` | `Decimal` | `-22.2171` | Latitude central inicial (Marília-SP) |
| `initialLng` | `Decimal` | `-49.9501` | Longitude central inicial |
| `initialZoom` | `Whole.None` | `12` | Nível de zoom inicial |
| `tileUrl` | `SingleLine.Text` | OSM | Template de tiles. Vazio = OpenStreetMap |

### Formato do JSON de ocorrências

```json
[
  { "lat": -22.2171, "lng": -49.9501, "weight": 1, "label": "Centro" }
]
```

| Campo | Obrigatório | Observação |
|---|---|---|
| `lat` / `latitude` | ✅ | Aceita os dois nomes |
| `lng` / `longitude` | ✅ | Aceita os dois nomes |
| `weight` | ❌ | Peso do ponto no calor (padrão `1`) |
| `label` | ❌ | Texto do popup no modo marcadores |

> 💡 **Para medir densidade de incidentes, use `weight: 1` em todos os pontos.** Assim a cor reflete *quantidade de ocorrências por região*, não a gravidade de cada uma. Detalhes em [docs/USO.md](docs/USO.md#peso-densidade-x-gravidade).

---

## Desenvolvimento

```bash
cd HeatMapControl
npm install
npm run build        # build de produção (minificado, sem eval — exigência do Canvas)
npm run start:watch  # harness local com hot reload
```

Para gerar o pacote `.zip` gerenciado, veja o script documentado em **[docs/BUILD.md](docs/BUILD.md)**.

### Como o projeto está organizado

```
PowerMaps/
├── HeatMapControl/              # o componente PCF em si
│   ├── index.ts                #   lógica React + Leaflet (arquivo principal)
│   ├── ControlManifest.Input.xml  #   manifesto: propriedades e tipo do controle
│   └── strings/                #   rótulos localizados (.resx)
├── PCFSolution/                # projeto de solução do Power Platform
├── releases/                   # pacotes .zip prontos para importar
└── docs/                       # documentação detalhada
```

---

## A jornada (ou: por que isso deu tanto trabalho 😅)

Esse componente parece simples, mas levou **da v1.0.2 até a v1.1.5** para funcionar de verdade dentro de um Canvas App. Documentei cada armadilha em **[docs/SOLUCAO-DE-PROBLEMAS.md](docs/SOLUCAO-DE-PROBLEMAS.md)** — se você está construindo um PCF e batendo cabeça com "Não foi possível importar os componentes", comece por lá. Em resumo, as três descobertas que destravaram tudo:

1. **`control-type="virtual"` + React** — Canvas App rejeitava o controle `standard` silenciosamente.
2. **Solução gerenciada (`Managed`)** — o ambiente não aceitava a versão não-gerenciada no picker de componentes.
3. **`ResizeObserver`** — o Leaflet "congela" o tamanho do mapa na inicialização; sem isso, ele só renderizava um pedacinho do mapa.

Cada uma dessas custou horas. Se este repositório te poupar essas horas, ele cumpriu seu papel. 🙌

---

## Roadmap

- [ ] Clustering de marcadores para grandes volumes
- [ ] Legenda de intensidade na tela
- [ ] Exportar o mapa como imagem
- [ ] Eventos de clique devolvidos ao Canvas (output properties)

Sugestões e PRs são bem-vindos — veja **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Licença

[MIT](LICENSE) — use, modifique e distribua à vontade. Se ajudar no seu projeto, uma ⭐ no repositório faz o dia mais feliz.

Feito com ☕ e paciência por **[PowerCodeBrasil](https://github.com/daniel-powercodebrasil)**.
