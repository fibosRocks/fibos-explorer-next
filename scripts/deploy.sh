#!/bin/bash
set -e

# FIBOS Explorer 部署脚本
# 构建项目并推送源码到 pages 分支供 Cloudflare Pages 构建

echo "=== FIBOS Explorer 部署 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 确保使用 Node 18+
if command -v nvm &> /dev/null; then
    source ~/.nvm/nvm.sh
    nvm use 18 || nvm use node
fi

# 检查 Node 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}错误: 需要 Node.js 18+，当前版本 $(node -v)${NC}"
    exit 1
fi

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}警告: 存在未提交的更改${NC}"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 1. 验证构建
echo -e "\n${GREEN}[1/3] 验证构建...${NC}"
bun run build

echo -e "${GREEN}构建验证通过${NC}"

# 2. 准备 pages 分支（推送源码，Cloudflare 会自动构建）
echo -e "\n${GREEN}[2/3] 准备 pages 分支...${NC}"

# 检查 pages 分支是否存在
if git show-ref --verify --quiet refs/heads/pages; then
    git branch -D pages 2>/dev/null || true
fi

# 从当前分支创建 pages 分支
git checkout -b pages

# 3. 推送到远程
echo -e "\n${GREEN}[3/3] 推送到远程...${NC}"

if git remote | grep -q origin; then
    git push origin pages --force
    echo -e "\n${GREEN}已推送到 origin/pages${NC}"
else
    echo -e "${YELLOW}警告: 没有配置远程仓库，请手动添加并推送${NC}"
    echo "  git remote add origin <your-repo-url>"
    echo "  git push origin pages --force"
fi

# 切回原分支
git checkout "$CURRENT_BRANCH"

echo -e "\n${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "Cloudflare Pages 配置:"
echo "  - 构建命令: bun run build"
echo "  - 输出目录: .next"
echo "  - Node.js 版本: 18"
echo ""
echo "Cloudflare Pages 将自动检测 pages 分支更新并构建部署"
