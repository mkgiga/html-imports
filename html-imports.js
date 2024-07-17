/**
 * @file html-imports.js
 * @description A lightweight script that allows for client-side imports of custom, reusable html elements.
 * @version 0.4.1
 * @license MIT
 * @author mk-giga
 * 
 * @todo Implement the palette system.
 * @todo Implement the custom syntax parser.
 */

const domParser = new DOMParser();
const mutObserver = new MutationObserver(onMutation);
const mutConfig = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

/**
 * A simple logging utility that allows for easy customization of the log message.
 * @returns {log} A log object that can be customized and sent to the console.
 */
function log(...args) {

  this.queries = 0;

  this._color               = "black";
  this._fontWeight          = "normal";
  this._fontSize            = "1em";
  this._textDecoration      = "none";
  this._textDecorationStyle = "solid";
  this._prefix              = "";
  this._suffix              = "";
  this.args                 = args || [];

  /**
   * Sends the log message to the console with the specified style.
   * @param  {...any} args The same arguments that would be passed to console.log. Overwrites any previous arguments set by the `message` method.
   */
  this.send = (...args) => {
    this.queries++;

    if (arguments.length > 0) {
      this.args = args;
    }

    console.log(
      `%c${this._prefix} ${this.args.join(" ")} ${this._suffix}`,
      this.getStyle(),
    );
  }

  this.getStyle = () => {
    this.queries++;
    return `color: ${this._color}; font-weight: ${this._fontWeight}; font-size: ${this._fontSize}; text-decoration: ${this._textDecoration}; text-decoration-style: ${this._textDecorationStyle};`;
  }

  this.text             = (...args) => { this.queries++; this.args = args; return this; }
  this.suffix              = (suffix) => { this.queries++; this._suffix = suffix; return this; }
  this.prefix              = (prefix) => { this.queries++; this._prefix = prefix; return this; }
  this.color               = (color) => { this.queries++; this._color = color; return this; }
  this.fontWeight          = (fontWeight) => { this.queries++; this._fontWeight = fontWeight; return this; }
  this.fontSize            = (fontSize) => { this.queries++; this._fontSize = fontSize; return this; }
  this.textDecoration      = (textDecoration) => { this.queries++; this._textDecoration = textDecoration; return this; }
  this.textDecorationStyle = (textDecorationStyle) => { this.queries++; this._textDecorationStyle = textDecorationStyle; return this; }
  
  // shorthand aliases

  this.txt = this.text;
  this.suf = this.suffix;
  this.pre = this.prefix;
  this.col = this.color;
  this.fw = this.fontWeight;
  this.size = this.fontSize;
  this.fs = this.fontSize;
  this.td = this.textDecoration;
  this.decorationStyle = this.textDecorationStyle;
  this.tds = this.textDecorationStyle;
  
  if (arguments.length > 0) {
    console.log(...args);
  } else {
    return this;
  }
}

log()
  .col("cyan")
  .fs("2em")
  .txt("[ html-imports ]")
  .send();

/**
 * This class serves as a singleton for any information about this document that has to do with importable components.
 */
class GlobalComponentStore {

  static #imported = {};
  static #failed = {};
  static #defined = {};

  static {

  }

  get imported() {

  }

  get failed() {
  
  }

  get defined() {

  }

  init(props) {
    for (let [key, value] of Object.entries(props)) {
      this[key] = value;
    }
  }

  static onFail(el, err) {
    let proto = Object.create({

    })
    this.#failed[el.getAttribute("src")] = err;
  }

  static onImport(el) {
    this.#imported[el.tagName] = el;
  }

  static onDefine(el) {
    this.#defined[el.tagName] = component;
  }
}

let compStore = new GlobalComponentStore();
compStore.init({ azz: "bzz" });
console.log("c%Test", "color: cyan; font-size: 2em;");
console.log(compStore["azz"]);

/**
 * For the property parser
 */
const preservedProperties = [
  "constructor",
  "connected-callback",
  "disconnected-callback",
  "attribute-changed-callback",
  "adopted-callback",
  "observed-attributes",
  "shadow-root",
];

