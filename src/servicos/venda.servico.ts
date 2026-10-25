import { Prisma, StatusVenda } from "@prisma/client";
import { prisma } from "../banco/prisma";

type DadosVenda = {
  idTransacao: string;
  status: StatusVenda;
  valor: number;
  emailCliente: string;
  dataCriacao?: Date;
};

function ehConflitoDeTransacao(erro: unknown): boolean {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") {
    return false;
  }

  const alvo = erro.meta?.target;
  return Array.isArray(alvo)
    ? alvo.includes("idTransacao")
    : typeof alvo === "string" && alvo.includes("idTransacao");
}

export async function registrarVenda(dados: DadosVenda): Promise<boolean> {
  const vendaExistente = await prisma.venda.findUnique({
    where: { idTransacao: dados.idTransacao },
    select: { id: true }
  });

  if (vendaExistente) {
    return false;
  }

  try {
    await prisma.venda.create({ data: dados });
    return true;
  } catch (erro) {
    if (ehConflitoDeTransacao(erro)) {
      return false;
    }

    throw erro;
  }
}

export async function obterRelatorioDeVendas() {
  const [quantidadeVendas, agregadosAprovados, ultimasVendas] = await Promise.all([
    prisma.venda.count(),
    prisma.venda.aggregate({
      where: { status: StatusVenda.APROVADO },
      _sum: { valor: true },
      _avg: { valor: true }
    }),
    prisma.venda.findMany({
      orderBy: { dataCriacao: "desc" },
      take: 10,
      select: {
        id: true,
        idTransacao: true,
        status: true,
        valor: true,
        emailCliente: true,
        dataCriacao: true
      }
    })
  ]);

  return {
    quantidadeVendas,
    receitaTotal: agregadosAprovados._sum.valor?.toNumber() ?? 0,
    ticketMedio: agregadosAprovados._avg.valor?.toNumber() ?? 0,
    ultimasVendas: ultimasVendas.map((venda) => ({
      ...venda,
      valor: venda.valor.toNumber()
    }))
  };
}
