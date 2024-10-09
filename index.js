/**
 * true if compatibility is ensured
 * @returns boolean
 */
function checkBrowserCompatibility() {
	if (!ArrayBuffer.prototype.hasOwnProperty("resizable") || window.CompressionStream === undefined || !ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength")) {
		message.setAttribute("class", "error");
		message.innerText = "⚠️ Update Your Browser. This tool needs the latest features to function properly.";
		return false;
	}
	return true;
}

/**
 * performs click on key "Enter" on any child input element, from the event target
 * performs focus change on key "Tab" to the next sibling  element
 * @param {KeyboardEvent} event
 */
function keyDownClicker(event) {
	event.preventDefault();
	if (event.key === "Enter") {
		let inputElement = event.target.queySelector("input");
		if (inputElement) {
			inputElement.click();
		} else {
			throw new Error(`Failed to find input-element`);
		}
	} else if (event.key === "Tab") {
		if (event.target.nextElementSibling !== null) {
			event.target.nextElementSibling.focus();
		}
	}
}

/**
 * chooses the next option of the select element or loops back to the start
 * @param {HTMLSelectElement} selectElement
 */
function cycler(selectElement) {
	let selectOptions = selectElement.queySelectorAll("option");
	let options = [];
	for (const element of selectOptions) {
		options.push(element.value);
	}
	if (options.includes(selectElement.value)) {
		let index = options.indexOf(selectElement.value);
		if (index + 1 === options.length) {
			index = 0;
		} else {
			index = index + 1;
		}
		selectElement.value = options[index];
	}
}

/**
 * chooses the next option of the select element or loops back to the start on key "Enter" on any child input element, from the event target
 * performs focus change on key "Tab" to the next sibling  element
 * @param {KeyboardEvent} event
 */
function keyDownCycler(event) {
	event.preventDefault();
	if (event.key === "Enter") {
		let selectElement = event.target.queySelector("select");
		if (selectElement) {
			cycler(selectElement);
		} else {
			throw new Error(`Failed to find select-element`);
		}
	} else if (event.key === "Tab") {
		if (event.target.nextElementSibling !== null) {
			event.target.nextElementSibling.focus();
		}
	}
}

/**
 * adds keyboard shortcuts
 * @param {KeyboardEvent} event
 * @param {HTMLInputElement} fileElement
 * @param {HTMLSelectElement} compressionElement
 * @param {HTMLImageElement} actionElement
 */
function addKeyShortcuts(event, fileElement, compressionElement, actionElement) {
	switch (event.key) {
		case "1":
			event.preventDefault();
			fileElement.parentElement.focus();
			break;
		case "2":
			event.preventDefault();
			compressionElement.parentElement.focus();
			break;
		case "3":
			event.preventDefault();
			actionElement.parentElement.focus();
			break;
		case "o":
			event.preventDefault();
			fileElement.parentElement.focus();
			fileElement.click();
			break;
		case "s":
			event.preventDefault();
			compressionElement.parentElement.focus();
			cycler(compressionElement);
			break;
		case "c":
			event.preventDefault();
			actionElement.parentElement.focus();
			actionElement.click();
			break;
		default:
			break;
	}
}

/**
 * creates a file and downloads it
 * @param {ArrayBuffer} buf the data in from of an ARrayBuffer
 * @param {"gzip" | "deflate" | "uncompressed"} compressionType compression type or when uncompressed the mime type of the input file
 * @param {string} fileName
 * @returns {Error | null}
 */
function downloadFile(buf, compressionType, fileName) {
	try {
		//create a new link
		const link = document.createElement("a");
		// create the file
		switch (compressionType) {
			case "deflate":
				link.href = URL.createObjectURL(new Blob([buf], { type: "application/zip" }));
				link.download = fileName + ".zip";
				break;
			case "gzip":
				link.href = URL.createObjectURL(new Blob([buf], { type: "application/gzip" }));
				link.download = fileName + ".gzip";
				break;
			case "uncompressed":
				link.href = URL.createObjectURL(new Blob([buf]));
				link.download = fileName;
				break;
			default:
				return new Error(`⚠️ Unsupported compression type: ${compressionType}`);
		}

		// click the link / download the file
		link.click();
		// remove the file
		URL.revokeObjectURL(link.href);
		return null;
	} catch (e) {
		console.error(e);
		return new Error("⚠️ File has been created from given data");
	}
}

