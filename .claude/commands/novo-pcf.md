# Skill: novo-pcf

Cria um novo **PCF Canvas App** compatível do zero, aplicando todas as lições aprendidas
no projeto PowerMaps. Use quando o usuário pedir para criar um novo controle PCF.

---

## O que este skill faz

Quando invocado, este skill:
1. Pergunta o nome do controle, namespace, publisher prefix e propriedades desejadas
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

    <!-- Adicione propriedades aqui. Tipos comuns:
         SingleLine.Text | Multiple | TwoOptions | Whole.None | Decimal | Currency
         usage="input" para receber dados, usage="bound" para ligação bidirecional -->
    <property name="inputData" display-name-key="inputData_DisplayName"
              description-key="inputData_Desc"
              of-type="Multiple" usage="input" required="false" />

    <resources>
      <code path="index.ts" order="1" />
      <platform-library name="React" version="16.14.0" />
      <!-- NUNCA adicione <css path="..."> aqui. O Canvas não suporta recursos CSS no manifesto.
           Injete CSS via JavaScript (veja template index.ts abaixo). -->
      <resx path="strings/{{CONTROL_NAME}}.1033.resx" version="1.0.0" />
    </resources>
  </control>
</manifest>
```

### `index.ts` — estrutura mínima canônica

```typescript
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

// Se usar Leaflet ou outra lib com CSS: injetar via JS, NUNCA via manifest
const STYLE_ID = "{{publisher}}-{{controlname}}-styles";
const INJECTED_CSS = `
/* Cole aqui o CSS necessário com url(images/...) substituídos por data-URLs */
`;

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
  // Adicione aqui todas as props que o controle recebe do PCF
}

const MyComponent: React.FC<Props> = (props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    injectStyles();
  }, []);

  // Se usar uma lib que mede o viewport (Leaflet, Chart.js, etc.):
  // O Canvas entrega allocatedWidth/Height = 0 no primeiro render.
  // A lib cacheia esse tamanho e não carrega fora dessa área mínima.
  // Solução: ResizeObserver no elemento real do DOM.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Inicialize sua lib aqui (ex: L.map(el, {...}))
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
    // Nudges extras para hosts onde o layout estabiliza depois
    const timers = [0, 100, 300, 600, 1000].map((ms) =>
      window.setTimeout(() => refresh(), ms)
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (resizeObserver) { try { resizeObserver.disconnect(); } catch {} }
      // Destrua a instância da lib aqui
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Rodar só na montagem

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
  // Se precisar de ref compartilhada entre a classe e o componente (ex: para destroy):
  // private _instanceRef: React.MutableRefObject<SomeType | null> = { current: null };

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    void context; // init sem container — este é o ReactControl, não StandardControl
  }

  updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    return React.createElement(MyComponent, {
      inputData: context.parameters.inputData.raw ?? "",
      width: context.mode.allocatedWidth,
      height: context.mode.allocatedHeight,
    });
  }

  getOutputs(): IOutputs {
    return {};
  }

  destroy(): void {
    // Se tiver _instanceRef: limpe aqui e chame .remove() ou equivalente
  }
}
```

### `PCFSolution/Other/Solution.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml version="9.0.0.207" SolutionPackageVersion="9.0" languagecode="1033"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SolutionManifest>
    <UniqueName>{{SolutionUniqueName}}</UniqueName>
    <LocalizedNames>
      <LocalizedName description="{{SolutionDisplayName}}" languagecode="1033" />
    </LocalizedNames>
    <Descriptions />
    <Version>1.0.0.0</Version>
    <Managed>1</Managed>
    <Publisher>
      <UniqueName>{{publisher_unique}}</UniqueName>
      <LocalizedNames>
        <LocalizedName description="{{PublisherDisplayName}}" languagecode="1033" />
      </LocalizedNames>
      <Descriptions />
      <EMailAddress />
      <SupportingWebsiteUrl />
      <CustomizationPrefix>{{prefix}}</CustomizationPrefix>
      <CustomizationOptionValuePrefix>10000</CustomizationOptionValuePrefix>
    </Publisher>
    <RootComponents>
      <!-- schemaName = {prefix}_{namespace}.{constructor} -->
      <RootComponent type="66" schemaName="{{prefix}}_{{NAMESPACE}}.{{CONTROL_NAME}}" behavior="0"/>
    </RootComponents>
    <MissingDependencies />
  </SolutionManifest>
