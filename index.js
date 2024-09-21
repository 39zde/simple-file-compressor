const compressionFileInput = document.getElementById("compression-file-input");
const compressionTypeInput = document.getElementById("compression-type-input");
const compressionStartInput = document.getElementById("compression-start-input");
const message = document.getElementById("notification");

// check if the browser is compatible
if (!ArrayBuffer.prototype.hasOwnProperty("resizable") || window.CompressionStream === undefined || !ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength")) {
	message.setAttribute("class", "error");
	message.innerText = "⚠️ Update Your Browser. This tool needs the latest features to function properly.";
}

// detect if a file has been detected
compressionFileInput.addEventListener("input", () => {
	// enable the compress button
	compressionStartInput.removeAttribute("disabled");
});

// check for compression button clicks
compressionStartInput.addEventListener("click", () => {
	// remove any class from message from previous compressions
	message.removeAttribute("class");
	message.innerText = "Starting...";
	// compress the file
	compressFile({ file: compressionFileInput.files[0], compression: compressionTypeInput.value });
});

/**
 * creates a file and downloads it
 * @param {ArrayBuffer} buf the data in from of an ARrayBuffer
 * @param {"gzip" | "deflate" | string} status compression type or when uncompressed the mime type of the input file
 * @param {string} fileName
 * @returns {void}
 */
function downloadFile(buf, status, fileName) {
	try {
		//create a new link
		const link = document.createElement("a");
		// create the file(Blob) and l

		if (status === "deflate") {
			link.href = URL.createObjectURL(new Blob([buf], { type: "application/zip" }));
			link.download = fileName + ".zip";
		} else if (status === "gzip") {
			link.href = URL.createObjectURL(new Blob([buf], { type: "application/gzip" }));
			link.download = fileName + ".gzip";
		} else {
			link.href = URL.createObjectURL(new Blob([buf], { type: status }));
			link.download = fileName;
		}
		// click the link / download the file
		link.click();
		// remove the file
		URL.revokeObjectURL(link.href);
	} catch (e) {
		message.setAttribute("class", "error");
		message.innerText = "⚠️ File has been compressed, but could not be downloaded";
		console.error(e);
	}
}

/**
 *	compresses as given file
 * @param {{compression: "gzip" | "deflate",file: File}} params
 * @returns {void}
 */
function compressFile(params) {
	// check if the file is too small
	if (params.file.size < 1000) {
		// if so return the file to the download folder
		return params.file.arrayBuffer().then((buf) => {
			message.setAttribute("class", "error");
			message.innerText = "⚠️ File is already so small, compressing it would increase the file size";
			downloadFile(buf, params.file.type, params.file.name);
		});
	}
	// create a stream from the file
	const stream = params.file.stream();
	// compress the stream
	const readable = stream.pipeThrough(new CompressionStream(params.compression));
	// create ArrayBuffer. must be resizable, because we don't know the compressed size. will hold the compressed data
	let buffer = new ArrayBuffer(0, { maxByteLength: params.file.size });
	// create a reader
	const reader = readable.getReader();
	// read the stream recursively
	reader.read().then(function readCompressed(value) {
		if (!value.done) {
			// if there is incoming data
			if (buffer.resizable) {
				let currentLength = buffer.byteLength;
				// increase the buffer by the size of the incoming data
				buffer.resize(buffer.byteLength + value.value.byteLength);
				let view = new DataView(buffer);
				for (let i = 0; i < value.value.byteLength; i++) {
					// add the incoming data
					view.setUint8(currentLength + i, value.value[i]);
				}
				// update the progress
				message.innerText = `Progress: ${((buffer.byteLength / params.file.size) * 100).toFixed(2)} %`;
				// start over
				reader.read().then(readCompressed);
			}
		} else {
			// all data has been received
			message.setAttribute("class", "success");
			// display the success message
			message.innerText = `✅ ${(params.file.size / 1000).toFixed(2)} kB  → ${(buffer.byteLength / 1000).toFixed(2)} kB ( - ${((1 - buffer.byteLength / params.file.size) * 100).toFixed(2)}%)`;
			// download the file
			downloadFile(buffer.transferToFixedLength(buffer.byteLength), params.compression, params.file.name);
		}
	});
}
