# 🧭 Guia de Uso

Como alimentar o **HeatMapControl** com dados reais e ajustar a aparência do mapa
de calor dentro do seu Canvas App.

---

## ⚠️ Onde ficam as propriedades

As propriedades customizadas de um PCF **não aparecem no painel "Propriedades"
da direita** — isso é uma limitação do próprio Canvas Apps, não um problema deste
componente.

👉 Para configurá-las, selecione o controle e use o **dropdown da barra de fórmulas**
no topo (onde normalmente aparece `occurrencesJson`). Escolha a propriedade e
digite o valor na fórmula.

---

## O formato dos dados

A propriedade `occurrencesJson` espera **uma string contendo um array JSON**:

```json
[
  { "lat": -22.2171, "lng": -49.9501, "weight": 1, "label": "Centro" },
  { "lat": -22.2210, "lng": -49.9450, "weight": 1, "label": "Bairro A" }
]
```

| Campo | Obrigatório | Observação |
|---|---|---|
| `lat` ou `latitude` | ✅ | Número decimal |
| `lng` ou `longitude` | ✅ | Número decimal |
| `weight` | ❌ | Peso no calor (padrão `1`) |
| `label` | ❌ | Texto do popup (modo marcadores) |

Pontos com `lat`/`lng` inválidos são **ignorados silenciosamente** — o mapa não quebra.

---

## Exemplo 1 — Valor fixo (teste rápido)

Lembre-se de **escapar as aspas duplas** no Power Fx (`""`):

```powerfx
"[{""lat"":-22.2171,""lng"":-49.9501,""weight"":1,""label"":""Centro""},{""lat"":-22.2210,""lng"":-49.9450,""weight"":1,""label"":""Bairro A""}]"
```

---

## Exemplo 2 — A partir de uma Collection

Se você tem uma `Collection` com colunas `Latitude`, `Longitude` e `Descricao`,
monte o JSON dinamicamente:

```powerfx
"[" &
Concat(
    colOcorrencias,
    "{""lat"":"   & Text(Latitude,  "[$-en-US]0.######") &
    ",""lng"":"   & Text(Longitude, "[$-en-US]0.######") &
    ",""weight"":1" &
    ",""label"":""" & Substitute(Descricao, """", "'") & """}",
    ","
) &
"]"
```

> 🔎 **Por que `Text(..., "[$-en-US]...")`?** Para forçar o **ponto** como separador
> decimal. Em ambientes pt-BR, o número sairia com vírgula (`-22,21`) e quebraria o JSON.

> 🔎 **`Substitute(..., """", "'")`** troca aspas duplas que possam existir no texto
> do rótulo por aspas simples, evitando quebrar o JSON.

---

## Exemplo 3 — Direto do Dataverse / SharePoint

Mesma ideia, apontando para a fonte de dados:

```powerfx
"[" &
Concat(
    Filter(Ocorrencias, Status = "Aberta"),
    "{""lat"":"   & Text(cr_latitude,  "[$-en-US]0.######") &
    ",""lng"":"   & Text(cr_longitude, "[$-en-US]0.######") &
    ",""weight"":1" &
    ",""label"":""" & Substitute(cr_titulo, """", "'") & """}",
    ","
) &
"]"
```

> ⚠️ **Delegação:** fontes como SharePoint e Dataverse têm limite de linhas
> não-delegáveis (padrão 500, máx. 2.000). Para volumes grandes, pré-filtre os
> dados ou faça a agregação antes de montar o JSON. O componente desenha o que
> receber — a paginação é responsabilidade do app.

---

## Alternar entre Mapa de Calor e Marcadores

Ligue um **Toggle** à propriedade `enableHeatmap`:

```powerfx
HeatMapControl1.enableHeatmap = tglModoCalor.Value
```

- `true` → mapa de calor (densidade por cor)
- `false` → marcadores (pins clicáveis; o `label` vira o popup)

---

## Peso: densidade x gravidade

Essa é a dúvida mais comum, então vale parar aqui. 🙂

O `weight` **não é uma categoria** (leve/grave). Ele é o **peso de contribuição**
de cada ponto no cálculo do calor. A cor de cada região é a **soma dos pesos** dos
pontos próximos.

### ✅ Quero ver onde há MAIS ocorrências (densidade)
Use `weight: 1` em **todos** os pontos. A cor vermelha vai surgir naturalmente onde
houver mais ocorrências aglomeradas. É o caso mais comum (mapas de incidentes,
chamados, denúncias).

### Quero que ocorrências graves "pesem mais"
Aí sim varie o peso. Por exemplo:

| Gravidade | `weight` |
|---|---|
| Leve | 1 |
| Moderada | 2 |
| Grave / Crítica | 5 |

Assim, uma única ocorrência grave acende como cinco leves. Use com cuidado: isso
mistura *densidade* com *severidade* e pode confundir a leitura do mapa.

> 💡 Recomendação: para a maioria dos painéis, **mantenha `weight: 1`** e use o campo
> de gravidade só no `label` (popup), no modo marcadores.

---

## Ajuste fino da aparência do calor

| Propriedade | Efeito | Quando mexer |
|---|---|---|
| `heatRadius` (px) | Tamanho do halo de cada ponto | Aumente (60–80) se os dados são esparsos e você quer manchas maiores |
| `heatBlur` (px) | Suavização das bordas | Diminua (10–15) para manchas mais nítidas; aumente para mais difuso |
| `heatIntensity` | Pontos sobrepostos para chegar ao vermelho | Diminua (1–2) para saturar com poucos pontos; aumente (5–10) se tudo fica vermelho |
| `heatMaxZoom` | Zoom em que o calor é máximo | Ajuste se o calor "some" ou "explode" ao dar zoom |

---

## Provedor de mapa (tiles)

Por padrão usa **OpenStreetMap** (ótimo para testes). Para produção com tráfego
alto, considere um provedor licenciado e preencha `tileUrl`:

```
https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=SUA_CHAVE
```

> A OSM tem uma [política de uso](https://operations.osmfoundation.org/policies/tiles/)
> que restringe tráfego pesado em produção. Respeite-a. 🙏
