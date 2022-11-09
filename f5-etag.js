/*app.js*/
const Koa = require('koa')
const app = new Koa()
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
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
     * @description etag、if-none-match
     */
    ctx.set('Cache-Control', 'no-cache')
    const fileBuffer = await parseStatic(filePath)
    const ifNoneMatch = ctx.request.headers['if-none-match']
    const hash = crypto.createHash('md5')
    hash.update(fileBuffer)
    const etag = `"${hash.digest('hex')}"`
    if (ifNoneMatch === etag) {
      ctx.status = 304
    } else {
      ctx.set('etag', etag)
      ctx.body = fileBuffer
    }
  }
})

app.listen(3000, () => {
  console.log('starting at port 3000')
})
