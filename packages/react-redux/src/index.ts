import type { FC } from 'react'
import type { Action, AnyAction } from 'redux'
import type { ForegroundStore } from '@web-ext/redux'
import { Provider, useDispatch, useSelector } from 'react-redux'

export type AsyncDispatch<A extends Action = AnyAction> = (
  action: A,
) => Promise<A>

export type ForegroundDispatchHook = <
  A extends Action = AnyAction
>() => AsyncDispatch<A>

const useForegroundDispatch = useDispatch as ForegroundDispatchHook

const BackgroundProvider = (Provider as any) as FC<{ store: ForegroundStore }>

export {
  useSelector,
  useForegroundDispatch as useDispatch,
  BackgroundProvider as Provider,
}
