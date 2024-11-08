"use strict";
/**
 * @class MainFunctions
 */
export class MainFunctions {
	constructor() {}

	/**
	 * @method
	 * @description check if compatibility is ensured
	 * @returns {boolean} true if compatible
	 */
	checkBrowserCompatibility() {
		if (
			!ArrayBuffer.prototype.hasOwnProperty("resizable") ||
			!ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength") ||
			!window.CompressionStream
		) {
			return false;
		}
		return true;
	}

	/**
	 * @async
	 * @description compresses a given file and downloads it
	 * @param {File} file
	 * @param {"gzip" | "deflate"} compressionType
	 * @returns {Promise<ArrayBuffer>}
	 * @throws {Error}
	 */
	async compressFile(file, compressionType) {
		// check if the file is too small
		if (file.size < 1000) {
			// if so return with error message
			throw new Error("File is already so small, compressing it would increase the file size");
		}
		// create a stream from the file
		const stream = file.stream();
		// compress the stream
		const readable = stream.pipeThrough(new CompressionStream(compressionType));
		// create ArrayBuffer. must be resizable, because we don't know the compressed size. will hold the compressed data
		let buffer = new ArrayBuffer(0, { maxByteLength: file.size });
		// read the stream recursively
		for await (const value of readable) {
			// if there is incoming data
			if (buffer.resizable) {
				let currentLength = buffer.byteLength;
				// increase the buffer by the size of the incoming data
				buffer.resize(buffer.byteLength + value.byteLength);
				let view = new DataView(buffer);
				for (let i = 0; i < value.byteLength; i++) {
					// add the incoming data
					view.setUint8(currentLength + i, value[i]);
				}
			}
		}
		return buffer.transferToFixedLength(buffer.byteLength);
	}

	/**
	 * @async
	 * @description decompresses a given file and downloads it
	 * @param {File} file
	 * @param {"gzip" | "deflate"} compressionType
	 * @param {(type: "progress" | "success" | "error" | "hide", msg: string | undefined)=> void} displayMessage
	 * @returns {Promise<ArrayBuffer>}
	 * @throws {Error}
	 */
	async decompressFile(file, compressionType) {
		// create a stream from the file
		const stream = file.stream();
		// compress the stream
		const readable = stream.pipeThrough(new DecompressionStream(compressionType));
		// create ArrayBuffer. must be resizable, because we don't know the decompressed size.
		// buffer will hold the decompressed data
		let buffer = new ArrayBuffer(0, { maxByteLength: file.size * 8 });
		// read the stream recursively
		for await (const value of readable) {
			let currentLength = buffer.byteLength;
			// increase the buffer by the size of the incoming data
			buffer.resize(buffer.byteLength + value.byteLength);
			let view = new DataView(buffer);
			for (let i = 0; i < value.byteLength; i++) {
				// add the incoming data
				view.setUint8(currentLength + i, value[i]);
			}
		}
		return buffer.transferToFixedLength(buffer.byteLength);
	}

	/**
	 * @description adds keyboard shortcuts
	 * @param {KeyboardEvent} event
	 * @param {Object} elements
	 * @param {HTMLInputElement} elements.fileInput
	 * @param {HTMLSelectElement} elements.compressionTypeInput
	 * @param {HTMLImageElement} elements.actionInput
	 * @param {Function} cycle2Next
	 * @returns {void}
	 */
	handleKeyShortcuts(event, elements, cycle2Next) {
		switch (event.key) {
			case "1":
				event.preventDefault();
				elements.fileInput.parentElement.focus();
				break;
			case "2":
				event.preventDefault();
				elements.compressionTypeInput.parentElement.focus();
				break;
			case "3":
				event.preventDefault();
				elements.actionInput.parentElement.focus();
				break;
			case "o":
				event.preventDefault();
				elements.fileInput.parentElement.focus();
				elements.fileInput.click();
				break;
			case "t":
				event.preventDefault();
				elements.compressionTypeInput.parentElement.focus();
				cycle2Next(elements.compressionTypeInput);
				break;
			case "c":
				event.preventDefault();
				elements.actionInput.parentElement.focus();
				elements.actionInput.click();
				break;
			default:
				return;
		}
	}
}

/**
 * @param {Object} ids The elementIDs, which need to be accessed
 * @param {string} ids.fileInputID HTMLInputElement id attribute value for the file upload button
 * @param {string} ids.compressionTypeInputID HTMLSelectElement id attribute value for the compression type selection
 * @param {string} ids.startInputID HTMLInputElement id attribute value for the file action button
 * @param {UtilityFunctions} util
 * @param {MainFunctions} funcs
 * @returns
 */
