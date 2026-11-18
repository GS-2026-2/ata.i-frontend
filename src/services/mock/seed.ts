import type {
  Ata,
  Escola,
  PrioridadeAnual,
  Reuniao,
  UsuarioComCredencial,
} from "@/types/domain";

export interface MockDatabaseState {
  version: number;
  nextIds: {
    escola: number;
    usuario: number;
    prioridade: number;
    reuniao: number;
    ata: number;
    alteracao: number;
  };
  currentUserId: number | null;
  escolas: Escola[];
  usuarios: UsuarioComCredencial[];
  prioridades: PrioridadeAnual[];
  reunioes: Reuniao[];
  atas: Ata[];
}

export const MOCK_STATE_VERSION = 1;

export function createInitialMockState(): MockDatabaseState {
  const escolas: Escola[] = [
    {
      id: 1,
      nome: "EMEB Jardim das Flores",
      ativa: true,
      criadaEm: "2026-11-02T09:00:00-03:00",
      localizacao: "Jandira · São Paulo",
    },
    {
      id: 2,
      nome: "EMEB Parque dos Ipês",
      ativa: true,
      criadaEm: "2026-11-04T09:00:00-03:00",
      localizacao: "Jandira · São Paulo",
    },
    {
      id: 3,
      nome: "EMEB Vila Esperança",
      ativa: false,
      criadaEm: "2026-11-06T09:00:00-03:00",
      localizacao: "Jandira · São Paulo",
    },
  ];

  const usuarios: UsuarioComCredencial[] = [
    {
      id: 1,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      nome: "Ana Souza",
      email: "ana.souza@escola.edu.br",
      senha: "123456",
      tipo: "DIRETOR",
      ativo: true,
      criadoEm: "2026-11-02T09:30:00-03:00",
    },
    {
      id: 2,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      nome: "Bruno Lima",
      email: "bruno.lima@escola.edu.br",
      senha: "123456",
      tipo: "COORDENADOR",
      ativo: true,
      criadoEm: "2026-11-02T09:35:00-03:00",
    },
    {
      id: 3,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      nome: "Carla Santos",
      email: "carla.santos@escola.edu.br",
      senha: "123456",
      tipo: "PROFESSOR",
      ativo: true,
      criadoEm: "2026-11-02T09:40:00-03:00",
    },
    {
      id: 4,
      escolaId: null,
      escolaNome: null,
      nome: "Marina Costa",
      email: "marina.costa@escola.edu.br",
      senha: "123456",
      tipo: "SUPERADMIN",
      ativo: true,
      criadoEm: "2026-11-01T08:00:00-03:00",
    },
  ];

  const prioridades: PrioridadeAnual[] = [
    {
      id: 1,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      anoReferencia: 2026,
      descricao: "Reparar a cobertura do pátio",
      ordem: 1,
      ativa: true,
      ultimaDecisaoEm: "2026-11-08",
      ultimaAtaId: 2,
    },
    {
      id: 2,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      anoReferencia: 2026,
      descricao: "Renovar o acervo da biblioteca",
      ordem: 2,
      ativa: true,
      ultimaDecisaoEm: "2026-10-21",
      ultimaAtaId: 3,
    },
    {
      id: 3,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      anoReferencia: 2026,
      descricao: "Melhorar a conexão dos laboratórios",
      ordem: 3,
      ativa: true,
      ultimaDecisaoEm: "2026-09-15",
      ultimaAtaId: 4,
    },
  ];

  const reunioes: Reuniao[] = [
    {
      id: 1,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      criadaPorId: 1,
      criadaPorNome: "Ana Souza",
      titulo: "Conselho escolar — novembro",
      dataReuniao: "2026-11-13",
      anoReferencia: 2026,
      transcricao:
        "Diretora: detalhar o reparo da cobertura do pátio, mantendo a ordem 1.\n" +
        "Coordenador: manter a biblioteca em segundo e retirar a melhoria da conexão dos laboratórios da lista vigente.\n" +
        "Diretora: incluir também a adequação da rampa de acesso na ordem 3.",
      criadaEm: "2026-11-13T14:30:00-03:00",
      tipoConteudo: "TRANSCRICAO",
      situacaoFluxo: "EM_REVISAO",
    },
    {
      id: 2,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      criadaPorId: 1,
      criadaPorNome: "Ana Souza",
      titulo: "Melhorias de acessibilidade",
      dataReuniao: "2026-11-12",
      anoReferencia: 2026,
      transcricao:
        "Diretora: precisamos levantar os ajustes de sinalização tátil e corrimão nos corredores principais para a próxima pauta.",
      criadaEm: "2026-11-12T16:10:00-03:00",
      tipoConteudo: "TRANSCRICAO",
      situacaoFluxo: "RASCUNHO",
    },
    {
      id: 3,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      criadaPorId: 1,
      criadaPorNome: "Ana Souza",
      titulo: "Planejamento do pátio",
      dataReuniao: "2026-11-08",
      anoReferencia: 2026,
      transcricao:
        "Diretora: diante das chuvas recentes, a cobertura do pátio passa a ser a primeira prioridade da escola.",
      criadaEm: "2026-11-08T10:15:00-03:00",
      tipoConteudo: "TRANSCRICAO",
      situacaoFluxo: "CONFIRMADA",
    },
    {
      id: 4,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      criadaPorId: 2,
      criadaPorNome: "Bruno Lima",
      titulo: "Revisão do acervo literário",
      dataReuniao: "2026-10-21",
      anoReferencia: 2026,
      transcricao:
        "Coordenador: registramos a necessidade de renovar o acervo da biblioteca para atender os anos iniciais.",
      criadaEm: "2026-10-21T15:00:00-03:00",
      tipoConteudo: "ATA_PRONTA",
      situacaoFluxo: "CONFIRMADA",
      textoAtaEnviada:
        "Ata da reunião pedagógica de 21/10/2026.\n\nDeliberou-se incluir a renovação do acervo da biblioteca na ordem 2 das prioridades anuais.",
    },
    {
      id: 5,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      criadaPorId: 1,
      criadaPorNome: "Ana Souza",
      titulo: "Infraestrutura dos laboratórios",
      dataReuniao: "2026-09-15",
      anoReferencia: 2026,
      transcricao:
        "Diretora: incluir a melhoria da conexão dos laboratórios como terceira prioridade para o semestre.",
      criadaEm: "2026-09-15T11:20:00-03:00",
      tipoConteudo: "TRANSCRICAO",
      situacaoFluxo: "CONFIRMADA",
    },
    {
      id: 6,
      escolaId: 1,
      escolaNome: "EMEB Jardim das Flores",
      criadaPorId: 1,
      criadaPorNome: "Ana Souza",
      titulo: "Abertura do planejamento anual 2026",
      dataReuniao: "2026-02-12",
      anoReferencia: 2026,
      transcricao:
        "Diretora: definimos a cobertura do pátio como prioridade inicial da escola para o ano letivo de 2026.",
      criadaEm: "2026-02-12T09:00:00-03:00",
      tipoConteudo: "ATA_PRONTA",
      situacaoFluxo: "CONFIRMADA",
      textoAtaEnviada:
        "Ata de abertura do ano letivo de 12/02/2026.\n\nFicou registrada a manutenção da cobertura do pátio na lista anual de prioridades.",
    },
  ];

  const atas: Ata[] = [
    {
      id: 1,
      reuniaoId: 1,
      reuniaoTitulo: "Conselho escolar — novembro",
      escolaId: 1,
      anoReferencia: 2026,
      texto:
        "Em 13 de novembro de 2026, reuniu-se o conselho escolar da EMEB Jardim das Flores para revisar as prioridades de 2026.\n\n" +
        "Ficou deliberado manter o reparo da cobertura do pátio como primeira prioridade e a renovação da biblioteca em segundo lugar.\n\n" +
        "Foi proposta a adequação da rampa de acesso como terceira prioridade, substituindo a melhoria da conexão dos laboratórios.",
      status: "MINUTA",
      criadaEm: "2026-11-13T14:45:00-03:00",
      aprovadaEm: null,
      aprovadaPorId: null,
      aprovadaPorNome: null,
      origemDocumento: "TRANSCRICAO",
      alteracoes: [
        {
          id: 1,
          ataId: 1,
          prioridadeId: null,
          operacao: "INCLUIR",
          descricaoProposta: "Adequar a rampa de acesso",
          ordemProposta: 3,
          justificativa: "Melhorar a acessibilidade de alunos e visitantes.",
          trechoOrigem: "Incluir também a adequação da rampa de acesso na ordem 3.",
        },
        {
          id: 2,
          ataId: 1,
          prioridadeId: 1,
          operacao: "ATUALIZAR",
          descricaoProposta: "Reparar a cobertura do pátio",
          ordemProposta: 1,
          justificativa: "Detalhar escopo do reparo estrutural mantendo a prioridade máxima.",
          trechoOrigem: "Detalhar o reparo da cobertura do pátio, mantendo a ordem 1.",
        },
        {
          id: 3,
          ataId: 1,
          prioridadeId: 3,
          operacao: "REMOVER",
          descricaoProposta: "Melhorar a conexão dos laboratórios",
          ordemProposta: null,
          justificativa: "Demanda atendida parcialmente e substituída pela adequação de acessibilidade.",
          trechoOrigem: "Retirar a melhoria da conexão dos laboratórios da lista vigente.",
        },
      ],
    },
    {
      id: 2,
      reuniaoId: 3,
      reuniaoTitulo: "Planejamento do pátio",
      escolaId: 1,
      anoReferencia: 2026,
      texto:
        "Em 08 de novembro de 2026, o conselho escolar analisou os danos provocados pelas chuvas no pátio central.\n\n" +
        "Deliberou-se colocar o reparo da cobertura do pátio na ordem 1 das prioridades vigentes de 2026.",
      status: "APROVADA",
      criadaEm: "2026-11-08T10:30:00-03:00",
      aprovadaEm: "2026-11-08T11:15:00-03:00",
      aprovadaPorId: 1,
      aprovadaPorNome: "Ana Souza",
      origemDocumento: "TRANSCRICAO",
      alteracoes: [
        {
          id: 4,
          ataId: 2,
          prioridadeId: 1,
          operacao: "ATUALIZAR",
          descricaoProposta: "Reparar a cobertura do pátio",
          ordemProposta: 1,
          justificativa: "Urgência estrutural após período de chuvas intensas.",
          trechoOrigem: "A cobertura do pátio passa a ser a primeira prioridade da escola.",
          efeitoResumo: "Passou à ordem 1",
        },
      ],
    },
    {
      id: 3,
      reuniaoId: 4,
      reuniaoTitulo: "Revisão do acervo literário",
      escolaId: 1,
      anoReferencia: 2026,
      texto:
        "Ata da reunião pedagógica de 21/10/2026.\n\n" +
        "Deliberou-se incluir a renovação do acervo da biblioteca na ordem 2 das prioridades anuais de 2026.",
      status: "APROVADA",
      criadaEm: "2026-10-21T15:10:00-03:00",
      aprovadaEm: "2026-10-21T16:05:00-03:00",
      aprovadaPorId: 1,
      aprovadaPorNome: "Ana Souza",
      origemDocumento: "ATA_PRONTA",
      alteracoes: [
        {
          id: 5,
          ataId: 3,
          prioridadeId: 2,
          operacao: "INCLUIR",
          descricaoProposta: "Renovar o acervo da biblioteca",
          ordemProposta: 2,
          justificativa: "Atualizar livros didáticos e literários para os anos iniciais.",
          trechoOrigem: "Incluir a renovação do acervo da biblioteca na ordem 2.",
          efeitoResumo: "Entrou na ordem 2",
        },
      ],
    },
    {
      id: 4,
      reuniaoId: 5,
      reuniaoTitulo: "Infraestrutura dos laboratórios",
      escolaId: 1,
      anoReferencia: 2026,
      texto:
        "Em 15 de setembro de 2026, a gestão e o corpo docente avaliaram a conectividade dos laboratórios de informática.\n\n" +
        "Ficou aprovada a inclusão da melhoria da conexão dos laboratórios na ordem 3.",
      status: "APROVADA",
      criadaEm: "2026-09-15T11:30:00-03:00",
      aprovadaEm: "2026-09-15T12:10:00-03:00",
      aprovadaPorId: 1,
      aprovadaPorNome: "Ana Souza",
      origemDocumento: "TRANSCRICAO",
      alteracoes: [
        {
          id: 6,
          ataId: 4,
          prioridadeId: 3,
          operacao: "INCLUIR",
          descricaoProposta: "Melhorar a conexão dos laboratórios",
          ordemProposta: 3,
          justificativa: "Estabilizar o acesso à internet durante aulas práticas.",
          trechoOrigem: "Incluir a melhoria da conexão dos laboratórios como terceira prioridade.",
          efeitoResumo: "Entrou na ordem 3",
        },
      ],
    },
    {
      id: 5,
      reuniaoId: 6,
      reuniaoTitulo: "Abertura do planejamento anual 2026",
      escolaId: 1,
      anoReferencia: 2026,
      texto:
        "Ata de abertura do ano letivo de 12/02/2026.\n\n" +
        "Ficou registrada a manutenção da cobertura do pátio na lista anual de prioridades.",
      status: "APROVADA",
      criadaEm: "2026-02-12T09:15:00-03:00",
      aprovadaEm: "2026-02-12T10:00:00-03:00",
      aprovadaPorId: 1,
      aprovadaPorNome: "Ana Souza",
      origemDocumento: "ATA_PRONTA",
      alteracoes: [
        {
          id: 7,
          ataId: 5,
          prioridadeId: 1,
          operacao: "INCLUIR",
          descricaoProposta: "Reparar a cobertura do pátio",
          ordemProposta: 1,
          justificativa: "Manutenção preventiva inicial do prédio escolar.",
          trechoOrigem: "Manutenção da cobertura do pátio na lista anual de prioridades.",
          efeitoResumo: "Entrou na ordem 1",
        },
      ],
    },
  ];

  return {
    version: MOCK_STATE_VERSION,
    nextIds: {
      escola: 4,
      usuario: 5,
      prioridade: 4,
      reuniao: 7,
      ata: 6,
      alteracao: 8,
    },
    currentUserId: null,
    escolas,
    usuarios,
    prioridades,
    reunioes,
    atas,
  };
}
