class PrintingConfig {
  constructor(config = {}) {
    this.id = config.id || Date.now();
    this.title = config.title || 'Untitled';
    this.description = config.description || '';
    this.thumbnail = config.thumbnail || null;
    this.active = config.active !== undefined ? config.active : true;
    this.priceRuler = config.priceRuler || {
      type: 'multi',
      ranges: []
    };
    this.resources = config.resources || {};
    this.layout = config.layout || {
      components: [],
      actions: [],
      toolbars: []
    };
    this.createdAt = config.createdAt || new Date().toISOString();
    this.updatedAt = config.updatedAt || new Date().toISOString();
  }

  setTitle(title) {
    this.title = title;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  setDescription(description) {
    this.description = description;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  setThumbnail(thumbnail) {
    this.thumbnail = thumbnail;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  setPriceRuler(ruler) {
    this.priceRuler = {
      ...this.priceRuler,
      ...ruler
    };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  setResource(type, config) {
    this.resources[type] = {
      ...this.resources[type],
      ...config
    };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  setLayout(layout) {
    this.layout = {
      ...this.layout,
      ...layout
    };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  activate() {
    this.active = true;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  deactivate() {
    this.active = false;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      thumbnail: this.thumbnail,
      active: this.active,
      priceRuler: this.priceRuler,
      resources: this.resources,
      layout: this.layout,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(json) {
    return new PrintingConfig(json);
  }
}

module.exports = PrintingConfig;
