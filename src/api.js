/**
 * options.endpoint options.token
 */
export class AdresseSearchAPI {
  apiUrl = "https://adressevaelger.dk";
  token = "";
  inputElement = null

  constructor(options) {
    if (!options || !options.token || !options.inputElement) {
      throw new Error(
        'AdresseSearchAPI must be initialized with a valid configuration. `{token, inputElement} is the minimum required.`',
      );
    }
    this.token = options.token;
    this.inputElement = options.inputElement
    // Configure custom API URL
    if (options.apiUrl) {
      this.apiUrl = options.apiUrl;
    }
  }

  async search(endpoint, query, options = {}) {
    // Input sanitation using a HTML conversion
    const sanitationElement = document.createElement('p')
    sanitationElement.innerHTML = query
    const cleanQuery = sanitationElement.innerText

    if (cleanQuery.length > 73) {
      throw new Error("Search query was too long (73+ characters).");
    } else if (cleanQuery === '') {
      throw new Error("Search query was empty.");
    } else if (!endpoint || !query) {
      throw new Error("search() requires both endpoint and query parameters.");
    }

    const response = await fetch(
      `${this.apiUrl}/${endpoint}/soeg?tekst=${cleanQuery}&token=${this.token}${this.formatParams(options)}`,
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Status ${response.status} - ${body}`);
    }
    const data = await response.json();
    if (data.status === "fejl") {
      throw new Error(`Search error: ${data.beskrivelse}`);
    }
    return data.fund;
  }

  getEndpoint(itemType) {
    switch (itemType) {
      case 'husnummer':
        return 'husnumre'
      case 'navngivenvejpostnummer':
        return 'navngivenvejpostnumre'
      default:
        return 'adresser'
    }
  }

  async get(item) {
    if (!item.id || !item.type) {
      throw new Error("get() requires id parameter.");
    }
    const endpoint = this.getEndpoint(item.type)
    const response = await fetch(
      `${this.apiUrl}/${endpoint}/${item.id}?token=${this.token}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === "fejl") {
      throw new Error(data.beskrivelse);
    }
    return data;
  }

  formatParams(options) {
    let queryStr = "";
    if (options.medtagForeloebige) {
      queryStr += `&medtagForeloebige=true`;
    }
    if (options.maksimum) {
      queryStr += `&maksimum=${options.maksimum}`;
    }
    if (options.kommuneKode) {
      queryStr += `&kommuneKode=${options.kommuneKode}`;
    }
    if (options.vejnavn) {
      queryStr += `&vejnavn=${options.vejnavn}`;
    }
    if (options.postnummer) {
      queryStr += `&postnummer=${options.postnummer}`;
    }
    return queryStr;
  }

  errorHandler(err) {
    if (!this.inputElement) {
      console.error(err)
    } else {
      console.error(err)
      this.inputElement.dispatchEvent(
        new CustomEvent("address:error", {
          bubbles: true,
          composed: true,
          detail: { message: err.message },
        }),
      );
    }
  }

  async selectProcessor(options) {
    const { item, searchType } = options
    if (
      item.type === "vejnavn" ||
      item.type === "vejnavnhusnummer" ||
      item.type === "navngivenvejpostnummer" ||
      (item.type === "husnummer" && searchType === "adresser")
    ) {
      // Search again with narrower search string
      this.inputElement.value = item.titel;
      return {
        selection: false,
        data: item
      }
    } else {
      // Handle selected item
      if (item.type === "adresse" || item.type === "husnummer") {
        return await this.selectItem(item);
      } else {
        this.errorHandler(new Error(`${item.type} is not a valid type`));
        return {
          selection: false,
          data: null
        }
      }

    }
  }

  async selectItem(item) {
    try {
      const data = await this.get(item);
      this.inputElement.value = item.titel;
      this.inputElement.dispatchEvent(
        new CustomEvent("address:select", {
          bubbles: true,
          composed: true,
          detail: data,
        }),
      );
      return {
        selection: true,
        data: data
      }
    } catch (err) {
      this.errorHandler(new Error(`Failed to fetch items: ${err.message}`));
    }
  }
}
