# 🔧 Solução de Problemas (e a história por trás)

> Este documento é parte guia de troubleshooting, parte diário de bordo. Construir
> um PCF que **importa e funciona dentro de um Canvas App** foi bem mais difícil do
> que escrever o código do mapa em si. Se você está passando pelo mesmo, talvez
> isto te poupe os dias que custou aqui.

A regra de ouro que aprendi: **quando um PCF não importa no Canvas, o problema quase
nunca é o seu código — é a estrutura/empacotamento da solução.** Por isso a estratégia
que funcionou foi reduzir o componente a um "hello world" mínimo e ir comparando, byte
a byte, com um PCF que comprovadamente funcionava no mesmo ambiente.

---

## 🟥 "Não foi possível importar os componentes" (no Canvas App)

O caso mais frustrante: a **solução importa com sucesso** no ambiente, o controle
**aparece** na lista de componentes de código, mas na hora de inserir no app dá esse
erro genérico, sem detalhes.

Passamos por isso da v1.0.3 até a v1.0.10. O que realmente resolveu foram **três**
mudanças estruturais. Se você está travado, verifique as três:

### 1. O controle precisa ser `virtual` (React), não `standard`

Esse foi **o** bloqueio. Um PCF que funcionava no ambiente usava:

```xml
<control ... control-type="virtual" ...>
  ...
  <resources>
    <code path="index.ts" order="1" />
    <platform-library name="React" version="16.14.0" />
    <resx ... />
  </resources>
</control>
```

E a classe implementa `ReactControl` em vez de `StandardControl`:

```ts
export class HeatMapControl
  implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  // updateView retorna React.ReactElement em vez de manipular o container
  updateView(context): React.ReactElement { ... }
}
```

> Trocar `standard` → `virtual` + React foi o que fez o componente finalmente aparecer
> e inserir no Canvas. No nosso ambiente, controles `standard` eram recusados sem mensagem.

### 2. A solução precisa ser **gerenciada** (`Managed=1`)

No `solution.xml`:

```xml
<Managed>1</Managed>
```

Os PCFs que funcionavam no ambiente eram todos gerenciados. A versão não-gerenciada
era recusada no picker de componentes do Canvas.

### 3. Estrutura do `.zip` precisa ser exata

- `customizations.xml` deve ser a **primeira** entrada do zip.
- `[Content_Types].xml` deve ser a **última**.
- Todos os XML de metadados com **BOM UTF-8**.
- O `schemaName` no `solution.xml` usa o **prefixo do publisher**:
  `pm_PowerMapsBR.HeatMapControl`.

---

## 🟥 "Custom Control with name X already created by another publisher"

O Dataverse usa `namespace.constructor` como **chave única global** — independente do
publisher. Uma importação anterior que falhou pode ter deixado um registro órfão com
esse nome.

**Solução:** renomeie o `namespace` (foi de `PowerMaps` → `PowerMapsBR`), ou remova o
registro órfão do ambiente antes de reimportar.

---

## 🟥 Importação fica em "Não Processado" / 0%

Formato do `.zip` errado. PCF empacotado "na mão" com bibliotecas de zip comuns
costuma sair fora do padrão que o Power Platform espera.

**Solução:** replicar exatamente a estrutura de um pacote que funciona (ordem das
entradas, BOM, `[Content_Types].xml`, pasta `Controls/`). Veja o script em
[BUILD.md](BUILD.md).

---

## 🟥 O rótulo aparece como a chave (ex.: `HeatMapControl_DisplayName`)

O arquivo `.resx` está registrado num **idioma que o ambiente não tem habilitado**.

**Solução:** use o código de idioma correto no nome do arquivo e no `<Languages>` do
`customizations.xml`. Aqui o ambiente tinha **1033** (en-US) habilitado, então o arquivo
virou `HeatMapControl.1033.resx` — mesmo com o conteúdo em português.

---

## 🟥 O bundle quebra no Canvas (mas funciona no harness local)

