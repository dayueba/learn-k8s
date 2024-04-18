FROM node:20 AS build

WORKDIR /app

COPY . .

RUN npm install --registry=https://registry.npmmirror.com/

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
# 把源代码复制过去， 以便报错能报对行
COPY --from=build /app/src ./src
COPY --from=build /app/bootstrap.js ./
COPY --from=build /app/package.json ./

RUN apk add --no-cache tzdata

ENV TZ="Asia/Shanghai"

RUN npm install --production --registry=https://registry.npmmirror.com/

# 如果端口更换，这边可以更新一下
EXPOSE 7002

CMD ["npm", "run", "start"]
