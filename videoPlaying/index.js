let categoryInput = document.getElementsByClassName('category-input')[0]
let videoContainer = document.getElementsByClassName('video-container')[0]

let categoryBtn = document.getElementsByClassName('category-btn')[0]

categoryInput.onchange = e => {
  console.log(e)

  /**
   * 目录选择器获取的file一维数组转换成树形结构
   * @param {*} e input directory 事件event
   * @returns
   */
  function dirData2Tree(e) {
    const fileList = [...e.target.files].map(item => ({
      file: item,
      name: item.name,
      path: item.webkitRelativePath,
      fullPath: item.webkitRelativePath.split('/'),
    }))

    let num = fileList.map(item => item.fullPath.length).sort()[
      fileList.length - 1
    ]

    function filterFloorData(fileList, deep) {
      let arr = []
      const fullPathList = fileList.map(item => item.fullPath)

      for (let index = 0; index < fileList.length; index++) {
        if (
          fullPathList[index][deep] &&
          !arr.find(item => item.name === fullPathList[index][deep])
        ) {
          arr.push(
            fileList[index].fullPath.length === deep + 1
              ? {
                  name: fullPathList[index][deep],
                  file: fileList.find(
                    _item => _item.name === fullPathList[index][deep]
                  )?.file,
                }
              : {
                  name: fullPathList[index][deep],
                  children: [],
                }
          )
        }
      }
      return arr
    }

    let categoryList = filterFloorData(fileList, 0)
    let item = {
      children: categoryList,
    }

    let str = ''

    for (let index = 0; index < num - 1; index++) {
      str += `
    item.children.forEach(item => {
    if (item.children) {
      item.children = filterFloorData(
        fileList.filter(_item => _item.fullPath[${index}] === item.name),
        ${index + 1}
      )
          `
    }

    str += '}})'.repeat(num - 1)

    //   console.log(str)
    eval(str)

    return categoryList
  }

  console.time('a')
  console.log(dirData2Tree(e))
  console.timeEnd('a')
}

/**
 * 获取下一层目录列表
 * @param {*} dirhandles
 * @returns
 */
async function getNextDeepDir(dirhandles) {
  let aaa = dirhandles.values()
  let array = []
  for await (const value of aaa) {
    array.push({
      fileHandle: value,
      name: value.name,
      kind: value.kind,
      children: [{ name: 1 }],
    })
    if (value.kind !== 'directory') {
      delete array[array.length - 1].children
    }
  }

  return array
}

categoryBtn.onclick = () => {}

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

const app = new Vue({
  el: '#app',
  components: {},
  data() {
    return {
      fileList: [],
      type: 'fileSystem',
      listDomWidth: document.body.clientWidth / 4,
    }
  },
  methods: {
    changeListDomWidth: throotle(function (e) {
      if (e.pageX === 0) return
      this.listDomWidth = document.body.clientWidth - 20 - e.pageX
    }, 20),
    // changeListDomWidth(e) {
    //   if (e.pageX === 0) return
    //   this.listDomWidth = document.body.clientWidth - 28 - e.pageX
    // },

    openDirDialog() {
      try {
        window.showDirectoryPicker().then(async dirhandles => {
          let fileList = [
            {
              name: dirhandles.name,
              kind: dirhandles.kind,
              fileHandle: dirhandles,
              children: await getNextDeepDir(dirhandles),
            },
          ]
          this.fileList = fileList
          console.log(fileList)
        })
      } catch (error) {
        this.$refs.dirSelectedInput.click()
      }
    },

    /**
     * 获取目录Tree列表
     * @param {*} e
     */
    getDirTreeData(e) {
      /**
       * 目录选择器获取的file一维数组转换成树形结构
       * @param {*} e input directory 事件event
       * @returns
       */
      function dirData2Tree(e) {
        const fileList = [...e.target.files].map(item => ({
          file: item,
          name: item.name,
          path: item.webkitRelativePath,
          fullPath: item.webkitRelativePath.split('/'),
        }))

        let num = fileList.map(item => item.fullPath.length).sort()[
          fileList.length - 1
        ]

        function filterFloorData(fileList, deep) {
          let arr = []
          const fullPathList = fileList.map(item => item.fullPath).sort()

          for (let index = 0; index < fileList.length; index++) {
            if (
              fullPathList[index][deep] &&
              !arr.find(item => item.name === fullPathList[index][deep])
            ) {
              arr.push(
                fileList[index].fullPath.length === deep + 1
                  ? {
                      name: fullPathList[index][deep],
                      file: fileList.find(
                        _item => _item.name === fullPathList[index][deep]
                      )?.file,
                    }
                  : {
                      name: fullPathList[index][deep],
                      children: [],
                    }
              )
            }
          }
          return arr
        }

        let categoryList = filterFloorData(fileList, 0)

        let item = {
          children: categoryList,
        }

        let str = ''

        for (let index = 0; index < num - 1; index++) {
          str += `
    item.children.forEach(item => {
    if (item.children) {
      item.children = filterFloorData(
        fileList.filter(_item => _item.fullPath[${index}] === item.name),
        ${index + 1}
      )
          `
        }

        str += '}})'.repeat(num - 1)

        //   console.log(str)
        eval(str)

        return categoryList
      }

      //   console.log(dirData2Tree(e))

      this.fileList = dirData2Tree(e)
      this.type = 'fileJson'
    },

    async handleNodeClick(e) {
      console.log(e)

      if (e.file || e.kind === 'file') {
        const file = e.file || (await e.fileHandle.getFile())
        console.log(file)
        this.$refs.videoContainer.innerHTML = ''

        if (file.type === 'video/mp4') {
          let arr = JSON.parse(localStorage.getItem('loadedVideos'))
          let time =
            arr?.find(item => item.name === file.name)?.loadedTime - 5 || 0
          const video = document.createElement('video')
          video.src = URL.createObjectURL(file)
          video.autoplay = true
          video.controls = true
          video.currentTime = time
          video.dataset.fileName = file.name
          this.$refs.videoContainer.appendChild(video)

          video.onpause = e => {
            console.log('暂停', e.target.dataset.fileName, e.target.currentTime)

            let arr = JSON.parse(localStorage.getItem('loadedVideos'))
            if (!arr) {
              arr = [
                {
                  name: e.target.dataset.fileName,
                  loadedTime: e.target.currentTime,
                },
              ]
            } else {
              let currentVideo = arr.find(
                item => item.name === e.target.dataset.fileName
              )
              if (currentVideo) {
                currentVideo.loadedTime = e.target.currentTime
              } else {
                arr.push({
                  name: e.target.dataset.fileName,
                  loadedTime: e.target.currentTime,
                })
              }
            }

            localStorage.setItem('loadedVideos', JSON.stringify(arr))
          }
        }
      }

      if (e.kind === 'directory' && e.children.length === 1) {
        e.children = await getNextDeepDir(e.fileHandle)
      }
    },
  },
  mounted() {},
})
