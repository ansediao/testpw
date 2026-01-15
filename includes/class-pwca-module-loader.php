<?php

/**
 * 模块加载器
 *
 * 负责扫描插件根目录下的 modules/ 目录，并依次 include 各子目录中的 index.php。
 * Day 1：只做文件包含，不注册任何钩子，不改变现有行为。
 */
class Pwca_Module_Loader {

    /**
     * 模块根目录路径（绝对路径，以目录分隔符结尾）
     *
     * @var string
     */
    protected $modules_path;

    /**
     * @param string $modules_path 模块目录绝对路径
     */
    public function __construct( $modules_path ) {
        $this->modules_path = rtrim( $modules_path, DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR;
    }

    /**
     * 扫描 modules/ 子目录并加载各模块 index.php
     */
    public function load() {
        if ( ! is_dir( $this->modules_path ) ) {
            return;
        }

        $dirs = glob( $this->modules_path . '*', GLOB_ONLYDIR );
        if ( ! is_array( $dirs ) || empty( $dirs ) ) {
            return;
        }

        foreach ( $dirs as $dir ) {
            $index = $dir . DIRECTORY_SEPARATOR . 'index.php';
            if ( file_exists( $index ) ) {
                include_once $index;
            }
        }
    }
}