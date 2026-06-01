# KelDel Court Gaussian Splat Attempt

This folder contains the first capture package for attempting a true Gaussian Splat virtual tour from the current website animation.

## What Was Prepared

- Source video: `public/assets/animation-3d-teaser.mp4`
- Extracted frames: `gaussian-splat-capture/frames`
- Frame count: 60
- Frame size: 960 x 1280
- Sampling: 2 frames per second

## Current Limitation

This machine does not currently have COLMAP, Postshot, Nerfstudio, or another Gaussian Splat trainer installed, so the repo can prepare input frames but cannot locally train the final `.splat`, `.ply`, `.spz`, or hosted scene yet.

The current video is also a rendered walkthrough, not a real capture pass. It may train a test splat, but a premium result needs a deliberate capture with overlapping camera movement around each room.

## Recommended Production Workflow

1. Open Postshot, SuperSplat, Luma, Splatica, or a Nerfstudio/COLMAP pipeline.
2. Import the images in `gaussian-splat-capture/frames`.
3. Train the Gaussian Splat.
4. Export one of these web-friendly outputs:
   - hosted SuperSplat or PlayCanvas embed URL
   - `.splat`
   - `.ply`
   - `.spz`
5. Add the final scene to the website virtual tour page.

## Better Capture Checklist

For a proper real estate splat, capture a new video with:

- slow steady movement
- bright even lighting
- no motion blur
- 80 percent overlap between views
- full orbit around living room, kitchen, bedrooms, bathrooms, closets, and exterior
- separate clips per room if possible
- no people moving through the scene

This will give buyers a true interactive virtual tour instead of a flat video preview.
