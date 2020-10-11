import { reply } from '../constants'

type SuccessReply = {
  type: typeof reply
  meta: string
  payload: any
  error: false
}

type ErrorReply = {
  type: typeof reply
  meta: string
  payload: string
  error: true
}

type Reply = SuccessReply | ErrorReply

export const createReplyMessage = (
  dispatchId: string,
  result: any,
): SuccessReply | ErrorReply => ({
  type: reply,
  meta: dispatchId,
  payload: result instanceof Error ? result.toString() : result,
  error: result instanceof Error,
})

export const isReplyMessage = (input: any): input is Reply => {
  if (!input) return false
  if (typeof input !== 'object') return false
  if (input.type !== reply) return false
  if (typeof input.meta !== 'string') return false
  return true
}
