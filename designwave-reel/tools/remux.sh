#!/usr/bin/env bash
# Replace the master's soundtrack with audio/build/mix.wav, keeping the picture
# exactly as encoded (stream copy). Use after an audio-only change; a picture
# change needs render-frames.mjs + encode.sh instead.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=out/designwave-reel.mp4
TMP=out/.remux.mp4
ffmpeg -hide_banner -loglevel error -y \
  -i "$OUT" -i audio/build/mix.wav \
  -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -t 30 -movflags +faststart \
  "$TMP"
mv "$TMP" "$OUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels,nb_frames \
  -of default=noprint_wrappers=1 "$OUT"
