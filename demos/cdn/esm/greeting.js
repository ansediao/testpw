const greetings = {
    en: 'Hello',
    zh: '你好',
    ja: 'こんにちは',
    fr: 'Bonjour',
    de: 'Hallo'
};

export default greetings;

export function translate(name, lang = 'zh') {
    const prefix = greetings[lang] || greetings.en;
    return `${prefix}, ${name}!`;
}

export function getSupportedLanguages() {
    return Object.keys(greetings);
}
