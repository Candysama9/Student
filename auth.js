/**
 * XDF数据看板 - 统一身份数证模块 v10
 * 液态玻璃 · 三级权限 · 邮箱验证（@xdf.cn）· 方正大标宋简体
 *
 * 权限层级：
 *   Level 1 - 邮箱验证（@xdf.cn）→ 可看各校看板概览（KPI/教师排名/图表），无学员详表/下载
 *   Level 2 - 27+城市拼音（如 27chengdu）→ 校区管理员，可看本校学员详表+下载（服务端校验）
 *   Level 3 - 27rk → 最高管理员，可进选校主页（index.html）+ 总看板（center_dashboard.html）
 *
 * 安全说明：
 *   - Level 1 邮箱格式前端校验（@xdf.cn 正则）
 *   - Level 2 校区密码由服务端校验（加载学员数据时），前端不存储/不暴露校区密码
 *   - Level 3 最高管理员密码仅做 UI 门禁，实际数据保护在服务端
 */
(function(){
  'use strict';

  // ==================== 配置区 ====================
  var EMAIL_REGEX=/^[a-zA-Z0-9._-]+@xdf\.cn$/;
  var AUTH_EXPIRY=8*3600*1000;
  var IS_CLOUDFLARE=true;/* 阿里云部署始终启用API */
  var DATA_WORKER_URL=(IS_CLOUDFLARE?'/api':'');
  var TOP_ADMIN_PWD='27rk';
  var TOP_ADMIN_PAGES=['index.html','center_dashboard.html',''];
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

  // ---- Level 2: 校区管理员（服务端校验后由前端记录状态）----
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

  // ---- 权限层级 ----
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

@keyframes xdfShake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-4px)}20%,40%,60%,80%{transform:translateX(4px)}}
@keyframes xdfFadeIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes xdfSheen{0%{transform:translateX(-120%) skewX(-15deg)}100%{transform:translateX(220%) skewX(-15deg)}}
@keyframes xdfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes xdfOrbDrift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-15px) scale(1.05)}}
@keyframes xdfOrbDrift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-18px,15px) scale(1.08)}}

#xdf-auth-gate{
  position:fixed;inset:0;z-index:2147483647;
  display:flex;align-items:center;justify-content:center;
  font-family:'FZDaBiaoSong','方正大标宋简体',-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Segoe UI",sans-serif;
  padding:20px;overflow:hidden;
}
#xdf-auth-gate *{margin:0;padding:0;box-sizing:border-box}

#xdf-auth-gate .xdf-bg{
  position:absolute;inset:0;z-index:-2;
  background:
    radial-gradient(ellipse 60% 50% at 20% 15%,rgba(100,140,255,.12),transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 85%,rgba(160,130,240,.10),transparent 60%),
    radial-gradient(ellipse 40% 30% at 50% 50%,rgba(255,149,0,.04),transparent 60%),
    linear-gradient(160deg,#f5f7fb 0%,#eef1f8 40%,#f2eef8 70%,#f6f4fc 100%);
}
.xdf-orb{position:absolute;border-radius:50%;filter:blur(40px);z-index:-1;pointer-events:none}
.xdf-orb-1{width:200px;height:200px;top:-5%;left:-3%;background:radial-gradient(circle,rgba(100,140,255,.12),transparent 70%);animation:xdfOrbDrift1 14s ease-in-out infinite}
.xdf-orb-2{width:180px;height:180px;bottom:5%;right:-3%;background:radial-gradient(circle,rgba(255,149,0,.08),transparent 70%);animation:xdfOrbDrift2 16s ease-in-out infinite}

.xdf-card{
  position:relative;overflow:hidden;width:100%;max-width:260px;padding:30px 24px 16px;
  border-radius:22px;text-align:center;
  background:rgba(255,255,255,.40);
  border:1px solid rgba(255,255,255,.70);
  box-shadow:
    0 12px 40px rgba(60,80,120,.10),
    0 2px 8px rgba(60,80,120,.04),
    inset 0 1px 1px rgba(255,255,255,.85);
  backdrop-filter:blur(36px) saturate(200%);-webkit-backdrop-filter:blur(36px) saturate(200%);
  animation:xdfFadeIn .45s cubic-bezier(.4,0,.2,1);
}
.xdf-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:50%;border-radius:22px 22px 0 0;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.35) 0%,transparent 100%);
}
.xdf-card::after{
  content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.15) 45%,rgba(255,255,255,.02) 55%,transparent 70%);
  background-size:300% 100%;animation:xdfSheen 8s ease-in-out infinite;
}

.xdf-card h2{
  font-size:1.05rem;font-weight:800;color:#2c2c3e;
  position:relative;z-index:1;letter-spacing:4px;margin-bottom:20px;
}

