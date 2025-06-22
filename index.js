// TS Video downloader and joiner
// 1. Update the playlist m3u8 file
// 2. Updathe this base url
const baseUrl = ''; // Replace with correct base
// 3. Run the script with node index.js
// 4. Your file will be saved to ./ts-videos/joined.ts
// 5. Make sure you have ffmpeg installed and available in your PATH

const fs = require('fs');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const path = require('path');
const url = require('url');

const randomFileName = crypto.randomUUID()

// TLS bypass for cert errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const playlistFile = 'playlist.m3u8';
const downloadDir = './ts-files';

const outputTS = `${randomFileName}.ts`; // Output file name
const CONCURRENCY_LIMIT = 10;

if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

// Parse .m3u8 file

const lines = fs.readFileSync(playlistFile, 'utf-8').split('\n');
const tsFiles = lines
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.trim());

// Helper: download a single file
function downloadFile(fileUrl, dest) {
    return new Promise((resolve, reject) => {
        const proto = fileUrl.startsWith('https') ? https : http;
        const options = fileUrl.startsWith('https') ? {
            agent: httpsAgent, headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
            }
        } : {};
        proto.get(fileUrl, options, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`Failed ${fileUrl}`));
            const fileStream = fs.createWriteStream(dest);
            res.pipe(fileStream);
            fileStream.on('finish', () => fileStream.close(resolve));
        }).on('error', reject);
    });
}

// Helper: limit parallel downloads
async function downloadAll(files, concurrency) {
    let index = 0;
    const results = [];

    async function worker() {
        while (index < files.length) {
            const i = index++;
            const tsName = `seg_${i}.ts`;
            const fullUrl = tsFiles[i].startsWith('http') ? tsFiles[i] : url.resolve(baseUrl, tsFiles[i]);
            const localPath = path.join(downloadDir, tsName);
            process.stdout.write(`Downloading ${i + 1}/${files.length}...\r`);
            try {
                await downloadFile(fullUrl, localPath);
                results[i] = tsName;
            } catch (err) {
                console.error(`\nFailed to download ${fullUrl}: ${err.message}`);
                results[i] = null;
            }
        }
    }

    // Start workers
    await Promise.all(Array.from({ length: concurrency }, worker));
    return results.filter(Boolean); // Remove any failed
}

const outputDir = path.join(__dirname, 'ts-videos');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const srcTsPath = path.join(downloadDir, outputTS);  // ./ts-files/<uuid name>.ts
const dstTsPath = path.join(outputDir, outputTS); // ./ts-videos/<uuid name>.ts

(async () => {
    console.log(`Found ${tsFiles.length} .ts files in playlist.`);
    const localFiles = await downloadAll(tsFiles, CONCURRENCY_LIMIT);

    // Generate filelist.txt
    const fileList = localFiles.map(f => `file '${f}'`).join('\n');
    const fileListPath = path.join(downloadDir, 'filelist.txt');
    fs.writeFileSync(fileListPath, fileList);

    console.log('\n✅ Download complete. Joining .ts files...');

    // Join .ts files
    exec(`ffmpeg -f concat -safe 0 -i filelist.txt -c copy ${outputTS}`, { cwd: downloadDir }, (err) => {
        if (err) return console.error('Joining error:', err.message);

        console.log('\n✅ Joining complete. Moving joined.ts...');

        // Move to ../ts-videos
        try {
            fs.renameSync(srcTsPath, dstTsPath);
            console.log(`📦 Moved joined.ts to ${dstTsPath}`);
        } catch (moveErr) {
            console.error('❌ Failed to move joined.ts:', moveErr.message);
            return;
        }

        console.log('🧹 Cleaning up downloaded segment .ts files...');

        fs.readdirSync(downloadDir).forEach(file => {
            if (file !== 'filelist.txt') {
                fs.unlinkSync(path.join(downloadDir, file));
            }
        });

        try {
            fs.unlinkSync(path.join(downloadDir, 'filelist.txt'));
        } catch (_) {
            console.warn('⚠️ Could not delete filelist.txt (maybe already gone)');
        }

        console.log('🗑️ Cleanup complete.');
    });
})();
