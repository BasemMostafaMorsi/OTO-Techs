const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => {
    const p = path.join(dir,e.name);
    if (e.isSymbolicLink()) throw new Error(`Refusing linked output: ${p}`);
    return e.isDirectory() ? files(p) : [p];
  });
}
function clean(root = path.resolve(__dirname,'..')) {
  const target = path.resolve(root,'test-results');
  if (path.dirname(target) !== path.resolve(root)) throw new Error('Invalid cleanup path');
  if (!fs.existsSync(target)) return;
  if (fs.lstatSync(target).isSymbolicLink()) throw new Error('Refusing linked test-results');
  const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const copies = new Map();
  for (const p of [...files(path.join(root,'allure-results')), ...files(path.join(root,'playwright-report'))]) {
    const size = fs.statSync(p).size;
    if (!copies.has(size)) copies.set(size,[]);
    copies.get(size).push(p);
  }
  const cached = new Map();
  let removed=0, kept=0, bytes=0;
  for (const entry of fs.readdirSync(target,{withFileTypes:true})) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const folder = path.resolve(target,entry.name);
    if (path.dirname(folder) !== target) throw new Error('Invalid output folder');
    const contents=files(folder);
    const safe=contents.every(p => {
      const candidates=copies.get(fs.statSync(p).size)||[];
      const digest=hash(p);
      return candidates.some(copy => {
        if (!cached.has(copy)) cached.set(copy,hash(copy));
        return cached.get(copy)===digest;
      });
    });
    if (!safe) { kept++; continue; }
    bytes+=contents.reduce((sum,p)=>sum+fs.statSync(p).size,0);
    fs.rmSync(folder,{recursive:true,force:true}); removed++;
  }
  console.log(`test-results: removed ${removed} copied folders (${(bytes/1048576).toFixed(1)} MB); retained ${kept} folders with unique evidence. Kept .last-run.json.`);
}
module.exports={clean};
if (require.main===module) clean();
