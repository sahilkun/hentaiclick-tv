"use client";

import Script from "next/script";

export function DevToolsGuard() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Script id="devtools-guard" strategy="beforeInteractive">
      {`(function(){
  document.addEventListener("keydown",function(e){
    if(e.key==="F12"){e.preventDefault();return}
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&"ijc".indexOf(e.key.toLowerCase())>-1){e.preventDefault();return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="u"){e.preventDefault();return}
  },true);

  function nuke(){
    // Stop all network activity
    window.stop();
    // Kill all media elements
    try{
      var m=document.querySelectorAll("video,audio");
      for(var i=0;i<m.length;i++){
        m[i].pause();
        m[i].removeAttribute("src");
        m[i].load();
      }
    }catch(e){}
    // Destroy entire document - kills HLS.js buffer and all state
    try{
      document.write("");
      document.close();
    }catch(e){}
    // Redirect
    window.location.replace(window.location.href);
  }

  // Debugger timing - fires every 50ms
  setInterval(function(){
    var t=performance.now();
    (function(){}).constructor("debugger")();
    if(performance.now()-t>100){nuke();}
  },50);

  // Window size detection for docked DevTools
  setInterval(function(){
    var w=window.outerWidth-window.innerWidth;
    var h=window.outerHeight-window.innerHeight;
    if(w>160||h>200){nuke();}
  },300);
})();`}
    </Script>
  );
}