/**
 *	compresses a given file and downloads it
 * @param {File} file
 * @param {"gzip" | "deflate"} compressionType
 * @param {HTMLOutputElement} messageOutput
 * @returns {Error|void}
 */
function compressFile(file, compressionType, messageOutput) {
	// check if the file is too small
	if (file.size < 1000) {
		// if so return with error message
		return displayMessage(messageOutput, "error", "⚠️ File is already so small, compressing it would increase the file size");
	}
	// create a stream from the file
	const stream = file.stream();
	// compress the stream
	const readable = stream.pipeThrough(new CompressionStream(compressionType));
	// create ArrayBuffer. must be resizable, because we don't know the compressed size. will hold the compressed data
	let buffer = new ArrayBuffer(0, { maxByteLength: file.size });
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
				displayMessage(messageOutput, "progress", `Progress: ${((buffer.byteLength / file.size) * 100).toFixed(2)} %`);
				// start over
				reader.read().then(readCompressed);
			}
		} else {
			// download the file
			const outputBuffer = buffer.transferToFixedLength(buffer.byteLength);
			const result = downloadFile(outputBuffer, compressionType, file.name);
			if (result !== null) {
				displayMessage(messageOutput, "error", result.message);
			} else {
				displayMessage(messageOutput, "success", `✅ ${(file.size / 1000).toFixed(2)} kB  → ${(outputBuffer.byteLength / 1000).toFixed(2)} kB ( - ${((1 - outputBuffer.byteLength / file.size) * 100).toFixed(2)}%)`);
			}
		}
	});
}

/**
 *	decompresses a given file and downloads it
 * @param {File} file
 * @param {"gzip" | "deflate"} compressionType
 * @param {HTMLOutputElement} messageOutput
 * @returns {void}
 */
function decompressFile(file, compressionType, messageOutput) {
	// create a stream from the file
	const stream = file.stream();
	// compress the stream
	const readable = stream.pipeThrough(new DecompressionStream(compressionType));
	// create ArrayBuffer. must be resizable, because we don't know the decompressed size.
	// buffer will hold the decompressed data
	let buffer = new ArrayBuffer(0, { maxByteLength: file.size * 2 });
	// create a reader
	const reader = readable.getReader();
	// read the stream recursively
	reader.read().then(function readDecompressed(value) {
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
				displayMessage(messageOutput, "progress", `Progress: ${((buffer.byteLength / file.size) * 100).toFixed(2)} %`);
				//start over
				reader.read().then(readDecompressed);
			}
		} else {
			// download the file
			const outputBuffer = buffer.transferToFixedLength(buffer.byteLength);
			const result = downloadFile(outputBuffer, "uncompressed", file.name.slice(0, file.name.lastIndexOf(".")));
			if (result !== null) {
				displayMessage(messageOutput, "error", result.message);
			} else {
				displayMessage(
					messageOutput,
					"success",
					`✅ ${(file.size / 1000).toFixed(2)} kB  → ${(outputBuffer.byteLength / 1000).toFixed(2)} kB (successfully decompressed, file size increased by ${((1 - file.size / outputBuffer.byteLength) * 100).toFixed(2)}%)`
				);
			}
		}
	});
}

/**
 * displays a message to an HTMLOutputElement via innerText
 * @param {HTMLOutputElement} element
 * @param {"progress" | "success" | "error" | "hide"} type
 * @param {string | undefined} msg
 */
