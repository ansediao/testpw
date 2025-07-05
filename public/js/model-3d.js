// 3D模型显示功能
function init3DModel() {
    const modelContainer = document.getElementById('model3dContainer');
    if (! modelContainer) {
        console.error('找不到模型容器元素');
        return;
    }
    const modelUrl = modelContainer.getAttribute('data-model-url');
    if (! modelUrl) {
        console.error('模型URL未设置');
        return;
    }
    console.log('尝试加载3D模型:', modelUrl);
    // 设置容器样式
    modelContainer.style.width = '100%';
    modelContainer.style.height = '400px';
    modelContainer.style.backgroundColor = '#f0f0f0';
    modelContainer.style.position = 'relative';
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, modelContainer.clientWidth / modelContainer.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // 检查WebGL支持
    if (! renderer) {
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '20px';
        errorMsg.textContent = '您的浏览器不支持WebGL，无法显示3D模型';
        modelContainer.appendChild(errorMsg);
        return;
    }
    // 修复: 确保使用正确的编码方式
    try {
        if (THREE.sRGBEncoding !== undefined) {
            renderer.outputEncoding = THREE.sRGBEncoding;
        } else if (THREE.SRGBColorSpace !== undefined) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
    } catch (e) {
        console.warn('设置渲染器编码时出错:', e);
    }
    modelContainer.appendChild(renderer.domElement);
    // 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    // 添加背光，使模型更容易看清
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);
    // 添加轨道控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // 全局变量存储模型和纹理引用
    window.modelMesh = null;
    window.modelMaterial = null;
    window.modelTexture = null;
    // 尝试加载模型
    try {
        const loader = new THREE.GLTFLoader();
        // 添加错误处理
        loader.load(modelUrl, function (gltf) { // 模型加载成功
            console.log('模型加载成功:', gltf);
            const model = gltf.scene;
            // 检查模型是否为空
            if (! model || ! model.children || model.children.length === 0) {
                console.error('加载的模型没有内容');
                return;
            }
            // 遍历模型的所有子对象，确保材质可见并准备应用纹理
            model.traverse(function (child) {
                if (child.isMesh) { // 保存对网格和材质的引用，以便后续更新纹理
                    window.modelMesh = child;
                    // 确保材质设置正确
                    if (child.material) { // 如果材质是数组
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.side = THREE.DoubleSide; // 双面渲染
                                mat.transparent = true;
                                mat.opacity = 1.0;
                                window.modelMaterial = mat; // 保存第一个材质引用
                            });
                        } else {
                            child.material.side = THREE.DoubleSide; // 双面渲染
                            child.material.transparent = true;
                            child.material.opacity = 1.0;
                            window.modelMaterial = child.material; // 保存材质引用
                        }
                    }
                }
            });
            // 自动调整模型大小和位置
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            console.log('模型尺寸:', size);
            console.log('模型中心点:', center);
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim === 0 || isNaN(maxDim)) {
                console.error('模型尺寸计算为零或无效');
                return;
            }
            const scale = 3 / maxDim;
            model.scale.set(scale, scale, scale);
            model.position.x = - center.x * scale;
            model.position.y = - center.y * scale;
            model.position.z = - center.z * scale;
            // 添加模型到场景
            scene.add(model);
            // 调整相机位置以适应模型
            const distance = maxDim * 1.5;
            camera.position.set(distance, distance, distance);
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            // 初始加载完成后，立即捕获画布并应用纹理
            captureCanvas(false).then(imageUrl => {
                updateModelTexture(imageUrl);
                console.log('初始纹理已应用到模型');
            });
        }, function (xhr) { // 加载进度 - 不显示进度信息
            if (xhr.lengthComputable) {
                const percent = Math.floor((xhr.loaded / xhr.total) * 100);
                console.log('模型加载进度: ' + percent + '%');
            }
        }, function (error) { // 加载错误
            console.error('模型加载错误:', error);
            // 显示错误信息（简化版）
            const errorMsg = document.createElement('div');
            errorMsg.style.color = 'red';
            errorMsg.style.padding = '20px';
            errorMsg.textContent = '模型加载失败: ' + error.message;
            modelContainer.appendChild(errorMsg);
        });
    } catch (e) {
        console.error('初始化3D模型加载器时出错:', e);
        // 显示错误信息（简化版）
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '20px';
        errorMsg.textContent = '初始化3D模型加载器失败: ' + e.message;
        modelContainer.appendChild(errorMsg);
    }
    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    // 窗口大小调整时重设渲染器大小
    window.addEventListener('resize', function () {
        camera.aspect = modelContainer.clientWidth / modelContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    });
}
// 添加更新3D模型纹理的函数
function updateModelTexture(imageUrl) {
    if (!window.modelMesh) {
        console.log('模型网格未准备好，无法更新纹理');
        return;
    }
    // 如果已有纹理，则更新它
    if (window.modelTexture) {
        window.modelTexture.dispose(); // 释放旧纹理
    }
    // 创建新纹理
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, function (texture) {
        const img = texture.image;
        // 创建临时画布并翻转图像
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // 设置画布尺寸为非boundary区域的尺寸
        const boundaryMargin = BOUNDARY_MARGIN;
        const validWidth = img.width -(boundaryMargin * 2);
        const validHeight = img.height -(boundaryMargin * 2);
        canvas.width = img.width;
        canvas.height = img.height;
        // canvas.width = validWidth;
        // canvas.height = validHeight;
        ctx.translate(0, img.height);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0);
        // 只绘制非boundary区域
        ctx.drawImage(img, boundaryMargin, boundaryMargin, // 源图像裁剪起点
        validWidth, validHeight, // 源图像裁剪尺寸
                0, 0, // 目标画布起点
        validWidth, validHeight // 目标画布尺寸
        );
        // 使用翻转后的画布创建新纹理
        window.modelTexture = new THREE.Texture(canvas);
        window.modelTexture.needsUpdate = true;
        // 更新材质
        if (window.modelMaterial) {
            window.modelMaterial.map = window.modelTexture;
            window.modelMaterial.needsUpdate = true;
        }
    });
}
// 添加自动更新3D模型的函数
function updateModelFromCanvas() {
    captureCanvas(false).then(imageUrl => {
        updateModelTexture(imageUrl);
    });
}


