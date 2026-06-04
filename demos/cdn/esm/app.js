import { add, multiply, factorial, PI } from './math.js';
import greetings, { translate, getSupportedLanguages } from './greeting.js';

import { formatResult, createSection, highlight } from './display.js';

function demoNamedExports() {
    const section = createSection('具名导出 Named Exports');
    section.appendChild(formatResult('add(5, 3) =', add(5, 3)));
    section.appendChild(formatResult('multiply(4, 7) =', multiply(4, 7)));
    section.appendChild(formatResult('PI =', PI));
    section.appendChild(formatResult('factorial(5) =', factorial(5)));
    return section;
}

function demoDefaultExport() {
    const section = createSection('默认导出 Default Export');
    section.appendChild(formatResult('greetings.zh =', greetings.zh));
    section.appendChild(formatResult('greetings.en =', greetings.en));
    section.appendChild(formatResult('greetings.ja =', greetings.ja));
    return section;
}

function demoNamedPlusDefault() {
    const section = createSection('同时导入默认 + 具名导出');
    section.appendChild(formatResult('translate("世界") =', translate('世界')));
    section.appendChild(formatResult('translate("World", "en") =', translate('World', 'en')));
    section.appendChild(formatResult('getSupportedLanguages() =', JSON.stringify(getSupportedLanguages())));
    return section;
}

function demoModuleScope() {
    const section = createSection('模块作用域（不污染全局）');

    const info1 = document.createElement('div');
    info1.className = 'result-item';
    info1.innerHTML = `<code>typeof window.add === 'undefined'</code> → <span class="${highlight(typeof window.add === 'undefined')}">${typeof window.add === 'undefined'}</span>`;

    const info2 = document.createElement('div');
    info2.className = 'result-item';
    info2.innerHTML = `<code>typeof window.PI === 'undefined'</code> → <span class="${highlight(typeof window.PI === 'undefined')}">${typeof window.PI === 'undefined'}</span>`;

    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = '↑ 模块内定义的变量不会泄漏到 window 全局对象上';

    section.appendChild(info1);
    section.appendChild(info2);
    section.appendChild(note);
    return section;
}

function demoImportRenaming() {
    const section = createSection('导入重命名 Import Renaming');

    const p = document.createElement('div');
    p.className = 'result-item';
    p.innerHTML = `<code>import { translate as t } from './greeting.js'</code> → <code>t('World', 'en')</code> → <span class="success">${'Hello, World!'}</span>`;

    section.appendChild(p);
    return section;
}

async function demoDynamicImport() {
    const section = createSection('动态导入 Dynamic Import ()');
    section.appendChild(formatResult('加载中...', '⏳'));

    try {
        const weatherModule = await import('./weather.js');
        const defaultCity = weatherModule.getDefaultCity();
        const hkWeather = weatherModule.getWeather('Hong Kong');

        section.innerHTML = '';
        section.appendChild(createSection('动态导入 Dynamic Import ()'));

        section.appendChild(formatResult('getDefaultCity() =', defaultCity));
        section.appendChild(formatResult('getWeather("Hong Kong") =', JSON.stringify(hkWeather)));

        const all = weatherModule.getAll();
        Object.entries(all).forEach(([city, data]) => {
            section.appendChild(formatResult(`  ${city}`, `${data.temp}°C, ${data.condition}`));
        });
    } catch (err) {
        section.innerHTML = '';
        section.appendChild(createSection('动态导入 Dynamic Import ()'));
        const errEl = document.createElement('div');
        errEl.className = 'result-item error';
        errEl.textContent = `加载失败: ${err.message}`;
        section.appendChild(errEl);
    }

    return section;
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('demos');

    container.appendChild(demoNamedExports());
    container.appendChild(demoDefaultExport());
    container.appendChild(demoNamedPlusDefault());
    container.appendChild(demoImportRenaming());
    container.appendChild(demoModuleScope());
    await demoDynamicImport();
});
