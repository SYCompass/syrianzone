import { symlink, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
const root = join(process.cwd(), '..')
const pub = join(process.cwd(), 'public')
const items = ['assets','styles','components','bingo','board','compass','game','hotels','house','legacytierlist','party','population','sites','startpage','stats','syid','syofficial','flag-replacer']
const link = async (name) => {
  const src = join(root, name); const dst = join(pub, name)
  try { const s = await stat(dst); if (s) await rm(dst, { recursive: true, force: true }) } catch {}
  try { await symlink(src, dst, 'junction') } catch {}
}
await Promise.all(items.map(link))

