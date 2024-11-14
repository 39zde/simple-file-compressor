"use strict";
import { MainFunctions, main } from "./src/main.js";

/**
 * @class UtilityFunctions
 */
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
		if (!this) {
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
		// hide any open messages
		await this.displayMessage("hide");
		const encoder = new TextEncoder();
		let html = document.children[0].outerHTML;
		// put styles into html
		html = await this.#saveCSS(html, document.styleSheets[0]);
		html = await this.#saveJS(html, document.scripts[0]);

		// remove the base tag
		let baseTag = document.querySelector("base");
		if (baseTag) {
			html = html.replace(baseTag.outerHTML, "");
		}
		// remove favicon
		let faviconTag = document.querySelector("link[rel='icon']");
		if (faviconTag) {
			html = html.replace(faviconTag.outerHTML, "");
		}
		// remove  style preload
		let preloadLink = document.querySelector("link[rel='preload']");
		if (preloadLink) {
			html = html.replace(preloadLink.outerHTML, "");
		}
		// remove 3rd party html elements
		let footer = document.querySelector("footer");
		if (footer) {
			let thirdPartyElement = footer.nextSibling;
			while (thirdPartyElement) {
				if (thirdPartyElement instanceof HTMLElement || thirdPartyElement instanceof Comment) {
					html = html.replace(thirdPartyElement.outerHTML, "");
				}
				thirdPartyElement = thirdPartyElement.nextSibling;
			}
		}

		return this.downloadFile(encoder.encode("<!doctype html>" + html).buffer, "text/html", "simple-file-compressor");
	}

	/**
	 * replates the given stylesheet link and all of its imports with inline `<style>` .
	 * @private
	 * @param {string} html html file as a string
	 * @param {CSSStyleSheet} sheet
	 * @returns {Promise<string>} html with inlined css
	 */
	async #saveCSS(html, sheet) {
		let css = "";
		let importedCss = "";
		for (const rule of sheet.cssRules) {
			if (rule instanceof CSSImportRule) {
				for (const importedRule of rule.styleSheet.cssRules) {
					importedCss += importedRule.cssText;
				}
			}
			css += rule.cssText;
		}
		// append the imported css
		css += importedCss;
		// don't show the html download option
		css = css.replace(/(?<=span\#save-html-notice[\s]{0,},[\n\s]{0,}tr\#save-html-shortcut[\n\s]{0,}{[\n\s]{0,}display:[\s]{0,})contents/gm, "none");
		// remove the css import statement
		css = css.replace(/\@import[\s]{0,}(url\([\s]{0,})?[\"\']{0,}\.?(\/?[\w]+\/?){0,}(\.css)?[\"\']{0,}([\s]{0,}\))?[\s\n]{0,}\;/gm, "");
		// minify
		css = css.replaceAll("\n", "");
		// set the CSP, to allow to use this style
		let cssHash = await this.getHash(css);
		if (!cssHash) {
			throw new Error("Failed to update CSP for style-src");
		}
		html = html.replace(/(?<=style-src[\s\t]{1,})((?<directive>[\"\'][^\s]+[\"\'])[\s]{0,})+(?=\;)/gm, ` 'sha256-${cssHash}'`);

		html = html.replace(sheet.ownerNode.outerHTML, `<style>${css}</style>`);
		return html;
	}

	/**
	 * save a script and it's imports as a inline script
	 * @private
	 * @param {string} html
	 * @param {HTMLScriptElement} scriptElem
	 * @returns {Promise<string>}
	 */
	async #saveJS(html, scriptElem) {
		let js = "";
		const request = await fetch(scriptElem.src, { method: "GET" });
		if (!request.ok) {
			throw new Error("Failed to load script");
		}
		const result = await request.text();
		if (!result) {
			throw new Error("Failed to parse script into text");
		}
		const importStatements = result.match(
			/import[\s]{0,}\{?([\s]{0,}[\w]+[\s]{0,}\,?[\s]{0,}){0,}\}?[\s]{0,}from[\s]{0,}[\'\"]\.?(\/?[\w]+\/?){0,}(\.[mc]?js)?[\'\"]\;?/gm,
		);
		if (!importStatements[0]) {
			throw new Error("Failed to match script imports");
		}
		js = result.replace(importStatements[0], "");
		const importsPath = importStatements[0].match(/(?<=[\"\']\.?)(\/?[\w]+\/?){0,}(\.[mc]?js)(?=[\"\']\;?)/gm);
		if (!importsPath[0]) {
			throw new Error("Failed to match script script imports path");
		}
		if (importsPath[0].startsWith("/")) {
			importsPath[0] = importsPath[0].replace("/", "");
		}
		let importedScriptPath = location.origin;
		importedScriptPath += location.pathname.includes("html") ? "/" : location.pathname;
		importedScriptPath += importsPath[0];
		const importedScriptRequest = await fetch(importedScriptPath, {
			method: "GET",
		});
		if (!importedScriptRequest.ok) {
			throw new Error("Failed to fetch imported script");
		}
		const importedScript = await importedScriptRequest.text();
		if (!importedScript) {
			throw new Error("Failed to parse imported script into text");
		}
		importedScript.replace(`"use strict";`, "");
		js += importedScript.replaceAll(/(?<!\[\'\"\)])export(?![\"\'\(])/gm, "");
		js = js
			// replace Js Comments
			.replaceAll(
				/(?<comment_start>\/[\*]{1,})(?<comment>((?<no_newline>.*)|(?<newline>\r?\n)(?<jsdoc>[\s\t]{0,}\*(.*)?)*\k<newline>))(?<comment_end>[\s\t]{0,}[\*]{1,}\/)/g,
				"",
			)
			.replaceAll(/(?<simple_comment>(?<=(?<![\"\']))[\/]{2,}.*)/g, "")
			// fill missing semicolons

			.replaceAll(/(?<=[^\s;\{\[\}\|\,\(\:\>\=\*\+\-\/\%\?])(?=(\s*[\r\n]))(?![\s\t\n]{0,}[\.\)])/g, ";")
			// minify
			.replaceAll(/[\s\t]{0,}\n[\s\t]{0,}|\t/g, "");

		// replace old with new inline script
		html = html.replace(scriptElem.outerHTML, `<script type="module"\>${js}\</script\>`);
		const jsHash = await this.getHash(js);
		if (!jsHash) {
			throw new Error("Failed to update CSP for script-src");
		}
		// update the csp
		html = html.replace(/(?<=style-src[\s\t]{1,})((?<directive>[\"\'][^\s]+[\"\'])[\s]{0,})+(?=\;)/gm, ` 'sha256-${jsHash}'`);
		return html;
	}
}

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

	window.addEventListener("keydown", (event) => {
		if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
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
	if (!funcs.checkBrowserCompatibility()) {
		util.displayMessage("error", "Your current Browser version does not support this application.\nConsider updating!");
	}
	main(elementIDs, util, funcs);
});
