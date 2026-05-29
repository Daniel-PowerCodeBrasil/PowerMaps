# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue, de forma leve, o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e o versionamento segue o [SemVer](https://semver.org/lang/pt-BR/).

---

## [1.1.5] — 2026-05-29

### Corrigido
- **Renderização parcial do mapa** ao redimensionar o container. O Leaflet
  guarda o tamanho do viewport no momento da criação, e o Canvas/PCF só entrega
  o tamanho final *depois* da inicialização (`allocatedWidth/Height` vinha 0 no
  primeiro render). Adicionado um `ResizeObserver` no elemento real do mapa, que
  chama `invalidateSize()` sempre que o container muda de tamanho de verdade.
- Adicionados "empurrõezinhos" escalonados (`setTimeout` em 0/100/300/600/1000 ms)
  para hosts onde o layout só estabiliza após o primeiro callback do observer.
- Div interno do mapa agora usa `position:absolute; inset:0` para que
  `clientWidth/Height` reflitam sempre o tamanho real do wrapper.

## [1.1.4] — 2026-05-29

### Corrigido
- Wrapper voltou para `position:relative; overflow:hidden`. O `position:absolute`
  fazia o mapa "escapar" visualmente dos limites do controle no editor do Canvas.

## [1.1.3] — 2026-05-29

### Corrigido
- Mapa agora ocupa 100% do container independentemente do `allocatedWidth/Height`.

## [1.1.2] — 2026-05-29

### Corrigido
- **Erro ao reabrir o app** ("Error loading control"). O `destroy()` agora limpa
  o mapa explicitamente, e na remontagem o código detecta um `_leaflet_id` órfão
  e remove a instância anterior antes de criar uma nova.
### Removido
- Rodapé de atribuição "© OpenStreetMap / Leaflet" (`attributionControl: false`).

## [1.1.1] — 2026-05-29

### Alterado
- **Gradiente repensado para mapas de incidentes**: amarelo → laranja → vermelho
  (sem azul/verde), para que pontos isolados ainda apareçam.
- `heatRadius` padrão de `25` → `50` (halo visível por ponto).
### Adicionado
- Propriedades `heatBlur` e `heatIntensity` para ajuste fino do calor.

## [1.1.0] — 2026-05-29

### Adicionado
- **Versão completa funcional**: mapa de calor + marcadores com Leaflet, sobre a
  base que finalmente importa no Canvas (virtual + React + gerenciado).
- 8 propriedades de entrada e parsing de JSON de ocorrências.

## [1.0.10] — 2026-05-28

### Alterado
- 🔑 **Descoberta-chave**: convertido para `control-type="virtual"` com
  `<platform-library name="React" />`. Esse era o último bloqueio do import no Canvas.

## [1.0.6 – 1.0.9] — 2026-05-28

Série de builds de diagnóstico que isolaram, um a um, os requisitos do Canvas:
build de produção (sem `eval`), CSS injetado via JS, idioma do `.resx` (1033),
e empacotamento como solução **gerenciada** (`Managed=1`).

## [1.0.2 – 1.0.5] — 2026-05-28

Primeiras correções de empacotamento: ordem das entradas no `.zip`, BOM nos XML,
prefixo do publisher no `schemaName`, `external-service-usage` e renomeação do
namespace para evitar colisão com registro órfão no Dataverse.

---

> 📚 A história completa por trás de cada uma dessas versões — com o "porquê" de
> cada decisão — está em [docs/SOLUCAO-DE-PROBLEMAS.md](docs/SOLUCAO-DE-PROBLEMAS.md).
