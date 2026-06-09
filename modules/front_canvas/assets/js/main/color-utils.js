function getCurrentSelectedColor() {
    const selectedSwatch = document.querySelector('.pwca-color-swatch.selected');
    if (selectedSwatch) {
        const color = selectedSwatch.getAttribute('data-color');
        if (color) return color;
    }
    if (window.currentColor) return window.currentColor;
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker && customColorPicker.value) return customColorPicker.value;
    return '#000000';
}

function getExplicitSelectedColor() {
    const selectedSwatch = document.querySelector('.pwca-color-swatch.selected');
    if (selectedSwatch) {
        const color = selectedSwatch.getAttribute('data-color');
        if (color) return color;
    }
    if (window.currentColor && window.currentColor !== '#000000') return window.currentColor;
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker && customColorPicker.value && customColorPicker.value !== '#000000') return customColorPicker.value;
    return null;
}

window.getCurrentSelectedColor = getCurrentSelectedColor;
window.getExplicitSelectedColor = getExplicitSelectedColor;