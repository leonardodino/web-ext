import { browser, Runtime } from 'webextension-polyfill-ts'
import { Middleware, Store } from 'redux'
import { exposeThunks, isProxyThunkAction } from './thunks'
import {
  isDispatchMessage,
  createNewStateMessage,
  createReplyMessage,
} from './messages'

const foreign: unique symbol = Symbol('foreign')

const createDispatchListener = (store: Store) => async (
  message: unknown,
  port: Runtime.Port,
): Promise<void> => {
  if (!isDispatchMessage(message)) return
  let result
  try {
    message.payload[foreign] = true
    result = await store.dispatch(message.payload)
  } catch (e) {
    result = e instanceof Error ? e : new Error(e?.message || e)
  } finally {
    port.postMessage(createReplyMessage(message.meta, result))
  }
}

export const exposeStore = (store: Store): void => {
  const ports = new Set<Runtime.Port>()
  const dispatchListener = createDispatchListener(store)

  browser.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => ports.delete(port))
    ports.add(port)

    port.onMessage.addListener(dispatchListener)
    port.postMessage(createNewStateMessage(store.getState()))
  })

  store.subscribe(() => {
    // TODO: deep equality check
    const state = store.getState()
    const message = createNewStateMessage(state)
    ports.forEach((port) => port.postMessage(message))
  })
}

const delayed = (value: unknown) => {
  return new Promise((resolve, reject) => {
    setTimeout(value instanceof Error ? reject : resolve, 0, value)
  })
}

export const createWebExtMiddleware = ({
  registry,
}: {
  registry: ReturnType<typeof exposeThunks>['registry']
}): Middleware => (store) => (next) => (action) => {
  if (isProxyThunkAction(action)) {
    const thunk = registry[action.meta](...action.payload)
    return delayed(next(thunk as any))
    // return delayed(thunk(store.dispatch, store.getState, undefined))
  }

  // delay out-of-background-page plain dispatches
  // so their response comes after the state is updated
  if (action[foreign]) {
    delete action[foreign]
    return delayed(next(action))
  }

  return next(action)
}
