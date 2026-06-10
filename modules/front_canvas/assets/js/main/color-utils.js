function pwcaGetCurrentSelectedColor() {
    const selectedSwatch = document.querySelector('.pwca-color-swatch.selected');
    if (selectedSwatch) {
        const color = selectedSwatch.getAttribute('data-color');
        if (color) return color;
    }
    if (window.pwcaCurrentColor) return window.pwcaCurrentColor;
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker && customColorPicker.value) return customColorPicker.value;
    return '#000000';
}

function pwcaGetExplicitSelectedColor() {
    const selectedSwatch = document.querySelector('.pwca-color-swatch.selected');
    if (selectedSwatch) {
        const color = selectedSwatch.getAttribute('data-color');
        if (color) return color;
    }
    if (window.pwcaCurrentColor && window.pwcaCurrentColor !== '#000000') return window.pwcaCurrentColor;
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker && customColorPicker.value && customColorPicker.value !== '#000000') return customColorPicker.value;
    return null;
}

window.pwcaGetCurrentSelectedColor = pwcaGetCurrentSelectedColor;
window.pwcaGetExplicitSelectedColor = pwcaGetExplicitSelectedColor;