.xdf-input-wrap{position:relative;z-index:1}
.xdf-input{
  width:100%;padding:10px 14px;border-radius:12px;
  border:1.5px solid rgba(200,210,230,.45);
  background:rgba(255,255,255,.50);
  font-size:.82rem;font-weight:600;color:#2c2c3e;outline:none;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  transition:border-color .2s,box-shadow .2s,background .2s;
  font-family:inherit;letter-spacing:.5px;
}
.xdf-input:focus{
  border-color:rgba(255,149,0,.35);
  background:rgba(255,255,255,.65);
  box-shadow:0 0 0 3px rgba(255,149,0,.06);
}
.xdf-input::placeholder{color:transparent}

.xdf-btn-wrap{display:flex;justify-content:center;margin-top:16px;position:relative;z-index:1}
.xdf-btn{
  display:inline-flex;align-items:center;justify-content:center;
  width:100%;padding:10px 24px;border-radius:999px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#FF9500 0%,#FF7800 50%,#FF6B00 100%);
  color:#fff;font-size:.78rem;font-weight:700;
  transition:transform .15s,box-shadow .2s,opacity .2s;
  font-family:inherit;letter-spacing:5px;
  box-shadow:0 4px 18px rgba(255,149,0,.28),inset 0 1px 2px rgba(255,255,255,.3);
  position:relative;overflow:hidden;
}
.xdf-btn::after{
  content:'';position:absolute;top:0;left:0;width:40%;height:100%;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
  animation:xdfSheen 4s ease-in-out infinite;
}
.xdf-btn:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(255,149,0,.38)}
.xdf-btn:active{transform:translateY(0)}

.xdf-error{
  color:#e85a5a;font-size:.65rem;height:14px;margin-top:6px;
  opacity:0;transition:opacity .2s;position:relative;z-index:1;font-weight:500;
}
.xdf-error.show{opacity:1}
.xdf-card.shake{animation:xdfShake .35s}

.xdf-hint{
  font-size:.62rem;color:#b0b0c0;margin-top:12px;
  position:relative;z-index:1;letter-spacing:.5px;
}

@media(max-width:480px){
  .xdf-card{max-width:230px;padding:26px 20px 14px;border-radius:18px}
  .xdf-card h2{font-size:.95rem;letter-spacing:3px;margin-bottom:16px}
  .xdf-btn{letter-spacing:4px;padding:9px}
}
`;
  document.head.appendChild(styleEl);

  // ==================== 创建遮罩层 ====================
  function createGate(title,hint,mode){
    var hasHint=hint&&hint.length>0;
    var overlay=document.createElement('div');
    overlay.id='xdf-auth-gate';
    overlay.innerHTML=`
      <div class="xdf-bg"></div>
      <div class="xdf-orb xdf-orb-1"></div>
      <div class="xdf-orb xdf-orb-2"></div>
      <div class="xdf-card" id="xdfCard">
        <h2>${title}</h2>
        <div id="xdfPwdForm">
          <div class="xdf-input-wrap">
            <input type="text" class="xdf-input" id="xdfPwdInput" autocomplete="off" autocapitalize="none" spellcheck="false">
          </div>
          <div class="xdf-btn-wrap">
            <button class="xdf-btn" id="xdfPwdBtn">进 入</button>
          </div>
          <div class="xdf-error" id="xdfError"></div>
        </div>
        ${hasHint?'<div class="xdf-hint">'+hint+'</div>':''}
      </div>
    `;
    document.documentElement.appendChild(overlay);

    var pwdInput=document.getElementById('xdfPwdInput');
    var pwdBtn=document.getElementById('xdfPwdBtn');
    var errorEl=document.getElementById('xdfError');
    var card=document.getElementById('xdfCard');

    function showError(msg){
      errorEl.textContent=msg;
      errorEl.classList.add('show');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      pwdInput.value='';
      pwdInput.focus();
      setTimeout(function(){card.classList.remove('shake');errorEl.classList.remove('show');},1500);
    }

    function verify(){
      var val=pwdInput.value.trim();
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

    pwdBtn.addEventListener('click',verify);
    pwdInput.addEventListener('keydown',function(e){
      if(e.key==='Enter')verify();
    });

    setTimeout(function(){pwdInput.focus();},100);
  }

  // ==================== 主逻辑 ====================
  // 第一道门：邮箱验证（@xdf.cn）→ Level 1
  if(!isAuthed()){
    createGate('身份验证','仅限新东方内部人员访问','email');
    return;
  }

  // 第二道门：最高管理员密码（仅 index.html / center_dashboard.html）→ Level 3
  if(isTopAdminPage()&&!isTopAdminVerified()){
    createGate('管理员验证','','admin');
    return;
  }
})();
