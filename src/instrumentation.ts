
export function register() {
    if (typeof global.localStorage !== 'undefined' && typeof global.localStorage.getItem === 'undefined') {
        Object.defineProperty(global, 'localStorage', {
            value: {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
                clear: () => { },
                length: 0,
                key: () => null,
            },
            writable: true,
            configurable: true,
        });
    }
}
