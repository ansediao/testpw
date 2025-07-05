export default {
    data() {
      return {
        year: new Date().getFullYear(),
      };
    },
    template: `<footer class="footer" id="footer"> <div class="product-card">
        <div class="product-card__info">
            <div class="product-card__detail">
                <span class="product-card__label">起订量</span>
                <span class="product-card__value">100只/设计<br>25只/颜色</span>

            </div>
            <div class="product-card__detail">
                <span class="product-card__label">价格</span>
                <span class="product-card__value">基础价格: $3.0<br>定制费用: $1.0</span>

            </div>
            <div class="product-card__detail">
                <span class="product-card__label">发货日期:<br>到货日期:</span>
                <span class="product-card__value">YYYY-MM-DD<br>YYYY-MM-DD</span>

            </div>
        </div>
        <div class="product-card__quantity">
            <button class="product-card__button product-card__button--minus">-</button>
            <input type="text" value="100" class="product-card__input">
            <button class="product-card__button product-card__button--plus">+</button>
        </div>
        <button class="product-card__add-to-cart">加购物车</button>
    </div></footer>`,
  };
  