function displayMessage(element, type, msg) {
	if (type !== "hide" && msg) {
		element.setAttribute("aria-hidden", "false");
		element.setAttribute("class", type);
		element.innerText = msg;
	} else {
		element.setAttribute("aria-hidden", "true");
		element.removeAttribute("class");
		element.innerText = "";
	}
}

/**
 *
 * @param {string} fileInputID HTMLInputElement id attribute value for the file upload button
 * @param {string} compressionTypeInputID HTMLSelectElement id attribute value for the compression type selection
 * @param {string} startInputID HTMLInputElement id attribute value for the file action button
 * @param {string} messageOutputID HTMLOutputElement id attribute value for the message output element
 * @param {string} shortcutID HTMLDivElement id attribute value  for the hidden div inside of the aside element
 * @param {string} shortcutToggle HTMLInputElement id attribute value for checkbox element to toggle the keyboard-shortcuts
 * @returns
 */
function main(fileInputID, compressionTypeInputID, startInputID, messageOutputID, shortcutID, shortcutToggleID) {
	const fileInput = document.getElementById(fileInputID);
	const typeSelect = document.getElementById(compressionTypeInputID);
	const actionInput = document.getElementById(startInputID);
	const messageOutput = document.getElementById(messageOutputID);
	const shortcutDiv = document.getElementById(shortcutID);
	const shortcutToggle = document.getElementById(shortcutToggleID);
	if (fileInput == null || typeSelect == null || actionInput == null || messageOutput == null || shortcutDiv == null || shortcutToggle == null) {
		console.log("File Input: ", fileInput == null, "type select: ", typeSelect == null, "action input: ", actionInput == null, "message output: ", messageOutput == null, "shortcut-div", shortcutDiv == null, "short-cut toggle", shortcutToggle == null);
		return console.error("failed to find input elements");
	}

	const isCompatible = checkBrowserCompatibility();
	if (!isCompatible) {
		return displayMessage(messageOutput, "error", "⚠️ Update Your Browser. This tool needs the latest features to function properly.");
	}

	// add event listeners
	document.addEventListener("keydown", (event) => {
		addKeyShortcuts(event, fileInput, typeSelect, actionInput);
	});
	fileInput.parentElement.addEventListener("keydown", keyDownClicker);
	typeSelect.parentElement.addEventListener("keydown", keyDownCycler);
	actionInput.parentElement.addEventListener("keydown", keyDownClicker);
	messageOutput.addEventListener("click", () => {
		displayMessage(messageOutput, "hide");
	});
	fileInput.addEventListener("input", () => {
		// enable the action button
		actionInput.removeAttribute("disabled");
	});
	actionInput.addEventListener("click", (event) => {
		// check for compression button clicks
		event.preventDefault();
		// set the notification-style to progress
		displayMessage(messageOutput, "progress", "Starting...");
		for (const file of fileInput.files) {
			// get the file ending
			let fileNameEnding = file.name;
			fileNameEnding = fileNameEnding.slice(fileNameEnding.lastIndexOf(".") + 1, file.name.length);
			// decompress or compress
			if (fileNameEnding === "zip" || fileNameEnding == "gzip" || fileNameEnding == "gz") {
				if (fileNameEnding === "zip") {
					decompressFile(file, "deflate", messageOutput);
				} else {
					decompressFile(file, "gzip", messageOutput);
				}
			} else {
				compressFile(file, typeSelect.value, messageOutput);
			}
		}
	});
	shortcutToggle.addEventListener("input", () => {
		// on toggle sidebar
		if (shortcutDiv.ariaHidden === "true") {
			shortcutDiv.ariaHidden = "false";
		} else {
			shortcutDiv.ariaHidden = "true";
		}
	});
}

// execute main, once the document has loaded
document.addEventListener("DOMContentLoaded", () => {
	const elementIDs = ["compression-file-input", "compression-type-input", "compression-start-input", "notification", "shortcuts", "toggle-shortcuts"];
	main(elementIDs[0], elementIDs[1], elementIDs[2], elementIDs[3], elementIDs[4], elementIDs[5]);
});