// We will observe the entire document for changes the moment this script is loaded in the <head> tag

/**
 * @param {MutationRecord[]} mutations
 */
function onMutation(mutations) {
  for (let mut of mutations) {
    // because we are avoiding having to use a hyphen for specifically this element,
    // we have to catch it here with a mutation observer (we'll disconnect it after we're done)
    if (mut.target.tagName === "IMPORTS") {
      let addedNodes = mut.addedNodes;

      for (const n of addedNodes) {
        // TODO: Implement custom syntax by catching text nodes the moment they are added to the document, and analyzing them for special syntax.
        if (n.nodeType === Node.TEXT_NODE) continue;

        /** @type {Node} */
        let node = n;
        console.log(node.nodeName);
        if (node.nodeName === "COMPONENT") {
          loadComponent(node)
            .then(({ element, propertyDefinitionMap }) => {
              defineComponent({ element, propertyDefinitionMap });
            })
            .catch((err) => {
              console.error(err);
              GlobalComponentStore.onFail(node, err);
            });

          continue;
        }
      }

      mutObserver.disconnect();
    }
  }
}

mutObserver.observe(document, mutConfig);

/**
 * Loads a component from either an external source or an inline definition.
 * @param {HTMLUnknownElement | HTMLElement} element The <component> element definition containing either a src or inline component definition.
 * @returns
 */
async function loadComponent(element) {
  console.log("Loading component...");
  console.log(element);

  let src = element.getAttribute("src") || element.getAttribute("href") || "";

  let external;

  if (src) {
    let cors =
      element.getAttribute("cors") ||
      element.getAttribute("allow-cors") ||
      false;
    let url = new URL(src, window.location.href);
    let origin = new URL(window.location.href).origin;
    if (origin !== url.origin && !cors) {
      throw new Error(
        "Cross-origin request blocked; set the 'cors' attribute to 'true' to allow cross-origin requests. Otherwise, please host the component on the same origin as the document."
      );
    }

    try {
      external = await loadExternalComponent(src);
      console.log("External component loaded successfully.");
      console.log(external);
      GlobalComponentStore.onImport(element, external);
      return external;
    } catch (err) {
      external = null;
      GlobalComponentStore.onFail(element, err);
    }
  }

  if (src === null || src === undefined) {
    // Load inline component if no src attribute is provided.
    // If both src and inline are provided, src will take precedence.

    return loadInlineComponent(element);
  }

  // we shouldn't reach this point, but just in case
  console.warn("Uhh, something went wrong. This shouldn't have happened.");
  return null;
}

/**
 * Loads an inline component definition within a <component> element and returns the parsed element.
 * @param {HTMLElement} element The <component> element definition containing an inline component definition.
 */
async function loadInlineComponent(element) {
  console.log("Loading inline component...");
  console.log(element);

  let { element: el, propertyDefinitionMap } = parseComponent(element);

  return { element: el, propertyDefinitionMap };
}

async function loadExternalComponent(src) {
  console.log("Loading external component...");
  console.log(src);

  // first, we have to fetch the component's actual element that contains valid html
  // this should be either a template or a custom element with a hyphen in its name
  let res = await fetch(src).catch((err) => {
    throw err;
  });
  console.log(
    "%cFetched component successfully.",
    "color: lime; text-decoration: underline; text-decoration-style: dashed;"
  );

  let text = await res.text().catch((err) => {
    throw err;
  });
  console.log(
    "%cRead component text successfully.",
    "color: lime; text-decoration: underline; text-decoration-style: dashed;"
  );

  // if successful, we will parse the text into a valid element
  /** @type {ChildNode} */
  let el;

  // if this is a custom element, it will get parsed as an entire document fragment
  let parsed = domParser.parseFromString(text, "text/html");

  console.log(parsed);

  el = parsed.head.firstChild;

  if (!el) {
    // template not found, this is a custom element
    el = parsed.body.firstChild;

    if (!el) {
      throw new Error(
        "Invalid component definition; custom elements must be defined as templates or as custom elements with a hyphen in their name."
      );
    }

    let name = el.tagName;

    if (!name.includes("-")) {
      throw new Error(
        "Invalid component definition; custom elements must have a hyphen in their name."
      );
    }
  } else {
    // template found, this is a template element
    let name = el.getAttribute("id") ?? el.getAttribute("name"); // templates must have a name. id is preferred, but name is also acceptable.

    if (!name || !name.includes("-")) {
      throw new Error(
        "Invalid template definition; component imports defined as templates must have a name attribute (containing a hyphen)."
      );
    }

    // get all the attributes and their values of the outer template element

    /** @type {NamedNodeMap} */
    let attributes = el.attributes;

    document.body.attributes = attributes;

    let newHtmlElement = document.createElement(name);
    newHtmlElement.innerHTML = el.innerHTML;
    newHtmlElement.attributes = attributes;

    el = newHtmlElement;
  }

  // now we can do all sorts of things with the element before we define it as a custom element across the entire document
  console.log("Parsed component successfully:", el);

  return { ...parseComponent(el) };
}

