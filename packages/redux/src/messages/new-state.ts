import { newState } from '../constants'

type NewStateMessage<A extends any = any> = {
  type: typeof newState
  payload: A
}

export const createNewStateMessage = <A>(state: A): NewStateMessage<A> => ({
  type: newState,
  payload: state,
})

export const isNewStateMesssage = (input: any): input is NewStateMessage => {
  if (!input) return false
  if (typeof input !== 'object') return false
  if (input.type !== newState) return false
  if (typeof input.payload === 'undefined') return false
  return true
}
