/**
 * XDF数据看板 - 统一身付认证模块
 *
 * 使用方式：在所有HTML页面的 <head> 最前面添加 <script src="auth.js"></script>
 *
 * 认证流程：
 * 1. 在钉钉客户端内打开 → 自动验证（需配置corpId并注册微应用）
 * 2. 非钉钉客户端 → 密码验证
 * 3. 验证通过后 8小时内免重新验证（sessionStorage）
 *
 * 钉钉配置步骤（可选，配置后启用自动验证）：
 * 1. 登录 钉钉开放平台 https://open-dev.dingtalk.com/
 * 2. 创建「企业内部应用」→「H5微应用」
 * 3. 应用首页地址填：https://candysama9.github.io/Student/index.html
 * 4. 在「安全域名」中添加：candysama9.github.io
 * 5. 在「企业信息」中找到 corpId
 * 6. 将下方 DINGTALK_CORP_ID 填入
 */
(function(){
  'use strict';

  // ==================== 配置区 ====================
  var PASSWORD='27rk';                      // 访问密码
  var DINGTALK_CORP_ID='';                  // 钉钉企业corpId（留空=不启用钉钉自动验证，仅用密码）
  var AUTH_EXPIRY=8*3600*1000;              // 认证有效期：8小时
  // =================================================

  var AUTH_KEY='center_unlocked';
  var AUTH_TS_KEY='xdf_auth_ts';

  // 检查是否已认证
  function isAuthed(){
    try{
      // 方式1：URL参数 ?k=密码（兼容中心看板跳转链接）
      var urlK=new URLSearchParams(location.search).get('k');
      if(urlK===PASSWORD){
        setAuth('url');
        // 清除URL中的密码参数
        var url=new URL(location.href);
        url.searchParams.delete('k');
        history.replaceState(null,'',url.toString());
        return true;
      }
      // 方式2：sessionStorage
      if(sessionStorage.getItem(AUTH_KEY)!=='1')return false;
      var ts=parseInt(sessionStorage.getItem(AUTH_TS_KEY)||'0');
      if(ts>0 && Date.now()-ts>AUTH_EXPIRY){
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_TS_KEY);
        return false;
      }
      return true;
    }catch(e){return false;}
  }

  function setAuth(method){
    sessionStorage.setItem(AUTH_KEY,'1');
    sessionStorage.setItem(AUTH_TS_KEY,String(Date.now()));
  }

  function inDingTalk(){
    return /DingTalk/i.test(navigator.userAgent);
  }

  // 已认证 → 直接放行
  if(isAuthed())return;

  // ==================== 创建遮罩层 ====================
  var overlay=document.createElement('div');
  overlay.id='xdf-auth-gate';
  overlay.style.cssText=[
    'position:fixed','inset:0','z-index:2147483647',
    'display:flex','align-items:center','justify-content:center',
    'background:rgba(20,25,45,.35)',
    'backdrop-filter:blur(28px) saturate(200%)','-webkit-backdrop-filter:blur(28px) saturate(200%)',
    'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Segoe UI",sans-serif',
    'padding:20px'
  ].join(';');

  // 注入动画样式
  var styleEl=document.createElement('style');
  styleEl.textContent=`
    @keyframes xdfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes xdfShake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-6px)}20%,40%,60%,80%{transform:translateX(6px)}}
    @keyframes xdfSpin{to{transform:rotate(360deg)}}
    @keyframes xdfPulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes xdfFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    #xdf-auth-gate *{margin:0;padding:0;box-sizing:border-box}
    .xdf-card{
      position:relative;overflow:hidden;width:100%;max-width:400px;padding:44px 40px 36px;
      border-radius:28px;text-align:center;
      background:rgba(255,255,255,.35);
      border:1px solid rgba(255,255,255,.45);
      box-shadow:0 24px 64px rgba(0,0,0,.18),inset 0 1px 2px rgba(255,255,255,.6);
      backdrop-filter:blur(40px) saturate(220%);-webkit-backdrop-filter:blur(40px) saturate(220%);
    }
    .xdf-card::before{
      content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.5),transparent 60%);opacity:.5;
    }
    .xdf-card::after{
      content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.2) 45%,rgba(255,255,255,.05) 55%,transparent 70%);
      background-size:300% 100%;animation:xdfFlow 8s ease-in-out infinite;
    }
    .xdf-lock{
      width:68px;height:68px;margin:0 auto 20px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-size:2rem;
      background:linear-gradient(135deg,#007AFF,#5856D6);color:#fff;
      box-shadow:0 10px 30px rgba(0,122,255,.3),inset 0 1px 2px rgba(255,255,255,.4);
      position:relative;z-index:1;animation:xdfFloat 3s ease-in-out infinite;
    }
    .xdf-card h2{font-size:1.35rem;font-weight:800;color:#1a1a2e;margin-bottom:6px;position:relative;z-index:1}
    .xdf-sub{font-size:.82rem;color:#6e6e80;margin-bottom:24px;position:relative;z-index:1}
    .xdf-input-wrap{display:flex;gap:8px;margin-bottom:12px;position:relative;z-index:1}
    .xdf-input{
      flex:1;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.4);
      background:rgba(255,255,255,.5);font-size:.95rem;color:#1a1a2e;outline:none;
      backdrop-filter:blur(10px);transition:border-color .2s;
    }
    .xdf-input:focus{border-color:#007AFF;box-shadow:0 0 0 3px rgba(0,122,255,.15)}
    .xdf-input::placeholder{color:#9e9eaf}
    .xdf-btn{
      padding:12px 24px;border-radius:14px;border:none;cursor:pointer;
      background:linear-gradient(135deg,#007AFF,#5856D6);color:#fff;font-size:.9rem;font-weight:700;
      transition:transform .15s,box-shadow .2s;white-space:nowrap;
    }
    .xdf-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,122,255,.3)}
    .xdf-btn:active{transform:translateY(0)}
    .xdf-error{color:#FF3B30;font-size:.78rem;height:18px;margin-bottom:8px;opacity:0;transition:opacity .2s;position:relative;z-index:1}
    .xdf-error.show{opacity:1}
    .xdf-card.shake{animation:xdfShake .4s}
    .xdf-hint{font-size:.72rem;color:#9e9eaf;margin-top:16px;position:relative;z-index:1}
    .xdf-dt-status{
      display:flex;align-items:center;justify-content:center;gap:8px;
      padding:16px 0;font-size:.85rem;color:#5856D6;position:relative;z-index:1;
    }
    .xdf-dt-spinner{
      width:20px;height:20px;border:2.5px solid rgba(88,86,214,.2);
      border-top-color:#5856D6;border-radius:50%;animation:xdfSpin .7s linear infinite;
    }
    .xdf-footer{
      margin-top:20px;font-size:.7rem;color:#9e9eaf;position:relative;z-index:1;
    }
    .xdf-footer a{color:#007AFF;text-decoration:none}
    .xdf-dt-badge{
      display:inline-flex;align-items:center;gap:4px;padding:3px 12px;border-radius:100px;
      font-size:.68rem;font-weight:600;background:rgba(0,199,190,.12);color:#00C7BE;
      margin-bottom:16px;position:relative;z-index:1;
    }
  `;
  document.head.appendChild(styleEl);

  // 构建卡片HTML
  overlay.innerHTML=`
    <div class="xdf-card" id="xdfCard">
      <div class="xdf-lock">&#128274;</div>
      <h2>新东方数据看板</h2>
      <p class="xdf-sub" id="xdfSub">请输入访问密码以继续</p>
      <div id="xdfDtStatus" style="display:none" class="xdf-dt-status">
        <div class="xdf-dt-spinner"></div>
        <span>正在验证钉钉身份...</span>
      </div>
      <div id="xdfPwdForm">
        <div class="xdf-input-wrap">
          <input type="password" class="xdf-input" id="xdfPwdInput" placeholder="输入访问密码" autocomplete="off">
          <button class="xdf-btn" id="xdfPwdBtn">进入</button>
        </div>
        <div class="xdf-error" id="xdfError">密码错误，请重新输入</div>
      </div>
      <div class="xdf-hint" id="xdfHint"></div>
      <div class="xdf-footer">如有问题，钉钉联系 <a href="mailto:zhurongcheng@xdf.cn">zhurongcheng@xdf.cn</a></div>
    </div>
  `;
  document.documentElement.appendChild(overlay);

  var sub=document.getElementById('xdfSub');
  var pwdForm=document.getElementById('xdfPwdForm');
  var pwdInput=document.getElementById('xdfPwdInput');
  var pwdBtn=document.getElementById('xdfPwdBtn');
  var errorEl=document.getElementById('xdfError');
  var card=document.getElementById('xdfCard');
  var dtStatus=document.getElementById('xdfDtStatus');
  var hint=document.getElementById('xdfHint');

  // ==================== 密码验证 ====================
  function showPwdForm(){
    dtStatus.style.display='none';
    pwdForm.style.display='block';
    sub.textContent='请输入访问密码以继续';
    hint.textContent='';
    setTimeout(function(){pwdInput.focus();},50);
  }

  function verifyPwd(){
    var val=pwdInput.value.trim();
    if(val===PASSWORD){
      setAuth('password');
      // 刷新页面，让所有脚本读取新的认证状态
      location.reload();
    }else{
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

  // ==================== 钉钉自动验证 ====================
  function tryDingTalkAuth(){
    // 未配置corpId → 直接显示密码
    if(!DINGTALK_CORP_ID){
      showPwdForm();
      return;
    }

    // 不在钉钉客户端 → 显示密码+提示
    if(!inDingTalk()){
      showPwdForm();
      hint.innerHTML='💡 在<a href="https://im.dingtalk.com/" style="color:#007AFF">钉钉客户端</a>中打开本页面可自动验证身份，无需输入密码';
      return;
    }

    // 在钉钉客户端内 → 尝试JSSDK免登
    dtStatus.style.display='flex';
    pwdForm.style.display='none';
    sub.textContent='正在通过钉钉验证身份...';

    var script=document.createElement('script');
    script.src='https://g.alicdn.com/dingding/dingtalk-jsapi/2.15.2/dingtalk.open.js';
    script.onload=function(){
      var dd=window.dd;
      if(!dd){
        showPwdForm();
        hint.textContent='钉钉SDK加载失败，请使用密码登录';
        return;
      }

      dd.ready(function(){
        dd.runtime.permission.requestAuthCode({
          corpId:DINGTALK_CORP_ID,
          onSuccess:function(info){
            // 获取到authCode → 说明是XDF组织成员
            setAuth('dingtalk');
            location.reload();
          },
          onFail:function(){
            showPwdForm();
            hint.textContent='钉钉验证失败，请使用密码登录';
          }
        });
      });

      dd.error(function(){
        showPwdForm();
        hint.textContent='钉钉验证失败，请使用密码登录';
      });
    };
    script.onerror=function(){
      showPwdForm();
      hint.textContent='钉钉SDK加载失败，请使用密码登录';
    };
    document.head.appendChild(script);

    // 5秒超时
    setTimeout(function(){
      if(dtStatus.style.display!=='none'){
        showPwdForm();
        hint.textContent='验证超时，请使用密码登录';
      }
    },5000);
  }

  // 启动验证流程
  tryDingTalkAuth();
})();
