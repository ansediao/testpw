export function formatResult(label, value) {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `<code>${label}</code> → <span class="success">${value}</span>`;
    return div;
}

export function createSection(title) {
    const section = document.createElement('div');
    section.className = 'demo-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    return section;
}

export function highlight(isTrue) {
    return isTrue ? 'success' : 'error';
}
