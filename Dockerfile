FROM ccr.ccs.tencentyun.com/eqxiu/devex-nginx-agent

WORKDIR /www

COPY nginx_default.conf /etc/nginx/nginx_default.conf

COPY zip/ process-env.sh /app/

RUN date "+%Y-%m-%d %H:%M:%S" > build.txt

EXPOSE 80

ENTRYPOINT /devex-nginx-agent /www > /etc/nginx/conf.d/default.conf;mv -f /etc/nginx/nginx_default.conf /etc/nginx/conf.d/default.conf;/app/process-env.sh; nginx -g "daemon off;"