/**
 * Takes care of parsing special syntax in the component definition such as method and regular property definitions.
 * @param {HTMLElement} element
 * @returns {{ element: HTMLElement, propertyDefinitionMap: { [key: string]: { type: "method" | "property", args: string[] | null, body: string } } }}
 */
function parseComponent(element) {
  let propertyDefinitionMap = {};
  let attributes = element.attributes;

  // method definitions are provided at the top level of the component definition. no need to traverse the tree.
  let children = element.childNodes;

  console.log("Children:", children);

  // <-- TODO: HANDLING VERY SPECIAL SYNTAX THAT THE BROWSER COMPLETELY DISREGARDS -->

  let lastParsedInvalidSyntaxType = null; // 'text' | 'comment' | null

  /**
   * A map of special syntax blocks that the browser does not recognize as valid elements.
   * We will have to parse these manually because the web standards do not allow for custom syntax (for good reason).
   * But we are better than everybody else, so we will do it anyway :) Hopefully nothing bad will come of this.
   * @type {{[key: string]: { opening: "<@blah>", closing: "</@blah>", body: string, attributes: { [key: string]: string } } }
   */
  let specialSyntaxBlocks = {}; 
  let currentSpecialSyntaxBlock = {};

  for (let child of children) {
    if (lastParsedInvalidSyntaxType == null) {
      // disregard empty text nodes
      if (child.nodeType === Node.TEXT_NODE && child.wholeText.trim().replace(/\n/g, "") === "") {
        // TODO: This is completely broken.
        console.log("Empty text node found. Skipping...");
        continue;
      }

      // we are at the beginning of a special syntax block
      // ex. <@click (e)>

      if (child.nodeType === Node.TEXT_NODE) {
        let value = child.textContent.trim();
        console.log("%cText node found:", "color: magenta; font-weight: bold;");
        console.log(child);


        lastParsedInvalidSyntaxType = "text";
      }
    }
    else if (lastParsedInvalidSyntaxType === "text") {
      // we are at the end of a special syntax block
      // ex. </@click>

      if (child.nodeType === Node.COMMENT_NODE) {
        // </@name> becomes just @name
        let nodeName = child.nodeValue; 

        // event listener syntax
        if (nodeName.startsWith("@")) {
          currentSpecialSyntaxBlock["closing"] = "</on-" + nodeName.slice(1) + ">";
        }

        // invalid syntax is parsed by the browser as a text node, then the closing tag becomes a comment node
        console.log("Comment node found:", child);
        /**
         * @type {ChildNode}
         */
        let node = child;

        console.log(node.nodeValue);

        lastParsedInvalidSyntaxType = "comment";
      }
    }
    
    if (lastParsedInvalidSyntaxType === "comment") {
      // we are at the end of a special syntax block. we should parse it now.

      console.log("Invalid syntax block ended.");
      lastParsedInvalidSyntaxType = null; // reset
    }

    if (
      // this means the browser thinks it's an undefined custom element because it has a hyphen in its name
      (child instanceof HTMLUnknownElement ||
        // this means it has no idea what it is, so it's just a generic HTMLElement (every regular element has its own dedicated interface)
        child.constructor.name === "HTMLElement") &&
      // BUT, we do not want to include actual custom elements in the property definition map.
      // we only want to check for elements that are invalid, and allow those to be used to set the properties of the to-be-defined custom element's prototype.
      customElements.get(child.tagName) === undefined
    ) {
      // example of a method definition
      /**
       * <print-two-numbers (num1,num2)>
       *   console.log(num1, num2);
       * </print-two-numbers>
       */
      // as you can see, we are using a valueless attribute to define the list of arguments.
      // in the case of any other property,

      // just checking to see if my assumptions are correct

      // make the javascript-friendly name followThisConvention
      let camelCase = child.tagName
        .toLowerCase()
        .replace(/-([a-z])/g, (g) => g[1].toUpperCase());

      if (camelCase in preservedProperties) {
        throw new Error(
          `Syntax error: Invalid property name '${camelCase}'. This name is reserved for internal use.`
        );
      }

      let attributeNames = child.getAttributeNames();
      let parsedArgumentNames = [];

      const allowedIdentifiers = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/; // this is a regex that matches valid javascript identifiers

      /**
       * Checks if the given string is a valid JavaScript identifier and pushes it to the given array (used as a helper function for the loop below)
       * @param {Array<string>} arr
       * @param {string} identifier
       */
      const pushIdentifierToArray = (arr, identifier) => {
        let result = allowedIdentifiers.exec(identifier);
        if (result) {
          arr.push(result[0]);
        } else {
          throw new Error(
            `Syntax error: Invalid identifier '${identifier}'. Only valid JavaScript identifiers are allowed. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Variables for more information.`
          );
        }
      };

      // try to see if this child element is a method definition
      for (let attrName of attributeNames) {
        if (!attrName.startsWith("(") && !attrName.endsWith(")")) {
          // it's not, so just skip
          parsedArgumentNames = null; // this will let us know later that it isn't a method
        }

        // ok this child element is a method definition
        let currentArgument = "";
        let openings = 0;

        for (let i = 0; i < attrName.length; i++) {
          let c = attrName[i];
          if (c === "(") {
            if (openings > 0)
              throw new Error(
                "Syntax error: Inline method argument list must have only one opening parenthesis."
              );
            openings++;
          } else if (c === ")") {
            if (currentArgument !== "") {
              // trailing commas are normal in js. dont punish the user for having them.
              pushIdentifierToArray(parsedArgumentNames, currentArgument);
            }
          } else if (c === ",") {
            if (currentArgument !== "") {
              pushIdentifierToArray(parsedArgumentNames, currentArgument);
              currentArgument = ""; // clear the buffer in preparation for the next argument
            } else {
              throw new Error(
                "Syntax error: Inline method argument list must not contain empty arguments."
              );
            }
          } else {
            // append current character to current argument
            currentArgument += c;
          }
        }
      }

      if (parsedArgumentNames === null) {
        // property definition
        propertyDefinitionMap[camelCase] = {
          type: "property",
          args: null,
          body: eval(child.innerText.trim()),
        };
      } else {
        // method definition
        propertyDefinitionMap[camelCase] = {
          type: "method",
          args: parsedArgumentNames,
          body: child.innerText.trim(),
        };

        console.log("Removing child:", child);
        // yeet this piece of garbage NOW!!
        element.removeChild(child);
      }
    }
  }

  console.table(propertyDefinitionMap);

  return { element, propertyDefinitionMap };
}
/**
 * Loads a palette from either an external source or an inline definition.
 * @param {HTMLElement} element
 * @todo Finish implementing this function.
 */
