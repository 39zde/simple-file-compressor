[![pages-build-deployment](https://github.com/39zde/simple-file-compressor/actions/workflows/pages/pages-build-deployment/badge.svg?branch=main)](https://github.com/39zde/simple-file-compressor/actions/workflows/pages/pages-build-deployment)
# Simple File Compressor
A tool to reduce the file size of your files. Free no-dependency, local, tracking-free, advert-free file compression and decompression. Simple and fast.

Now, that the following browser features are implemented by the major vendors: 

- [Resizable ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/resizable#browser_compatibility) (since July 2024)
- [transfer ArrayBuffer to a fixed length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/transferToFixedLength#browser_compatibility) (since March 2024)
- [Compression Streams](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API#browser_compatibility) (since May 2023)

nothing stands in the way of selecting a file, compressing it with the [CompressionStream API](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream), creating an archive and downloading it.

For now there are two formats supported: `gzip` and `deflate`, with no control over compression strength. 
In the future this API might be expanded to finer controls and the formats `brotli` and `zstd`[^1],[^2],[^3].

Try it here: [File Compressor](https://39zde.github.io/simple-file-compressor/)

- One might say: `7Zip can also do this, why would I use this instead?`
- To which one might reply: `Yes`

Spread the word and star this repo. That's all, thank you for your time.

### Development

I'd like to keep this project free from dependencies. This also means no devtools, no package.json, no TypeScript, no versioning. Given the project size (in the future and now) none of this would be worth it.
There is 1 point, which I declare as exceptions:
- the use of JsDoc[^4], because it improves the readability, most IDE support it and it's inside of comments. It's plain and simple, therefore worth it.

### License

Licensed under the MIT License. Copyright (c) 2024 39zde.

 See [LICENSE](./LICENSE).

### Footnotes

[^1]: https://github.com/whatwg/compression/blob/main/explainer.md#future-work
[^2]: https://github.com/whatwg/compression/issues/34
[^3]: https://github.com/whatwg/compression/issues/54
[^4]: https://jsdoc.app/
[^5]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
