(async ()=>{
  const path = process.argv[2];
  if(!path){ console.error('Usage: node run_mjs_launcher.mjs <absolute-path-to-mjs>'); process.exit(1); }
  try{
    await import(new URL('file://'+path).href);
  }catch(e){
    console.error('Launcher import error:', e);
    process.exit(2);
  }
})();
