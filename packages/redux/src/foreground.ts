import { browser, Runtime } from 'webextension-polyfill-ts'
import { nanoid } from 'nanoid'
import { connected, awaiting } from './constants'
import { createDispatchMessage, isNewStateMesssage } from './messages'
import { isReplyMessage } from './messages/reply'
import { isAwaiting } from './utils'

type State<T extends {}> = { [connected]: false } | ({ [connected]: true } & T)
type PromiseArgs = Parameters<ConstructorParameters<PromiseConstructor>[0]>

const $ = Symbol('foreground-store')
const g = (self as any) as { [$]?: ForegroundStore<any, any> }

// TODO: do fancy patch-magic here to keep references
const applyStatePatch = <T>(oldState: T | State<T>, newState: T): State<T> => {
  return { ...newState, [connected]: true }
}

export class ForegroundStore<S = {}, A = any> {
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

  connect = (extensionId?: string, name?: string) => {
    if (!this.port) {
      this.port = browser.runtime.connect(extensionId, { name })
      this.port.onMessage.addListener(this.listener)
    }

    return this
  }

  // redux store API (sans observable stuff)
  dispatch = async (action: A) => {
    if (typeof action === 'function') {
      throw new Error('tried to dispatch a bare (non-exposed) thunk')
    }
    // TODO: make A only JSON serializable stuff
    const dispatchId = nanoid()
    const promise = new Promise((resolve, reject) => {
      this.dispatches.set(dispatchId, [resolve, reject])
    })
    this.getPort().postMessage(createDispatchMessage(dispatchId, action))

    // TODO: unwrap the return of wrapped-thunks
    return promise as Promise<A>
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
