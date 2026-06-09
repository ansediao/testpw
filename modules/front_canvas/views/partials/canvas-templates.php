<template id="pwca-header-controls-template">
    <div class="pwca-header-right-content">
        <div id="history-controls" class="pwca-history-controls">
            <div
                v-for="view in store.views"
                :key="view.id"
                v-show="view.id === store.activeViewId"
                class="pwca-history-btn-group"
            >
                <button
                    :id="'backward-' + view.id"
                    class="pwca-history-btn"
                    :disabled="!getCanUndo(view.id)"
                    @click="handleUndo(view.id)"
                    :style="{
                        color: getCanUndo(view.id) ? '#000' : '#ccc',
                        background: 'none',
                        border: 'none',
                        cursor: getCanUndo(view.id) ? 'pointer' : 'default',
                        padding: '0 5px'
                    }"
                >
                    <i class="iconfont icon-houtui"></i>
                </button>
                <button
                    :id="'forward-' + view.id"
                    class="pwca-history-btn"
                    :disabled="!getCanRedo(view.id)"
                    @click="handleRedo(view.id)"
                    :style="{
                        color: getCanRedo(view.id) ? '#000' : '#ccc',
                        background: 'none',
                        border: 'none',
                        cursor: getCanRedo(view.id) ? 'pointer' : 'default',
                        padding: '0 5px'
                    }"
                >
                    <i class="iconfont icon-Icon-forward"></i>
                </button>
            </div>
        </div>
        <div class="pwca-design-switch-btn-box">
            <button
                class="pwca-design-switch-btn"
                :class="{ active: activeTab === 'viewDesign' }"
                @click="switchTab('viewDesign')"
                data-tab="viewDesign"
            >
                Design
            </button>
            <button
                class="pwca-design-switch-btn"
                id="renderBtn"
                :class="{ active: activeTab === 'viewMockup' }"
                @click="switchTab('viewMockup')"
                data-tab="viewMockup"
            >
                Mockups
            </button>
        </div>
        <button id="generatePdfBtn" @click="generatePdf">PDF</button>
        <a :href="productLink" class="pwca-close-btn" title="Back to Product">
            X
        </a>
    </div>
</template>

<template id="pwca-product-card-footer-template">
    <div class="pwca-product-card__info">
        <div class="pwca-product-card__detail">
            <span class="pwca-product-card__label">Minimum Order Quantity</span>
            <span class="pwca-product-card__value">
                <span v-show="showDesign">{{ moqDesignText }}</span>
                <br v-show="showDesign && showColor" />
                <span v-show="showColor">{{ moqColorText }}</span>
            </span>
        </div>
        <div class="pwca-product-card__detail">
            <span class="pwca-product-card__label">Price</span>
            <span class="pwca-product-card__value">
                Base Price:
                <template v-if="hasDiscount">
                    <span class="price-value unit-price discounted">$ {{ discountedBasePrice }} </span>
                    <span class="discount-badge">{{ discountText }}</span>
                </template>
                <template v-else>
                    <span class="price-value unit-price">$ {{ originalBasePrice }}</span>
                </template>
                <br>
                Customization Price: <span>$ {{ customizationPrice }}</span>
            </span>
        </div>
        <div class="pwca-product-card__detail">
            <span class="pwca-product-card__label">
                Estimated delivery date:<br>Estimated arrival date:
            </span>
            <span class="pwca-product-card__value">
                <span>{{ estimatedDeliveryDate }}</span><br>
                <span>{{ estimatedArrivalDate }}</span>
            </span>
        </div>
    </div>
    <div class="pwca-product-card__quantity">
        <button
            class="pwca-product-card__button pwca-product-card__button--minus"
            :disabled="quantityDisabled"
            @click="onMinus"
        >
            -
        </button>
        <input
            type="number"
            :min="minQuantity"
            :max="maxQuantity"
            :step="batchQuantity"
            v-model.number="quantity"
            class="pwca-product-card__input"
            :readonly="quantityDisabled"
        >
        <button
            class="pwca-product-card__button pwca-product-card__button--plus"
            :disabled="quantityDisabled"
            @click="onPlus"
        >
            +
        </button>
    </div>
</template>