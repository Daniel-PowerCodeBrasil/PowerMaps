# 📦 Guia de Instalação

Este guia cobre a importação do **PowerMaps HeatMapControl** em um ambiente do
Power Platform e a inserção dele em um Canvas App.

---

## Pré-requisitos

- Um ambiente do **Power Platform** com permissão para importar soluções.
- **Componentes de código (PCF) habilitados** no ambiente. Eles já vêm ativos na
  maioria dos ambientes; se precisar verificar:
  - **Centro de administração do Power Platform** → seu ambiente → **Configurações**
    → **Produto** → **Recursos** → ative **"Permitir publicação de componentes de código do Power Apps"**.

---

## Passo 1 — Baixar o pacote

Baixe o pacote gerenciado mais recente da pasta de releases:

```
releases/PowerMaps_HeatMapControl_latest_managed.zip
```

> Esse é o mesmo arquivo da versão estável atual (hoje, `1.2.0`). Cada versão
> também fica disponível com o número no nome, ex.: `PowerMaps_HeatMapControl_1_2_0_0_managed.zip`.

---

## Passo 2 — Importar a solução

1. Acesse [make.powerapps.com](https://make.powerapps.com).
2. Confirme, no topo direito, que está no **ambiente correto**.
3. Menu lateral → **Soluções**.
4. Clique em **Importar solução** (barra superior).
5. **Procurar** → selecione o `.zip` baixado → **Avançar** → **Importar**.
6. Aguarde a mensagem de sucesso. Pode levar de alguns segundos a alguns minutos.

✅ Quando terminar, você verá a solução **PowerMaps** na lista, com status
**"Processado"** / importação concluída.

> ♻️ **Atualizando de uma versão anterior?** Se você já tem uma versão instalada,
> recomendo **excluir a solução PowerMaps antiga** antes de importar a nova — isso
> evita conflitos de cache do componente no editor do Canvas. Soluções → PowerMaps
> → **Excluir**, e então importe a nova.

---

## Passo 3 — Inserir no Canvas App

1. Abra (ou crie) seu **Canvas App** para edição.
2. Barra superior → **Inserir** → **Obter mais componentes**.
3. Abra a aba **Código**.
4. Selecione **HeatMapControl** (nome de exibição: **"Mapa de Calor"**) → **Importar**.
5. Agora ele aparece na lista de **Inserir → Código**. Clique para adicionar na tela.

---

## Passo 4 — Dimensionar e alimentar com dados

Com o controle selecionado na tela:

1. Faça o mapa preencher o espaço desejado (na **barra de fórmulas**, escolha a
   propriedade e digite o valor):
   ```powerfx
   Width  = Parent.Width
   Height = Parent.Height
   X      = 0
   Y      = 0
   ```
2. Defina `occurrencesJson` com seus pontos. Um exemplo pronto para colar:
   ```powerfx
   "[{""lat"":-22.2171,""lng"":-49.9501,""weight"":1,""label"":""Centro""},{""lat"":-22.2210,""lng"":-49.9450,""weight"":1,""label"":""Bairro A""},{""lat"":-22.2130,""lng"":-49.9560,""weight"":1,""label"":""Bairro B""}]"
   ```

➡️ Para alimentar com dados reais (Dataverse, SharePoint, Collections), veja **[USO.md](USO.md)**.

---

## Deu algum erro?

A página **[SOLUCAO-DE-PROBLEMAS.md](SOLUCAO-DE-PROBLEMAS.md)** lista os erros mais
comuns de importação e o que cada um significa — incluindo o famoso
*"Não foi possível importar os componentes"*.
