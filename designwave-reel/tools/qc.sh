#!/usr/bin/env bash
# Check the master against the delivery spec and make a contact sheet.
set -euo pipefail
cd "$(dirname "$0")/.."
F=${1:-out/designwave-reel.mp4}
echo "== $F"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_frames,color_space,color_primaries,color_transfer \
  -of default=noprint_wrappers=1 "$F"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,channel_layout,bit_rate \
  -of default=noprint_wrappers=1 "$F"
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 "$F"
echo "== loudness"
ffmpeg -hide_banner -nostats -i "$F" -vn -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=summary -f null - 2>&1 \
  | grep -E "Input Integrated|Input True Peak|Input LRA"
echo "== contact sheet"
ffmpeg -hide_banner -loglevel error -y -i "$F" -vf "fps=1,scale=216:384,tile=10x3:padding=6:color=0x222222" \
  -frames:v 1 out/contact-sheet.jpg
echo "wrote out/contact-sheet.jpg"
