FROM public.ecr.aws/lambda/python:3.12

# Install Node.js 20
RUN dnf install -y wget tar xz && \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
    dnf install -y nodejs

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    tar -xf ffmpeg-release-amd64-static.tar.xz && \
    mv ffmpeg-*-amd64-static /usr/local/bin/ffmpeg/ && \
    ln -s /usr/local/bin/ffmpeg/ffmpeg /usr/bin/ffmpeg && \
    rm ffmpeg-release-amd64-static.tar.xz

RUN mkdir -p /var/task/bin && \
    mkdir -p /tmp/yt && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /var/task/bin/yt-dlp && \
    chmod a+rx /var/task/bin/yt-dlp

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --omit=dev

RUN python3 --version

RUN /var/task/bin/yt-dlp --version

COPY handler.js ./

CMD [ "handler.handler" ]
