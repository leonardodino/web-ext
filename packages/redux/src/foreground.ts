import { browser, Runtime } from 'webextension-polyfill-ts'
import { nanoid } from 'nanoid'
import { connected, awaiting } from './constants'
import { createDispatchMessage, isNewStateMesssage } from './messages'
import { isReplyMessage } from './messages/reply'
import { isAwaiting } from './utils'

type VoidFn = () => void
type State<T extends {}> = { [connected]: false } | ({ [connected]: true } & T)
type PromiseArgs = Parameters<ConstructorParameters<PromiseConstructor>[0]>

const $ = Symbol('foreground-store')
const g = (self as any) as { [$]?: ForegroundStore<any, any> }

// TODO: do fancy patch-magic here to keep references
const applyStatePatch = <T>(oldState: State<T>, newState: State<T>): void => {
  oldState = isAwaiting(oldState) ? newState : Object.assign(oldState, newState)
  oldState[connected] = true
}

export class ForegroundStore<S = {}, A = any> {
  private port?: Runtime.Port
  private dispatches = new Map<string, PromiseArgs>()
  private listeners = new Set<VoidFn>()
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
      applyStatePatch(this.state, message.payload)
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

  connect() {
    if (!this.port) {
      this.port = browser.runtime.connect(undefined, { name })
      this.port.onMessage.addListener(this.listener)
    }

    return this
  }

  // redux store API (sans observable stuff)
  async dispatch(action: A) {
    // TODO: make A only JSON serializable stuff
    const dispatchId = nanoid()
    const promise = new Promise((resolve, reject) => {
      this.dispatches.set(dispatchId, [resolve, reject])
    })
    this.getPort().postMessage(createDispatchMessage(dispatchId, action))

    // TODO: unwrap the return of wrapped-thunks
    return promise as Promise<A>
  }

  getState() {
    return this.state
  }

  subscribe(listener: VoidFn) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  replaceReducer(_: unknown): void {
    throw new Error('replaceReducer is not supported on the foreground!')
  }
}