O Canvas App aplica uma **Content Security Policy** que bloqueia `eval()`. O build de
desenvolvimento do PCF embrulha cada módulo em `eval()`.

**Solução:** sempre faça o build de **produção**:

```bash
npm run build            # já configurado para produção neste projeto
# ou explicitamente:
pcf-scripts build --buildMode production
```

Confirme que o `bundle.js` final **não contém** `eval(`.

---

## 🟥 PNGs do Leaflet sumindo / bundle quebrado

Importar o `leaflet.css` (`import "leaflet/dist/leaflet.css"`) faz o webpack tentar
extrair os PNGs do Leaflet como arquivos separados — que não vão para o `.zip`.

**Solução adotada:** **não** importar o CSS via webpack. Em vez disso, o CSS do Leaflet
é **injetado em tempo de execução** via uma tag `<style>` no `<head>` (constante
`INJECTED_CSS` no `index.ts`), com os poucos `url(...)` de imagem substituídos por um
PNG transparente 1×1 em data-URL.

> Bônus: isso também resolveu um erro de import, já que os PCFs que funcionavam no
> ambiente **não declaravam recurso `<css>`** no manifesto — só `<code>` e `<resx>`.

---

## 🟧 "Error loading control" ao reabrir / dar F5 no app

O Leaflet marca o elemento DOM com um `_leaflet_id` interno. Quando o Canvas
remonta o controle sem destruir o DOM por completo, o Leaflet reclama que o container
"já está inicializado".

**Solução (v1.1.2):**
- `destroy()` chama `map.remove()` explicitamente (via um `ref` compartilhado).
- Na montagem, o código detecta `_leaflet_id` órfão e remove a instância anterior
  antes de criar uma nova.
- Todas as operações do Leaflet ficam em `try/catch` para nunca borbulhar como
  "Error loading control" para o usuário.

---

## 🟧 O mapa renderiza só num pedacinho (tiles cinza no resto)

Sintoma clássico: o mapa aparece num cantinho, e dar zoom/arrastar não preenche o
resto — fica tudo cinza.

**Causa:** o Leaflet **cacheia o tamanho do viewport no `L.map()`**. O Canvas/PCF
entrega o tamanho final do container **depois** da inicialização (`allocatedWidth/Height`
chega como `0` no primeiro render). Resultado: o mapa só carrega tiles para a área
minúscula original.

**Solução (v1.1.5):**
- Um **`ResizeObserver`** observa o elemento real do mapa e chama
  `map.invalidateSize()` sempre que o tamanho físico muda — sem depender dos valores
  não-confiáveis do Canvas.
- Empurrõezinhos com `setTimeout` (0/100/300/600/1000 ms) cobrem hosts onde o layout
  só estabiliza depois.
- O div do mapa usa `position:absolute; inset:0` para refletir sempre o tamanho do wrapper.

> ⚙️ Além do componente, lembre de definir no Canvas:
> `Width = Parent.Width` e `Height = Parent.Height`.

---

## 🟨 As propriedades não aparecem no painel direito

Não é bug. **Canvas Apps não mostra propriedades customizadas de PCF no painel
"Propriedades"** — só no **dropdown da barra de fórmulas**. Comportamento da plataforma.

---

## Resumo: a receita que funciona

Para um PCF rodar em Canvas App (pelo menos neste tipo de ambiente):

- ✅ `control-type="virtual"` + `<platform-library name="React" .../>` + `ReactControl`
- ✅ Solução **gerenciada** (`<Managed>1</Managed>`)
- ✅ Build de **produção** (sem `eval`)
- ✅ `.zip` na estrutura exata (ordem das entradas, BOM, `[Content_Types].xml` por último)
- ✅ `.resx` no idioma habilitado no ambiente
- ✅ Sem recurso `<css>` no manifesto — injete CSS via JS se precisar
- ✅ `ResizeObserver` para o `invalidateSize()` se você usa mapa/canvas/lib que mede o container

Se isto te ajudou, considere deixar uma ⭐ no repositório. Boa sorte! 🍀
