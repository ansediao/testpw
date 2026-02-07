<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Orders_Order_Meta {
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		$instance->register();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		// 在订单创建时存储自定义数据
		add_action( 'woocommerce_checkout_create_order_line_item', array( $this, 'store_custom_data_on_order_item' ), 10, 4 );

		// 控制订单项元数据表格中的显示
		add_filter( 'woocommerce_order_item_display_meta_key', array( $this, 'filter_order_item_display_meta_key' ), 10, 3 );
		add_filter( 'woocommerce_order_item_display_meta_value', array( $this, 'filter_order_item_display_meta_value' ), 10, 3 );
		add_filter( 'woocommerce_order_item_get_formatted_meta_data', array( $this, 'hide_view_images_from_display_meta' ), 10, 2 );
	}

	public function store_custom_data_on_order_item( $item, $cart_item_key, $values, $order ) {
		if ( ! $item || ! is_object( $item ) || ! method_exists( $item, 'add_meta_data' ) ) {
			return;
		}

		$product_id = $item->get_product_id();

		if ( $product_id ) {
			$pw_id = get_post_meta( $product_id, 'pw_id', true );
			if ( $pw_id ) {
				$item->add_meta_data( 'Variation ID', $pw_id, true );
			}
		}

		if ( ! isset( $values['custom_data'] ) || ! is_array( $values['custom_data'] ) ) {
			return;
		}

		$custom_data = $this->sanitize_custom_data( $values['custom_data'] );
		if ( empty( $custom_data ) ) {
			return;
		}

		$skip_keys = array( 'custom_image', 'added_from', 'is_sample', 'is_blank', 'view_images', 'color' );
		foreach ( $custom_data as $key => $value ) {
			if ( in_array( $key, $skip_keys, true ) ) {
				continue;
			}
			$item->add_meta_data( $key, $value, true );
		}

		// 存储 view_images 到私有元数据（以下划线开头，不会在 display_meta 中显示）
		if ( isset( $custom_data['view_images'] ) && is_array( $custom_data['view_images'] ) && ! empty( $custom_data['view_images'] ) ) {
			$item->add_meta_data( '_view_images', $custom_data['view_images'], true );
		}

		// 存储 Order Type（根据 is_sample 转换）
		if ( isset( $custom_data['is_sample'] ) ) {
			$is_sample = (int) $custom_data['is_sample'];
			$item->add_meta_data( '_order_type', $is_sample === 1 ? 'Sample' : 'Bulk', true );
		}

		// 存储 Customization（根据 added_from 转换）
		if ( isset( $custom_data['added_from'] ) ) {
			$added_from = (string) $custom_data['added_from'];
			$item->add_meta_data( '_customization', $added_from === 'design' ? 'Yes' : 'No', true );
		}
	}

	/**
	 * 过滤订单项元数据表格中的 key 显示
	 *
	 * @param string $display_key 显示的 key
	 * @param object $meta 元数据对象
	 * @param WC_Order_Item $item 订单项对象
	 * @return string
	 */
	public function filter_order_item_display_meta_key( $display_key, $meta, $item ) {
		// 将内部 key 转换为友好的显示名称
		$key_mapping = array(
			'_order_type'       => 'Order Type',
			'_customization'    => 'Customization',
			'accessories_names' => 'Accessories',
			'color'             => 'Color',
			'custom_color'      => 'Color',
			'color_value'       => 'Color',
			'color_name'        => 'Color',
			'is_blank'          => 'Blank Product',
		);

		if ( isset( $key_mapping[ $display_key ] ) ) {
			return $key_mapping[ $display_key ];
		}

		return $display_key;
	}

	/**
	 * 过滤订单项元数据表格中的 value 显示
	 *
	 * @param string $display_value 显示的值
	 * @param object $meta 元数据对象
	 * @param WC_Order_Item $item 订单项对象
	 * @return string
	 */
	public function filter_order_item_display_meta_value( $display_value, $meta, $item ) {
		$meta_key = isset( $meta->key ) ? $meta->key : '';

		// 处理 accessories_names 数组显示
		if ( $meta_key === 'accessories_names' ) {
			if ( is_array( $display_value ) ) {
				return implode( ', ', $display_value );
			}
			// 如果是 JSON 字符串，尝试解码
			$decoded = json_decode( $display_value, true );
			if ( is_array( $decoded ) ) {
				return implode( ', ', $decoded );
			}
		}

		return $display_value;
	}

	/**
	 * 隐藏 view_images 从订单项元数据表格显示，并处理颜色显示逻辑
	 *
	 * 颜色显示规则：
	 * - 只显示一个 Color 项
	 * - 有 color_name 就只显示 color_name
	 * - 没有 color_name 就显示 color_value
	 * - 都没有就不显示 Color 项
	 *
	 * @param array $formatted_meta 格式化后的元数据
	 * @param WC_Order_Item $item 订单项对象
	 * @return array
	 */
	public function hide_view_images_from_display_meta( $formatted_meta, $item ) {
		$color_name_meta = null;
		$color_value_meta = null;
		$color_name_key = null;
		$color_value_key = null;

		foreach ( $formatted_meta as $key => $meta ) {
			// 隐藏 view_images
			if ( isset( $meta->key ) && $meta->key === 'view_images' ) {
				unset( $formatted_meta[ $key ] );
				continue;
			}
			// 记录 color_name 和 color_value 的位置
			if ( isset( $meta->key ) && $meta->key === 'color_name' ) {
				$color_name_meta = $meta;
				$color_name_key = $key;
			}
			if ( isset( $meta->key ) && $meta->key === 'color_value' ) {
				$color_value_meta = $meta;
				$color_value_key = $key;
			}
		}

		// 处理颜色显示逻辑：只显示一个 Color
		if ( $color_name_meta && ! empty( $color_name_meta->value ) ) {
			// 有 color_name，删除 color_value
			if ( $color_value_key !== null ) {
				unset( $formatted_meta[ $color_value_key ] );
			}
		} elseif ( $color_value_meta && ! empty( $color_value_meta->value ) ) {
			// 没有 color_name 但有 color_value，删除空的 color_name
			if ( $color_name_key !== null ) {
				unset( $formatted_meta[ $color_name_key ] );
			}
		} else {
			// 都没有值，都删除
			if ( $color_name_key !== null ) {
				unset( $formatted_meta[ $color_name_key ] );
			}
			if ( $color_value_key !== null ) {
				unset( $formatted_meta[ $color_value_key ] );
			}
		}

		return $formatted_meta;
	}

	private function sanitize_custom_data( array $custom_data ) {
		$out = $this->sanitize_custom_data_scalars( $custom_data );

		$flags = $this->sanitize_custom_data_flags( $custom_data );
		if ( ! empty( $flags ) ) {
			$out = array_merge( $out, $flags );
		}

		$view_images = $this->sanitize_custom_data_view_images( $custom_data );
		if ( ! empty( $view_images ) ) {
			$out['view_images'] = $view_images;
		}

		$accessories = $this->sanitize_accessories_names( $custom_data );
		if ( ! empty( $accessories ) ) {
			$out['accessories_names'] = $accessories;
		}

		return $out;
	}

	private function sanitize_custom_data_scalars( array $custom_data ) {
		$allowed_scalar_keys = array(
			'custom_image',
			'color',
			'color_name',
			'color_value',
			'custom_color',
			'variant_id',
			'added_from',
		);

		$out = array();
		foreach ( $allowed_scalar_keys as $key ) {
			$value = $this->sanitize_scalar_value( $custom_data, $key );
			if ( $value !== '' ) {
				$out[ $key ] = $value;
			}
		}

		return $out;
	}

	private function sanitize_scalar_value( array $custom_data, $key ) {
		if ( ! array_key_exists( $key, $custom_data ) ) {
			return '';
		}

		$value = $custom_data[ $key ];
		if ( is_string( $value ) ) {
			return sanitize_text_field( $value );
		}
		if ( is_numeric( $value ) ) {
			return (string) $value;
		}

		return '';
	}

	private function sanitize_custom_data_flags( array $custom_data ) {
		$out = array();

		if ( array_key_exists( 'is_blank', $custom_data ) ) {
			$value = $custom_data['is_blank'];
			$out['is_blank'] = is_numeric( $value ) ? (int) $value : ( (bool) $value ? 1 : 0 );
		}

		if ( array_key_exists( 'is_sample', $custom_data ) ) {
			$value = $custom_data['is_sample'];
			$out['is_sample'] = is_numeric( $value ) ? (int) $value : ( (bool) $value ? 1 : 0 );
		}

		return $out;
	}

	private function sanitize_custom_data_view_images( array $custom_data ) {
		if ( ! isset( $custom_data['view_images'] ) || ! is_array( $custom_data['view_images'] ) ) {
			return array();
		}

		return $this->sanitize_view_images( $custom_data['view_images'] );
	}

	private function sanitize_view_images( array $view_images ) {
		$out = array();
		foreach ( $view_images as $view_item ) {
			$sanitized = $this->sanitize_view_image_item( $view_item );
			if ( ! empty( $sanitized ) ) {
				$out[] = $sanitized;
			}
		}
		return $out;
	}

	private function sanitize_view_image_item( $view_item ) {
		if ( ! is_array( $view_item ) ) {
			return array();
		}

		$view_id   = isset( $view_item['view_id'] ) ? sanitize_text_field( (string) $view_item['view_id'] ) : '';
		$view_name = isset( $view_item['view_name'] ) ? sanitize_text_field( (string) $view_item['view_name'] ) : '';
		$images    = isset( $view_item['images'] ) && is_array( $view_item['images'] ) ? $view_item['images'] : array();

		$urls = $this->sanitize_image_urls( $images );
		if ( empty( $urls ) ) {
			return array();
		}

		return array(
			'view_id'   => $view_id,
			'view_name' => $view_name,
			'images'    => $urls,
		);
	}

	private function sanitize_image_urls( array $urls ) {
		$out = array();
		foreach ( $urls as $url ) {
			if ( ! is_string( $url ) ) {
				continue;
			}
			$clean = esc_url_raw( $url );
			if ( $clean !== '' ) {
				$out[] = $clean;
			}
		}
		return array_values( $out );
	}

	private function sanitize_accessories_names( array $custom_data ) {
		if ( ! isset( $custom_data['accessories_names'] ) || ! is_array( $custom_data['accessories_names'] ) ) {
			return array();
		}

		$out = array();
		foreach ( $custom_data['accessories_names'] as $value ) {
			$clean = sanitize_text_field( (string) $value );
			if ( $clean !== '' ) {
				$out[] = $clean;
			}
		}

		return array_values( $out );
	}
}
