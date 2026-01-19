<!-- 图片 -->
<div id="content-pianquan" class="content-pane">
    <div id="img_origin_controls">
        <div id="dropZone">
            Drag and drop your image here or click to upload
        </div>
        <input type="file" id="imageInput" accept="image/*" />
        <button id="addImageBtn" class="btn btn-custom pwca-add-image-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" class="pwca-icon-inline">
                <path fill="currentColor"
                    d="M21,19V5c0-1.1-0.9-2-2-2H5c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5-4.5z" />
            </svg>
            Add Image
        </button>

        <!-- 已上传过的图片 列表显示在这 -->
        <div id="uploaded-images-list" class="pwca-uploaded-images-list">
            <h3 class="pwca-uploaded-images-title">Uploaded Images</h3>
            <div id="uploaded-images-container" class="pwca-uploaded-images-container">
                <!-- 图片缩略图将通过JS动态插入 -->
            </div>
        </div>
    </div>
    <div id="img_add_controls">

    </div>
</div>