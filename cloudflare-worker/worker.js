/**
 * XDF数据看板 - Cloudflare Worker 数据保护网关
 *
 * 部署步骤：
 * 1. 安装 wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 创建KV: wrangler kv:namespace create DASHBOARD_KV
 * 4. 运行上传脚本: ./upload_data.sh
 * 5. 部署: wrangler deploy
 * 6. 将得到的Worker URL填入 auth.js 的 DATA_WORKER_URL
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // 健康检查
    if (url.pathname === '/ping') {
      return new Response('ok', {headers: {'Access-Control-Allow-Origin': '*'}});
    }

    // 提取密码参数（支持 ?k=密码 或 header）
    const token = url.searchParams.get('k') || request.headers.get('X-Auth-Token') || '';

    // 验证密码
    if (token !== env.AUTH_PASSWORD) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 从KV读取数据
    // 路径映射: /chengdu_dashboard.json -> KV key: chengdu_dashboard.json
    const key = url.pathname.replace(/^\//, '');
    if (!key) {
      return new Response(JSON.stringify({error: 'Not Found', hint: 'Usage: /<filename>.json?k=<password>'}), {
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

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Data-Source': 'cloudflare-kv'
      }
    });
  }
};
