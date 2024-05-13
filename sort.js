const fs = require('fs');
const readline = require('readline');
const { PassThrough } = require('stream');

const CHUNK_SIZE = 1024 * 1024; // Chunk size in bytes

async function externalMergeSort(filePath, outputFilePath) {
    // Step 1: Divide the file into sorted chunks that fit into memory
    let chunkNum = 0;
    const chunkFileNames = [];

    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

    let currentChunk = [];
    for await (const line of rl) {
        currentChunk.push(line);
        if (Buffer.from(currentChunk.join('\n')).byteLength > CHUNK_SIZE) {
            currentChunk.sort(); // Sort chunk in memory
            const chunkFileName = `chunk_${chunkNum}.txt`;
            fs.writeFileSync(chunkFileName, currentChunk.join('\n'));
            chunkFileNames.push(chunkFileName);
            currentChunk = [];
            chunkNum++;
        }
    }

    // Sort the last chunk
    if (currentChunk.length > 0) {
        currentChunk.sort();
        const chunkFileName = `chunk_${chunkNum}.txt`;
        fs.writeFileSync(chunkFileName, currentChunk.join('\n'));
        chunkFileNames.push(chunkFileName);
    }

    // Step 2: Merge sorted chunks
    while (chunkFileNames.length > 1) {
        const mergedChunkFileName = `merged_chunk_${chunkNum}.txt`;
        const mergedChunkStream = fs.createWriteStream(mergedChunkFileName, { flags: 'a' });

        const streams = chunkFileNames.map(chunkFileName => fs.createReadStream(chunkFileName, { encoding: 'utf-8' }));
        const mergeStream = mergeStreams(streams);

        await new Promise((resolve, reject) => {
            mergeStream.pipe(mergedChunkStream);
            mergeStream.on('end', () => {
                for (const stream of streams) {
                    stream.close();
                }
                resolve();
            });
            mergeStream.on('error', reject);
        });

        for (const chunkFileName of chunkFileNames) {
            fs.unlinkSync(chunkFileName); // Remove merged chunk files
        }
        chunkFileNames.length = 0;
        chunkFileNames.push(mergedChunkFileName);
        chunkNum++;
    }

    // Step 3: Rename the final merged chunk to the output file
    fs.renameSync(chunkFileNames[0], outputFilePath);
}

function mergeStreams(streams) {
    const mergedStream = new PassThrough({ objectMode: true });

    const next = (i) => {
        const stream = streams[i];
        stream.once('data', (chunk) => {
            mergedStream.write(chunk);
        });
        stream.once('end', () => {
            if (i + 1 < streams.length) {
                next(i + 1);
            } else {
                mergedStream.end();
            }
        });
    };

    next(0);

    return mergedStream;
}

// Example usage
const inputFile = 'input.txt';
const outputFile = 'output.txt';

externalMergeSort(inputFile, outputFile)
    .then(() => console.log('File sorted successfully!'))
    .catch(error => console.error('Error sorting file:', error));
