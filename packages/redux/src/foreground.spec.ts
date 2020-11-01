import { exposeThunks } from './thunks'
import { ForegroundStore } from './foreground'

const { thunks } = exposeThunks({
  format: (a: number) => () => String(a),
})

export const x = async () => {
  const store = new ForegroundStore()
  const action = thunks.format(1)
  const r1 = await store.dispatch(action)
  const r2 = store.dispatch({ type: 'a' })
  return r1
}
