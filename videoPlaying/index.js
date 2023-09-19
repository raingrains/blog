// let categoryInput = document.getElementsByClassName('category-input')[0]
// let videoContainer = document.getElementsByClassName('video-container')[0]

// let categoryBtn = document.getElementsByClassName('category-btn')[0]

// categoryInput.onchange = e => {
//   console.log(e)

//   /**
//    * 目录选择器获取的file一维数组转换成树形结构
//    * @param {*} e input directory 事件event
//    * @returns
//    */
//   function dirData2Tree(e) {
//     const fileList = [...e.target.files].map(item => ({
//       file: item,
//       name: item.name,
//       path: item.webkitRelativePath,
//       fullPath: item.webkitRelativePath.split('/'),
//     }))

//     let num = fileList.map(item => item.fullPath.length).sort()[
//       fileList.length - 1
//     ]

//     function filterFloorData(fileList, deep) {
//       let arr = []
//       const fullPathList = fileList.map(item => item.fullPath)

//       for (let index = 0; index < fileList.length; index++) {
//         if (
//           fullPathList[index][deep] &&
//           !arr.find(item => item.name === fullPathList[index][deep])
//         ) {
//           arr.push(
//             fileList[index].fullPath.length === deep + 1
//               ? {
//                   name: fullPathList[index][deep],
//                   file: fileList.find(
//                     _item => _item.name === fullPathList[index][deep]
//                   )?.file,
//                 }
//               : {
//                   name: fullPathList[index][deep],
//                   children: [],
//                 }
//           )
//         }
//       }
//       return arr
//     }

//     let categoryList = filterFloorData(fileList, 0)
//     let item = {
//       children: categoryList,
//     }

//     let str = ''

//     for (let index = 0; index < num - 1; index++) {
//       str += `
//     item.children.forEach(item => {
//     if (item.children) {
//       item.children = filterFloorData(
//         fileList.filter(_item => _item.fullPath[${index}] === item.name),
//         ${index + 1}
//       )
//           `
//     }

//     str += '}})'.repeat(num - 1)

//     //   console.log(str)
//     eval(str)

//     return categoryList
//   }

//   console.time('a')
//   console.log(dirData2Tree(e))
//   console.timeEnd('a')
// }
// categoryBtn.onclick = () => {}

const app = new Vue({
  el: '#app',
  components: {},
  data() {
    return {
      fileList: [],
      type: 'fileSystem',
      listDomWidth: document.body.clientWidth / 4,
      currentFileType: '',
      activeTabName: 'list',
      recordList: [],
    }
  },
  methods: {
    // 调整操作栏宽度
    changeListDomWidth: throotle(function (e) {
      if (e.pageX === 0) return
      this.listDomWidth = document.body.clientWidth - 20 - e.pageX
    }, 16),

    /**
     * 打开目录选择器弹窗
     */
    openDirDialog() {
      try {
        throw new Error()
        window.showDirectoryPicker().then(async dirhandles => {
          let fileList = [
            {
              name: dirhandles.name,
              kind: dirhandles.kind,
              fileHandle: dirhandles,
              path: dirhandles.name,
              children: await getNextDeepDir(dirhandles, dirhandles.name),
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

        function filterFloorData(fileList, deep, fathPath) {
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
                      path:
                        (fathPath ? fathPath + '/' : fathPath) +
                        fullPathList[index][deep],
                    }
                  : {
                      name: fullPathList[index][deep],
                      path:
                        (fathPath ? fathPath + '/' : fathPath) +
                        fullPathList[index][deep],
                      children: [],
                    }
              )
            }
          }
          return arr
        }

        let categoryList = filterFloorData(fileList, 0, '')

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
        ${index + 1},
        item.path
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

      console.log(this.fileList)
      this.type = 'fileJson'
    },

    /**
     * 获取播放记录
     */
    getRecordList() {
      this.recordList = JSON.parse(localStorage.getItem('loadedVideos') || '[]')
      console.log(this.recordList)
    },

    async handleNodeClick(data) {
      if (data.file || data.kind === 'file') {
        const file = data.file || (await data.fileHandle.getFile())

        if (file.type === 'video/mp4') {
          this.currentFileType = 'video'
          let arr = JSON.parse(localStorage.getItem('loadedVideos'))
          let time =
            arr?.find(item => item.name === file.name)?.loadedTime - 5 || 0

          this.$nextTick(() => {
            let video = this.$refs.videoContent
            video.src = URL.createObjectURL(file)
            video.currentTime = time
            video.dataset.fileName = file.name
            video.title = file.name
            // 播放
            video.play()

            // 暂停事件
            video.onpause = e => {
              console.log(
                '暂停',
                e.target.dataset.fileName,
                e.target.currentTime
              )
              console.dir(e.target)

              let arr = JSON.parse(localStorage.getItem('loadedVideos'))
              if (!arr) {
                arr = [
                  {
                    name: e.target.dataset.fileName,
                    path: data.path,
                    loadedTime: Math.floor(e.target.currentTime),
                    totalTime: Math.floor(e.target.duration),
                    percent:
                      +(e.target.currentTime / e.target.duration).toFixed(3) *
                      100,
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
          })
        } else {
          this.currentFileType = ''
        }
      }

      if (data.kind === 'directory' && data.children.length === 1) {
        data.children = await getNextDeepDir(data.fileHandle, data.path)
      }
    },
  },
  mounted() {
    this.getRecordList()
  },
})
