const release=require('../release.json');
module.exports={appId:'mx.witi.bot',productName:'WITI BOT',directories:{output:'dist',buildResources:'build'},files:['src/**','renderer/**','assets/**','release.json','build/icon.png','package.json'],asar:true,compression:'store',
 win:{target:[{target:'nsis',arch:['x64']}],icon:'build/icon.ico',artifactName:'WITI_BOT_Setup_v${version}.exe',requestedExecutionLevel:'asInvoker',verifyUpdateCodeSignature:true,...(release.publisherName?{publisherName:release.publisherName}:{})},
 nsis:{oneClick:false,perMachine:false,allowElevation:true,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,createStartMenuShortcut:true,shortcutName:'WITI BOT',runAfterFinish:true,deleteAppDataOnUninstall:false,include:'build/installer.nsh',installerLanguages:['es','en'],language:'3082',installerIcon:'build/icon.ico',uninstallerIcon:'build/icon.ico',uninstallDisplayName:'WITI BOT ${version}'},
 publish:null};
