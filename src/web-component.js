import { AdresseSearchAPI } from "./api.js";

// Web component version of DAR search UI
export class AdresseSearchInput extends HTMLElement {
  static observedAttributes = [
    "placeholder",
    "disabled",
    "adgangsadresser-only",
    "kommune-kode",
    "maksimum",
    "medtag-foreloebige",
    "token",
    "api-url",
  ];
  elementId = `adr-${Math.ceil(Math.random() * 100000)}`;
  disabled = false;
  placeholder = "Søg adresse";
  searchType = "adresser";
  options = {
    kommuneKode: null,
    maksimum: null,
    medtagForeloebige: null,
  };
  debounceTimer;
  inputElement;
  listElement;
  api;
  token;
  style = `
    #${this.elementId} {
      --highlight-color: lightblue;
      max-width: 30rem;
      width: 100%;
      display: block;
    }
    #${this.elementId}-input {
      anchor-name: --input-${this.elementId};
      width: 100%;
      display: block;
    }
    #${this.elementId}-list {
      margin: 0;
      inset: auto;
      position-anchor: --input-${this.elementId};
      position: fixed;
      left: anchor(left);
      top: anchor(bottom);
      right: auto;

      position-try-fallbacks: flip-block;
      max-height: 50vh;
      overflow: auto;

      li {
        cursor: pointer;
      }
      li:hover {
        background-color: var(--highlight-color);
      }
    }
  `;

  constructor() {
    super();
  }

  connectedCallback() {
    this.id = this.elementId;
    this.attachStyle(this.style);
    this.renderList();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "token":
        this.token = newValue;
        break;
      case "adgangsadresser-only":
        this.searchType = "husnumre";
        break;
      case "placeholder":
        this.placeholder = newValue;
        break;
      case "kommune-kode":
        this.options.kommuneKode = newValue;
        break;
      case "maksimum":
        this.options.maksimum = Number(newValue);
        break;
      case "medtag-foreloebige":
        this.options.medtagForeloebige = newValue !== "false" ? true : false;
        break;
      case "api-url":
        this.options.apiUrl = newValue;
        break;
      default:
      // Nothing
    }
    if (name === "disabled" && newValue === "") {
      this.disabled = true;
    }
    this.renderInput();
    this.setAPI();
  }

  setAPI() {
    if (!this.token || !this.inputElement) {
      return;
    }
    let opt = {
      token: this.token,
      inputElement: this.inputElement
    }
    if (this.options.apiUrl) {
      opt.apiUrl = this.options.apiUrl
    }
    this.api = new AdresseSearchAPI(opt);
  }

  select(event) {
    this.api.selectProcessor({
      item: JSON.parse(event.target.dataset.item),
      searchType: this.searchType,
    }).then(async (result) => {
      if (result.selection) {
        this.listElement.hidePopover();
      } else if (result.data) {
        await this.refreshList(result.data.titel);
      }
    });
  }

  selectHandler(event) {
    this.select(event)
  }

  attachStyle() {
    const styleElement = document.createElement("style");
    styleElement.textContent = this.style;
    document.head.append(styleElement);
  }

  renderInput() {
    if (this.inputElement) {
      this.inputElement.remove();
    }
    this.inputElement = document.createElement("input");
    this.inputElement.id = `${this.elementId}-input`;
    this.inputElement.type = "search";
    this.inputElement.role = "combobox";
    this.inputElement.ariaAutocomplete = "list";
    this.inputElement.ariaControls = `${this.elementId}-list`;
    this.inputElement.placeholder = this.placeholder;
    this.inputElement.disabled = this.disabled;
    this.inputElement.addEventListener("input", this.inputHandler.bind(this));
    this.inputElement.addEventListener(
      "keyup",
      this.inputKeyHandler.bind(this),
    );
    this.append(this.inputElement);
  }

  renderList() {
    this.listElement = document.createElement("ul");
    this.listElement.id = `${this.elementId}-list`;
    this.listElement.popover = "auto";
    this.listElement.role = "listbox";
    this.listElement.ariaLabel = "Søgeresultater";
    this.listElement.addEventListener("keyup", this.listKeyHandler.bind(this));
    this.append(this.listElement);
  }

  renderListItems(items) {
    this.listElement.hidePopover();
    this.listElement.innerHTML = "";
    items.forEach((item) => {
      this.listElement.append(this.createListItem(item));
    });
    this.listElement.showPopover();
  }

  createListItem(item) {
    const liElement = document.createElement("li");
    liElement.tabIndex = 0;
    liElement.role = "option";
    liElement.innerText = item.titel;
    liElement.dataset.item = JSON.stringify(item);
    liElement.addEventListener("click", this.selectHandler.bind(this));
    return liElement;
  }

  moveFocus(direction) {
    const next = this.listElement.querySelector(":focus").nextElementSibling;
    const previous =
      this.listElement.querySelector(":focus").previousElementSibling;
    if (direction === 1 && next) {
      next.focus();
    } else if (direction === -1 && previous) {
      previous.focus();
    }
  }

  async refreshList(value) {
    try {
      const data = await this.api.search(this.searchType, value, this.options);
      this.renderListItems(data);
    } catch (err) {
      this.api.errorHandler(new Error(`Failed to load search items: ${err.message}`));
    }
  }

  inputHandler(event) {
    if (event.target.value === "") {
      this.listElement.hidePopover();
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(async () => {
      await this.refreshList(event.target.value);
    }, 300);
  }

  inputKeyHandler(event) {
    if (event.key === "ArrowDown") {
      this.listElement.childNodes[0].focus();
    }
  }

  async listKeyHandler(event) {
    switch (event.key) {
      case "ArrowUp":
        this.moveFocus(-1);
        break;
      case "ArrowDown":
        this.moveFocus(1);
        break;
      case "Enter":
        this.listElement.hidePopover();
        this.select(event)
        break;
      default:
      // Nothing
    }
  }
}
