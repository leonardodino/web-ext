import type { ThunkAction } from 'redux-thunk'
import { thunk as type } from './constants'

type AnyThunk = ThunkAction<any, any, any, any>
type ThunkMap = Record<string, (...args: any[]) => AnyThunk>
type KeyOfMap = string | symbol | number

export type ProxyThunkAction<
  A extends any[] = any[],
  K extends KeyOfMap = KeyOfMap,
  R extends any = any
> = {
  type: typeof type
  payload: A
  meta: K
  __return__: R
}

type ProxyThunk<M extends ThunkMap, K extends keyof M> = (
  ...args: Parameters<M[K]>
) => ProxyThunkAction<typeof args, K, ReturnType<ReturnType<M[K]>>>

export const exposeThunks = <M extends ThunkMap>(thunkMap: M) => {
  const thunks = {} as { [K in keyof M]: ProxyThunk<M, K> }

  for (const meta in thunkMap) {
    thunks[meta] = (...payload) => ({ type, payload, meta } as any)
  }

  return { registry: thunkMap, thunks }
}

export const isProxyThunkAction = (
  input: any,
): input is ReturnType<ProxyThunk<any, any>> => {
  if (!input) return false
  if (typeof input !== 'object') return false
  if (input.type !== type) return false
  if (typeof input.meta !== 'string') return false
  if (!Array.isArray(input.payload)) return false
  return true
}
