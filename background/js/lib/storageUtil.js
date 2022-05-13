export default class StorageUtil {
    static get = key =>
        new Promise((resolve, reject) =>
            chrome.storage.local.get(key, result =>
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve(result[key])
            )
        );

    static printAll = async () => {
        const allKeys = await StorageUtil.getAllKeys();
        console.log('----- all storage ----')
        allKeys.map(async key => {
            const value = await StorageUtil.get(key);
            console.log('key: ' + key);
            console.table(value);
        })
    }

    static getAllKeys = () =>
        new Promise((resolve, reject) =>
            chrome.storage.local.get(null, items => {
                const allKeys = Object.keys(items);
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve(allKeys)
            })
        );

    static set = data =>
        new Promise((resolve, reject) =>
            chrome.storage.local.set(data, () =>
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve()
            )
        )

    static clearAll = () => {
        new Promise((resolve, reject) =>
            chrome.storage.local.clear(() =>
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve()
            )
        )
    }
}
