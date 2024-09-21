# Simple File Compressor
A tool to reduce the file size of your files. Free online, local, tracking-free, advert-free file compression. Simple and fast.

Now, that the following browser features are widely available: 

- [Resizable ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/resizable#browser_compatibility) (since July 2024)
- [transfer ArrayBuffer to a fixed length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/transferToFixedLength#browser_compatibility) (since March 2024)
- [Compression Streams](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API#browser_compatibility) (since May 2023)

nothing stands in the way of selecting a file, compressing it with the [CompressionStream API](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream), creating an archive and downloading it.

For now there are two formats supported: `gzip` and `deflate`, with no control over compression strength. 

Try it here: [File Compressor](https://39zde.github.io/simple-file-compressor/)

- One might say: `7Zip can also do this, why would I use this instead?`
- To which one might reply: `Yes`

Spread the word and star this repo. That's all, thank you for your time.
