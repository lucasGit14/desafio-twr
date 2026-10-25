import express, { ErrorRequestHandler } from "express";
import { rotasDeVenda } from "./rotas/venda.rotas";

export const aplicacao = express();

aplicacao.use(express.json());
aplicacao.use(rotasDeVenda);

const tratarErro: ErrorRequestHandler = (erro, _requisicao, resposta, _proximo) => {
  console.error("Falha ao processar requisicao:", erro);
  resposta.status(500).json({ erro: "Erro interno do servidor" });
};

aplicacao.use(tratarErro);
