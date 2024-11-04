import { Router } from "express";
import {
  buscarTarefaPorSituacao,
  create,
  getAll,
  getTarefa,
  updateStatusTarefa,
  updateTarefa,
} from "../controllers/tarefaController.js";

const router = Router();

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getTarefa);
router.put("/:id", updateTarefa);
router.patch("/:id/status", updateStatusTarefa);
router.get("/status/:situacao", buscarTarefaPorSituacao);

export default router;
