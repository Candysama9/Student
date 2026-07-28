/**
 * XDF数据看板 - Pages Function
 * 路由：/api/[[path]]
 *
 * 功能：
 * - JSON数据文件需要 @xdf.cn 邮箱验证
 * - 邮箱访问日志记录到KV
 * - 管理员日志查看接口 /api/__logs?k=27rk
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@xdf\.cn$/;
const ADMIN_PASSWORD = '27rk';

export async function onRequest(context) {
  const { request, env, params, waitUntil } = context;
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

  // 获取 /api/ 后的路径
  const pathParts = params.path || [];
  const fileName = pathParts.join('/');

  // ===== 管理员日志查看接口 =====
  if (fileName === '__logs') {
    const adminToken = url.searchParams.get('k') || '';
    if (adminToken !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {
        status: 401,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }
    if (!env.DASHBOARD_KV) {
      return new Response(JSON.stringify({error: 'KV not bound'}), {
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

  // ===== 邮箱验证 =====
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

  // 防止访问日志文件
  if (!fileName || fileName.startsWith('log_') || fileName.startsWith('__')) {
    return new Response(JSON.stringify({error: 'Not Found'}), {
      status: 404,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
    });
  }

  // ===== 从KV获取JSON数据 =====
  const data = env.DASHBOARD_KV ? await env.DASHBOARD_KV.get(fileName, 'text') : null;
  if (!data) {
    return new Response(JSON.stringify({error: 'Not Found', path: fileName}), {
      status: 404,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
    });
  }

  // 异步记录邮箱日志（不阻塞响应）
  if (env.DASHBOARD_KV) {
    const logKey = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const logEntry = JSON.stringify({
      email: token,
      path: fileName,
      time: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || ''
    });
    waitUntil(env.DASHBOARD_KV.put(logKey, logEntry));
  }

  // 返回JSON数据
  return new Response(data, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Data-Source': 'pages-function-kv',
      'X-Auth-Email': token
    }
  });
}
