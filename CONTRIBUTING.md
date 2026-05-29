# Contribuindo

Que bom que você quer contribuir! 🎉 Este é um projeto pequeno e prático, então o
processo é leve.

## Como ajudar

- 🐛 **Achou um bug?** Abra uma _issue_ descrevendo o que aconteceu, o que você
  esperava, e — se possível — um `occurrencesJson` de exemplo e a versão usada.
- 💡 **Tem uma ideia?** Issues com a tag de sugestão são muito bem-vindas. Veja o
  _roadmap_ no [README](README.md) para não duplicar.
- 🔧 **Quer mandar código?** Siga o fluxo abaixo.

## Fluxo de Pull Request

1. Faça um _fork_ e crie um _branch_ a partir do principal.
2. Rode o componente localmente:
   ```bash
   cd HeatMapControl
   npm install
   npm run start:watch
   ```
3. Faça sua mudança. Mantenha o estilo do código existente (TypeScript, sem
   dependências novas sem necessidade real).
4. **Teste dentro de um Canvas App real**, não só no harness — o harness não
   reproduz as restrições do Canvas (veja [docs/SOLUCAO-DE-PROBLEMAS.md](docs/SOLUCAO-DE-PROBLEMAS.md)).
5. Se mudou comportamento ou propriedades, atualize a documentação relevante e o
   [CHANGELOG.md](CHANGELOG.md).
6. Abra o PR explicando **o quê** e **por quê**.

## Subindo versão

Se a sua mudança gera um novo pacote, lembre de subir a versão nos dois lugares
(devem bater) e seguir o checklist em [docs/BUILD.md](docs/BUILD.md):

- `HeatMapControl/ControlManifest.Input.xml` → `version`
- `PCFSolution/Other/Solution.xml` → `<Version>`

## Código de conduta

Seja gentil. Trate os outros como gostaria de ser tratado. É só isso. 🤝
