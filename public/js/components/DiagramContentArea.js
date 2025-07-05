/**
 * 这是一个经过改进的 Vue 组件。
 * 它现在可以将多个图层（shadow 和 color）绘制到对应的 canvas 上。
 * 代码被重构为一个可复用的函数，以提高可维护性。
 */
export default {
  template: `
    <div class="diagram-content">
      <!-- 
        为 canvas 的容器添加了 'position: relative'。
        这是为了让内部的 canvas 元素可以使用 'position: absolute' 进行精确定位。
      -->
      <div class="canvas-container" :style="{ width: productData.canvas_width + 'px', height: productData.canvas_height + 'px' }">
        <canvas id="shadowLayer" :width="productData.canvas_width" :height="productData.canvas_height"></canvas>
        <canvas id="colorLayer" :width="productData.canvas_width" :height="productData.canvas_height"></canvas>
        <canvas id="mainCanvas" :width="productData.canvas_width" :height="productData.canvas_height"></canvas>
        <canvas id="boundaryLayer" :width="productData.canvas_width" :height="productData.canvas_height"></canvas>
      </div>
      <div class="view-area" v-if="productData.pw_productType !== '1'">
        {{ productData }}
      </div>

      <!-- 
        CSS 样式保持不变，确保所有 canvas 正确堆叠。
      -->
      <style>
        .canvas-container {
          position: relative;
          border: 1px solid #ccc; /* 添加一个边框，方便调试时看到容器位置 */
        }
        .canvas-container canvas {
          position: absolute;
          top: 0;
          left: 0;
          background-color: transparent; /* 必须！确保上层画布是透明的 */
        }
      </style>
    </div>`,
  data() {
    return {
      productData: productData
    };
  },
  methods: {
    /**
     * 【新】这是一个统一的入口函数，负责调用所有图层的绘制任务。
     */
    renderAllLayers() {
      // 绘制阴影图层
      this.drawImageOnCanvas('shadowLayer', this.productData.shadow_details_image_url);
      
      // 绘制颜色图层
      this.drawImageOnCanvas('colorLayer', this.productData.color_image_url);
    },

    /**
     * 【重构】这是一个通用的绘图函数。
     * @param {string} canvasId - 需要绘制的目标 canvas 的 ID。
     * @param {string} imageUrl - 要绘制的图片的 URL。
     */
    drawImageOnCanvas(canvasId, imageUrl) {
      const canvasWidth = this.productData.canvas_width;
      const canvasHeight = this.productData.canvas_height;

      // 检查 URL 和画布尺寸是否有效
      if (!imageUrl || !canvasWidth || !canvasHeight) {
        console.log(`等待 ${canvasId} 的图片 URL 和画布尺寸...`);
        return;
      }

      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`无法找到ID为 '${canvasId}' 的 canvas 元素。`);
        return;
      }

      // 如果 URL 是以 "/" 开头的相对路径，则为其添加域名，构成完整的绝对路径。
      // 这可以确保图片在任何情况下都能被正确加载。
      let fullUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        fullUrl = window.location.origin + imageUrl;
      }
      
      console.log(`开始为 ${canvasId} 加载图片:`, fullUrl);

      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        console.log(`✅ ${canvasId} 的图片加载成功，正在绘制...`);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log(`🎉 ${canvasId} 绘制完成！`);
      };

      img.onerror = () => {
        console.error(`❌ ${canvasId} 的图片加载失败。请检查 URL:`, fullUrl);
      };

      img.src = fullUrl;
    }
  },
  watch: {
    /**
     * 深度侦听整个 'productData' 对象。
     * 当任何数据（如 URL 或尺寸）变化时，重新绘制所有图层。
     */
    productData: {
      handler(newValue, oldValue) {
        console.log(`检测到 productData 变化，准备重新渲染所有图层。`);
        this.renderAllLayers();
      },
      deep: true
    }
  },
  mounted() {
    console.log("组件已成功挂载 (Component has been successfully mounted)!");
    // 初始调用，绘制所有图层。
    this.renderAllLayers();
  }
};