import {
  OAIBuildFunctionParams,
  OAIBuildMessageBasedParams,
  OAIBuildToolFunctionParams
} from "@/oai/params"
import OpenAI from "openai"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

import { MODE, ModeParamsReturnType } from "@/constants/modes"

import { Mode, ResponseModel } from "./types"

export function withResponseModel<
  T extends z.AnyZodObject,
  M extends Mode,
  P extends OpenAI.ChatCompletionCreateParams
>({
  response_model: { name, schema, description = "" },
  mode,
  params
}: {
  response_model: ResponseModel<T>
  mode: M
  params: P
}): ModeParamsReturnType<P, M> {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").replace(/\s/g, "_")

  const { definitions } = zodToJsonSchema(schema, {
    name: safeName,
    errorMessages: true
  })

  if (!definitions || !definitions?.[safeName]) {
    console.warn("Could not extract json schema definitions from your schema", schema)
    throw new Error("Could not extract json schema definitions from your schema")
  }

  const definition = {
    name: safeName,
    description,
    ...definitions[safeName]
  }
  if (mode === MODE.FUNCTIONS) {
    return OAIBuildFunctionParams<P>(definition, params) as ModeParamsReturnType<P, M>
  }

  if (mode === MODE.TOOLS) {
    return OAIBuildToolFunctionParams<P>(definition, params) as ModeParamsReturnType<P, M>
  }

  return OAIBuildMessageBasedParams<P>(definition, params, mode) as ModeParamsReturnType<P, M>
}
