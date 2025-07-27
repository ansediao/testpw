<?php
/**
 * API Data Display Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Api_Data_Display {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_sync_product_api_data'), 999);
    }

    /**
     * Display sync product API data (admin only)
     */
    public function display_sync_product_api_data() {
        if (!is_super_admin()) {
            return;
        }

        global $product;
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);
        
        // Output collapsible container
        ?>
        
        <!-- 加载axios库 -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        <div id="pw-sync-product-container" class="pw-sync-product-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
            <!-- Collapsible header -->
            <div id="pw-sync-header" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; color: #333;">产品详细信息</h4>
                <span id="pw-sync-toggle" style="font-size: 18px; color: #666; transition: transform 0.3s ease;">▼</span>
            </div>
            
            <!-- Collapsible content area -->
            <div id="pw-sync-body" style="display: none; padding: 15px;">
                <div id="pw-sync-loading" style="text-align: center; padding: 20px; display: none;">
                    <img src="<?php echo esc_url(MY_PLUGIN_URL . 'assets/images/icons/spinner.gif'); ?>" alt="加载中..." style="width: 32px; height: 32px;">
                    <p style="margin-top: 10px; color: #666;">正在获取产品信息...</p>
                </div>
                <div id="pw-sync-content" style="display: none;"></div>
            </div>
        </div>

        <!-- 右侧悬停面板 -->
        <div id="pw-floating-panel" class="pw-floating-panel">
            <div class="pw-panel-header">
                <span class="pw-panel-title">🔍 API 数据面板</span>
                <div class="pw-panel-controls">
                    <button id="pw-panel-minimize" class="pw-panel-btn" title="最小化">−</button>
                    <button id="pw-panel-close" class="pw-panel-btn" title="关闭">×</button>
                </div>
            </div>
            <div class="pw-panel-content">
                <div class="pw-panel-status">
                    <span id="pw-panel-status-text">准备就绪</span>
                    <div id="pw-panel-loading" class="pw-panel-spinner" style="display: none;"></div>
                </div>
                <div class="pw-panel-tabs">
                    <button class="pw-tab-btn active" data-tab="response">响应数据</button>
                </div>
                <div class="pw-panel-body">
                    <div id="pw-tab-response" class="pw-tab-content active">
                        <div id="pw-response-data">等待API调用...</div>
                    </div>
                </div>
                <div class="pw-panel-footer">
                    <span class="pw-timestamp" id="pw-last-update">未更新</span>
                </div>
            </div>
        </div>

        <!-- 悬停触发按钮 -->
        <div id="pw-floating-trigger" class="pw-floating-trigger" title="显示API数据面板">
            📊
        </div>

        <style>
        #pw-sync-header:hover {
            background-color: #f0f0f0;
        }
        
        #pw-sync-toggle.expanded {
            transform: rotate(180deg);
        }
        
        .pw-sync-slide-down {
            animation: slideDown 0.3s ease-out;
        }
        
        .pw-sync-slide-up {
            animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
            }
            to {
                opacity: 1;
                max-height: 500px;
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                max-height: 500px;
            }
            to {
                opacity: 0;
                max-height: 0;
            }
        }

        /* 悬停面板样式 */
        .pw-floating-trigger {
            position: fixed;
            top: 50%;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 9998;
            transition: all 0.3s ease;
            transform: translateY(-50%);
        }

        .pw-floating-trigger:hover {
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 6px 25px rgba(0,0,0,0.4);
        }

        .pw-floating-panel {
            position: fixed;
            top: 20px;
            right: -400px;
            width: 380px;
            height: calc(100vh - 40px);
            background: white;
            border-radius: 10px 0 0 10px;
            box-shadow: -5px 0 25px rgba(0,0,0,0.2);
            z-index: 9999;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .pw-floating-panel.show {
            right: 0;
        }

        .pw-floating-panel.minimized {
            height: 60px;
        }

        .pw-panel-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px 0 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }

        .pw-panel-title {
            font-weight: 600;
            font-size: 16px;
        }

        .pw-panel-controls {
            display: flex;
            gap: 5px;
        }

        .pw-panel-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .pw-panel-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        .pw-panel-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .pw-panel-status {
            padding: 10px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #6c757d;
        }

        .pw-panel-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #e9ecef;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .pw-panel-tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }

        .pw-tab-btn {
            flex: 1;
            padding: 10px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 12px;
            color: #6c757d;
            transition: all 0.2s;
        }

        .pw-tab-btn.active {
            background: white;
            color: #495057;
            border-bottom: 2px solid #007bff;
        }

        .pw-tab-btn:hover:not(.active) {
            background: #e9ecef;
        }

        .pw-panel-body {
            flex: 1;
            overflow: hidden;
            position: relative;
        }

        .pw-tab-content {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 15px;
            overflow-y: auto;
            display: none;
        }

        .pw-tab-content.active {
            display: block;
        }

        .pw-panel-footer {
            padding: 10px 20px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            flex-shrink: 0;
        }



        .pw-timestamp {
            font-size: 11px;
            color: #6c757d;
        }

        .pw-json-viewer {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 300px;
            overflow-y: auto;
        }



        /* 响应式设计 */
        @media (max-width: 768px) {
            .pw-floating-panel {
                width: 100%;
                right: -100%;
                border-radius: 0;
            }
            
            .pw-floating-trigger {
                right: 10px;
                width: 45px;
                height: 45px;
                font-size: 18px;
            }
        }
        </style>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            var isExpanded = false;
            var isLoaded = false;
            
            // 悬停面板相关变量
            var lastApiResponse = null;

            // 更新面板状态
            function updatePanelStatus(text, loading = false) {
                $('#pw-panel-status-text').text(text);
                $('#pw-panel-loading').toggle(loading);
            }

            // 更新响应数据标签页
            function updateResponseTab(data) {
                var responseContainer = $('#pw-response-data');
                if (data) {
                    var jsonString = JSON.stringify(data, null, 2);
                    responseContainer.html('<div class="pw-json-viewer">' + jsonString + '</div>');
                } else {
                    responseContainer.html('暂无数据');
                }
            }



            // 更新时间戳
            function updateTimestamp() {
                $('#pw-last-update').text('最后更新: ' + new Date().toLocaleString());
            }

            // 新增功能：在控制台输出指定API的返回信息
            function fetchAndLogApiData() {
                updatePanelStatus('正在请求API...', true);
                
                console.log('=== PW Canvas API 调用开始 ===');
                console.log('请求URL:', 'https://mock.apipost.net/mock/2adf9164a465000/mock/2adf9164a465000/?apipost_id=432a4307f209d');
                console.log('请求时间:', new Date().toLocaleString());
                
                axios.get('https://mock.apipost.net/mock/2adf9164a465000/mock/2adf9164a465000/?apipost_id=432a4307f209d')
                    .then(function(response) {
                        // 控制台输出
                        console.log('✅ API请求成功');
                        console.log('📊 返回数据:', response.data);
                        console.log('📋 完整响应对象:', response);
                        console.log('🔢 响应状态码:', response.status);
                        console.log('📄 响应头信息:', response.headers);
                        console.log('⏱️ 响应时间:', new Date().toLocaleString());
                        console.log('=== API 调用结束 ===');
                        
                        if (typeof response.data === 'object') {
                            console.log('🎯 格式化JSON数据:');
                            console.table(response.data);
                        }

                        // 更新面板
                        updatePanelStatus('API请求成功 (状态码: ' + response.status + ')', false);
                        
                        lastApiResponse = response.data;
                        
                        updateResponseTab(response.data);
                        updateTimestamp();
                    })
                    .catch(function(error) {
                        // 控制台输出
                        console.log('❌ API请求失败');
                        console.error('🚫 错误详情:', error);
                        
                        var errorMessage = '请求失败';
                        if (error.response) {
                            console.error('📄 错误响应数据:', error.response.data);
                            console.error('🔢 错误状态码:', error.response.status);
                            console.error('📋 错误响应头:', error.response.headers);
                            errorMessage = '错误状态码: ' + error.response.status;
                        } else if (error.request) {
                            console.error('📡 请求未收到响应:', error.request);
                            errorMessage = '网络请求失败';
                        } else {
                            console.error('⚙️ 请求配置错误:', error.message);
                            errorMessage = '配置错误: ' + error.message;
                        }
                        console.log('⏱️ 错误发生时间:', new Date().toLocaleString());
                        console.log('=== API 调用结束 (失败) ===');

                        // 更新面板
                        updatePanelStatus(errorMessage, false);
                        
                        updateResponseTab(error.response ? error.response.data : null);
                        updateTimestamp();
                    });
            }
            
            // 检查axios是否加载成功
            function checkAxiosAndExecute() {
                if (typeof axios !== 'undefined') {
                    console.log('✅ Axios库加载成功，开始执行API调用');
                    fetchAndLogApiData();
                } else {
                    console.log('⏳ 等待Axios库加载...');
                    setTimeout(checkAxiosAndExecute, 100);
                }
            }
            
            // 页面加载完成后检查并执行API调用
            checkAxiosAndExecute();
            
            // 也可以通过控制台手动调用
            window.pwFetchApiData = fetchAndLogApiData;
            console.log('💡 提示：可以通过 window.pwFetchApiData() 手动调用API');
            console.log('💡 提示：打开浏览器开发者工具的控制台查看API返回信息');

            // 悬停面板控制
            var panelVisible = false;
            var panelMinimized = false;

            // 显示/隐藏面板
            $('#pw-floating-trigger').click(function() {
                if (panelVisible) {
                    $('#pw-floating-panel').removeClass('show');
                    panelVisible = false;
                } else {
                    $('#pw-floating-panel').addClass('show');
                    panelVisible = true;
                }
            });

            // 关闭面板
            $('#pw-panel-close').click(function() {
                $('#pw-floating-panel').removeClass('show');
                panelVisible = false;
            });

            // 最小化/还原面板
            $('#pw-panel-minimize').click(function() {
                if (panelMinimized) {
                    $('#pw-floating-panel').removeClass('minimized');
                    $(this).text('−').attr('title', '最小化');
                    panelMinimized = false;
                } else {
                    $('#pw-floating-panel').addClass('minimized');
                    $(this).text('□').attr('title', '还原');
                    panelMinimized = true;
                }
            });


            
            // Collapsible/expandable functionality
            $('#pw-sync-header').click(function() {
                if (!isExpanded) {
                    // Expand
                    $('#pw-sync-body').removeClass('pw-sync-slide-up').addClass('pw-sync-slide-down').show();
                    $('#pw-sync-toggle').addClass('expanded');
                    isExpanded = true;
                    
                    // Load data if not already loaded
                    if (!isLoaded) {
                        $('#pw-sync-loading').show();
                        
                        // Simulate async loading effect, then use already fetched API data
                        setTimeout(function() {
                            <?php
                            if (is_wp_error($api_response)) {
                                $error_message = $api_response->get_error_message();
                                ?>
                                // Hide loading and show error
                                $('#pw-sync-loading').hide();
                                $('#pw-sync-content').html('<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>API 错误:</strong> <?php echo esc_js($error_message); ?></div>').show();
                                <?php
                            } else {
                                // Format and display JSON data (reuse already fetched API response)
                                $json_html = '<pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">' . esc_html(json_encode($api_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';
                                ?>
                                // Hide loading and display JSON content
                                $('#pw-sync-loading').hide();
                                $('#pw-sync-content').html(<?php echo wp_json_encode($json_html); ?>).show();
                                <?php
                            }
                            ?>
                            isLoaded = true;
                        }, 500); // 500ms delay to show loading effect
                    }
                } else {
                    // Collapse
                    $('#pw-sync-body').removeClass('pw-sync-slide-down').addClass('pw-sync-slide-up');
                    setTimeout(function() {
                        $('#pw-sync-body').hide();
                    }, 300);
                    $('#pw-sync-toggle').removeClass('expanded');
                    isExpanded = false;
                }
            });
        });
        </script>
        
        <?php
    }
}