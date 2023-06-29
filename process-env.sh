#!/bin/sh

######################################
# desc: 该文件需要和 zip 包放在同一目录
#       前端因为是静态页面，无法通过环境变量来区分配置，所以生成多环境页面，容器启动时根据环境变量选择使用那个构建结果
#       打包的zip文件必须以  xxx-$环境.zip 的形式命名，eg:  video-test.zip
# author: hesimincn@gmail.com
# version: 0.2
######################################

EQXIU_ENV="${SPRING_PROFILES}"

date "+%Y-%m-%d %H:%M:%S" >> start-time.txt

echo "process-env.sh: ****** current env: $EQXIU_ENV ******* "

ZIP_FILE="`find $(dirname $0) -name '*.zip'|grep "\-${EQXIU_ENV}.zip"`"

echo "process-env.sh: ****** current file: $ZIP_FILE ******* "

if [[ ! -f "${ZIP_FILE}" ]];then
   echo "[error] process-env.sh: ****** file not found: ${ZIP_FILE} ******* "
   exit 500
fi

if [[ ! -f "/www/index.html" ]];then
    unzip ${ZIP_FILE} -d /www

    # 因为压缩包可能包含目录，根据index.html找到目录并将所有文件移到根目录
    INDEX_ORG_DIR=`find /www -name index.html`
    if [[ -z "$INDEX_ORG_DIR" ]];then
        echo "[error] not found index.html in /www !!!"
        exit 1
    fi
    if [[ "/www/index.html" != "$INDEX_ORG_DIR" ]];then
        echo "move $INDEX_ORG_DIR to /www"
        cp -r ${INDEX_ORG_DIR%index.html}* /www
    fi
    echo "/www dir==>"
    echo "`ls /www`"

    # 修改 nginx 配置，添加 cache-control header
    #echo ">>> nginx config: cache-control"
    #sed -i "s/location \/ {/add_header Cache-Control \'max-age=60, s-maxage=120\';\n location \/ {/" /etc/nginx/conf.d/default.conf
fi