</ImportExportXml>
```

### `strings/{{CONTROL_NAME}}.1033.resx`

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <resheader name="resmimetype"><value>text/microsoft-resx</value></resheader>
  <resheader name="version"><value>2.0</value></resheader>
  <resheader name="reader"><value>System.Resources.ResXResourceReader, ...</value></resheader>
  <resheader name="writer"><value>System.Resources.ResXResourceWriter, ...</value></resheader>

  <data name="{{CONTROL_NAME}}_DisplayName" xml:space="preserve">
    <value>{{Display Name do Controle}}</value>
  </data>
  <data name="{{CONTROL_NAME}}_Description" xml:space="preserve">
    <value>{{Descrição do Controle}}</value>
  </data>

  <!-- Uma entrada para cada property do manifesto: -->
  <data name="inputData_DisplayName" xml:space="preserve">
    <value>Dados de Entrada</value>
  </data>
  <data name="inputData_Desc" xml:space="preserve">
    <value>JSON com os dados a exibir.</value>
  </data>
</root>
```

**Atenção ao nome do arquivo resx:** deve usar o código de idioma que está habilitado
no ambiente de destino. Se o ambiente roda em en-US, use `1033`. Se usa pt-BR habilitado,
use `1046`. Conteúdo em português dentro de um arquivo `.1033.resx` funciona perfeitamente.

---

## Script Python de empacotamento

Salve como `pack.py` na raiz do projeto e execute com `python3 pack.py`:

