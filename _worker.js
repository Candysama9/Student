/**
 * XDF数据看板 - Cloudflare Pages _worker.js
 *
 * 功能：
 * - 静态文件（HTML/JS/CSS/字体）直接放行
 * - JSON数据文件需要 @xdf.cn 邮箱验证
 * - 邮箱访问日志记录到KV
 * - 管理员日志查看接口 /__logs?k=27rk
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@xdf\.cn$/;
const ADMIN_PASSWORD = '27rk';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // ===== 管理员日志查看接口 =====
    if (path === '/__logs') {
      const adminToken = url.searchParams.get('k') || '';
      if (adminToken !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {
          status: 401,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        });
      }
      // 如果没有KV绑定，返回提示
      if (!env.DASHBOARD_KV) {
        return new Response(JSON.stringify({error: 'KV not bound', hint: '请在Cloudflare Pages设置中绑定DASHBOARD_KV'}), {
          status: 500,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        });
      }
      const list = await env.DASHBOARD_KV.list({prefix: 'log_'});
      const logs = [];
      for (const key of list.keys) {
        try {
          const val = await env.DASHBOARD_KV.get(key.name, 'text');
          if (val) logs.push(JSON.parse(val));
        } catch(e) {}
      }
      logs.sort((a,b) => new Date(b.time) - new Date(a.time));

      // 按邮箱聚合统计
      const emailStats = {};
      for (const log of logs) {
        if (!emailStats[log.email]) {
          emailStats[log.email] = {email: log.email, count: 0, firstAccess: log.time, lastAccess: log.time, paths: new Set()};
        }
        emailStats[log.email].count++;
        if (new Date(log.time) < new Date(emailStats[log.email].firstAccess)) emailStats[log.email].firstAccess = log.time;
        if (new Date(log.time) > new Date(emailStats[log.email].lastAccess)) emailStats[log.email].lastAccess = log.time;
        if (log.path) emailStats[log.email].paths.add(log.path);
      }
      const summary = Object.values(emailStats).map(s => ({...s, paths: [...s.paths]}));

      return new Response(JSON.stringify({
        total_logins: logs.length,
        unique_emails: summary.length,
        summary: summary,
        recent_logs: logs.slice(0, 100)
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ===== JSON数据文件需要邮箱验证 =====
    if (path.endsWith('.json')) {
      const token = url.searchParams.get('k') || request.headers.get('X-Auth-Token') || '';

      if (!EMAIL_REGEX.test(token)) {
        return new Response(JSON.stringify({error: 'Unauthorized', hint: '需要 @xdf.cn 邮箱验证'}), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 从KV获取JSON数据
      const kvKey = path.replace(/^\//, '');
      const data = env.DASHBOARD_KV ? await env.DASHBOARD_KV.get(kvKey, 'text') : null;
      if (!data) {
        return new Response(JSON.stringify({error: 'Not Found', path: path}), {
          status: 404,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        });
      }

      // 异步记录邮箱日志（不阻塞响应）
      if (env.DASHBOARD_KV) {
        const logKey = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const logEntry = JSON.stringify({
          email: token,
          path: kvKey,
          time: new Date().toISOString(),
          ip: request.headers.get('CF-Connecting-IP') || ''
        });
        ctx.waitUntil(env.DASHBOARD_KV.put(logKey, logEntry));
      }

      // 返回JSON数据
      return new Response(data, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Data-Source': 'cloudflare-kv',
          'X-Auth-Email': token
        }
      });
    }

    // ===== 其他静态文件直接放行 =====
    return env.ASSETS.fetch(request);
  }
};
