export function double(n) {
    return n * 2;
}

export function formatMessage(name, lang = 'zh') {
    const dict = { zh: '你好', en: 'Hello', ja: 'こんにちは' };
    return `${dict[lang] || dict.zh}, ${name}!`;
}

const APP_NAME = 'Vue ESM Demo';
export default APP_NAME;
