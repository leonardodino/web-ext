export const name = '@web-ext/redux'
export const reply = '@web-ext/redux – reply'
export const thunk = '@web-ext/redux – thunk'
export const dispatch = '@web-ext/redux – dispatch'
export const newState = '@web-ext/redux – newState'

/** internal symbol to denote store connection state */
export const connected: unique symbol = Symbol('connected')

/** provisional state while the store connects to the background */
export const awaiting = { [connected]: false } as const
