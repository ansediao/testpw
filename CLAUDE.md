# API Refactoring Documentation

## Changes Made

### New File Created
- `includes/class-pw-admin-promowares-api.php` - Centralized Promowares API communication

### Files Modified
- `admin/class-pw-admin-admin.php` - Updated to use new API class
- `includes/class-pw-admin.php` - Added new API class to dependencies

## API Communication Centralization

All code that communicates with `https://dev.promowares.com/api/` has been extracted and centralized into the new `Pw_Admin_Promowares_Api` class.

### Extracted Functionality

1. **Product Fetching**
   - `get_products_from_api()` - Fetches products from Promowares API
   - Moved from direct API calls to centralized class method

2. **AJAX Proxy Requests**
   - `handle_proxy_api_request()` - Handles frontend AJAX requests to Promowares API
   - Moved from inline function to class method

3. **Authentication & Verification**
   - `verify_user_token()` - Verifies JWT tokens with Promowares API
   - New method for token validation

4. **Connection Testing**
   - `check_connection()` - Tests API connectivity
   - New method for API health checks

### Benefits

1. **Centralized Management** - All Promowares API communication in one place
2. **Better Error Handling** - Consistent error logging and handling
3. **Security** - Removed nopriv AJAX hooks for better security
4. **Maintainability** - Easier to update API endpoints or authentication methods
5. **Backward Compatibility** - Existing functions still work but now use the new class

### Usage Examples

```php
// Create API instance
$api = new Pw_Admin_Promowares_Api();

// Fetch products
$products = $api->get_products_from_api();

// Check connection
$is_connected = $api->check_connection();

// Verify token
$user_info = $api->verify_user_token($token);
```

### Legacy Support

The original `get_products_from_api()` function still exists but now internally uses the new API class, ensuring no breaking changes to existing code.

## Testing

A test file `test-api-integration.php` has been created to verify the integration works correctly. This file can be removed after testing.

## Security Improvements

- Removed `wp_ajax_nopriv_` hooks for API proxy requests
- Added proper permission checks
- Centralized token management
- Better input sanitization and validation