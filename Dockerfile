# ===== 知识卡片 · Docker 镜像 =====
# 基于 Node.js 20 Alpine（轻量、体积小、安全）
FROM node:20-alpine

# 容器内工作目录
WORKDIR /app

# 复制应用代码
# server.js 仅依赖 Node 内置模块（http / fs / path / crypto），无需 npm install
COPY server.js ./
COPY config.json ./
COPY public ./public
COPY pwa ./pwa

# 运行时环境变量
ENV NODE_ENV=production
# 数据写入 /data，运行时通过挂载卷持久化（容器重建不丢数据）
ENV DATA_DIR=/data

# 声明数据卷
VOLUME ["/data"]

# 服务端口：server.js 监听 0.0.0.0:PORT（默认 3000）
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
