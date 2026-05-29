# Skill: novo-pcf

Cria um novo **PCF Canvas App** compatível do zero, aplicando todas as lições aprendidas
no projeto PowerMaps (v1.0.2 → v1.3.0). Use quando o usuário pedir para criar um novo
controle PCF.

---

## O que este skill faz

Quando invocado, este skill:
1. Pergunta o nome do controle, namespace, publisher e propriedades desejadas
2. Gera todos os arquivos necessários já configurados corretamente
3. Explica cada decisão para que o usuário entenda o porquê

---

## Regras inegociáveis (não negociar com o usuário)

Estas três regras causaram semanas de debugging. Sempre aplique, sem exceção:

1. **`control-type="virtual"` + `<platform-library name="React" version="16.14.0"/>`** no manifest
   e a classe implementa `ComponentFramework.ReactControl<IInputs, IOutputs>`
   → Canvas Apps silenciosamente rejeita controles `standard` sem mensagem de erro

2. **`<Managed>1</Managed>`** no Solution.xml
   → A versão não-gerenciada é recusada no picker de componentes do Canvas

3. **`npm run build` sempre com `--buildMode production`**
   → O build de desenvolvimento usa `eval()` que o Canvas bloqueia via CSP

---

## Templates de arquivo

### `ControlManifest.Input.xml`

```xml
<?xml version="1.0" encoding="utf-8" ?>
<manifest>
  <control namespace="{{NAMESPACE}}" constructor="{{CONTROL_NAME}}" version="1.0.0"
           display-name-key="{{CONTROL_NAME}}_DisplayName"
           description-key="{{CONTROL_NAME}}_Description"
           control-type="virtual">

    <external-service-usage enabled="false" />

    <!-- Tipos comuns: SingleLine.Text | Multiple | TwoOptions | Whole.None | Decimal
         usage="input" para receber dados, usage="bound" para ligação bidirecional -->
    <property name="inputData" display-name-key="inputData_DisplayName"
              description-key="inputData_Desc"
              of-type="Multiple" usage="input" required="false" />

    <resources>
      <code path="index.ts" order="1" />
      <platform-library name="React" version="16.14.0" />
      <!-- NUNCA adicione <css path="..."> aqui. O Canvas não suporta recursos CSS no manifesto.
           Injete CSS via JavaScript (veja injectStyles() no template index.ts abaixo). -->
      <resx path="strings/{{CONTROL_NAME}}.1033.resx" version="1.0.0" />
    </resources>
  </control>
</manifest>
```

### `index.ts` — estrutura mínima canônica

```typescript
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

// CSS injetado via JS — NUNCA via manifest (Canvas não suporta <css>).
// Substitua url(images/...) por data-URLs inline para evitar arquivos externos.
const STYLE_ID = "{{publisher}}-{{controlname}}-styles";
const INJECTED_CSS = `/* cole o CSS necessário aqui */`;

function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = INJECTED_CSS;
  document.head.appendChild(style);
}

interface Props {
  inputData: string;
  width: number;
  height: number;
}

const MyComponent: React.FC<Props> = (props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => { injectStyles(); }, []);

  // Se usar uma lib que mede o viewport (Leaflet, Chart.js, canvas, etc.):
  // O Canvas entrega allocatedWidth/Height = 0 no primeiro render e a lib
  // cacheia esse tamanho. Solução: ResizeObserver no elemento real do DOM.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Inicialize sua lib aqui (ex: const map = L.map(el, {...}))
    // ...

    let resizeObserver: ResizeObserver | null = null;
    let lastW = 0, lastH = 0;
    const refresh = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
        lastW = w; lastH = h;
        // Chame invalidateSize() ou equivalente da sua lib aqui
      }
    };
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => refresh());
      resizeObserver.observe(el);
    }
    // Nudges extras para hosts onde o layout só estabiliza depois do observer
    const timers = [0, 100, 300, 600, 1000].map((ms) =>
      window.setTimeout(() => refresh(), ms)
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (resizeObserver) { try { resizeObserver.disconnect(); } catch {} }
      // Destrua a instância da lib aqui
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Rodar só na montagem — NUNCA colocar deps aqui

  return React.createElement(
    "div",
    { style: { width: "100%", height: "100%", position: "relative", overflow: "hidden" } },
    React.createElement("div", {
      ref: containerRef,
      style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    })
  );
};

// A classe PCF em si é mínima — só passa props para o componente React
export class {{CONTROL_NAME}}
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  // Se precisar de ref compartilhada entre classe e componente (ex: destroy de Leaflet):
  // private _instanceRef: React.MutableRefObject<SomeType | null> = { current: null };

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    void context; // init não recebe container — este é ReactControl, não StandardControl
  }

  updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    return React.createElement(MyComponent, {
      inputData: context.parameters.inputData.raw ?? "",
      width: context.mode.allocatedWidth,
      height: context.mode.allocatedHeight,
    });
  }

  getOutputs(): IOutputs { return {}; }

  destroy(): void {
    // Se tiver _instanceRef: limpe aqui e chame .remove() ou equivalente
  }
}
```

