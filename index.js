"use strict";

class UtilityFunctions {
	messageElement;
	shortcutDiv;
	shortcutToggle;

	/**
	 * @description creates a new UtilityFunctions Object
	 * @param {HTMLOutputElement} messageElement
	 */
	constructor(messageElement, shortcutDiv, shortcutToggle) {
		this.messageElement = messageElement;
		this.shortcutDiv = shortcutDiv;
		this.shortcutToggle = shortcutToggle;
	}

	/**
	 * @method
	 * @description check if compatibility is ensured
	 * @returns {boolean} true if compatible
	 */
	checkBrowserCompatibility() {
		if (
			!ArrayBuffer.prototype.hasOwnProperty("resizable") ||
			window.CompressionStream === undefined ||
			!ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength")
		) {
			return false;
		}
		return true;
	}

	/**
	 * @private
	 * @method
	 * @description function to select the children of an element, by passing the
	 * Parent HTML Element(1) and the Child Tag-Name(2) as a parameter
	 * @param {HTMLElement} parent
	 * @param {string} tagName
	 * @returns {HTMLElement[] | null}
	 */
	#selectChildrenOf(parent, tagName) {
		let out = [];
		for (const child of parent.children) {
			if (child.tagName === tagName.toUpperCase()) {
				out.push(child);
			}
		}
		if (out.length !== 0) {
			return out;
		}
		return null;
	}

	/**
	 * @description performs click on key "Enter" on any child input element, from the event
	 * target performs focus change on key "Tab" to the next sibling element
	 * @param {KeyboardEvent} event - the event coming from a "keydown" event listener
	 * @returns {Error | null}
	 */
	keyDownClicker(event) {
		event.preventDefault();
		if (event.key === "Enter" || event.key === " ") {
			const inputElement = this.#selectChildrenOf(event.target, "INPUT");
			if (inputElement) {
				inputElement[0].click();
			} else {
				return new Error(`Failed to find input-element`);
			}
		} else if (event.key === "Tab") {
			if (event.shiftKey) {
				if (event.target.previousElementSibling !== null) {
					event.target.previousElementSibling.focus();
				}
			} else {
				if (event.target.nextElementSibling !== null) {
					event.target.nextElementSibling.focus();
				}
			}
		}
		return null;
	}

	/**
	 * @description chooses the next option of the select element or loops back to the start
	 * @param {HTMLSelectElement} selectElement - the "select" element to cycle
	 * @returns {null}
	 */
	cycler(selectElement) {
		let options;
		if (this === undefined) {
			options = Array.from(selectElement.querySelectorAll("OPTION"));
		} else {
			options = this.#selectChildrenOf(selectElement, "OPTION");
		}
		if (options) {
			options = options.map((elem) => elem.value);
		}
		if (options && options.includes(selectElement.value)) {
			let index = options.indexOf(selectElement.value);
			if (index + 1 === options.length) {
				index = 0;
			} else {
				index = index + 1;
			}
			selectElement.value = options[index];
		}
		return null;
	}

	/**
	 * @method
	 * @description chooses the next option of the select element or loops back to the start on key "Enter"
	 * on any child input element, from the event target performs focus change on key "Tab" to
	 * the next sibling  element
	 * @param {KeyboardEvent} event - The Keyboard Event
	 * @returns {Error | null}
	 */
	keyDownCycler(event) {
		event.preventDefault();
		if (event.key === "Enter" || event.key === " ") {
			let selectElement = this.#selectChildrenOf(event.target, "SELECT");
			if (selectElement) {
				this.cycler(selectElement[0]);
			} else {
				return new Error(`Failed to find select-element`);
			}
		} else if (event.key === "Tab") {
			if (event.shiftKey) {
				if (event.target.previousElementSibling !== null) {
					event.target.previousElementSibling.focus();
				}
			} else {
				if (event.target.nextElementSibling !== null) {
					event.target.nextElementSibling.focus();
				}
			}
		}
		return null;
	}

	/**
	 * @method
	 * @description shows or hides the sidebar, where the key shortcuts are displayed
	 */
	toggleKeyShortcuts() {
		// on toggle sidebar
		if (this.shortcutDiv.ariaHidden === "true") {
			this.shortcutDiv.ariaHidden = "false";
			this.shortcutDiv.parentElement.ariaExpanded = "true";
			this.shortcutToggle.ariaChecked = "false";
			this.shortcutToggle.checked = false;
		} else {
			this.shortcutDiv.ariaHidden = "true";
			this.shortcutDiv.parentElement.ariaExpanded = "false";
			this.shortcutToggle.ariaChecked = "true";
			this.shortcutToggle.checked = true;
		}
	}

	/**
	 * @async
	 * @description creates a file and downloads it
	 * @param {ArrayBuffer} buf the data in from of an ArrayBuffer
	 * @param {string} mimeType the mime type
	 * @param {string} fileName file name without the extension - extension is derived from mime type
	 * @returns {Promise<number>} - the file size in Bytes
	 * @throws {Error}
	 */
	async downloadFile(buf, mimeType, fileName) {
		try {
			const name = fileName + "." + mimeType.split("/")[1];
			if ("showOpenFilePicker" in self) {
				const newHandle = await window.showSaveFilePicker({ startIn: "downloads", suggestedName: name });
				const writableStream = await newHandle.createWritable();
				await writableStream.write(buf);
				await writableStream.close();
			} else {
				const url = URL.createObjectURL(new Blob([buf], { type: mimeType }));
				const link = document.createElement("a");
				//create a new link
				link.href = url;
				link.download = name;
				if (typeof link.download === "undefined") {
					// safari popup handling
					link.target = "_blank";
				}
				// click the link / download the file
				link.click();
				// remove the URL and link
				link.remove();
				URL.revokeObjectURL(url);
			}
			return buf.byteLength;
		} catch (e) {
			throw new Error("No file was created from given data");
		}
	}

	/**
	 * @async
	 * @description displays a message to an HTMLOutputElement via innerText
	 * @param {HTMLOutputElement} element - the output element
	 * @param {"progress" | "success" | "error" | "hide"} type - can determine the color
	 * @param {string | undefined} msg - the message to display
	 * @returns {Promise<void>}
	 */
	async displayMessage(type, msg) {
		if (type !== "hide" && msg) {
			this.messageElement.setAttribute("aria-hidden", "false");
			this.messageElement.setAttribute("class", type);
			switch (type) {
				case "error":
					this.messageElement.innerText = "⚠️ " + msg;
					break;
				case "progress":
					this.messageElement.innerText = "⏳ " + msg;
					break;
				case "success":
					this.messageElement.innerText = "✅ " + msg;
					break;
				default:
					this.messageElement.innerText = msg;
					break;
			}
		} else {
			this.messageElement.setAttribute("aria-hidden", "true");
			this.messageElement.removeAttribute("class");
			this.messageElement.innerText = "";
		}
	}

	/**
	 * @async
	 * @description get the SHA-256 Hash String from a given string
	 * @param {string} data - the data to be hashed with SHA-256
	 * @returns {Promise<string>} the hashed encoded in base64
	 */
	async getHash(data) {
		let encoder = new TextEncoder();
		let hashed = await crypto.subtle.digest("SHA-256", encoder.encode(data).buffer);
		let binary = String.fromCharCode.apply(null, new Uint8Array(hashed));
		return btoa(binary);
	}

	/**
	 * @async
	 * @description Saves the page as an HTML File, with inline style and script.
	 * The hashes for the inline css and js are calculated and the CSP gets adjusted to allow only the inlined ones.
	 * @returns {Promise<null>}
	 */
	async saveHtmlFile() {
		await this.displayMessage("hide");
		const encoder = new TextEncoder();
		let html = document.children[0].outerHTML;
		let css;
		let js;
		// get styles and script
		let requests = await Promise.all([fetch(document.styleSheets[0].href, { method: "GET" }), fetch(document.scripts[0].src, { method: "GET" })])
			.catch((e) => {
				throw new Error("Failed to fetch style/script to compose file");
			})
			.catch((error) => {
				throw new Error(error);
			});

		for await (let request of requests) {
			if (request.ok) {
				// store them in variables as text
				if (request.url.endsWith("css")) {
					css = await request.text();
				}
				if (request.url.endsWith("js")) {
					js = await request.text();
				}
			}
		}

		// don't show the html download option
		css = css.replace(/(?<=span\#save-html-notice[\s]{0,},[\n\s]{0,}tr\#save-html-shortcut[\n\s]{0,}{[\n\s]{0,}display:[\s]{0,})auto/gm, "none");

		for (let link of document.querySelectorAll("link")) {
			if (link.rel !== "stylesheet") {
				// remove any link, which is not the stylesheet one
				html = html.replace(link.outerHTML, "");
			} else {
				// remove the link to stylesheet and insert inline style
				html = html.replace(link.outerHTML, `\<style\>${css}\</style\>`);
			}
		}
		// set the CSP, to allow to use this style
		let cssHash = await this.getHash(css);
		html = html.replace("style-src 'self'", `style-src 'sha256-${cssHash}'`);
		// remove the script t and insert the inline script
		html = html.replace(document.querySelector("script").outerHTML, `\<script type="module"\>${js}\</script\>`);
		// set the CSP, to allow to execute this script.
		let jsHash = await this.getHash(js);
		html = html.replace("script-src 'self'", `script-src 'sha256-${jsHash}'`);
		// remove the base tag
		let baseTag = document.querySelector("base");
		if (baseTag) {
			html = html.replace(baseTag.outerHTML, "");
		}

		return this.downloadFile(encoder.encode("<!doctype html>\n" + html).buffer, "text/html", "simple-file-compressor");
	}
}

class MainFunctions {
	constructor() {}

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
function main(ids, util, funcs) {
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

	const isCompatible = util.checkBrowserCompatibility();
	if (!isCompatible) {
		return util.displayMessage("error", "Update Your Browser. This tool needs the latest features to function properly.");
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

// execute main, once the document has loaded
document.addEventListener("DOMContentLoaded", () => {
	// default features
	// get elements
	const messageOutput = document.getElementById("notification");
	const htmlDownloadLink = document.getElementById("save-html");
	const shortcutDiv = document.getElementById("shortcuts");
	const shortcutToggle = document.getElementById("toggle-shortcuts");
	// create util
	const util = new UtilityFunctions(messageOutput, shortcutDiv, shortcutToggle);
	// add event listeners
	messageOutput.addEventListener("click", () => {
		util.displayMessage("hide");
	});

	const saveForOfflineUse = () =>
		util.saveHtmlFile().then(() => {
			// when done display message
			util.displayMessage("success", "Saved this page for offline use!");
		});

	htmlDownloadLink.addEventListener("click", () => {
		saveForOfflineUse();
	});

	shortcutToggle.addEventListener("input", (event) => {
		event.preventDefault();
		util.toggleKeyShortcuts();
	});

	document.addEventListener("keydown", (event) => {
		console.log(event);
		if (event.key == "ArrowRight" || event.key == "ArrowLeft") {
			util.toggleKeyShortcuts();
		} else if (event.key.toLowerCase() === "s" && event.composed && (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			saveForOfflineUse();
		}
	});

	// project specific code
	const elementIDs = {
		fileInputID: "compression-file-input",
		compressionTypeInputID: "compression-type-input",
		startInputID: "compression-start-input",
	};
	const funcs = new MainFunctions();
	main(elementIDs, util, funcs);
});
