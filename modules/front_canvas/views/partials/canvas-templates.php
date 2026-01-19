<template id="pwca-header-controls-template">
    <div class="header_right_content">
        <div id="history-controls" class="history-controls">
            <div
                v-for="view in store.views"
                :key="view.id"
                v-show="view.id === store.activeViewId"
                class="history-btn-group"
            >
                <button
                    :id="'backward-' + view.id"
                    class="history-btn"
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
                    class="history-btn"
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
        <div class="design-switch-btn-box">
            <button
                class="design-switch-btn"
                :class="{ active: activeTab === 'viewDesign' }"
                @click="switchTab('viewDesign')"
                data-tab="viewDesign"
            >
                Design
            </button>
            <button
                class="design-switch-btn"
                id="renderBtn"
                :class="{ active: activeTab === 'viewMockup' }"
                @click="switchTab('viewMockup')"
                data-tab="viewMockup"
            >
                Mockups
            </button>
        </div>
        <button id="generatePdfBtn" @click="generatePdf">PDF</button>
        <a :href="productLink" class="close-btn" title="返回产品页">
            X
        </a>
    </div>
</template>

<template id="pwca-product-card-footer-template">
    <div class="product-card__info">
        <div class="product-card__detail">
            <span class="product-card__label">Minimum Order Quantity</span>
            <span class="product-card__value">
                <span v-show="showDesign">{{ moqDesignText }}</span>
                <br v-show="showDesign && showColor" />
                <span v-show="showColor">{{ moqColorText }}</span>
            </span>
        </div>
        <div class="product-card__detail">
            <span class="product-card__label">Price</span>
            <span class="product-card__value">
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
        <div class="product-card__detail">
            <span class="product-card__label">
                Estimated delivery date:<br>Estimated arrival date:
            </span>
            <span class="product-card__value">
                <span>{{ estimatedDeliveryDate }}</span><br>
                <span>{{ estimatedArrivalDate }}</span>
            </span>
        </div>
    </div>
    <div class="product-card__quantity">
        <button
            class="product-card__button product-card__button--minus"
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
            class="product-card__input"
            :readonly="quantityDisabled"
        >
        <button
            class="product-card__button product-card__button--plus"
            :disabled="quantityDisabled"
            @click="onPlus"
        >
            +
        </button>
    </div>
</template>