### `PCFSolution/Other/Solution.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml version="9.0.0.0013" SolutionPackageVersion="9.1" languagecode="1033"
                 generatedBy="CrmLive" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SolutionManifest>
    <UniqueName>{{SolutionUniqueName}}</UniqueName>
    <LocalizedNames>
      <LocalizedName description="{{SolutionDisplayName}}" languagecode="1033"/>
    </LocalizedNames>
    <Descriptions/>
    <Version>1.0.0.0</Version>  <!-- 4 partes: major.minor.patch.0 -->
    <Managed>1</Managed>
    <Publisher>
      <!-- UniqueName e CustomizationPrefix definem o schemaName do controle.
           NUNCA os troque em versões futuras ou o controle vira um órfão.
           PublisherDisplayName é só o nome exibido na coluna "Distribuidor" —
           pode ser alterado sem quebrar nada. -->
      <UniqueName>{{publisher_unique}}</UniqueName>
      <LocalizedNames>
        <LocalizedName description="{{PublisherDisplayName}}" languagecode="1033"/>
      </LocalizedNames>
      <Descriptions/>
      <EMailAddress/>
      <SupportingWebsiteUrl/>
      <CustomizationPrefix>{{prefix}}</CustomizationPrefix>
      <CustomizationOptionValuePrefix>10000</CustomizationOptionValuePrefix>
    </Publisher>
    <RootComponents>
      <!-- schemaName = {prefix}_{namespace}.{constructor} — deve ser único global no Dataverse -->
      <RootComponent type="66" schemaName="{{prefix}}_{{NAMESPACE}}.{{CONTROL_NAME}}" behavior="0"/>
    </RootComponents>
    <MissingDependencies/>
  </SolutionManifest>
</ImportExportXml>
```

### `strings/{{CONTROL_NAME}}.1033.resx`

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <resheader name="resmimetype"><value>text/microsoft-resx</value></resheader>
  <resheader name="version"><value>2.0</value></resheader>
  <data name="{{CONTROL_NAME}}_DisplayName" xml:space="preserve">
    <value>{{Display Name do Controle}}</value>
  </data>
  <data name="{{CONTROL_NAME}}_Description" xml:space="preserve">
    <value>{{Descrição do Controle}}</value>
  </data>
  <!-- Uma entrada por property declarada no manifesto: -->
  <data name="inputData_DisplayName" xml:space="preserve">
    <value>Dados de Entrada</value>
  </data>
  <data name="inputData_Desc" xml:space="preserve">
    <value>JSON com os dados a exibir.</value>
  </data>
</root>
```

**Atenção ao nome do arquivo `.resx`:** deve usar o código de idioma habilitado no
ambiente de destino. `1033` = en-US (o mais comum). `1046` = pt-BR. Conteúdo em
português dentro de um arquivo `.1033.resx` funciona perfeitamente — o que importa
é o código no nome, não o idioma do conteúdo.

---

## Script Python de empacotamento (`pack.py`)

A estrutura do `.zip` tem regras rígidas. Este script replica o formato exato que o
Power Platform aceita. Execute com `python3 pack.py` na raiz do projeto.

