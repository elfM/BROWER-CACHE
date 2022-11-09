/**
 * 强缓存
 */
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
     * @title 强缓存
     * @description Expires设置3秒后过期。这里要注意时间格式是 GMT 格式
     */
    // ctx.set('expires', new Date(Date.now() + 3000).toGMTString())
    // ctx.body = await parseStatic(filePath)

    /**
     * @title 强缓存
     * @description Cache-Control max-age=3000 设置3秒后过期
     */
    ctx.set('Cache-Control', 'max-age=3000')
    ctx.body = await parseStatic(filePath)
  }
})

app.listen(3000, () => {
  console.log('starting at port 3000')
})
