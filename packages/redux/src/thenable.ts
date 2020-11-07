type PromiseArgs = Parameters<ConstructorParameters<PromiseConstructor>[0]>
type PC = { tracked: boolean; resolve: PromiseArgs[0]; reject: PromiseArgs[1] }

export const createThenable = (callback: (control: PC) => void) => {
  const control = { tracked: false } as PC
  const promise = new Promise((resolve, reject) => {
    Object.assign(control, { resolve, reject })
  })

  Promise.resolve().then(() => {
    if (!control.tracked) control.resolve()
    callback(control)
  })

  return {
    then: (...args: PromiseArgs) => {
      control.tracked = true
      return promise.then(...args)
    },
  }
}
