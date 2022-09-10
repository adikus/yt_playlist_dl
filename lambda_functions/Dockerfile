FROM public.ecr.aws/lambda/nodejs:16

RUN yum install -y python3 ffmpeg

RUN mkdir -p /var/task/bin
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /var/task/bin/yt-dlp
RUN chmod a+rx /var/task/bin/yt-dlp

COPY handler.js ./