```python
#!/usr/bin/env python3
"""
Gera o .zip gerenciado para importação no Power Platform.
Ordem das entradas e BOM nos XMLs de metadados são obrigatórios.
Execute APÓS `npm run build` dentro do diretório do controle.
"""
import zipfile, os, re

# ── Configuração ─────────────────────────────────────────────────────────────
CONTROL_DIR   = "NomeDoControle"    # pasta do controle (onde fica index.ts)
SOLUTION_DIR  = "PCFSolution"
NAMESPACE     = "NomeNamespace"
CONSTRUCTOR   = "NomeControlName"
PUBLISHER_PFX = "pm"               # prefixo do publisher (CustomizationPrefix)
VERSION       = "1.0.0"            # 3 partes; o script adiciona ".0" no Solution.xml
# ─────────────────────────────────────────────────────────────────────────────

BOM          = b'\xef\xbb\xbf'
CONTROL_NAME = f"{PUBLISHER_PFX}_{NAMESPACE}.{CONSTRUCTOR}"
CTRL_PATH    = f"Controls/{CONTROL_NAME}"
OUT_DIR      = f"{CONTROL_DIR}/out/controls"
OUT_ZIP      = f"releases/{CONTROL_DIR}_{VERSION.replace('.','_')}_managed.zip"

def read(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()

# customizations.xml: formato completo com as seções que o Power Platform espera.
# Variante simplificada suficiente para PCFs sem entidades/workflows customizados.
CUSTOMIZATIONS = f"""<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Entities /><Roles /><Workflows /><FieldSecurityProfiles /><Templates />
  <EntityMaps /><EntityRelationships /><OrganizationSettings /><optionsets />
  <CustomControls>
    <CustomControl>
      <Name>{CONTROL_NAME}</Name>
      <FileName>/Controls/{CONTROL_NAME}/ControlManifest.xml</FileName>
    </CustomControl>
  </CustomControls>
  <SolutionPluginAssemblies /><EntityDataProviders />
  <Languages><Language>1033</Language></Languages>
</ImportExportXml>""".encode("utf-8")

# [Content_Types].xml: sem BOM, deve ser a ÚLTIMA entrada do zip.
CONTENT_TYPES = (
    f'<?xml version="1.0" encoding="utf-8"?>'
    f'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    f'<Default Extension="xml" ContentType="text/xml" />'
    f'<Default Extension="js" ContentType="application/octet-stream" />'
    f'<Default Extension="resx" ContentType="application/octet-stream" />'
    f'<Default Extension="txt" ContentType="application/octet-stream" />'
    f'<Override PartName="/{CTRL_PATH}/ControlManifest.xml" '
    f'ContentType="application/octet-stream" /></Types>'
).encode("utf-8")

# solution.xml: lido do fonte, força BOM e versão 4-partes.
sol_raw = read(f"{SOLUTION_DIR}/Other/Solution.xml").lstrip(BOM).decode("utf-8")
sol_raw = re.sub(r"<Version>[^<]*</Version>", f"<Version>{VERSION}.0</Version>", sol_raw)
SOLUTION = BOM + sol_raw.encode("utf-8")

os.makedirs("releases", exist_ok=True)

entries = [
    ("customizations.xml",           BOM + CUSTOMIZATIONS),  # PRIMEIRA entrada (com BOM)
    ("solution.xml",                 SOLUTION),
    (f"{CTRL_PATH}/ControlManifest.xml",   read(f"{OUT_DIR}/ControlManifest.xml")),
    (f"{CTRL_PATH}/bundle.js",             read(f"{OUT_DIR}/bundle.js")),
]
for extra in ["bundle.js.LICENSE.txt"]:
    p = f"{OUT_DIR}/{extra}"
    if os.path.exists(p):
        entries.append((f"{CTRL_PATH}/{extra}", read(p)))

resx = f"{OUT_DIR}/strings/{CONSTRUCTOR}.1033.resx"
if os.path.exists(resx):
    entries.append((f"{CTRL_PATH}/strings/{CONSTRUCTOR}.1033.resx", read(resx)))

entries.append(("[Content_Types].xml", CONTENT_TYPES))  # ÚLTIMA entrada (sem BOM)

with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
    for name, data in entries:
        zf.writestr(name, data)

print(f"Gerado: {OUT_ZIP}")
with zipfile.ZipFile(OUT_ZIP) as zf:
    for n in zf.namelist():
        print(f"  {n}")
```

---

## `package.json` — configuração recomendada

```json
{
  "name": "nome-do-controle",
  "version": "1.0.0",
  "description": "Descrição do controle",
  "author": "Seu Nome",
  "license": "MIT",
  "scripts": {
    "build": "pcf-scripts build --buildMode production",
    "start:watch": "pcf-scripts start watch",
    "lint": "eslint --ext .ts ."
  }
}
```