export function main(ids, util, funcs) {
	const fileInput = document.getElementById(ids.fileInputID);
	const compressionTypeInput = document.getElementById(ids.compressionTypeInputID);
	const actionInput = document.getElementById(ids.startInputID);

	if (fileInput == null || compressionTypeInput == null || actionInput == null) {
		// console.log(
		// 	"File Input: ",
		// 	fileInput == null,
		// 	"type select: ",
		// 	compressionTypeInput == null,
		// 	"action input: ",
		// 	actionInput == null,
		// );
		// return console.error("failed to find input elements");
		return;
	}

	// add  project event listeners
	document.addEventListener("keydown", (event) => {
		funcs.handleKeyShortcuts(event, { fileInput, compressionTypeInput, actionInput }, util.cycler);
	});

	fileInput.parentElement.addEventListener("keydown", (event) => util.keyDownClicker(event));

	compressionTypeInput.parentElement.addEventListener("keydown", (event) => {
		util.keyDownCycler(event);
	});

	actionInput.parentElement.addEventListener("keydown", (event) => util.keyDownClicker(event));

	fileInput.addEventListener("input", () => {
		// enable the action button
		actionInput.removeAttribute("disabled");
	});

	actionInput.addEventListener("click", (event) => {
		// check for compression button clicks
		event.preventDefault();
		// set the notification-style to progress
		util.displayMessage("progress", "Starting...");
		for (const file of fileInput.files) {
			// decompress or compress
			let fileNameEnding = file.name;
			fileNameEnding = fileNameEnding.slice(fileNameEnding.lastIndexOf(".") + 1, file.name.length);
			if (new RegExp(/(\.7z|\.zstd?|\.bz|\.tgz|\.tz|\.tar\.[\w]{0,}|\.bz2|\.br)$/gm).test(file.name)) {
				if (file.name.includes("tar")) {
					util.displayMessage("error", `File extension .tar.${fileNameEnding} not supported.\nSelect a .zip or .gzip/.gz file instead`);
				} else {
					util.displayMessage("error", `File extension ${fileNameEnding} not supported.\nSelect a .zip or .gzip/.gz file instead`);
				}
				continue;
			}
			if (file.type === "application/gzip" || file.type === "application/x-gzip" || fileNameEnding === "gz" || fileNameEnding == "gzip") {
				funcs
					.decompressFile(file, "gzip")
					.then((decompressedFile) => {
						let fileNameParts = file.split(".");
						let ext = fileNameParts[fileNameParts.length - 2];
						let fileName = fileNameParts
							.map((v, i) => {
								if (i !== fileNameParts.length - 1 && i !== fileNameParts.length - 2) {
									return v;
								}
							})
							.join("");

						return util.downloadFile(decompressedFile, `application/${ext}`, fileName);
					})
					.then((fileSize) => {
						util.displayMessage(
							"success",
							`${(file.size / 1000).toFixed(2)} kB  → ${(fileSize / 1000).toFixed(2)} kB\n(successfully decompressed, file size increased by ${(
								(1 - file.size / fileSize) *
								100
							).toFixed(2)}%)`,
						);
					})
					.catch((error) => {
						util.displayMessage("error", error.message);
					});
			} else if (
				file.type === "application/x-zip-compressed" ||
				file.type === "application/zip" ||
				file.type === "application/x-7z-compressed" ||
				fileNameEnding == "zip"
			) {
				funcs
					.decompressFile(file, "deflate")
					.then((decompressedFile) => {
						let fileNameParts = file.name.split(".");
						let ext = fileNameParts[fileNameParts.length - 2];
						let fileName = fileNameParts
							.map((v, i) => {
								if (i !== fileNameParts.length - 1 && i !== fileNameParts.length - 2) {
									return v;
								}
							})
							.join("");

						return util.downloadFile(decompressedFile, `application/${ext}`, fileName);
					})
					.then((fileSize) => {
						util.displayMessage(
							"success",
							`${(file.size / 1000).toFixed(2)} kB  → ${(fileSize / 1000).toFixed(2)} kB\n(successfully decompressed, file size increased by ${(
								(1 - file.size / fileSize) *
								100
							).toFixed(2)}%)`,
						);
					})
					.catch((error) => {
						util.displayMessage("error", error.message);
					});
			} else {
				funcs
					.compressFile(file, compressionTypeInput.value)
					.then((compressedFile) => {
						return util.downloadFile(compressedFile, compressionTypeInput.value === "gzip" ? "application/gzip" : "application/zip", file.name);
					})
					.then((fileSize) => {
						util.displayMessage(
							"success",
							`${(file.size / 1000).toFixed(2)} kB  → ${(fileSize / 1000).toFixed(2)} kB \n( - ${((1 - fileSize / file.size) * 100).toFixed(2)}%)`,
						);
					})
					.catch((error) => {
						util.displayMessage("error", error.message);
					});
			}
		}
	});
}
