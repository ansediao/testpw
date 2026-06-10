// src/stores/design-usage-store.js
// 设计使用计费 Store — 管理设计使用次数和计费

const { defineStore } = window.Pinia;

const useDesignUsageStore = defineStore('designUsage', {
    state: () => ({
        items: [],
        feePerItem: 7
    }),
    getters: {
        totalFee(state) {
            let total = 0;
            for (const it of state.items) {
                const q = Number(it.quantity || 0);
                if (Number.isFinite(q) && q > 0) {
                    total += q * state.feePerItem;
                }
            }
            return total;
        },
    },
    actions: {
        addDesign(payload) {
            const id = payload && payload.id ? String(payload.id) : '';
            const name = payload && payload.name ? String(payload.name) : '';
            const image = payload && payload.image ? String(payload.image) : '';
            const sku = payload && payload.sku ? String(payload.sku) : '';
            let found = null;
            for (const it of this.items) {
                if ((id && it.id === id) || (!id && image && it.image === image)) {
                    found = it;
                    break;
                }
            }
            if (found) {
                found.quantity = (Number(found.quantity || 0) + 1);
                if (!found.sku && sku) found.sku = sku;
            } else {
                this.items.push({ id, name, image, sku, quantity: 1 });
            }
        },
        removeDesign(payload) {
            const id = payload && payload.id ? String(payload.id) : '';
            const image = payload && payload.image ? String(payload.image) : '';
            for (let i = 0; i < this.items.length; i++) {
                const it = this.items[i];
                const match = (id && it.id === id) || (!id && image && it.image === image);
                if (match) {
                    const nextQty = Number(it.quantity || 0) - 1;
                    if (nextQty > 0) {
                        it.quantity = nextQty;
                    } else {
                        this.items.splice(i, 1);
                    }
                    break;
                }
            }
        },
        clear() {
            this.items = [];
        }
    }
});
export { useDesignUsageStore };
window.pwcaUseDesignUsageStore = useDesignUsageStore;
