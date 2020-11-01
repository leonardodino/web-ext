import { browser, Runtime } from 'webextension-polyfill-ts'
import { nanoid } from '@reduxjs/toolkit'
import { connected, awaiting } from './constants'
import { createDispatchMessage, isNewStateMesssage } from './messages'
import { isReplyMessage } from './messages/reply'
import { isAwaiting } from './utils'
import { ProxyThunkAction, isProxyThunkAction } from './thunks'
import { AnyAction } from 'redux'
import { createThenable } from './thenable'

type State<T extends {}> = { [connected]: false } | ({ [connected]: true } & T)
type PromiseArgs = Parameters<ConstructorParameters<PromiseConstructor>[0]>

const $ = Symbol('foreground-store')
const g = (self as any) as { [$]?: ForegroundStore<any> }

// TODO: do fancy patch-magic here to keep references
const applyStatePatch = <T>(oldState: T | State<T>, newState: T): State<T> => {
  return { ...newState, [connected]: true }
}

export class ForegroundStore<S = {}> {
  static isAwaiting = isAwaiting
  private port?: Runtime.Port
  private dispatches = new Map<string, PromiseArgs>()
  private listeners = new Set<VoidFunction>()
  private state: State<S> = awaiting

  /** singleton */
  constructor() {
    if (g[$]) return g[$]!
    g[$] = this
  }

  private getPort() {
    if (!this.port) throw new Error('not connected yet')
    return this.port
  }

  private listener = (message: unknown): void => {
    if (isNewStateMesssage(message)) {
      this.state = applyStatePatch(this.state, message.payload)
      return this.listeners.forEach((listener) => listener())
    }
    if (isReplyMessage(message)) {
      if (!this.dispatches.has(message.meta)) return

      const { error, meta: dispatchId, payload } = message
      const [resolve, reject] = this.dispatches.get(dispatchId)!
      this.dispatches.delete(dispatchId)
      return error ? reject(new Error(payload)) : resolve(payload)
    }
  }

  connect = () => {
    if (!this.port) {
      this.port = browser.runtime.connect(undefined, { name })
      this.port.onMessage.addListener(this.listener)
    }

    return this
  }

  // redux store API (sans observable stuff)
  dispatch<A extends ProxyThunkAction>(action: A): Promise<A['__return__']>
  dispatch<A extends AnyAction>(action: A): void
  dispatch(action: AnyAction | ProxyThunkAction) {
    if (typeof action === 'function') {
      throw new Error('tried to dispatch a bare (non-exposed) thunk')
    }

    if (!isProxyThunkAction(action)) {
      this.getPort().postMessage(createDispatchMessage(null, action))
      return
    }

    return createThenable(({ tracked, resolve, reject }) => {
      const dispatchId = tracked ? nanoid() : null
      if (dispatchId) this.dispatches.set(dispatchId, [resolve, reject])
      this.getPort().postMessage(createDispatchMessage(dispatchId, action))
    })
  }

  getState = () => {
    return this.state as S
  }

  subscribe = (listener: VoidFunction): VoidFunction => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  replaceReducer(_: unknown): never {
    throw new Error('replaceReducer is not supported on the foreground!')
  }
}
