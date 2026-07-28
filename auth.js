/**
 * XDF数据看板 - 统一身份数证模块 v5
 * 液态玻璃设计 · 邮箱验证（@xdf.cn）· 方正大标宋简体
 */
(function(){
  'use strict';

  // ==================== 配置区 ====================
  var EMAIL_REGEX=/^[a-zA-Z0-9._-]+@xdf\.cn$/;
  var AUTH_EXPIRY=8*3600*1000;
  var IS_CLOUDFLARE=location.hostname.endsWith('.pages.dev')||location.hostname.endsWith('.workers.dev');
  var DATA_WORKER_URL=(IS_CLOUDFLARE?(location.hostname.endsWith('.pages.dev')?'/api':''):'');
  // =================================================

  var AUTH_KEY='xdf_authed';
  var AUTH_TS_KEY='xdf_auth_ts';
  var AUTH_METHOD_KEY='xdf_auth_method';
  var AUTH_EMAIL_KEY='xdf_auth_email';

  function isValidEmail(val){return EMAIL_REGEX.test(val.trim());}

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

  function getToken(){return sessionStorage.getItem(AUTH_EMAIL_KEY)||'';}

  window.XDF_AUTH={
    isAuthed:isAuthed,
    getToken:getToken,
    getWorkerUrl:function(){return DATA_WORKER_URL;},
    hasWorker:function(){return IS_CLOUDFLARE;},
    getEmail:function(){return sessionStorage.getItem(AUTH_EMAIL_KEY)||'';}
  };

  if(isAuthed())return;

  // ==================== 注入样式 ====================
  var styleEl=document.createElement('style');
  styleEl.textContent=`
@font-face{
  font-family:'FZDaBiaoSong';
  src:local('方正大标宋简体'),local('FZDaBiaoSongJianTi'),local('FZDBSJW--GB1-0'),
      url('FZDBSJW.woff') format('woff');
  font-display:swap
}

@keyframes xdfOrbDrift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.08)}}
@keyframes xdfOrbDrift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,20px) scale(1.12)}}
@keyframes xdfOrbDrift3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(15px,25px) scale(.92)}}
@keyframes xdfShake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-6px)}20%,40%,60%,80%{transform:translateX(6px)}}
@keyframes xdfSpin{to{transform:rotate(360deg)}}
@keyframes xdfSpecular{0%{background-position:0% 0%}50%{background-position:100% 0%}100%{background-position:0% 0%}}
@keyframes xdfFadeIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes xdfGradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes xdfPulseRing{0%{transform:scale(.92);opacity:.5}50%{transform:scale(1.06);opacity:.15}100%{transform:scale(.92);opacity:.5}}
@keyframes xdfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}

#xdf-auth-gate{
  position:fixed;inset:0;z-index:2147483647;
  display:flex;align-items:center;justify-content:center;
  font-family:'FZDaBiaoSong','方正大标宋简体',-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Segoe UI",sans-serif;
  padding:20px;overflow:hidden;
}
#xdf-auth-gate *{margin:0;padding:0;box-sizing:border-box}

#xdf-auth-gate .xdf-bg{
  position:absolute;inset:0;z-index:-2;
  background:linear-gradient(135deg,#e8ecf6 0%,#f0ebf8 40%,#e8f0f5 70%,#f5f0fa 100%);
}
.xdf-orb{position:absolute;border-radius:50%;filter:blur(50px);z-index:-1}
.xdf-orb-1{width:300px;height:300px;top:-8%;left:-3%;background:radial-gradient(circle,rgba(0,122,255,.20),transparent 70%);animation:xdfOrbDrift1 12s ease-in-out infinite}
.xdf-orb-2{width:280px;height:280px;top:45%;right:-5%;background:radial-gradient(circle,rgba(88,86,214,.18),transparent 70%);animation:xdfOrbDrift2 15s ease-in-out infinite}
.xdf-orb-3{width:240px;height:240px;bottom:-3%;left:25%;background:radial-gradient(circle,rgba(0,199,190,.14),transparent 70%);animation:xdfOrbDrift3 10s ease-in-out infinite}

.xdf-card{
  position:relative;overflow:hidden;width:100%;max-width:250px;padding:28px 22px 18px;
  border-radius:22px;text-align:center;
  background:rgba(255,255,255,.32);
  border:1px solid rgba(255,255,255,.65);
  box-shadow:0 20px 50px rgba(0,0,0,.08),0 0 0 1px rgba(255,255,255,.12) inset,inset 0 1px 2px rgba(255,255,255,.7);
  backdrop-filter:blur(44px) saturate(240%);-webkit-backdrop-filter:blur(44px) saturate(240%);
  animation:xdfFadeIn .5s cubic-bezier(.4,0,.2,1);
}
.xdf-card::before{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(255,255,255,.5),transparent 70%);
  opacity:.5;
}
.xdf-card::after{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.18) 45%,rgba(255,255,255,.03) 55%,transparent 70%);
  background-size:300% 100%;animation:xdfSpecular 8s ease-in-out infinite;
}

.xdf-logo{
  width:40px;height:40px;margin:0 auto 14px;position:relative;z-index:1;
  animation:xdfFloat 3.5s ease-in-out infinite;
}
.xdf-logo-ring{
  position:absolute;inset:-5px;border-radius:50%;
  background:linear-gradient(135deg,rgba(0,122,255,.25),rgba(88,86,214,.25),rgba(0,199,190,.25));
  opacity:.4;animation:xdfPulseRing 3s ease-in-out infinite;
}
.xdf-logo-inner{
  position:absolute;inset:0;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#007AFF 0%,#5856D6 50%,#00C7BE 100%);
  background-size:200% 200%;animation:xdfGradShift 6s ease infinite;
  box-shadow:0 6px 22px rgba(0,122,255,.30),inset 0 1px 3px rgba(255,255,255,.5),inset 0 -2px 5px rgba(0,0,0,.08);
}
.xdf-logo-inner svg{width:20px;height:20px;fill:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.12))}

.xdf-input-wrap{position:relative;z-index:1}
.xdf-input-icon{
  position:absolute;left:12px;top:50%;transform:translateY(-50%);
  width:14px;height:14px;opacity:.35;z-index:1;pointer-events:none;
}
.xdf-input{
  width:100%;padding:10px 14px 10px 34px;border-radius:10px;
  border:1.5px solid rgba(255,255,255,.55);
  background:rgba(255,255,255,.40);
  font-size:.85rem;font-weight:700;color:#1a1a2e;outline:none;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  transition:border-color .25s,box-shadow .25s,background .25s;
  font-family:inherit;letter-spacing:.5px;
}
.xdf-input:focus{
  border-color:#007AFF;
  background:rgba(255,255,255,.60);
  box-shadow:0 0 0 3px rgba(0,122,255,.10);
}
.xdf-input::placeholder{color:#a0a0b0;font-weight:400}

.xdf-btn-wrap{display:flex;justify-content:center;margin-top:14px;position:relative;z-index:1}
.xdf-btn{
  display:inline-block;width:100%;padding:10px;border-radius:999px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#007AFF,#5856D6);
  background-size:200% 200%;animation:xdfGradShift 6s ease infinite;
  color:#fff;font-size:.82rem;font-weight:700;
  transition:transform .15s,box-shadow .25s;
  font-family:inherit;letter-spacing:4px;
  box-shadow:0 3px 16px rgba(0,122,255,.30);
  position:relative;overflow:hidden;
}
.xdf-btn::before{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,transparent 50%);
}
.xdf-btn:hover{transform:translateY(-2px);box-shadow:0 5px 20px rgba(0,122,255,.40)}
.xdf-btn:active{transform:translateY(0)}

.xdf-error{
  color:#FF3B30;font-size:.68rem;height:16px;margin-top:8px;
  opacity:0;transition:opacity .2s;position:relative;z-index:1;font-weight:500;
}
.xdf-error.show{opacity:1}
.xdf-card.shake{animation:xdfShake .4s}

.xdf-hint{
  font-size:.65rem;color:#a8a8b8;margin-top:12px;
  position:relative;z-index:1;letter-spacing:.5px;
}

.xdf-dt-status{
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding:16px 0;font-size:.82rem;color:#5856D6;position:relative;z-index:1;font-weight:600;
}
.xdf-dt-spinner{
  width:20px;height:20px;border:2.5px solid rgba(88,86,214,.2);
  border-top-color:#5856D6;border-radius:50%;animation:xdfSpin .7s linear infinite;
}

@media(max-width:480px){
  .xdf-card{padding:24px 20px 16px;border-radius:18px}
  .xdf-logo{width:36px;height:36px}
  .xdf-btn{letter-spacing:3px;padding:9px}
}
`;
  document.head.appendChild(styleEl);

  // ==================== 创建遮罩层 ====================
  var overlay=document.createElement('div');
  overlay.id='xdf-auth-gate';
  overlay.innerHTML=`
    <div class="xdf-bg"></div>
    <div class="xdf-orb xdf-orb-1"></div>
    <div class="xdf-orb xdf-orb-2"></div>
    <div class="xdf-orb xdf-orb-3"></div>
    <div class="xdf-card" id="xdfCard">
      <div class="xdf-logo">
        <div class="xdf-logo-ring"></div>
        <div class="xdf-logo-inner">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        </div>
      </div>
      <div id="xdfPwdForm">
        <div class="xdf-input-wrap">
          <svg class="xdf-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 7l-10 5L2 7"/>
          </svg>
          <input type="text" class="xdf-input" id="xdfPwdInput" autocomplete="off" placeholder="name@xdf.cn">
        </div>
        <div class="xdf-btn-wrap">
          <button class="xdf-btn" id="xdfPwdBtn">进 入</button>
        </div>
        <div class="xdf-error" id="xdfError"></div>
      </div>
      <div class="xdf-hint">仅限新东方内部人员访问</div>
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
