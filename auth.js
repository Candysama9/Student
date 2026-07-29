/**
 * XDF数据看板 - 统一身份数证模块 v11
 * Dark Tech Liquid Glass UI · 三级权限 · 邮箱验证（@xdf.cn）· 方正大标宋简体
 *
 * UI设计来源: 6a695e1aa9b20f8243ce39e0 任务流
 * 权限层级：
 *   Level 1 - 邮箱验证（@xdf.cn）→ 可看各校看板概览
 *   Level 2 - 27+城市拼音 → 校区管理员
 *   Level 3 - 27rk → 最高管理员
 */
(function(){
  'use strict';

  // ==================== 配置区 ====================
  var EMAIL_REGEX=/^[a-zA-Z0-9._-]+@xdf\.cn$/;
  var AUTH_EXPIRY=8*3600*1000;
  var IS_CLOUDFLARE=true;
  var DATA_WORKER_URL=(IS_CLOUDFLARE?'/api':'');
  var TOP_ADMIN_PWD='27rk';
  var TOP_ADMIN_PAGES=['center_dashboard.html'];
  // =================================================

  var AUTH_KEY='xdf_authed';
  var AUTH_TS_KEY='xdf_auth_ts';
  var AUTH_METHOD_KEY='xdf_auth_method';
  var AUTH_EMAIL_KEY='xdf_auth_email';
  var TOP_ADMIN_KEY='xdf_top_admin';
  var SCHOOL_ADMIN_KEY='xdf_school_admin';
  var SCHOOL_CITY_KEY='xdf_school_city';

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
        clearAllAuth();
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

  function clearAllAuth(){
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_TS_KEY);
    sessionStorage.removeItem(AUTH_METHOD_KEY);
    sessionStorage.removeItem(AUTH_EMAIL_KEY);
    sessionStorage.removeItem(TOP_ADMIN_KEY);
    sessionStorage.removeItem(SCHOOL_ADMIN_KEY);
    sessionStorage.removeItem(SCHOOL_CITY_KEY);
  }

  function getToken(){return sessionStorage.getItem(AUTH_EMAIL_KEY)||'';}

  function isTopAdminPage(){
    var path=location.pathname.split('/').pop()||'';
    return TOP_ADMIN_PAGES.indexOf(path)>=0;
  }

  function isTopAdminVerified(){
    return sessionStorage.getItem(TOP_ADMIN_KEY)==='1';
  }

  function isSchoolAdmin(){
    return sessionStorage.getItem(SCHOOL_ADMIN_KEY)==='1';
  }

  function getSchoolCity(){
    return sessionStorage.getItem(SCHOOL_CITY_KEY)||'';
  }

  function setSchoolAdmin(city){
    sessionStorage.setItem(SCHOOL_ADMIN_KEY,'1');
    sessionStorage.setItem(SCHOOL_CITY_KEY,(city||'').trim());
  }

  function clearSchoolAdmin(){
    sessionStorage.removeItem(SCHOOL_ADMIN_KEY);
    sessionStorage.removeItem(SCHOOL_CITY_KEY);
  }

  function getLevel(){
    if(sessionStorage.getItem(AUTH_KEY)!=='1')return 0;
    var ts=parseInt(sessionStorage.getItem(AUTH_TS_KEY)||'0');
    if(ts>0 && Date.now()-ts>AUTH_EXPIRY)return 0;
    if(isTopAdminVerified())return 3;
    if(isSchoolAdmin())return 2;
    return 1;
  }

  function canViewStudentDetails(){return getLevel()>=2;}
  function canDownload(){return getLevel()>=2;}

  function logout(){
    clearAllAuth();
    location.reload();
  }

  window.XDF_AUTH={
    isAuthed:isAuthed,
    getToken:getToken,
    getWorkerUrl:function(){return DATA_WORKER_URL;},
    hasWorker:function(){return IS_CLOUDFLARE;},
    getEmail:function(){return sessionStorage.getItem(AUTH_EMAIL_KEY)||'';},
    getLevel:getLevel,
    isTopAdmin:function(){return isTopAdminVerified();},
    isSchoolAdmin:isSchoolAdmin,
    getSchoolCity:getSchoolCity,
    setSchoolAdmin:setSchoolAdmin,
    clearSchoolAdmin:clearSchoolAdmin,
    canViewStudentDetails:canViewStudentDetails,
    canDownload:canDownload,
    requireTopAdmin:function(){return isTopAdminPage()&&!isTopAdminVerified();},
    logout:logout
  };

  // ==================== 注入样式 ====================
  var styleEl=document.createElement('style');
  styleEl.textContent=`
@font-face{
  font-family:'FZDaBiaoSong';
  src:local('方正大标宋简体'),local('FZDaBiaoSongJianTi'),local('FZDBSJW--GB1-0'),
      url('FZDBSJW.woff') format('woff');
  font-display:swap
}

/* ---- SVG icon helpers ---- */
.xdf-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.xdf-icon svg{width:100%;height:100%}

@keyframes xdfCardEntrance{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes xdfShake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-4px)}20%,40%,60%,80%{transform:translateX(4px)}}
@keyframes xdfBtnPulse{0%,100%{box-shadow:0 12px 32px -8px rgba(34,211,238,.45),inset 0 1px 0 rgba(255,255,255,.25)}50%{box-shadow:0 12px 40px -4px rgba(34,211,238,.6),inset 0 1px 0 rgba(255,255,255,.3)}}

#xdf-auth-gate{
  position:fixed;inset:0;z-index:2147483647;
  display:flex;align-items:center;justify-content:center;
  font-family:'FZDaBiaoSong','方正大标宋简体',"Inter","Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;
  padding:24px 20px;overflow:hidden;
}
#xdf-auth-gate *{margin:0;padding:0;box-sizing:border-box}

/* ---- Ambient dark-tech background ---- */
#xdf-auth-gate .xdf-bg{
  position:absolute;inset:0;z-index:-2;
  background-color:#070B14;
  background-image:
    radial-gradient(circle at 18% 22%,rgba(34,211,238,.18),transparent 45%),
    radial-gradient(circle at 82% 78%,rgba(56,189,248,.13),transparent 50%),
    radial-gradient(circle at 50% 96%,rgba(34,211,238,.08),transparent 55%);
}
#xdf-auth-gate .xdf-bg::before{
  content:"";position:absolute;inset:0;
  background-image:radial-gradient(rgba(238,246,255,.9) 1px,transparent 1px);
  background-size:30px 30px;opacity:.04;pointer-events:none;
}

/* ---- Glass card ---- */
#xdf-auth-gate .xdf-card{
  position:relative;z-index:1;
  width:min(92vw,480px);
  padding:clamp(36px,5vw,48px);
  background:rgba(255,255,255,.055);
  -webkit-backdrop-filter:blur(28px) saturate(180%);
  backdrop-filter:blur(28px) saturate(180%);
  border:1px solid rgba(255,255,255,.12);
  border-radius:28px;
  box-shadow:0 8px 40px -8px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.10);
  display:flex;flex-direction:column;align-items:center;text-align:center;
  animation:xdfCardEntrance 480ms cubic-bezier(.32,.72,0,1) both;
}
#xdf-auth-gate .xdf-card.shake{animation:xdfShake .35s}

/* ---- Circular frosted-glass icon badge ---- */
#xdf-auth-gate .xdf-icon-badge{
  width:64px;height:64px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.06);
  -webkit-backdrop-filter:blur(16px) saturate(160%);
  backdrop-filter:blur(16px) saturate(160%);
  border:1px solid rgba(255,255,255,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 4px 16px -4px rgba(34,211,238,.25);
}
#xdf-auth-gate .xdf-icon-badge .xdf-icon{width:28px;height:28px;color:#22D3EE}

/* ---- Title area ---- */
#xdf-auth-gate .xdf-title{
  margin-top:28px;
  font-size:clamp(26px,4vw,34px);
  font-weight:600;letter-spacing:-.01em;
  color:#EEF6FF;text-wrap:balance;
}
#xdf-auth-gate .xdf-subtitle{
  margin-top:10px;font-size:15px;
  color:rgba(238,246,255,.62);text-wrap:balance;
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
}

/* ---- Form + input ---- */
#xdf-auth-gate .xdf-form{
  width:100%;display:flex;flex-direction:column;align-items:center;margin-top:32px;
}
#xdf-auth-gate .xdf-input-wrap{
  position:relative;width:100%;height:60px;
  display:flex;align-items:center;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.12);
  border-radius:16px;
  transition:border-color 200ms ease,box-shadow 200ms ease,background-color 200ms ease;
}
#xdf-auth-gate .xdf-input-wrap:focus-within{
  border-color:#22D3EE;
  box-shadow:0 0 0 3px rgba(34,211,238,.18);
  background:rgba(255,255,255,.09);
}
#xdf-auth-gate .xdf-input-wrap .xdf-input-icon{
  position:absolute;left:16px;top:50%;transform:translateY(-50%);
  width:20px;height:20px;color:rgba(238,246,255,.62);pointer-events:none;
}
#xdf-auth-gate .xdf-input{
  width:100%;height:100%;background:transparent;border:none;outline:none;
  color:#EEF6FF;font-size:16px;line-height:1;
  padding:0 18px 0 48px;border-radius:16px;
  font-family:inherit;letter-spacing:.02em;
}
#xdf-auth-gate .xdf-input::placeholder{color:rgba(238,246,255,.40)}

/* ---- Circular CTA button ---- */
#xdf-auth-gate .xdf-btn{
  width:96px;height:96px;min-width:96px;
  border-radius:999px;border:none;
  margin:36px auto 0;
  background:linear-gradient(145deg,#22D3EE 0%,#0891B2 100%);
  color:#04181D;font-size:17px;font-weight:600;
  font-family:inherit;letter-spacing:.04em;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 12px 32px -8px rgba(34,211,238,.45),inset 0 1px 0 rgba(255,255,255,.25);
  transition:transform 220ms cubic-bezier(.32,.72,0,1),box-shadow 220ms ease;
}
#xdf-auth-gate .xdf-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 18px 40px -8px rgba(34,211,238,.55),inset 0 1px 0 rgba(255,255,255,.30);
}
#xdf-auth-gate .xdf-btn:active{transform:translateY(0) scale(.98)}
#xdf-auth-gate .xdf-btn:focus-visible{
  outline:none;
  box-shadow:0 12px 32px -8px rgba(34,211,238,.45),0 0 0 3px rgba(34,211,238,.35),inset 0 1px 0 rgba(255,255,255,.25);
}

/* ---- Error message ---- */
#xdf-auth-gate .xdf-error{
  color:#F87171;font-size:13px;height:20px;margin-top:12px;
  opacity:0;transition:opacity .2s;
}
#xdf-auth-gate .xdf-error.show{opacity:1}

/* ---- Footnote ---- */
#xdf-auth-gate .xdf-footnote{
  margin-top:28px;font-size:13px;line-height:1.5;
  color:rgba(238,246,255,.40);
  display:flex;align-items:center;justify-content:center;gap:6px;
}
#xdf-auth-gate .xdf-footnote .xdf-icon{width:14px;height:14px;color:rgba(238,246,255,.40)}

@media(prefers-reduced-motion:reduce){
  #xdf-auth-gate .xdf-card,#xdf-auth-gate .xdf-btn,#xdf-auth-gate .xdf-input-wrap{
    animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;
  }
}
@media(max-width:480px){
  #xdf-auth-gate{padding:16px 12px}
  #xdf-auth-gate .xdf-card{padding:32px 24px 28px}
  #xdf-auth-gate .xdf-btn{width:84px;height:84px;min-width:84px;font-size:15px}
}
`;
  document.head.appendChild(styleEl);

  // ==================== SVG Icons (inline, no CDN dependency) ====================
  var SVG_FINGERPRINT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 12h4"/><path d="M21 8v4"/><path d="M11 2c-1.5 1.5-2 4-2 6a2 2 0 0 1-2 2c-1 0-2-.5-2-2"/><path d="M19.5 13c-.5 3-1 6.5-3 9"/></svg>';
  var SVG_KEY='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>';
  var SVG_SHIELD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m12 8 v4"/><path d="m12 16 .01 0"/></svg>';
  var SVG_LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  // ==================== 创建遮罩层 ====================
  function createGate(title,subtitle,hint,mode){
    var hasHint=hint&&hint.length>0;
    var hasSubtitle=subtitle&&subtitle.length>0;
    var iconSvg=(mode==='admin')?SVG_LOCK:SVG_FINGERPRINT;
    var overlay=document.createElement('div');
    overlay.id='xdf-auth-gate';
    overlay.innerHTML=`
      <div class="xdf-bg"></div>
      <div class="xdf-card" id="xdfCard">
        <div class="xdf-icon-badge">
          <span class="xdf-icon">${iconSvg}</span>
        </div>
        <h1 class="xdf-title">${title}</h1>
        ${hasSubtitle?'<p class="xdf-subtitle">'+subtitle+'</p>':''}
        <form class="xdf-form" id="xdfForm" autocomplete="off">
          <div class="xdf-input-wrap">
            <span class="xdf-icon xdf-input-icon">${SVG_KEY}</span>
            <input type="text" class="xdf-input" id="xdfInput" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="${mode==='admin'?'管理员密码':'邮箱地址'}">
          </div>
          <button type="submit" class="xdf-btn" id="xdfBtn">进入</button>
          <div class="xdf-error" id="xdfError"></div>
        </form>
        ${hasHint?'<p class="xdf-footnote"><span class="xdf-icon">'+SVG_SHIELD+'</span><span>'+hint+'</span></p>':''}
      </div>
    `;
    document.documentElement.appendChild(overlay);

    var input=document.getElementById('xdfInput');
    var btn=document.getElementById('xdfBtn');
    var errorEl=document.getElementById('xdfError');
    var card=document.getElementById('xdfCard');
    var form=document.getElementById('xdfForm');

    function showError(msg){
      errorEl.textContent=msg;
      errorEl.classList.add('show');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      input.value='';
      input.focus();
      setTimeout(function(){card.classList.remove('shake');errorEl.classList.remove('show');},1500);
    }

    function verify(){
      var val=input.value.trim();
      if(mode==='email'){
        if(isValidEmail(val)){
          setAuth('email',val);
          location.reload();
        }else{
          showError('请输入有效的 @xdf.cn 邮箱');
        }
      }else if(mode==='admin'){
        if(val===TOP_ADMIN_PWD){
          sessionStorage.setItem(TOP_ADMIN_KEY,'1');
          location.reload();
        }else{
          showError('密码错误');
        }
      }
    }

    form.addEventListener('submit',function(e){e.preventDefault();verify();});

    setTimeout(function(){input.focus();},100);
  }

  // ==================== 主逻辑 ====================
  if(!isAuthed()){
    createGate('身份验证','请输入访问密钥以继续','仅限新东方内部人员访问','email');
    return;
  }

  if(isTopAdminPage()&&!isTopAdminVerified()){
    createGate('管理员验证','','','admin');
    return;
  }
})();
