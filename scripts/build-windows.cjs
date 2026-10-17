// Linux only: use electron-builder's own static NSIS UninstallerReader.
// No Windows executable is executed, and no signing verification is disabled.
// The upstream target normally selects this extraction path for macOS Catalina.
if(process.platform==='linux'){
 const v=require('app-builder-lib/out/util/macosVersion');
 v.isMacOsCatalina=()=>true;
}
// Ignore only temporary executable copies produced by atomic resource editing.
// Keep the real application executable and all runtime resources.
const archiveModule=require('app-builder-lib/out/targets/archive');
const originalArchive=archiveModule.archive;
archiveModule.archive=(format,file,dir,options={})=>originalArchive(format,file,dir,{...options,excluded:[...(options.excluded||[]),'.electron.exe*','.WITI BOT.exe*']});
const {build,Platform,Arch}=require('electron-builder');
const config=require('../build/builder.cjs');if(process.env.WITI_BUILD_OUTPUT)config.directories={...config.directories,output:process.env.WITI_BUILD_OUTPUT};
build({targets:Platform.WINDOWS.createTarget(['nsis'],Arch.x64),config,publish:'never'}).then(async()=>{const {verifyInstaller}=require('./verify-installer.cjs');const path=require('node:path');console.log(JSON.stringify(await verifyInstaller(path.resolve(config.directories.output)),null,2));}).catch(e=>{console.error(e);process.exitCode=1;});
