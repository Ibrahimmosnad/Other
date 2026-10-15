#!/usr/bin/env bash
# Encode the captured frames and the final mix into the Instagram master.
#   H.264 High, 1080x1920, 30 fps, BT.709, yuv420p, faststart; AAC stereo 48 kHz.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=out/designwave-reel.mp4
ffmpeg -hide_banner -loglevel error -y \
  -framerate 30 -i out/frames/%04d.png \
  -i audio/build/mix.wav \
  -map 0:v -map 1:a \
  -vf "scale=1080:1920:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -tune film \
  -x264-params "keyint=60:min-keyint=30" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -t 30 -movflags +faststart \
  "$OUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels,nb_frames \
  -of default=noprint_wrappers=1 "$OUT"
