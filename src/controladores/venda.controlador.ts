import { StatusVenda } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { obterRelatorioDeVendas, registrarVenda } from "../servicos/venda.servico";

const esquemaVenda = z.object({
  idTransacao: z.string().trim().min(1),
  status: z.enum(StatusVenda),
  valor: z.number().finite().positive(),
  emailCliente: z.string().trim().email(),
  dataCriacao: z.string().datetime().optional().transform((data) => data ? new Date(data) : undefined)
}).strict();

export async function receberWebhookDeVenda(requisicao: Request, resposta: Response): Promise<void> {
  if (requisicao.header("x-segredo-webhook") !== process.env.X_SEGREDO_WEBHOOK) {
    resposta.status(401).json({ erro: "Segredo do webhook invalido" });
    return;
  }

  const resultado = esquemaVenda.safeParse(requisicao.body);

  if (!resultado.success) {
    resposta.status(400).json({
      erro: "Payload invalido",
      detalhes: resultado.error.flatten()
    });
    return;
  }

  const vendaRegistrada = await registrarVenda(resultado.data);

  resposta.status(vendaRegistrada ? 201 : 200).json({
    mensagem: vendaRegistrada ? "Venda recebida" : "Transacao ja recebida",
    duplicada: !vendaRegistrada
  });
}

export async function consultarRelatorioDeVendas(_requisicao: Request, resposta: Response): Promise<void> {
  const relatorio = await obterRelatorioDeVendas();
  resposta.status(200).json(relatorio);
}
