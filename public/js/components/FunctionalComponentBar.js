export default {
    template: `
      <div class="functional-component">
          <div class="dongtai-area">          
            <!-- Display buttons for color images -->
            <div v-if="colorImageUrls && colorImageUrls.length > 0">                
                <!-- Loop through the array and create a button for each URL -->
                <button
                    v-for="(url, index) in colorImageUrls"
                    :key="index"
                    class="viewer-switch-btn"
                    :data-image-url="url"
                    style="margin: 5px;"
                >
                    视图 {{ index + 1 }}
                </button>
            </div>
          </div>
      </div>
  `,
    data() {
        return {
            title: productData, colorImageUrls: [] // This will store the array of URLs
        };
    },
    created() {
        // Check if productData exists, has color_image_url, is a string, and is not empty
        const imageUrlString = this.title && typeof this.title === 'object' ? this.title.color_image_url : null;

        if (imageUrlString && typeof imageUrlString === 'string' && imageUrlString.trim() !== '') {
            // Split the string by comma, trim whitespace, and filter out any potentially empty results
            this.colorImageUrls = imageUrlString.split(',').map(url => url.trim()).filter(url => url !== ''); // Ensure no empty strings end up as buttons
        }
    }
};
