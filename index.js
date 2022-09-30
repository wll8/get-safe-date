const os = require(`os`)
const fs = require(`fs`)
const cp = require(`child_process`)
const { homedir } = os.userInfo()
const platform = os.platform()
const root = platform === `win32` ? homedir.match(/(.+:)/)[0] : `/`

async function getSafeDate() {
  const date = [
    tryFn(() => +fs.readFileSync(`${os.tmpdir()}/.d`), 0),
    await netDate(),
    await dirDate(),
    +new Date(),
  ].sort((a, b) => (b - a))[0]
  fs.writeFileSync(`${os.tmpdir()}/.d`, `${date}`)
  return date
}

function dirDate() {
  const baseLinux = [
    () => [[`home 目录`, homedir]],
    () => [[`根目录`, `/`]],
    () => [[`缓存`, `${homedir}/.cache/`]],
    () => [[`本地`, `${homedir}/.local/`]],
    () => [[`临时`, os.tmpdir()]],
    () => [[`日志`, `/var/log/`]],
    () => [[`进程`, `/proc`]],
    () => [[`设备`, `/dev/`]],
    () => [[`配置`, `${homedir}/.config/`]],
  ]
  const platformMap = {
    darwin: [
      ...baseLinux,
      () => [[`程序数据`, `${homedir}/Library/Application Support/`]],
    ],
    linux: [
      ...baseLinux,
    ],
    win32: [
      () => cp.execSync(`wmic logicaldisk get caption`).toString().trim().split(`\n`).slice(1).map(item => item.trim()).map(item => [`根目录`, `${item}/`]),
      () => [[`home 目录`, homedir]],
      () => [[`临时`, os.tmpdir()]],
      () => [[`程序数据`, process.env.LOCALAPPDATA]],
      () => [[`x64 程序`, `${root}/Program Files/`]],
      () => [[`x32 程序`, `${root}/Program Files (x86)/`]],
      () => [[`预读`, `${root}/Windows/Prefetch/`]],
    ],
  }
  const dirList = platformMap[platform] || platformMap[`linux`]
  const list = dirList.map(item => tryFn(item, []))
    .flat()
    .filter(([name, dir = ``]) => dir.trim())
    .map(([name, dir]) => [
      `${name} ${dir}`,
      tryFn(() => getNewDate(dir), 0)
    ])
  const newDate = list.sort((a, b) => (b[1] - a[1]))[0]
  return newDate[1]
}


function tryFn(fn, defaultVal) {
  try {
    return fn()
  } catch (error) {
    return defaultVal
  }
}

function getNewDate(dir) {
  const list = getList({
    root: dir,
  }).map(item => +(new Date(item.mtime))).sort((a, b) => (b - a))
  return list[0]
}

/**
 * 获取网络时间
 * @returns 
 */
async function netDate() {
  let netRes
  netRes = await new Promise((resolve, reject) => {
    const req =  require(`http`).request({
      host: `httpbin.org`,
      method: `head`,
      timeout: 1000,
    }, res => {
      resolve(+new Date(res.headers.date))
    }).on(`error`, () => {
      resolve(+new Date())
    })
    req.end()
  }).catch(err => {
    netRes = +new Date()
  })
  return netRes
}


/**
 * 获取目录下的内容列表
 * @param {*} option
 * @param {*} option.root 目录地址
 * @param {*} option.sort 排序的 key
 * @param {*} option.order 排序方式 asc desc
 * @returns
 */
function getList(option) {
  const list = fs
    .readdirSync(option.root)
    .map((name) => {
      try {
        const stat = fs.statSync(`${option.root}/${name}`)
        const isFile = stat.isFile()
        const isDirectory = stat.isDirectory()
        return isFile || isDirectory
          ? {
              name,
              // 文件大小
              size: stat.size,
              // 修改时间
              mtime: stat.mtime,
              // 创建时间
              birthtime: stat.birthtime,
              // 是否是文件
              isFile,
              // stat,
            }
          : undefined
      } catch (error) {
        return undefined
      }
    })
    .filter((item) => item)
  return list
}

module.exports = {
  getSafeDate
}