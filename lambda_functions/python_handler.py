import json
import os
import subprocess


def resolve(event, context):
    params = json.loads(event['body'])
    youtube_id = params['id']
    s3_key = params['key']

    print("Invoking resolve function with params", params)

    resolve_command = f'/var/task/bin/youtube-dl -j --cache-dir /tmp/yt -- {youtube_id}'.split(' ')
    resolve_process = subprocess.run(resolve_command, check=True, text=True, capture_output=True)
    yt_info = json.loads(resolve_process.stdout)

    format = \
        next((f for f in yt_info['formats'] if f['format_id'] == '171'), False) or \
        next(f for f in yt_info['formats'] if f['format_id'] == '140')
    print(format)
    ext = format['ext']
    format_id = format['format_id']

    print('Identified format, downloading & uploading to S3...')

    bucket = os.environ.get('BUCKET')
    download_command = f'/var/task/bin/youtube-dl -f {format_id} --cache-dir /tmp/yt -o - -- {youtube_id} | /opt/awscli/aws s3 cp - s3://{bucket}/{s3_key}'
    print(download_command)
    download_output = os.popen(download_command).read()

    print(download_output)
