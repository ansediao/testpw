const weatherData = {
    'Beijing':    { temp: 28, condition: 'Sunny' },
    'Tokyo':      { temp: 24, condition: 'Cloudy' },
    'New York':   { temp: 22, condition: 'Rainy' },
    'London':     { temp: 18, condition: 'Overcast' },
    'Hong Kong':  { temp: 31, condition: 'Humid' }
};

export function getDefaultCity() {
    return 'Beijing';
}

export function getWeather(city) {
    return weatherData[city] || null;
}

export function getAll() {
    return weatherData;
}
