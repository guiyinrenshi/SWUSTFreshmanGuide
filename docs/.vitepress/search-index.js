// 生成搜索索引: 遍历 docs/ 下所有 md,提取标题+正文,输出 search-index.json
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)

export function buildSearchIndex() {
  return {
    name: 'build-search-index',
    buildEnd() {
      try {
        const docsDir = path.resolve(process.cwd(), 'docs')
        const outDir = path.resolve(process.cwd(), 'docs/.vitepress/dist')
        const pages = []

        function walk(dir, prefix = '') {
          const items = fs.readdirSync(dir, { withFileTypes: true })
          for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === '.vitepress') continue
            const full = path.join(dir, item.name)
            const rel = path.join(prefix, item.name)
            if (item.isDirectory()) {
              walk(full, rel)
            } else if (item.name.endsWith('.md') && item.name !== 'index.md') {
              try {
                const raw = fs.readFileSync(full, 'utf-8')
                // 去 frontmatter
                const body = raw.replace(/^---[\s\S]*?---/, '').trim()
                // 第一行作为标题(有 # 就去掉),否则取文件名
                const firstLine = body.split('\n').find(l => l.trim())
                const title = (firstLine?.replace(/^#+\s*/, '').trim() || item.name.replace(/\.md$/, '')).slice(0, 80)
                // 去掉 markdown 语法,取前 500 字做摘要
                const clean = body
                  .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
                  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // 链接
                  .replace(/[#>*`_~\-|]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                pages.push({
                  title,
                  content: clean.slice(0, 500),
                  path: '/' + rel.replace(/\.md$/, '').replace(/\\/g, '/'),
                })
              } catch (e) {
                // 跳过无法读取的文件
              }
            }
          }
        }
        walk(docsDir)
        const outFile = path.join(outDir, 'search-index.json')
        fs.mkdirSync(path.dirname(outFile), { recursive: true })
        fs.writeFileSync(outFile, JSON.stringify(pages))
        console.log(`[search-index] generated ${pages.length} pages -> ${outFile}`)
      } catch (e) {
        console.warn('[search-index] failed:', e.message)
      }
    },
  }
}
