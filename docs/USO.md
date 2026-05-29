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
| `lat` ou `latitude` | ⬦ | Número decimal. Opcional **se** você informar nome (veja abaixo) |
| `lng` ou `longitude` | ⬦ | Número decimal. Opcional **se** você informar nome |
| `uf` ou `estado` | ⬦ | Sigla ou nome do estado (resolvido pela tabela embutida) |
| `cidade` | ⬦ | Resolvido pela `placesJson` |
| `bairro` | ⬦ | Resolvido pela `placesJson` |
| `weight` | ❌ | Peso no calor (padrão `1`) |
| `label` | ❌ | Texto do popup (modo marcadores) |

⬦ = informe **lat/lng** _ou_ pelo menos um nome (`uf`/`estado`, `cidade`, `bairro`).
Veja **[Não tenho lat/lng](#não-tenho-latlng--só-bairro-cidade-ou-estado)** logo abaixo.

Ocorrências que não trazem coordenada **nem** um nome reconhecível são **ignoradas
silenciosamente** — o mapa não quebra.

---

## Não tenho lat/lng — só bairro, cidade ou estado

A partir da **v1.2.0**, uma ocorrência pode ser localizada **por nome**, sem
coordenadas. O componente resolve a posição na seguinte ordem:

1. `lat`/`lng` (se existirem, sempre vencem — é o mais preciso)
2. `cidade` + `bairro`
3. `bairro`
4. `cidade`
5. `uf` / `estado`

Os nomes são comparados **sem acento e sem diferença de maiúsculas** (`"São Paulo"`
= `"sao paulo"`).

### Estados do Brasil: funcionam de graça 🇧🇷

Os centroides dos **27 estados** já vêm embutidos. Basta a ocorrência ter `uf` ou
`estado`:

```json
[
  { "uf": "SP" },
  { "estado": "Rio de Janeiro", "weight": 3 },
  { "uf": "MG", "label": "Belo Horizonte" }
]
```

> ⚠️ Estado vira um **único ponto no centro geográfico** do estado (calor por
> centroide). Ótimo para um panorama nacional; para detalhe dentro de uma cidade,
> use bairro.

### Cidades e bairros: você fornece a tabela (`placesJson`)

Como os centroides de cidade/bairro mudam de projeto pra projeto, eles vêm de uma
**tabela de referência** que você passa na propriedade `placesJson`:

```powerfx
// placesJson
"[{""cidade"":""Bauru"",""bairro"":""Centro"",""lat"":-22.3147,""lng"":-49.0606},{""cidade"":""Bauru"",""bairro"":""Vila Nova"",""lat"":-22.3220,""lng"":-49.0710},{""cidade"":""Marília"",""lat"":-22.2171,""lng"":-49.9501}]"
```

E aí as ocorrências referenciam só pelos nomes:

```powerfx
// occurrencesJson
"[{""cidade"":""Bauru"",""bairro"":""Centro""},{""cidade"":""Bauru"",""bairro"":""Centro""},{""cidade"":""Marília""}]"
```

No exemplo acima, as duas ocorrências do Centro de Bauru são **agregadas** num só
ponto (peso somado = 2). No modo marcadores, o popup mostra *"Centro: 2 ocorrências"*.

> 💡 **De onde tiro os centroides?** Monte a tabela uma vez (planilha, tabela do
> Dataverse, etc.). Para cidades, o centro aproximado já resolve bem o calor; para
> bairros, use o centro do bairro.

### Misturando tudo

Pode misturar livremente pontos exatos, bairros, cidades e estados no mesmo
`occurrencesJson` — cada um resolve pelo critério mais específico que tiver:

```json
[
  { "lat": -22.3147, "lng": -49.0606, "label": "Endereço exato" },
  { "cidade": "Bauru", "bairro": "Centro" },
  { "cidade": "Marília" },
  { "uf": "SP" }
]
```

> 🔎 Ocorrências cujo nome **não bate** com nada na tabela (nem com um estado) são
> **ignoradas silenciosamente** — o mapa não quebra. Confira a grafia na `placesJson`.

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
