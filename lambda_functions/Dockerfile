FROM public.ecr.aws/lambda/nodejs:20

# Install Python 3.11 (yt-dlp requires Python 3.10+)
RUN dnf install -y python3.11 wget tar xz

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    tar -xf ffmpeg-release-amd64-static.tar.xz && \
    mv ffmpeg-*-amd64-static /usr/local/bin/ffmpeg/ && \
    ln -s /usr/local/bin/ffmpeg/ffmpeg /usr/bin/ffmpeg && \
    rm ffmpeg-release-amd64-static.tar.xz

RUN mkdir -p /var/task/bin && \
    mkdir -p /tmp/yt && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /var/task/bin/yt-dlp-original && \
    chmod a+rx /var/task/bin/yt-dlp-original && \
    echo '#!/bin/bash' > /var/task/bin/yt-dlp && \
    echo 'exec /usr/bin/python3.11 /var/task/bin/yt-dlp-original "$@"' >> /var/task/bin/yt-dlp && \
    chmod a+rx /var/task/bin/yt-dlp

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --omit=dev

# https://github.com/amazonlinux/amazon-linux-2023/issues/625#issuecomment-1924864568
RUN cp /usr/lib64/libssl.so.3 /var/lang/lib/libssl.so.3 && \
    cp /usr/lib64/libcrypto.so.3 /var/lang/lib/libcrypto.so.3

RUN python3.11 --version

RUN /var/task/bin/yt-dlp --version

COPY handler.js ./
