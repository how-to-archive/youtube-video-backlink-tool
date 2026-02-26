# YouTube Backlink Generator

A lightweight web-based tool that generates backlink URLs for any YouTube video.

This tool:
- Extracts the YouTube video ID
- Generates backlink URLs using predefined templates
- Displays them as clickable links
- Allows downloading the full list
- Supports shareable URLs
- Includes one-click submission to multiple web archive services

No automation, no hidden iframe calls, and no background requests.

---

## Features

- Generate backlinks from YouTube video URL
- Clickable backlink list
- Download backlinks as `.txt`
- Shareable URL support
- Auto-load backlinks when URL parameter is present
- Archive submission buttons:
  - Internet Archive (Wayback Machine)
  - Ghostarchive
  - Archive.today
  - Megalodon.jp
  - Archive.st

---

## Project Structure


/index.html
/backlink-generator.js
/youtube-backlink-templates.json


---

## How It Works

1. User enters a YouTube video URL
2. The script extracts the video ID
3. Templates from `youtube-backlink-templates.json` are shuffled
4. Templates are populated with the video ID
5. Backlinks are rendered as clickable links
6. User can download the list or archive the original video URL

---

## Example Input


[https://www.youtube.com/watch?v=Zpy1tCC2XrA](https://www.youtube.com/watch?v=Zpy1tCC2XrA)


---

## Example Output


https://heartvod.com/play=Zpy1tCC2XrA

https://videogg.com/watch?v=Zpy1tCC2XrA

https://www.nsfwyoutube.com/watch?v=Zpy1tCC2XrA

...


---

## Deployment

You can host this easily using:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting provider

To use GitHub Pages:

1. Upload files to repository
2. Go to **Settings → Pages**
3. Select the branch
4. Save

Your tool will be live at:


[https://how-to-archive.github.io/youtube-backlink-generator/](https://how-to-archive.github.io/youtube-video-backlink-tool/)


---

## License

MIT License

---

## Disclaimer

This tool only generates URLs based on templates.  
It does not automatically submit, ping, iframe-load, or manipulate third-party services.

Users are responsible for how they use generated links.
