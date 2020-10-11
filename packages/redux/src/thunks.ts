import type { ThunkAction } from 'redux-thunk'
import { thunk } from './constants'

type AnyThunk = ThunkAction<any, any, any, any>
type ThunkMap = Record<string, (...args: any[]) => AnyThunk>

type ProxyThunk<M extends ThunkMap, K extends keyof M> = (
  ...args: Parameters<M[K]>
) => {
  type: typeof thunk
  payload: typeof args
  meta: K
}

export const exposeThunks = <M extends ThunkMap>(thunks: M) => {
  const exposed = {} as { [K in keyof M]: ProxyThunk<M, K> }
  for (const key in thunks) {
    exposed[key] = (...args) => ({ type: thunk, payload: args, meta: key })
  }

  return { registry: thunks, exposed }
}

export const isProxyThunkAction = (
  input: any,
): input is ReturnType<ProxyThunk<any, any>> => {
  if (!input) return false
  if (typeof input !== 'object') return false
  if (input.type !== thunk) return false
  if (typeof input.meta !== 'string') return false
  if (!Array.isArray(input.payload)) return false
  return true
}
