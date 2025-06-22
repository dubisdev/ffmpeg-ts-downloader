# TS Video Downloader and Joiner

A simple Node.js utility to download and join Transport Stream (TS) video files from an M3U8 playlist. This tool downloads individual TS segments and combines them into a single file using FFmpeg.

> [!WARNING]
> This project is intended for educational purposes only. Ensure you have the right to download and use the content from the M3U8 playlist.

## 🚀 Features

- Downloads TS segments from an M3U8 playlist
- Handles both HTTP and HTTPS URLs
- Parallel downloading with concurrency control
- Automatic cleanup after processing
- TLS bypass for self-signed certificates

## ⚙️ Requirements

- [Node.js](https://nodejs.org/) (v22 or later recommended)
- [FFmpeg](https://ffmpeg.org/download.html) installed and available in your PATH

### Installing FFmpeg

#### Windows

1. Download from [FFmpeg official website](https://ffmpeg.org/download.html) or install using [Chocolatey](https://chocolatey.org/):

```powershell
choco install ffmpeg
```

#### macOS

```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

## 📂 Project Structure

```plaintext
ts-joiner/
├── index.js           # Main script
├── playlist.m3u8      # M3U8 playlist file (must be updated)
├── ts-files/          # Temporary folder for downloaded segments
└── ts-videos/         # Output folder for joined TS files
```

## 🔧 Usage

1. Update the `playlist.m3u8` file with your TS segment URLs
2. Open `index.js` and set the `baseUrl` variable to your base URL (if segments use relative paths)
3. Run the script:

```powershell
node index.js
```

The joined video file will be saved to `./ts-videos/` with a unique filename

## 💻 How it Works

1. The script parses the M3U8 playlist file to extract TS segment URLs
2. It downloads each segment in parallel (with a concurrency limit of 10)
3. It creates a filelist for FFmpeg
4. FFmpeg joins all segments into a single TS file
5. The script moves the joined file to the output directory
6. Temporary files are cleaned up automatically

## 🔍 Development

This project uses standard Node.js libraries with no external dependencies:

- `fs` - File system operations
- `https/http` - Network requests
- `child_process` - For executing FFmpeg
- `path` - Path manipulation
- `url` - URL resolution

To modify the concurrency limit, change the `CONCURRENCY_LIMIT` constant in `index.js`.

## 📝 License

[MIT](./LICENSE.md) © [David Jimenez](https://dubis.dev)
