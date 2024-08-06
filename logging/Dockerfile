FROM fluent/fluentd:v1.12.0-debian-1.0

USER root

# Actualizar Ruby a una versión más reciente
RUN apt-get update && apt-get install -y \
    ruby-full \
    build-essential

# Instalar las versiones específicas de las dependencias necesarias
RUN gem install faraday -v 2.8.1
RUN gem install faraday-net_http -v 3.0.2
RUN gem install excon -v 0.109.0
RUN gem install fluent-plugin-elasticsearch

COPY fluent.conf /fluentd/etc/