import { dispatch } from '../constants'

type WrappedAction<A extends any = any> = {
  type: typeof dispatch
  meta: string
  payload: A
}

export const createDispatchMessage = <A extends any>(
  dispatchId: string,
  action: A,
): WrappedAction<A> => ({
  type: dispatch,
  meta: dispatchId,
  payload: action,
})

export const isDispatchMessage = (input: any): input is WrappedAction => {
  if (typeof input !== 'object') return false
  if (!input || !('type' in input)) return false
  if (typeof input.meta !== 'string') return false
  if (typeof input.payload === 'undefined') return false
  if (input.type !== dispatch) return false
  return true
}