async function loadPalette(element) {
  let src = element.getAttribute("src") || element.getAttribute("href") || "";
  const validAttributes = ["src", "href", "name", "override-css"];

  if (src !== "") {
    let external = await loadExternalPalette(src);
    console.error(
      "%cExternal palettes are not yet supported. :(",
      "color: red; font-weight: bold;"
    );
    return null;
  }

  return external;
}

async function loadExternalPalette(src, validAttributes) {
  let res = await fetch(src).catch((err) => {
    throw err;
  });

  let text = await res.text().catch((err) => {
    throw err;
  });

  let parsed = domParser.parseFromString(text, "text/html");

  let children = parsed.body.childNodes;

  let colors = [];

  for (let child of children) {
    if (
      child instanceof HTMLUnknownElement ||
      child.constructor.name === "HTMLElement"
    ) {
      let res = parseColorElement(child);
      colors.push(res);
    }
  }

  return {
    colors,
  };
}

/**
 * Loads an inline palette definition within a <palette> element and returns the parsed element.
 * @param {HTMLElement} element
 * @todo Implement this function.
 */
function loadInlinePalette(element) {
  // TODO: Implement this function.
}

/**
 * Parses a <color> element and whatever special attributes it may have.
 * @param {HTMLElement} element
 * @todo Implement this function.
 */
