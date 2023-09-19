/**
 * 获取下一层目录列表
 * @param {*} dirhandles
 * @returns
 */
async function getNextDeepDir(dirhandles, fatherPath) {
  let aaa = dirhandles.values()
  let array = []
  for await (const value of aaa) {
    array.push({
      fileHandle: value,
      name: value.name,
      kind: value.kind,
      path: fatherPath + '/' + value.name,
      children: [{ name: 1 }],
    })
    if (value.kind !== 'directory') {
      delete array[array.length - 1].children
    }
  }

  return array
}

// 节流函数
function throotle(fn, delay) {
  let timer = null

  return function (...args) {
    if (timer) {
      return
    }
    fn.apply(this, args)
    timer = setTimeout(() => {
      timer = null
    }, delay)
  }
}
