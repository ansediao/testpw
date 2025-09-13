// 图层弹窗模板文件
// 包含打印方法选择对话框和图层组印刷方式修改弹窗的HTML模板

export const layerModalsTemplate = `
    <!-- 打印方法选择对话框 - 使用 MicroModal 标准结构 -->
    <div class="pwca-print-method-modal modal micromodal-slide" id="pwca-print-method-modal" aria-hidden="true">
        <div class="pwca-print-method-modal__overlay modal__overlay" tabindex="-1" data-micromodal-close>
            <div class="pwca-print-method-modal__container modal__container" role="dialog" aria-modal="true" aria-labelledby="pwca-print-method-title">
                <header class="pwca-print-method-modal__header modal__header">
                    <h2 class="pwca-print-method-modal__title modal__title" id="pwca-print-method-title">Print Method Setting</h2>
                    <button class="pwca-print-method-modal__close modal__close" aria-label="Close modal" data-micromodal-close></button>
                </header>
                <main class="pwca-print-method-modal__content modal__content">
                    <div class="pwca-print-methods">
                        <div class="pwca-method-grid">
                            <label v-for="method in printMethods" :key="method.id" class="pwca-method-option">
                                <input 
                                    type="radio" 
                                    v-model="selectedPrintMethodId" 
                                    :value="method.id" 
                                    name="printMethod" 
                                />
                                <span class="pwca-method-label">{{ method.label }}</span>                               
                            </label>
                        </div>
                    </div>
                    
                    <div class="pwca-method-tabs">
                        <div class="pwca-tab" :class="{active: activeTab === 'color'}" @click="activeTab = 'color'">Color</div>
                        <div class="pwca-tab" :class="{active: activeTab === 'moq'}" @click="activeTab = 'moq'">MOQ</div>
                        <div class="pwca-tab" :class="{active: activeTab === 'printarea'}" @click="activeTab = 'printarea'">Print Area</div>
                    </div>
                    
                    <div class="pwca-tab-content">
                        <div v-if="activeTab === 'color'" class="pwca-color-content">
                            <!-- Color 选项卡内容 -->
                            <p>{{ printMethods.find(method => method.id === selectedPrintMethodId)?.apiData.printable_color || 'No method selected' }}</p>
                        </div>
                        <div v-if="activeTab === 'moq'" class="pwca-moq-content">
                            <!-- MOQ 选项卡内容 -->
                            <p>{{ printMethods.find(method => method.id === selectedPrintMethodId)?.apiData.moq_quantity || 'No method selected' }}</p>
                        </div>
                        <div v-if="activeTab === 'printarea'" class="pwca-printarea-content">
                            <!-- Print Area 选项卡内容 -->
                            <img v-if="printMethods.find(method => method.id === selectedPrintMethodId)?.apiData.print_method_area" 
                                 :src="printMethods.find(method => method.id === selectedPrintMethodId)?.apiData.print_method_area" 
                                 alt="Print Method Area" 
                                 class="pwca-print-method-area-image" />
                            <p v-else>No method selected</p>
                        </div>
                    </div>
                    
                    <!-- 单选框选项 -->
                    <div v-if="isSelectedLayerInExistingGroup" class="pwca-combination-print-method-options">
                        <label class="pwca-print-method-option">
                            <input type="radio" name="printMethodOption" value="merge" checked />
                            <span>合并印刷方式组</span>
                        </label>
                        <label class="pwca-print-method-option">
                            <input type="radio" name="printMethodOption" value="separate" />
                            <span>独立印刷方式组</span>
                        </label>
                    </div>
                </main>
                <footer class="pwca-print-method-modal__footer modal__footer">
                    <button class="pwca-print-method-modal__btn modal__btn" data-micromodal-close>取消</button>
                    <button class="pwca-print-method-modal__btn pwca-print-method-modal__btn--primary modal__btn modal__btn-primary" @click="assignLayerToPrintMethod">Save</button>
                </footer>
            </div>
        </div>
    </div>
    
    <!-- 图层组印刷方式修改弹窗 -->
    <div class="pwca-group-print-modal modal micromodal-slide" id="pwca-group-print-method-modal" aria-hidden="true">
        <div class="pwca-group-print-modal__overlay modal__overlay" tabindex="-1" data-micromodal-close>
            <div class="pwca-group-print-modal__container modal__container" role="dialog" aria-modal="true" aria-labelledby="pwca-group-print-method-title">
                <header class="pwca-group-print-modal__header modal__header">
                    <h2 class="pwca-group-print-modal__title modal__title" id="pwca-group-print-method-title">修改图层组印刷方式</h2>
                    <button class="pwca-group-print-modal__close modal__close" aria-label="Close modal" data-micromodal-close></button>
                </header>
                <main class="pwca-group-print-modal__content modal__content">
                    <div class="pwca-group-info" v-if="selectedGroupForPrintMethod">
                        <h4 class="pwca-group-info__title">图层组信息</h4>
                        <p class="pwca-group-info__description"><strong>名称:</strong> {{ selectedGroupForPrintMethod.name }}</p>
                        <p class="pwca-group-info__description"><strong>图层数量:</strong> {{ getGroupLayers(selectedGroupForPrintMethod.id).length }}</p>
                    </div>
                    
                    <div class="pwca-print-method-selection">
                        <h4 class="pwca-print-method-selection__title">选择新的印刷方式</h4>
                        <div class="pwca-print-method-selection__grid method-grid">
                            <label v-for="method in printMethods" :key="method.id" class="pwca-print-method-selection__option method-option">
                                <input 
                                    type="radio" 
                                    v-model="selectedGroupPrintMethodId" 
                                    :value="method.id" 
                                    name="groupPrintMethod" 
                                />
                                <span class="pwca-print-method-selection__label method-label">{{ method.label }}</span>
                                <div class="pwca-print-method-selection__description method-description" v-if="method.description">
                                    {{ method.description }}
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="pwca-affected-layers" v-if="selectedGroupForPrintMethod">
                        <h4 class="pwca-affected-layers__title">将要修改的图层</h4>
                        <div class="pwca-affected-layers__list layer-list">
                            <div v-for="layer in getGroupLayers(selectedGroupForPrintMethod.id)" :key="layer.id" class="pwca-layer-preview layer-preview">
                                <div class="pwca-layer-preview__thumbnail layer-thumbnail">
                                    <img v-if="layer.type === 'image'" :src="getLayerThumbnail(layer)" alt="缩略图" />
                                    <div v-else-if="layer.type === 'text'" class="pwca-layer-preview__icon pwca-layer-preview__icon--text text-icon">T</div>
                                    <div v-else class="pwca-layer-preview__icon pwca-layer-preview__icon--default default-icon">📄</div>
                                </div>
                                <span class="pwca-layer-preview__name layer-name">{{ layer.name || layer.type }}</span>
                            </div>
                        </div>
                    </div>
                </main>
                <footer class="pwca-group-print-modal__footer modal__footer">
                    <button class="pwca-group-print-modal__btn modal__btn" data-micromodal-close>取消</button>
                    <button class="pwca-group-print-modal__btn pwca-group-print-modal__btn--primary modal__btn modal__btn-primary" @click="confirmGroupPrintMethodChange">确认修改</button>
                </footer>
            </div>
        </div>
    </div>
`;