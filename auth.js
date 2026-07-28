/**
 * XDF数据看板 - 统一身付认证模块 v3
 * 液态玻璃设计 · 邮箱验证（@xdf.cn）· 钉钉免登(可选)
 *
 * 登录方式：输入任意 @xdf.cn 邮箱即可进入
 * 邮箱会通过Cloudflare Worker留存后台供查验
 */
(function(){
  'use strict';

  // ==================== 配置区 ====================
  var EMAIL_REGEX=/^[a-zA-Z0-9._-]+@xdf\.cn$/;
  var DINGTALK_CORP_ID='';                  // 钉钉企业corpId（留空=仅邮箱）
  var AUTH_EXPIRY=8*3600*1000;              // 8小时
  // 数据API地址：Pages上同源加载（_worker.js保护），GitHub走Cloudflare Pages跨域加载
  var DATA_WORKER_URL=(location.hostname.endsWith('.pages.dev')?'':'https://xdf-dashboard.pages.dev');
  // =================================================

  var AUTH_KEY='xdf_authed';
  var AUTH_TS_KEY='xdf_auth_ts';
  var AUTH_METHOD_KEY='xdf_auth_method';
  var AUTH_EMAIL_KEY='xdf_auth_email';

  function isValidEmail(val){
    return EMAIL_REGEX.test(val.trim());
  }

  function isAuthed(){
    try{
      var urlK=new URLSearchParams(location.search).get('k');
      if(urlK&&isValidEmail(urlK)){
        setAuth('url',urlK.trim());
        var url=new URL(location.href);
        url.searchParams.delete('k');
        history.replaceState(null,'',url.toString());
        return true;
      }
      if(sessionStorage.getItem(AUTH_KEY)!=='1')return false;
      var ts=parseInt(sessionStorage.getItem(AUTH_TS_KEY)||'0');
      if(ts>0 && Date.now()-ts>AUTH_EXPIRY){
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_TS_KEY);
        sessionStorage.removeItem(AUTH_EMAIL_KEY);
        return false;
      }
      return true;
    }catch(e){return false;}
  }

  function setAuth(method,email){
    sessionStorage.setItem(AUTH_KEY,'1');
    sessionStorage.setItem(AUTH_TS_KEY,String(Date.now()));
    sessionStorage.setItem(AUTH_METHOD_KEY,method||'email');
    sessionStorage.setItem(AUTH_EMAIL_KEY,(email||'').trim());
  }

  function getToken(){
    return sessionStorage.getItem(AUTH_EMAIL_KEY)||'';
  }

  // 暴露给全局，供看板加载数据时使用
  window.XDF_AUTH={
    isAuthed:isAuthed,
    getToken:getToken,
    getWorkerUrl:function(){return DATA_WORKER_URL;},
    hasWorker:function(){return true;},
    getEmail:function(){return sessionStorage.getItem(AUTH_EMAIL_KEY)||'';}
  };

  if(isAuthed())return;

  // ==================== 注入样式 ====================
  var styleEl=document.createElement('style');
  styleEl.textContent=`
@keyframes xdfBgFlow{
  0%{background-position:0% 0%,100% 0%,50% 100%,100% 100%,0% 100%,30% 50%,0 0}
  50%{background-position:30% 20%,70% 30%,60% 80%,80% 70%,20% 80%,50% 30%,0 0}
  100%{background-position:60% 40%,40% 60%,40% 60%,60% 40%,40% 60%,70% 70%,0 0}
}
@keyframes xdfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes xdfShake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-7px)}20%,40%,60%,80%{transform:translateX(7px)}}
@keyframes xdfSpin{to{transform:rotate(360deg)}}
@keyframes xdfSpecular{0%,100%{background-position:0% 0%}50%{background-position:100% 0%}}
@keyframes xdfFadeIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes xdfPulseRing{0%{transform:scale(.95);opacity:.7}50%{transform:scale(1.05);opacity:.3}100%{transform:scale(.95);opacity:.7}}
@keyframes xdfGradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

#xdf-auth-gate{
  position:fixed;inset:0;z-index:2147483647;
  display:flex;align-items:center;justify-content:center;
  font-family:'FZDaBiaoSong','方正大标宋简体',-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Segoe UI",sans-serif;
  padding:20px;overflow:hidden;
}
#xdf-auth-gate .xdf-bg{
  position:absolute;inset:-10%;z-index:-1;
  background:
    radial-gradient(ellipse 60% 50% at 12% 8%,rgba(0,122,255,.28),transparent 60%),
    radial-gradient(ellipse 50% 40% at 88% 22%,rgba(88,86,214,.25),transparent 60%),
    radial-gradient(ellipse 60% 45% at 50% 100%,rgba(0,199,190,.22),transparent 60%),
    radial-gradient(ellipse 45% 35% at 80% 80%,rgba(255,149,0,.15),transparent 60%),
    radial-gradient(ellipse 40% 30% at 18% 75%,rgba(52,199,89,.15),transparent 60%),
    radial-gradient(ellipse 35% 25% at 65% 45%,rgba(255,94,138,.12),transparent 60%),
    linear-gradient(135deg,#eef2fb 0%,#f5f0fa 50%,#eaf6f4 100%);
  background-size:200% 200%,220% 220%,200% 200%,220% 220%,200% 200%,200% 200%,100% 100%;
  animation:xdfBgFlow 18s ease-in-out infinite alternate;
}
#xdf-auth-gate *{margin:0;padding:0;box-sizing:border-box}
.xdf-card{
  position:relative;overflow:hidden;width:100%;max-width:380px;padding:48px 40px 36px;
  border-radius:32px;text-align:center;
  background:rgba(255,255,255,.25);
  border:1px solid rgba(255,255,255,.5);
  box-shadow:0 24px 64px rgba(0,0,0,.12),0 0 0 1px rgba(255,255,255,.2) inset,inset 0 1px 2px rgba(255,255,255,.8);
  backdrop-filter:blur(44px) saturate(240%);-webkit-backdrop-filter:blur(44px) saturate(240%);
  animation:xdfFadeIn .6s cubic-bezier(.4,0,.2,1);
}
.xdf-card::before{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.6),transparent 65%);opacity:.6;
}
.xdf-card::after{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.25) 45%,rgba(255,255,255,.05) 55%,transparent 70%);
  background-size:300% 100%;animation:xdfSpecular 8s ease-in-out infinite;
}
.xdf-logo{
  width:72px;height:72px;margin:0 auto 22px;position:relative;z-index:1;
  animation:xdfFloat 3.5s ease-in-out infinite;
}
.xdf-logo-ring{
  position:absolute;inset:0;border-radius:50%;
  background:linear-gradient(135deg,#007AFF,#5856D6,#00C7BE);
  opacity:.2;animation:xdfPulseRing 3s ease-in-out infinite;
}
.xdf-logo-inner{
  position:absolute;inset:8px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#007AFF 0%,#5856D6 50%,#00C7BE 100%);
  background-size:200% 200%;animation:xdfGradShift 6s ease infinite;
  box-shadow:0 8px 28px rgba(0,122,255,.35),inset 0 1px 3px rgba(255,255,255,.5);
}
.xdf-logo-inner svg{width:32px;height:32px;fill:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.15))}
.xdf-card h2{
  font-size:1.4rem;font-weight:900;color:#1a1a2e;margin-bottom:4px;
  position:relative;z-index:1;letter-spacing:-.3px;
}
.xdf-sub{font-size:.82rem;color:#6e6e80;margin-bottom:28px;position:relative;z-index:1;font-weight:500}
.xdf-input-wrap{display:block;margin-bottom:24px;position:relative;z-index:1}
.xdf-input{
  width:100%;padding:14px 18px;border-radius:16px;
  border:1.5px solid rgba(255,255,255,.5);
  background:rgba(255,255,255,.4);
  font-size:.95rem;color:#1a1a2e;outline:none;
  backdrop-filter:blur(10px);
  transition:border-color .25s,box-shadow .25s,background .25s;
  font-family:inherit;text-align:center;
}
.xdf-input:focus{
  border-color:#007AFF;
  background:rgba(255,255,255,.6);
  box-shadow:0 0 0 4px rgba(0,122,255,.12);
}
.xdf-input::placeholder{color:#9e9eaf;font-weight:400}
.xdf-btn{
  display:block;width:100%;padding:16px;border-radius:18px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#007AFF,#5856D6);
  background-size:200% 200%;animation:xdfGradShift 6s ease infinite;
  color:#fff;font-size:1.05rem;font-weight:800;
  transition:transform .15s,box-shadow .25s;white-space:nowrap;
  font-family:inherit;letter-spacing:2px;
  box-shadow:0 6px 24px rgba(0,122,255,.35);
}
.xdf-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,122,255,.4)}
.xdf-btn:active{transform:translateY(0)}
.xdf-error{color:#FF3B30;font-size:.76rem;height:20px;margin-bottom:6px;opacity:0;transition:opacity .2s;position:relative;z-index:1;font-weight:500}
.xdf-error.show{opacity:1}
.xdf-card.shake{animation:xdfShake .4s}
.xdf-hint{font-size:.72rem;color:#9e9eaf;margin-top:18px;position:relative;z-index:1;line-height:1.6}
.xdf-hint a{color:#007AFF;text-decoration:none;font-weight:500}
.xdf-dt-status{
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding:20px 0;font-size:.85rem;color:#5856D6;position:relative;z-index:1;font-weight:600;
}
.xdf-dt-spinner{
  width:22px;height:22px;border:2.5px solid rgba(88,86,214,.2);
  border-top-color:#5856D6;border-radius:50%;animation:xdfSpin .7s linear infinite;
}
.xdf-footer{
  margin-top:22px;padding-top:18px;
  border-top:1px solid rgba(255,255,255,.3);
  font-size:.7rem;color:#9e9eaf;position:relative;z-index:1;
}
.xdf-footer a{color:#007AFF;text-decoration:none;font-weight:500}
.xdf-badge{
  display:inline-flex;align-items:center;gap:4px;padding:3px 12px;border-radius:100px;
  font-size:.65rem;font-weight:600;background:rgba(0,199,190,.12);color:#00C7BE;
  margin-bottom:16px;position:relative;z-index:1;
}
`;
  document.head.appendChild(styleEl);

  // ==================== 创建遮罩层 ====================
  var overlay=document.createElement('div');
  overlay.id='xdf-auth-gate';
  overlay.innerHTML=`
    <div class="xdf-bg"></div>
    <div class="xdf-card" id="xdfCard">
      <div class="xdf-logo">
        <div class="xdf-logo-ring"></div>
        <div class="xdf-logo-inner">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        </div>
      </div>
      <p class="xdf-sub" id="xdfSub">请输入邮箱</p>
      <div id="xdfPwdForm">
        <div class="xdf-input-wrap">
          <input type="text" class="xdf-input" id="xdfPwdInput" placeholder="姓名拼音@xdf.cn" autocomplete="off">
        </div>
        <button class="xdf-btn" id="xdfPwdBtn">进 入</button>
        <div class="xdf-error" id="xdfError"></div>
      </div>
    </div>
  `;
  document.documentElement.appendChild(overlay);

  var pwdForm=document.getElementById('xdfPwdForm');
  var pwdInput=document.getElementById('xdfPwdInput');
  var pwdBtn=document.getElementById('xdfPwdBtn');
  var errorEl=document.getElementById('xdfError');
  var card=document.getElementById('xdfCard');

  function showPwdForm(){
    pwdForm.style.display='block';
    setTimeout(function(){pwdInput.focus();},100);
  }

  function verifyPwd(){
    var val=pwdInput.value.trim();
    if(isValidEmail(val)){
      setAuth('email',val);
      location.reload();
    }else{
      errorEl.textContent='请输入有效的 @xdf.cn 邮箱';
      errorEl.classList.add('show');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      pwdInput.value='';
      pwdInput.focus();
      setTimeout(function(){card.classList.remove('shake');errorEl.classList.remove('show');},1500);
    }
  }

  pwdBtn.addEventListener('click',verifyPwd);
  pwdInput.addEventListener('keydown',function(e){
    if(e.key==='Enter')verifyPwd();
  });

  showPwdForm();
})();
