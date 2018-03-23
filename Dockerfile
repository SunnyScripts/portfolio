FROM quantmind/openresty:jessie

WORKDIR /production_server
ADD . /production_server
WORKDIR apiServer

# forward request and error logs to docker log collector
#RUN ln -sf /dev/stdout /var/log/nginx/access.log \
#	&& ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80

ENTRYPOINT /usr/local/openresty/nginx/sbin/nginx -p `pwd`/ -c apiServer.conf -g 'daemon off;'