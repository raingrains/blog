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
      currentFile: null,
      activeTabName: 'list',
      recordList: [],
    }
  },

  watch: {
    activeTabName(val) {
      if (val === 'record') {
        this.getRecordList()
      }
    },
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
        data.file = file
        if (file.type === 'video/mp4') {
          this.currentFileType = 'video'
          let arr = JSON.parse(localStorage.getItem('loadedVideos'))
          let time =
            arr?.find(item => item.name === file.name)?.loadedTime - 5 || 0

          this.$nextTick(() => {
            let video = this.$refs.videoContent

            if (this.currentFile) {
              // 记录旧视频源相关信息
              this.recordMessage(video, this.currentFile)
            }

            // 设置新视频源
            this.currentFile = data
            video.src = URL.createObjectURL(file)
            video.currentTime = time
            video.dataset.fileName = file.name
            video.title = file.name
            // 播放
            video.play()
            video.focus()

            // 暂停事件
            video.onpause = e => {
              console.log(
                '暂停',
                e.target.dataset.fileName,
                e.target.currentTime
              )
              console.dir(e.target)

              this.recordMessage(e.target, data)
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
    recordMessage(video, data) {
      let arr = JSON.parse(localStorage.getItem('loadedVideos'))
      // 没有记录
      if (!arr) {
        arr = [
          {
            name: video.dataset.fileName,
            loadedTime: Math.floor(video.currentTime),
            path: data.path,
            totalTime: Math.floor(video.duration),
            percent: +((video.currentTime / video.duration) * 100).toFixed(1),
          },
        ]
      } else {
        // 有记录且有当前视频记录
        let currentVideo = arr.find(
          item => item.name === video.dataset.fileName
        )
        if (currentVideo) {
          currentVideo.loadedTime = video.currentTime
        } else {
          // 无当前视频记录
          arr.push({
            name: video.dataset.fileName,
            loadedTime: video.currentTime,
            path: data.path,
            totalTime: Math.floor(video.duration),
            percent: +((video.currentTime / video.duration) * 100).toFixed(1),
          })
        }
      }

      localStorage.setItem('loadedVideos', JSON.stringify(arr))
    },

    // 秒转 时分秒格式
    secToTime(time) {
      let sec_num = parseInt(time, 10) // don't forget the second param
      let hours = Math.floor(sec_num / 3600)
      let minutes = Math.floor((sec_num - hours * 3600) / 60)
      let seconds = sec_num - hours * 3600 - minutes * 60
      return `${hours < 10 ? '0' + hours : hours}:${
        minutes < 10 ? '0' + minutes : minutes
      }:${seconds < 10 ? '0' + seconds : seconds}`
    },

    /**
     * 获取记录信息
     * @param {*} data
     */
    getRecord(data) {
      console.log(data)
    },
  },
  mounted() {
    this.getRecordList()

    // 切换回页面时
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (this.$refs.videoContent) {
          // video标签聚焦
          this.$refs.videoContent.focus()
        }
      }
    })
  },
})
