import type { FC } from 'react'
import type { AnyAction } from 'redux'
import type { ForegroundStore, ProxyThunkAction } from '@web-ext/redux'
import { Provider, useDispatch, useSelector } from 'react-redux'

interface ProxyDispatch {
  /** returns a promise of a proxy thunk */
  <A extends ProxyThunkAction>(action: A): Promise<A['__return__']>
  /** returns nothing for non-thunk actions */
  (action: AnyAction): void
}

const useForegroundDispatch: () => ProxyDispatch = useDispatch

const BackgroundProvider = (Provider as any) as FC<{ store: ForegroundStore }>

export {
  useSelector,
  useForegroundDispatch as useDispatch,
  BackgroundProvider as Provider,
}