function parseColorElement(element) {
  /* <color 
    name="red" 
    base="#ff0000" 
    hue-func="linear" 
    saturation-func="linear" 
    lightness-func="linear" 
    alpha-func="linear"
    steps="10"></color>
   */
  // usage later on: <style> button { background-color: var($red); } </style>
}
/**
 * Dynamically defines a custom element based on the given element and property definition.
 * @param {HTMLElement} element
 * @param {{
 *   type: "method" | "property",
 *   args: string[] | null,
 *   body: string
 * }} propertyDefinitionMap
 * @todo Find a way to bind the methods to the class so `this` refers to the instance of the element.
 */
function defineComponent({ element, propertyDefinitionMap }) {
  console.log("Updating Custom Element Registry...");

  let innerHTML = element.innerHTML;
  let props = propertyDefinitionMap;
  let tagName = element.tagName; // when we get here, the format of this string will be "MY-CUSTOM-ELEMENT"
  console.log(props);
  // MY-CUSTOM-ELEMENT => MyCustomElement <- this is the format we want, capitalizing every word's first letter
  let esName = tagName
    .split("-")
    .map((value, index, array) => {
      value = value.toLowerCase();

      // capitalize the first letter of each word
      return value[0].toUpperCase() + value.slice(1);
    })
    .join("");

  // we have to extract the predefined methods to be inserted into connectedCallback, etc.

  let _connected = props["connected"]?.body ?? "";
  let _disconnected = props["disconnected"]?.body ?? "";
  let _adopted = props["adopted"]?.body ?? "";
  let _attribute = props["attribute"]?.body ?? "";

  // before we iterate in the class body so we don't define them as part of the class.
  delete props["connected"];
  delete props["disconnected"];
  delete props["adopted"];
  delete props["attribute"];

  let component = class HTMLComponent extends HTMLElement {
    name = esName;

    constructor() {
      super();
      this.attachShadow({ mode: "open" });

      this.shadowRoot.innerHTML = `
        ${innerHTML}
      `;

      // define the custom element's properties and methods
      for (let [key, value] of Object.entries(props)) {
        if (value.type === "property") {
          Object.defineProperty(this, key, {
            value: value.body,
            writable: true,
          });
        } else {
          // Define and bind methods to ensure `this` refers to the instance
          this[key] = new Function(...value.args, value.body).bind(this);
          console.log("%cMethod defined:", "color: lime; font-weight: bold;");
          console.log(this[key]);
        }
      }

    }

    connectedCallback() {
      this.hidden = false;

      if (_connected) {
        // Execute the connected callback method if defined
        new Function(_connected).call(this);
      }
    }

    disconnectedCallback() {
      if (_disconnected) {
        // Execute the disconnected callback method if defined
        new Function(_disconnected).call(this);
      }
    }

    adoptedCallback() {
      if (_adopted) {
        // Execute the adopted callback method if defined
        new Function(_adopted).call(this);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (_attribute) {
        // Execute the attribute callback method if defined
        new Function('name', 'oldValue', 'newValue', _attribute).call(this, name, oldValue, newValue);
      }
    }
  };

  /**
   * @type {CustomElementConstructor}
   */
  let res = component;

  customElements.define(tagName.toLowerCase(), res);
  console.log(customElements.get(tagName.toLowerCase()));

  // testing
  let el = document.createElement(tagName.toLowerCase());
  document.body.appendChild(el);
  el.connectedCallback();
}