```python
#!/usr/bin/env python3
"""
Gera o .zip gerenciado para importação no Power Platform.
A ordem das entradas e o BOM nos XMLs de metadados são obrigatórios.
Execute após `npm run build` dentro do diretório do controle.
"""
import zipfile, os, sys

# ── Configuração ─────────────────────────────────────────────────────────────
CONTROL_DIR   = "NomeDoControle"          # pasta do controle (onde fica index.ts)
SOLUTION_DIR  = "PCFSolution"
NAMESPACE     = "NomeNamespace"
CONSTRUCTOR   = "NomeControlName"
PUBLISHER_PFX = "pm"                      # prefixo do publisher
VERSION       = "1.0.0"

OUT_NAME = f"releases/{CONTROL_DIR}_{VERSION.replace('.','_')}_managed.zip"
CONTROL_NAME = f"{PUBLISHER_PFX}_{NAMESPACE}.{CONSTRUCTOR}"
CONTROLS_PATH = f"Controls/{CONTROL_NAME}"
# ─────────────────────────────────────────────────────────────────────────────

BOM = b'\xef\xbb\xbf'

def read(path):
    with open(path, "rb") as f:
        return f.read()

def content_types_xml(control_path):
    return f"""<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml"  ContentType="application/octet-stream"/>
  <Default Extension="js"   ContentType="application/octet-stream"/>
  <Default Extension="resx" ContentType="application/octet-stream"/>
  <Default Extension="txt"  ContentType="application/octet-stream"/>
  <Override PartName="/{control_path}/ControlManifest.xml"
            ContentType="application/octet-stream"/>
</Types>""".encode("utf-8")

def customizations_xml(namespace, constructor, publisher_pfx):
    schema = f"{publisher_pfx}_{namespace}.{constructor}"
    return f"""<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml version="9.0.0.207" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CustomControls>
    <CustomControl Name="{schema}" Version="{VERSION}">
      <FileName>{schema}</FileName>
    </CustomControl>
  </CustomControls>
</ImportExportXml>""".encode("utf-8")

os.makedirs("releases", exist_ok=True)
out_dir = f"{CONTROL_DIR}/out/controls"

entries = [
    # OBRIGATÓRIO: customizations.xml é a PRIMEIRA entrada
    ("customizations.xml", BOM + customizations_xml(NAMESPACE, CONSTRUCTOR, PUBLISHER_PFX)),
    (f"{SOLUTION_DIR}/Other/Solution.xml",
     BOM + read(f"{SOLUTION_DIR}/Other/Solution.xml").lstrip(b'\xef\xbb\xbf')),
    (f"{CONTROLS_PATH}/ControlManifest.xml", read(f"{out_dir}/ControlManifest.xml")),
    (f"{CONTROLS_PATH}/bundle.js",           read(f"{out_dir}/bundle.js")),
]

license_path = f"{out_dir}/bundle.js.LICENSE.txt"
if os.path.exists(license_path):
    entries.append((f"{CONTROLS_PATH}/bundle.js.LICENSE.txt", read(license_path)))

resx_path = f"{out_dir}/strings/{CONSTRUCTOR}.1033.resx"
if os.path.exists(resx_path):
    entries.append((f"{CONTROLS_PATH}/strings/{CONSTRUCTOR}.1033.resx", read(resx_path)))

# OBRIGATÓRIO: [Content_Types].xml é a ÚLTIMA entrada
entries.append(("[Content_Types].xml", content_types_xml(CONTROLS_PATH)))

with zipfile.ZipFile(OUT_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
    for name, data in entries:
        zf.writestr(name, data)

print(f"Gerado: {OUT_NAME}")
print("Entradas:")
with zipfile.ZipFile(OUT_NAME) as zf:
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

## Checklist para cada nova versão

Antes de gerar o `.zip` e publicar:

- [ ] Subir versão em **dois** lugares (devem ser idênticas):
  - `ControlManifest.Input.xml` → atributo `version` (ex: `1.1.6`)
  - `PCFSolution/Other/Solution.xml` → `<Version>` (ex: `1.1.6.0`)
- [ ] `npm run build` dentro da pasta do controle
- [ ] Confirmar que o bundle não contém `eval(`: `grep -c "eval(" out/controls/bundle.js` → deve ser **0**
- [ ] Confirmar `control-type=virtual` no ControlManifest.xml gerado
- [ ] Executar `python3 pack.py`
- [ ] Verificar as entradas do zip (ordem: customizations.xml PRIMEIRO, [Content_Types].xml ÚLTIMO)
- [ ] Testar em Canvas App real (não só no harness — o harness não reproduz as restrições do Canvas)
- [ ] Atualizar `CHANGELOG.md`
- [ ] Atualizar `releases/..._latest_managed.zip` para apontar para a nova versão

---

## Gotchas que vão te morder se esquecer

| Situação | Causa | Solução |
|---|---|---|
| "Não foi possível importar os componentes" no Canvas | `control-type="standard"` ou solução não-gerenciada | Trocar para `virtual` + `Managed=1` |
| Importação fica em 0% "Não Processado" | Estrutura do zip fora do padrão | Usar este script de empacotamento |
| "Custom Control already created by another publisher" | Registro órfão no Dataverse de import anterior que falhou | Renomear namespace ou remover o registro órfão |
| Labels aparecem como chave (ex: `Control_DisplayName`) | Arquivo `.resx` registrado no idioma errado | Renomear para o código do idioma habilitado no ambiente (geralmente `1033`) |
| Mapa/canvas renderiza só em pedaço pequeno | Leaflet cacheia viewport no init; Canvas entrega `0x0` primeiro | `ResizeObserver` + `invalidateSize()` (veja template index.ts) |
| "Error loading control" ao reabrir o app | `_leaflet_id` órfão no DOM de mount anterior | Detectar e limpar `_leaflet_id` antes de criar nova instância |
| Bundle quebra no Canvas (funciona no harness) | Build de desenvolvimento usa `eval()`, bloqueado por CSP | Sempre `--buildMode production` |
| Imagens (pins, tiles extras) sumindo no bundle | `import "lib.css"` faz webpack extrair arquivos de imagem | Não importar CSS via webpack; injetar via `<style>` em JS |

---

## Fluxo resumido do zero ao funcionando

```bash
# 1. Criar o projeto PCF
pac pcf init --namespace MeuNamespace --name MeuControle --template reactcomponent
# ou: npx pcf-scripts init ...

# 2. Instalar dependências extras que precisar
cd MeuControle && npm install

# 3. Aplicar os templates acima (manifest, index.ts, Solution.xml)
# 4. Desenvolver com hot reload
npm run start:watch

# 5. Build de produção
npm run build

# 6. Empacotar
cd .. && python3 pack.py

# 7. Importar o .zip no Power Platform e testar em Canvas App real
```
