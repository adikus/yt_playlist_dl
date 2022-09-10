FROM public.ecr.aws/lambda/nodejs:16

RUN yum install -y python3 wget tar xz

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    tar -xf ffmpeg-release-amd64-static.tar.xz && \
    mv ffmpeg-*-amd64-static /usr/local/bin/ffmpeg/ && \
    ln -s /usr/local/bin/ffmpeg/ffmpeg /usr/bin/ffmpeg && \
    rm ffmpeg-release-amd64-static.tar.xz

RUN mkdir -p /var/task/bin
RUN mkdir -p /tmp/yt

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /var/task/bin/yt-dlp
RUN chmod a+rx /var/task/bin/yt-dlp

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --omit=dev

RUN ffmpeg -version

COPY handler.js ./
