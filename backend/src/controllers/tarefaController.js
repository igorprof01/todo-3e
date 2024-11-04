import Tarefa from "../models/tarefaModel.js";
import { z } from "zod";
import formatZodError from "../helpers/formatZodError.js";

//Validações com ZOD
const createSchema = z.object({
  tarefa: z
    .string()
    .min(3, { message: "A tarefa deve ter pelo menos 3 caracteres" })
    .transform((txt) => txt.toLowerCase()),
  descricao: z
    .string()
    .min(5, { message: "A Descrição deve ter pelo menos 5 caracteres" }),
});

const getSchema = z.object({
  id: z.string().uuid({ message: "Id da tarefa está inválido" }),
});

const buscarTarefaPorSituacaoSchema = z.object({
  situacao: z.enum(["pendente", "concluida"]),
});

const updateTarefaSchema = z.object({
  tarefa: z
    .string()
    .min(3, { message: "A tarefa deve ter pelo menos 3 caracterez" })
    .transform((txt) => txt.toLowerCase()),
  descricao: z
    .string()
    .min(3, { message: "A Descricao deve ter pelo menos 5 caracterez" }),
  situacao: z.enum(["pendente", "concluida"]),
});

//tarefas?page=1&limit=10
export const getAll = async (request, response) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const tarefas = await Tarefa.findAndCountAll({
      limit,
      offset,
    });

    const totalPaginas = Math.ceil(tarefas.count / limit);
    response.status(200).json({
      totalTarefas: tarefas.count,
      totalPaginas,
      paginaAtual: page,
      itemsPorPagina: limit,
      proximaPagina:
        totalPaginas === 0
          ? null
          : `http://localhost:3333/tarefas?page=${page + 1}`,
      tarefas: tarefas.rows,
    });
  } catch (error) {
    response.status(500).json({ message: "Erro ao buscar Tarefas" });
  }
};

//Precisa de validação - OK
export const create = async (request, response) => {
  //implementar a validação
  const bodyValidation = createSchema.safeParse(request.body);
  // console.log(bodyValidation)
  if (!bodyValidation.success) {
    response.status(400).json({
      message: "Os dados recebidos do corpo da requisição são inválidos",
      detalhes: formatZodError(bodyValidation.error),
    });
    return;
  }

  const { tarefa, descricao } = request.body;
  const status = "pendente";

  const novaTarefa = {
    tarefa,
    descricao,
    status,
  };

  try {
    await Tarefa.create(novaTarefa);
    response.status(201).json({ message: "Tarefa Cadastrada" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Erro ao cadastrar tarefa" });
  }
};

//Precisa de validação - OK
export const getTarefa = async (request, response) => {
  const paramValidator = getSchema.safeParse(request.params);
  if (!paramValidator.success) {
    response.status(400).json({
      message: "Número de identificação está inválido",
      detalhes: formatZodError(paramValidator.error),
    });
    return;
  }

  const { id } = request.params;

  try {
    // const tarefa = await Tarefa.findByPk(id) OBJETO
    const tarefa = await Tarefa.findOne({ where: { id } });
    if (tarefa === null) {
      response.status(404).json({ message: "Tarefa não encontrada" });
      return;
    }
    response.status(200).json(tarefa);
  } catch (error) {
    response.status(500).json({ message: "Erro ao buscar tarefa" });
  }
};

//Precisa de validação -
export const updateTarefa = async (request, response) => {

  const paramValidator = getSchema.safeParse(request.params);
  if (!paramValidator.success) {
    response.status(400).json({
      message: "Número de identificação está inválido",
      detalhes: formatZodError(paramValidator.error),
    });
    return;
  }

  const updateValidator = updateTarefaSchema.safeParse(request.body)
  if(!updateValidator.success){
    response.status(400).json({
      message:"Dados para atualização estão incorretos",
      details: formatZodError(updateValidator.error)
    })
    return
  }

  const { id } = request.params;
  const { tarefa, descricao, status } = request.body;

  const tarefaAtualizada = {
    tarefa,
    descricao,
    status,
  };

  try {
    const [linhasAfetadas] = await Tarefa.update(tarefaAtualizada, {
      where: { id },
    });

    if (linhasAfetadas <= 0) {
      response.status(404).json({ message: "Tarefa não encontrada" });
      return;
    }
    response.status(200).json({ message: "Tarefa Atualizada" });
  } catch (error) {
    response.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
};

//Precisa de validação
export const updateStatusTarefa = async (request, response) => {
  
  const paramValidator = getSchema.safeParse(request.params);
  if (!paramValidator.success) {
    response.status(400).json({
      message: "Número de identificação está inválido",
      detalhes: formatZodError(paramValidator.error),
    });
    return;
  }
  
  const { id } = request.params;

  try {
    const tarefa = await Tarefa.findOne({ raw: true, where: { id } });
    if (tarefa === null) {
      response.status(404).json({ message: "Tarefa não encontrada" });
      return;
    }

    if (tarefa.status === "pendente") {
      await Tarefa.update({ status: "concluida" }, { where: { id } });
    } else if (tarefa.status === "concluida") {
      await Tarefa.update({ status: "pendente" }, { where: { id } });
    }

    const tarefaAtualizada = await Tarefa.findOne({ raw: true, where: { id } });
    response.status(200).json(tarefaAtualizada);
  } catch (error) {
    console.error(error);
    response.status(500).json({ err: "Erro ao atualizar tarefa" });
  }
};

//validação - //Precisa de validação
export const buscarTarefaPorSituacao = async (request, response) => {

  const situacaoValidation = buscarTarefaPorSituacaoSchema.safeParse(request.params)
  if(!situacaoValidation.success){
    response.status(400).json({
      message:"Situação inválida",
      details: formatZodError(situacaoValidation.error)
    })
    return
  }

  const { situacao } = request.params;
  if (situacao !== "pendente" && situacao !== "concluida") {
    response.status(400).json({
      message: "Situação inválida. Use 'pendente' ou 'concluida'",
    });
    return;
  }

  try {
    const tarefas = await Tarefa.findAll({
      where: { status: situacao },
      raw: true,
    });

    response.status(200).json(tarefas);
  } catch (error) {
    response.status(500).json({ err: "Erro ao buscar tarefas" });
  }
};
