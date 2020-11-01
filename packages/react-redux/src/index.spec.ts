import { exposeThunks } from '@web-ext/redux'
import { useDispatch } from '.'

const { thunks } = exposeThunks({
  format: (a: number) => () => String(a),
})

export const x = async () => {
  const dispatch = useDispatch()
  const action = thunks.format(1)
  const r1 = await dispatch(action)
  const r2 = dispatch({ type: 'a' })
  return r1
}