---

## Padrão: embutir tabelas de dados estáticos no bundle

Quando o controle precisa de dados de referência (ex.: coordenadas de municípios,
tabelas de conversão, listas de domínio) sem depender de API externa, embuta os dados
como um módulo TypeScript. O webpack inclui tudo no `bundle.js`.

```bash
# 1. Gere o arquivo TS com os dados (script Python, Node, etc.)
python3 gerar_dados.py > MeuControle/minhaTabelaRef.ts

# 2. O arquivo gerado exporta um objeto/constante:
#    export const MINHA_TABELA: { [key: string]: [number, number] } = { ... };

# 3. Importe no index.ts normalmente:
#    import { MINHA_TABELA } from "./minhaTabelaRef";
```

**Sobre o aviso de tamanho do webpack:**
```
WARNING: asset size limit: bundle.js (368 KiB) exceeds recommended limit (244 KiB)
```
Este é apenas um **aviso de performance**, não um erro. O componente funciona
normalmente. Só se torna um problema real se o bundle ultrapassar alguns MB — tabelas
de referência de dezenas de milhares de linhas ficam bem abaixo disso.

**Padrão de lookup com normalização de nomes** (útil para resolver strings do usuário
como cidade, bairro, categoria):

```typescript
// Normaliza para casar independente de acento, caixa e espaços extras.
function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Constrói índice invertido normalizando as chaves.
const INDEX: { [key: string]: SomeValue } = {};
for (const [key, val] of Object.entries(RAW_TABLE)) {
  INDEX[normalize(key)] = val;
}

// Lookup tolerante a variações de grafia:
function lookup(input: string): SomeValue | null {
  return INDEX[normalize(input)] ?? null;
}
```

---

## Padrão: agregação de pontos no mesmo local (heatmap / clustering)

Quando múltiplos registros podem cair no mesmo ponto (ex.: vários incidentes num
mesmo bairro mapeado para o mesmo centroide):

```typescript
interface DataPoint {
  lat: number;
  lng: number;
  weight: number;
  count: number;
  label: string;
  labels: string[]; // todos os rótulos individuais coletados
}

function aggregate(items: RawItem[]): DataPoint[] {
  const map = new Map<string, DataPoint>();
  for (const item of items) {
    const [lat, lng] = resolveCoord(item); // sua lógica de resolução
    if (!lat) continue;
    // toFixed(4) ≈ precisão de ~11 m — suficiente para agrupar no mesmo centroide
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const existing = map.get(key);
    if (existing) {
      existing.weight += item.weight ?? 1;
      existing.count += 1;
      if (item.label) existing.labels.push(item.label);
    } else {
      map.set(key, {
        lat, lng,
        weight: item.weight ?? 1,
        count: 1,
        label: item.label ?? "",
        labels: item.label ? [item.label] : [],
      });
    }
  }
  return [...map.values()];
}
```

Para exibir o total sobre cada ponto (badge flutuante com `L.divIcon`):

```typescript
// Badge escuro com número centralizado via transform
const icon = L.divIcon({
  className: "",               // string vazia evita o box branco padrão do Leaflet
  html: `<div class="my-badge">${count > 999 ? "999+" : count}</div>`,
  iconSize: [0, 0],            // [0,0] + transform:translate(-50%,-50%) no CSS centra o badge
  iconAnchor: [0, 0],
  popupAnchor: [0, -14],
});

// CSS necessário (embutir no INJECTED_CSS):
// .my-badge { background: rgba(15,15,15,.72); color:#fff; border:2px solid rgba(255,255,255,.88);
//   border-radius:20px; min-width:22px; height:22px; display:flex; align-items:center;
//   justify-content:center; font:700 11px/1 sans-serif; padding:0 5px; box-sizing:border-box;
//   cursor:pointer; transform:translate(-50%,-50%); pointer-events:auto; }
```

---

## Checklist para cada nova versão

Antes de gerar o `.zip` e publicar:

- [ ] Subir versão em **dois** lugares (formatos diferentes — não copiar direto):
  - `ControlManifest.Input.xml` → `version="1.2.3"` (3 partes)
  - `PCFSolution/Other/Solution.xml` → `<Version>1.2.3.0</Version>` (4 partes)
  - `package.json` → `"version": "1.2.3"` (3 partes)
