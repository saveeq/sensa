import schema from "./ai-schema.json"
import Ajv from "ajv" 

const ajv = new Ajv()

export const validateAIResult = (data: unknown) => {
  const validate = ajv.compile(schema)
  const valid = validate(data)

  if (!valid) {
    throw new Error("AI response does not match schema")
  }

  return data
}