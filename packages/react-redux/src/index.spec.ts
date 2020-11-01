import { exposeThunks } from '@web-ext/redux'
import { useDispatch } from '.'

const { thunks } = exposeThunks({
  format: (a: number) => () => String(a),
})

export const x = async () => {
  const dispatch = useDispatch()

  const r = dispatch(thunks.format(1))
  return r
}
