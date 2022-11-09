/*app.js*/
const Koa = require('koa')
const app = new Koa()
const fs = require('fs')
const path = require('path')
const mimes = require('./util/mimes')


// 解析资源类型
function parseMime(url) {
  // path.extname获取路径中文件的后缀名
  let extName = path.extname(url)
  extName = extName ? extName.slice(1) : 'unknown'
  return mimes[extName]
}

const parseStatic = (dir) => {
  return new Promise((resolve) => {
    resolve(fs.readFileSync(dir), 'binary')
  })
}

function getFileStat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, function (err, stats) {
      if (stats) {
        resolve(stats)
      } else {
        reject(err)
      }
    })
  })
}

app.use(async (ctx) => {
  const url = ctx.request.url
  console.log(url, 'url')
  if (url === '/') {
    // 访问根路径返回index.html
    ctx.set('Content-Type', 'text/html')
    ctx.body = await parseStatic('./index.html')
  } else {
    const filePath = path.resolve(__dirname, `.${url}`)
    ctx.set('Content-Type', parseMime(url))

    /**
     * @title 协商缓存
     * @description Last-Modified、if-modified-since
     */
    ctx.set('Cache-Control', 'no-cache')
    const ifModifiedSince = ctx.request.header['if-modified-since']
    const fileStat = await getFileStat(filePath)
    if (ifModifiedSince === fileStat.mtime.toGMTString()) {
      ctx.status = 304
    } else {
      ctx.set('Last-Modified', fileStat.mtime.toGMTString())
      ctx.body = await parseStatic(filePath)
    }
  }
})

app.listen(3000, () => {
  console.log('starting at port 3000')
})
