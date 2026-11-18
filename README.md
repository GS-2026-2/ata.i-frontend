# ATA.I — Frontend

Interface web do **ATA.I** (copiloto de gestão escolar para prioridades anuais, reuniões, minutas e atas), desenvolvida em **Next.js**, **TypeScript** e **Tailwind CSS** a partir dos protótipos no Figma, com persistência local mockada (`localStorage`) e camada preparada para integração futura com o `ata.i-backend`.

## Como executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

### Scripts disponíveis

- `npm run dev` — servidor de desenvolvimento
- `npm run typecheck` — verificação de tipos TypeScript (`tsc --noEmit`)
- `npm run lint` — análise estática com ESLint
- `npm run build` — build de produção Next.js

## Contas de demonstração (modo mock)

Senha padrão de todas as contas iniciais: `123456`.

| Perfil | Usuário | E-mail | Escopo |
|---|---|---|---|
| **Diretor** | Ana Souza | `ana.souza@escola.edu.br` | EMEB Jardim das Flores (fluxo completo + confirmação) |
| **Coordenador** | Bruno Lima | `bruno.lima@escola.edu.br` | EMEB Jardim das Flores (registra e revisa; não confirma) |
| **Professor** | Carla Santos | `carla.santos@escola.edu.br` | EMEB Jardim das Flores (somente consulta) |
| **Superadmin** | Marina Costa | `marina.costa@escola.edu.br` | Administração global de escolas e usuários |

Também é possível acessar `/demo` (ou clicar em **Roteiros demo** no cabeçalho / **Ver roteiros →** no login) para acionar diretamente os 8 cenários do protótipo e resetar os dados do `localStorage`.

## Integração futura com o backend

Toda a comunicação de dados passa pela interface `DataProvider` (`src/services/data-provider.ts`), selecionada via variável de ambiente (`NEXT_PUBLIC_DATA_MODE`):

- `NEXT_PUBLIC_DATA_MODE=mock` (padrão): usa `MockDataProvider` com persistência em `localStorage` (`atai_mock_state_v1`).
- `NEXT_PUBLIC_DATA_MODE=api`: usa `ApiDataProvider` apontando para `NEXT_PUBLIC_API_BASE_URL` (padrão `http://localhost:8080`) nos endpoints REST `/api/*` do `ata.i-backend`.
