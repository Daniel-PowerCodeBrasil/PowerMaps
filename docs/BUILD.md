# 🛠️ Build & Empacotamento

Como compilar o componente e gerar o pacote `.zip` gerenciado pronto para importar.

---

## Pré-requisitos

- **Node.js** (LTS recomendado) e **npm**
- **Python 3** (usado pelo script de empacotamento do `.zip`)
- Opcional: [**Power Platform CLI** (`pac`)](https://learn.microsoft.com/power-platform/developer/cli/introduction)
  para o fluxo oficial de solução

---

## Compilar o componente

```bash
cd HeatMapControl
npm install
npm run build        # build de PRODUÇÃO (minificado, sem eval)
```

> ⚠️ Sempre use o build de produção para empacotar. O build de desenvolvimento
> embrulha módulos em `eval()`, que o Canvas App bloqueia via CSP. O `npm run build`
> deste projeto já está configurado com `--buildMode production`.

A saída fica em `HeatMapControl/out/controls/`:

```
out/controls/
├── ControlManifest.xml
├── bundle.js
├── bundle.js.LICENSE.txt
└── strings/HeatMapControl.1033.resx
```

### Verificações rápidas de sanidade

```bash
# Não pode haver eval() no bundle final:
grep -c "eval(" out/controls/bundle.js          # deve imprimir 0

# Deve ser virtual + React:
grep "control-type" out/controls/ControlManifest.xml
```

---

## Gerar o `.zip` gerenciado

O pacote precisa de uma estrutura **muito específica** (a ordem das entradas importa,
os XML precisam de BOM, e `[Content_Types].xml` vem por último). Por isso o `.zip` é
montado por um script, e não pela ferramenta padrão.

Os arquivos-fonte da solução estão em:

- `PCFSolution/Other/Solution.xml` — versão, publisher (`pm`), `RootComponent`
- O `customizations.xml` e o `[Content_Types].xml` são gerados pelo script

### Estrutura final do pacote

```
PowerMaps_HeatMapControl_x_y_z_managed.zip
├── customizations.xml          ← PRIMEIRA entrada (com BOM)
├── solution.xml                ← com BOM, <Managed>1</Managed>
├── Controls/pm_PowerMapsBR.HeatMapControl/
│   ├── ControlManifest.xml
│   ├── bundle.js
│   ├── bundle.js.LICENSE.txt
│   └── strings/HeatMapControl.1033.resx
└── [Content_Types].xml         ← ÚLTIMA entrada
```

### Checklist antes de publicar uma nova versão

1. Subir a versão em **dois** lugares (devem bater):
   - `HeatMapControl/ControlManifest.Input.xml` → atributo `version` (ex.: `1.1.6`)
   - `PCFSolution/Other/Solution.xml` → `<Version>` (ex.: `1.1.6.0`)
2. `npm run build` (produção).
3. Montar o `.zip` (script de empacotamento).
4. Conferir o conteúdo:
   ```bash
   python3 -c "import zipfile; z=zipfile.ZipFile('releases/....zip'); [print(i) for i in z.namelist()]"
   ```
5. Confirmar: `control-type=virtual`, `<Managed>1</Managed>`, `eval` = 0.
6. Colocar o `.zip` em `releases/` e atualizar `releases/..._latest_managed.zip`.
7. Registrar a mudança no [CHANGELOG.md](../CHANGELOG.md).

---

## Desenvolvimento com hot reload

Para iterar rápido sem reimportar a cada mudança:

```bash
npm run start:watch
```

Isso abre o **PCF Test Harness** local (fora do Canvas). Útil para a lógica do mapa,
mas lembre-se: o harness **não reproduz** as restrições do Canvas (CSP, virtual/React,
dimensionamento). O teste final é sempre dentro de um Canvas App real.
