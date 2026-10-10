import {cp,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const out=resolve(process.env.TASK_WINDOW_BUILD_DIR||join(root,'dist'));
const files=[];
for(const host of ['dsh','zcode']){
 const stage=join(out,host),plugin=join(stage,'plugin');
 await cp(join(root,'adapters',host),plugin,{recursive:true});
 await cp(join(root,'app'),join(plugin,'native','resources','app'),{recursive:true});
 for(const name of ['README.md','LICENSE','THIRD_PARTY.md','docs'])await cp(join(root,name),join(plugin,name),{recursive:true});
 if(host==='dsh'){
  const result=execFileSync('npm.cmd',['pack','--json','--pack-destination',stage],{cwd:plugin,encoding:'utf8',shell:true});
  const item=JSON.parse(result)[0];await rename(join(stage,item.filename),join(stage,'plugin.tgz'));files.push(join(stage,'plugin.tgz'));
 }
 const zip=join(out,`task-window-${host}-win-x64.zip`);
 execFileSync('tar.exe',['-a','-c','-f',zip,'-C',stage,'plugin','PACKAGE-CONTENTS.md']);files.push(zip);
 const listing=execFileSync('tar.exe',['-tf',zip],{encoding:'utf8'});
 if(!listing.includes('plugin/docs/validation.md')||!listing.includes('plugin/native/resources/app/main.cjs'))throw Error('Incomplete package: '+host);
 if(/(?:state\.json|\.env|user-data|Cache\/)/.test(listing))throw Error('Unexpected private state');
 console.log('Verified archive '+host);
}
await writeFile(join(out,'SHA256SUMS.txt'),(await Promise.all(files.map(async path=>createHash('sha256').update(await readFile(path)).digest('hex')+'  '+path.slice(out.length+1).replaceAll('\\','/')))).join('\n')+'\n');
