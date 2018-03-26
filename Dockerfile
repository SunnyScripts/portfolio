FROM quantmind/openresty:jessie

WORKDIR /production_server
ADD . /production_server
WORKDIR apiServer

# forward error logs to docker log collector
#RUN ln -sf /dev/stderr logs/error.log

EXPOSE 80

ENTRYPOINT /usr/local/openresty/nginx/sbin/nginx -p `pwd`/ -c apiServer.conf -g 'daemon off;'