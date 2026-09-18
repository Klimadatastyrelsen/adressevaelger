import { AdresseSearchAPI } from "./api.js";

export function adressevaelger(element, options) {
  return new AdresseSearchUI(element, options);
}

export class AdresseSearchUI {
  searchType = "adresser";
  debounceTimer;
  options;
  wrapperElement;
  inputElement;
  listElement;
  api;

  constructor(element, options) {
    this.options = options;
    this.searchType = options.adgangsadresserOnly ? "husnumre" : "adresser";
    this.inputElement = element;
    this.listElement = document.createElement("div");
    this.wrapperElement = this.inputElement.parentNode;
    this.wrapperElement.append(this.listElement);
    this.inputElement.addEventListener("input", this.inputHandler.bind(this));
    this.wrapperElement.addEventListener(
      "keyup",
      this.listKeyHandler.bind(this),
    );
    document.addEventListener("click", this.outsideClickHandler.bind(this));
    let opt = {
      token: this.options.token,
      inputElement: this.inputElement
    }
    if (this.options.apiUrl) {
      opt.apiUrl = this.options.apiUrl
    }
    this.api = new AdresseSearchAPI(opt);
  }

  inputHandler(event) {
    if (event.target.value === "") {
      this.renderDOMList(this.listElement, []);
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(async () => {
      await this.refreshList(event.target.value);
    }, 500);
  }

  async refreshList(queryText) {
    try {
      const data = await this.api.search(
        this.searchType,
        queryText,
        this.options,
      );
      this.renderDOMList(this.listElement, data);
    } catch (err) {
      this.api.errorHandler(new Error(`Failed to load search items: ${err.message}`));
    }
  }

  renderDOMList(parentElement, items) {
    const ulEl = document.createElement("ul");
    ulEl.className = "adressevaelger-suggestions";
    ulEl.role = "listbox";
    ulEl.ariaLabel = "Søgeresultater";
    items.forEach((item) => {
      this.renderDOMListItem(ulEl, item);
    });
    parentElement.querySelector("ul")?.remove();
    parentElement.append(ulEl);
  }

  renderDOMListItem(parentElement, item) {
    const liEl = document.createElement("li");
    liEl.className = "adressevaelger-suggestion";
    liEl.role = "option";
    liEl.tabIndex = 0;
    liEl.dataset.item = JSON.stringify(item);
    liEl.addEventListener("click", (event) => {
      this.select(event);
    });
    liEl.innerText = item.titel;
    parentElement.append(liEl);
  }

  listKeyHandler(event) {
    if (event.key === "ArrowDown") {
      this.moveFocus(1);
    } else if (event.key === "ArrowUp") {
      this.moveFocus(-1);
    } else if (
      event.key === "Enter" &&
      this.listElement.querySelector(":focus")
    ) {
      this.inputElement.focus();
      this.select(event);
    } else if (event.key === "Escape") {
      this.inputElement.focus();
      this.listElement.querySelector("ul")?.remove();
    }
  }

  outsideClickHandler(event) {
    if (!this.wrapperElement.contains(event.target)) {
      this.listElement.querySelector("ul")?.remove();
    }
  }

  moveFocus(direction) {
    if (!this.listElement.querySelector("ul")) {
      return;
    }
    const next = this.listElement.querySelector(":focus")?.nextElementSibling;
    const previous =
      this.listElement.querySelector(":focus")?.previousElementSibling;
    const first = this.listElement.querySelector("li");
    this.listElement.querySelectorAll("li").forEach((li) => {
      li.classList.remove("dawa-selected");
    });
    if (direction === 1 && !next && !previous) {
      first.focus();
    } else if (direction === -1 && !previous) {
      this.inputElement.focus();
    } else if (direction === 1 && next) {
      next.focus();
    } else if (direction === -1 && previous) {
      previous.focus();
    }
    this.listElement.querySelector(":focus")?.classList.add("dawa-selected");
  }

  select(event) {
    this.api.selectProcessor({
      item: JSON.parse(event.target.dataset.item),
      searchType: this.searchType,
    }).then((result) => {
      if (result.selection && result.data) {
        this.listElement.querySelector("ul")?.remove();
        this.options.select(result.data);
      } else if (result.data) {
        this.refreshList(result.data.titel);
      }
    });
  }
}
