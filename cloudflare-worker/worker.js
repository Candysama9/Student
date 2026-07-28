/**
 * XDF数据看板 - Cloudflare Worker 数据保护网关 v2
 *
 * 认证方式：任意 @xdf.cn 邮箱
 * 邮箱日志：每次请求自动记录到KV，可通过 /__logs?k=27rk 查看
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@xdf\.cn$/;
const ADMIN_PASSWORD = '27rk';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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

    // 健康检查
    if (url.pathname === '/ping') {
      return new Response('ok', {headers: {'Access-Control-Allow-Origin': '*'}});
    }

    // ===== 管理员日志查看接口 =====
    // 用法: /__logs?k=27rk
    if (url.pathname === '/__logs') {
      const adminToken = url.searchParams.get('k') || '';
      if (adminToken !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {
          status: 401,
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

    // ===== 数据请求 =====
    const token = url.searchParams.get('k') || request.headers.get('X-Auth-Token') || '';

    // 验证邮箱格式
    if (!EMAIL_REGEX.test(token)) {
      return new Response(JSON.stringify({error: 'Unauthorized', hint: '需要 @xdf.cn 邮箱验证'}), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 从KV读取数据
    const key = url.pathname.replace(/^\//, '');
    if (!key || key.startsWith('log_') || key.startsWith('__')) {
      return new Response(JSON.stringify({error: 'Not Found', hint: 'Usage: /<filename>.json?k=<email>@xdf.cn'}), {
        status: 404,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }

    const data = await env.DASHBOARD_KV.get(key, 'text');
    if (!data) {
      return new Response(JSON.stringify({error: 'Not Found', key: key}), {
        status: 404,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }

    // 异步记录邮箱日志（不阻塞响应）
    const logKey = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const logEntry = JSON.stringify({
      email: token,
      path: key,
      time: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || ''
    });
    ctx.waitUntil(env.DASHBOARD_KV.put(logKey, logEntry));

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
};