- [ ] `npm run build` dentro da pasta do controle
- [ ] Confirmar que o bundle não contém `eval(`:
  ```bash
  grep -c "eval(" out/controls/bundle.js   # deve imprimir 0
  ```
- [ ] Confirmar `control-type=virtual` no ControlManifest.xml gerado
- [ ] Executar `python3 pack.py`
- [ ] Verificar entradas do zip: `customizations.xml` PRIMEIRO, `[Content_Types].xml` ÚLTIMO
- [ ] **Testar em Canvas App real** — o harness local não reproduz as restrições do Canvas
- [ ] Atualizar `CHANGELOG.md`
- [ ] Atualizar `releases/..._latest_managed.zip` para apontar para a nova versão

### Como atualizar no ambiente do cliente

Quando o ambiente já tem uma versão anterior instalada:
1. **Excluir** a solução antiga (Soluções → PowerMaps → Excluir)
2. **Importar** o novo `.zip`
3. **Re-adicionar** o componente no Canvas App (Inserir → Código → HeatMapControl)

> ⚠️ **Não basta sobrescrever**: o Canvas cacheia o `bundle.js` do componente e uma
> importação em cima da anterior frequentemente não atualiza o que está rodando no
> editor. Excluir + reimportar é a forma confiável.

---

## Gotchas que vão te morder se esquecer

| Situação | Causa | Solução |
|---|---|---|
| "Não foi possível importar os componentes" no Canvas | `control-type="standard"` ou solução não-gerenciada | Trocar para `virtual` + `Managed=1` |
| Importação fica em 0% "Não Processado" | Estrutura do zip fora do padrão | Usar o `pack.py` deste skill |
| "Custom Control already created by another publisher" | Registro órfão no Dataverse de import anterior falho | Renomear namespace ou remover o registro órfão no ambiente |
| Labels aparecem como chave (`Control_DisplayName`) | `.resx` registrado no idioma errado | Renomear para o código habilitado no ambiente (geralmente `1033`) |
| Mapa/canvas renderiza só em pedaço pequeno | Leaflet cacheia viewport no init; Canvas entrega `0x0` primeiro | `ResizeObserver` + `invalidateSize()` (veja template acima) |
| "Error loading control" ao reabrir o app | `_leaflet_id` órfão no DOM de mount anterior | Detectar e limpar `_leaflet_id` antes de criar nova instância; `destroy()` chama `map.remove()` |
| Bundle quebra no Canvas (funciona no harness) | Build de desenvolvimento usa `eval()`, bloqueado por CSP | Sempre `--buildMode production` |
| Imagens (pins, tiles extras) sumindo no bundle | `import "lib.css"` faz webpack extrair arquivos de imagem | Não importar CSS via webpack; injetar via `<style>` em JS |
| Componente não atualiza após reimportar a solução | Canvas cacheia o bundle da versão anterior | Excluir a solução antiga → importar a nova → re-adicionar no app |
| "Distribuidor" mostra nome antigo após reimport | Publisher já existe no ambiente com nome antigo | Excluir solução + reimportar; ou renomear o publisher em Soluções → Publicadores |
| Dados do usuário não casam com a tabela de lookup | Variações de acento, caixa ou espaços | Normalize com `.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim()` |
| Aviso webpack "asset size limit" no build | Bundle > 244 KB (ex.: tabela grande embutida) | Apenas aviso, não erro — o componente funciona normalmente |

---

## Fluxo resumido do zero ao funcionando

```bash
# 1. Criar o projeto PCF
pac pcf init --namespace MeuNamespace --name MeuControle --template reactcomponent
# ou: npx pcf-scripts init ...

# 2. Instalar dependências extras que precisar
cd MeuControle && npm install

# 3. Aplicar os templates acima (manifest, index.ts, Solution.xml)
# 4. Desenvolver com hot reload (lembre: harness não tem CSP nem React virtual)
npm run start:watch

# 5. Build de produção
npm run build
grep -c "eval(" out/controls/bundle.js   # confirmar 0

# 6. Empacotar
cd .. && python3 pack.py

# 7. Importar o .zip no Power Platform e testar em Canvas App real
```
