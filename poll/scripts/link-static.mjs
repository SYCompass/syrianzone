import { symlink, rm, stat, mkdir, cp, copyFile } from 'node:fs/promises'
import { join } from 'node:path'
const root = join(process.cwd(), '..')
const pub = join(process.cwd(), 'public')
const items = ['assets','styles','components','bingo','board','compass','food','game','hotels','house','legacytierlist','party','population','sites','startpage','stats','syid','syofficial','flag-replacer']
const useCopy = true
const link = async (name) => {
  const src = join(root, name); const dst = join(pub, name)
  try { const s = await stat(dst); if (s) await rm(dst, { recursive: true, force: true }) } catch {}
  try {
    if (useCopy) await cp(src, dst, { recursive: true })
    else await symlink(src, dst, 'junction')
  } catch {}
}
await Promise.all(items.map(link))

// Link root index.html to serve landing page at "/"
try {
  const src = join(root, 'index.html');
  const dst = join(pub, 'index.html');
  try { const s = await stat(dst); if (s) await rm(dst, { force: true }) } catch {}
  try {
    if (useCopy) await copyFile(src, dst)
    else await symlink(src, dst)
  } catch {}
} catch {}

// Ensure /tierlist/images points to /images (for app assets under /tierlist)
try { await mkdir(join(pub, 'tierlist'), { recursive: true }) } catch {}
const nestedSrc = join(pub, 'images')
const nestedDst = join(pub, 'tierlist', 'images')
try { const s = await stat(nestedDst); if (s) await rm(nestedDst, { recursive: true, force: true }) } catch {}
try { await symlink(nestedSrc, nestedDst, 'junction') } catch {}

