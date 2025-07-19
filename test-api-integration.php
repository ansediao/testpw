<?php
/**
 * Test file to verify API integration
 * This file can be deleted after testing
 */

// Include WordPress
require_once('wp-config.php');

// Test the new Promowares API class
if (class_exists('Pw_Admin_Promowares_Api')) {
    echo "✓ Pw_Admin_Promowares_Api class exists\n";
    
    $api = new Pw_Admin_Promowares_Api();
    
    // Test API base URL
    echo "API Base URL: " . $api->get_api_base_url() . "\n";
    
    // Test connection (this will make an actual API call)
    echo "Testing API connection...\n";
    $connection_test = $api->check_connection();
    echo $connection_test ? "✓ API connection successful\n" : "✗ API connection failed\n";
    
} else {
    echo "✗ Pw_Admin_Promowares_Api class not found\n";
}

// Test the legacy function
if (function_exists('get_products_from_api')) {
    echo "✓ get_products_from_api function exists\n";
    
    echo "Testing product fetch...\n";
    $products = get_products_from_api();
    
    if ($products && is_array($products)) {
        echo "✓ Products fetched successfully (" . count($products) . " products)\n";
    } else {
        echo "✗ Failed to fetch products\n";
    }
} else {
    echo "✗ get_products_from_api function not found\n";
}