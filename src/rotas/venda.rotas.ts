import { Router } from "express";
import { consultarRelatorioDeVendas, receberWebhookDeVenda } from "../controladores/venda.controlador";

export const rotasDeVenda = Router();

rotasDeVenda.post("/webhooks/vendas", receberWebhookDeVenda);
rotasDeVenda.get("/relatorios/vendas", consultarRelatorioDeVendas);
