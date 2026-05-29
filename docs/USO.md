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
2. `placesJson` (tabela do usuário): `cidade`+`bairro` → `bairro` → `cidade`
3. `cidade` → **base embutida dos 5.570 municípios do Brasil (IBGE)**
4. `uf` / `estado`

Os nomes são comparados **sem acento e sem diferença de maiúsculas** (`"São Paulo"`
= `"sao paulo"`).

### Estados e cidades: funcionam de graça 🇧🇷

A partir da **v1.3.0**, tanto os **27 estados** quanto os **5.570 municípios** do
Brasil já vêm embutidos. Basta a ocorrência ter `cidade`, `uf` ou `estado` — **sem
precisar de `placesJson`**:

```json
[
  { "cidade": "Marília", "label": "Furto" },
  { "cidade": "Marília", "label": "Roubo" },
  { "cidade": "Bauru" },
  { "estado": "Rio de Janeiro", "weight": 3 },
  { "uf": "SP" }
]
```

No exemplo acima, as duas ocorrências de Marília são **agregadas** no centroide da
cidade (badge "2"). Cidade resolve sozinha; o estado vira um ponto no centro
geográfico dele.

> 🏙️ **Homônimos** (cidades com mesmo nome em estados diferentes): informe o `uf`
> junto para desambiguar (`{"cidade":"Bom Jesus","uf":"PI"}`). Sem `uf`, o
> componente prefere a **capital** de mesmo nome; senão, a primeira correspondência.

> ⚠️ Estado vira um **único ponto no centro geográfico** do estado (calor por
> centroide). Ótimo para um panorama nacional; para detalhe, use cidade ou bairro.

### Bairros: a precisão fina vem da `placesJson`

A base embutida vai até o nível de **cidade**. Bairro não tem uma base nacional
prática, então:

- Se você **não** fornece `placesJson`, ocorrências com `bairro` caem no **centroide
  da cidade** (todas as de uma cidade se agrupam no centro dela).
- Para separar **por bairro**, forneça a tabela `placesJson` com os centroides dos
  bairros:

```powerfx
// placesJson — só necessário para granularidade por BAIRRO
"[{""cidade"":""Bauru"",""bairro"":""Centro"",""lat"":-22.3147,""lng"":-49.0606},{""cidade"":""Bauru"",""bairro"":""Vila Nova"",""lat"":-22.3220,""lng"":-49.0710}]"
```

A `placesJson` tem **prioridade** sobre a base embutida — útil também se você quiser
ajustar o ponto de uma cidade específica.

> 💡 **De onde tiro os centroides de bairro?** Monte a tabela uma vez (planilha,
> tabela do Dataverse, etc.) usando o centro aproximado de cada bairro.

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
