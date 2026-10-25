import "dotenv/config";
import { z } from "zod";
import { aplicacao } from "./aplicacao";

const configuracao = z.object({
  PORTA: z.coerce.number().int().positive().default(3000),
  X_SEGREDO_WEBHOOK: z.string().min(1),
  DATABASE_URL: z.string().url()
}).parse(process.env);

aplicacao.listen(configuracao.PORTA, () => {
  console.log(`API de vendas disponivel na porta ${configuracao.PORTA}`);
});
