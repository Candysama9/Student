#!/bin/bash
# ============================================
# XDF数据看板 - Cloudflare Worker 一键部署脚本
# ============================================
# 使用前请确保:
# 1. 已安装 Node.js (https://nodejs.org)
# 2. 已注册 Cloudflare 账号 (https://dash.cloudflare.com/sign-up)
# ============================================

set -e
cd "$(dirname "$0")/.."
ONLINE_DIR="$(pwd)"

echo "=========================================="
echo "  XDF数据看板 Cloudflare Worker 部署"
echo "=========================================="
echo ""

# 1. 检查 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "[1/6] 安装 wrangler CLI..."
    npm install -g wrangler
else
    echo "[1/6] wrangler 已安装 ✓"
fi

# 2. 登录
echo ""
echo "[2/6] 请在浏览器中完成 Cloudflare 登录..."
wrangler login

# 3. 创建 KV 命名空间
echo ""
echo "[3/6] 创建 KV 存储空间..."
KV_OUTPUT=$(wrangler kv:namespace create DASHBOARD_KV 2>&1)
echo "$KV_OUTPUT"

# 提取 KV ID
KV_ID=$(echo "$KV_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$KV_ID" ]; then
    echo "❌ 无法获取 KV ID，请手动创建并填入 wrangler.toml"
    echo "   运行: wrangler kv:namespace create DASHBOARD_KV"
    echo "   将返回的 id 填入 cloudflare-worker/wrangler.toml"
    exit 1
fi
echo "KV ID: $KV_ID"

# 更新 wrangler.toml
sed -i.bak "s/id = \"\"/id = \"$KV_ID\"/" cloudflare-worker/wrangler.toml
echo "已更新 wrangler.toml ✓"

# 4. 上传数据到 KV
echo ""
echo "[4/6] 上传数据文件到 KV..."
JSON_FILES=(
    "chengdu_dashboard.json"
    "guangzhou_dashboard.json"
    "lanzhou_dashboard.json"
    "zhengzhou_dashboard.json"
    "hangzhou_dashboard.json"
    "chengdu_daily_history.json"
    "guangzhou_daily_history.json"
    "lanzhou_daily_history.json"
    "zhengzhou_daily_history.json"
    "hangzhou_daily_history.json"
)

for f in "${JSON_FILES[@]}"; do
    if [ -f "$ONLINE_DIR/$f" ]; then
        echo "  上传 $f ..."
        wrangler kv:key put --namespace-id="$KV_ID" "$f" --path="$ONLINE_DIR/$f" 2>&1 | tail -1
    else
        echo "  跳过 $f (文件不存在)"
    fi
done

# 5. 部署 Worker
echo ""
echo "[5/6] 部署 Worker..."
cd "$ONLINE_DIR/cloudflare-worker"
DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# 提取 Worker URL
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[a-z0-9-]*\.[a-z]*\.workers\.dev')
if [ -z "$WORKER_URL" ]; then
    echo "❌ 无法自动获取 Worker URL"
    echo "   请从上方输出中找到 .workers.dev 地址"
    echo "   手动填入 auth.js 的 DATA_WORKER_URL"
    exit 1
fi

echo ""
echo "Worker URL: $WORKER_URL"

# 6. 更新 auth.js
echo ""
echo "[6/6] 更新 auth.js 中的 Worker URL..."
cd "$ONLINE_DIR"
sed -i.bak "s|var DATA_WORKER_URL='';|var DATA_WORKER_URL='$WORKER_URL';|" auth.js
echo "auth.js 已更新 ✓"

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "Worker URL: $WORKER_URL"
echo ""
echo "测试: curl '$WORKER_URL/chengdu_dashboard.json?k=27rk'"
echo ""
echo "下一步:"
echo "  1. 从GitHub仓库中删除JSON文件（Worker已接管数据）"
echo "  2. git rm *_dashboard.json *_daily_history.json"
echo "  3. git commit -m '安全: JSON数据迁移至Cloudflare KV'"
echo "  4. git push"
echo ""
