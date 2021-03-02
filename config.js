"use strict";

var twpConfig = {}

{
    let observers = []
    let onReadyObservers = []
    let config = null
    const defaultConfig = {
        pageTranslatorService: "google",
        targetLanguages: [
            "ko",
            "ja",
            "en"
        ], // "en", "es", "de"
        alwaysTranslateSites: [
            "dunfaoff.com",
            "namu.wiki"
        ],
        neverTranslateSites: [],
        alwaysTranslateLangs: [],
        neverTranslateLangs: [],
        showTranslatePageContextMenu: true,
        showTranslateSelectedContextMenu: true,
        showOriginalTextWhenHovering: "no",
        showTranslateSelectedButton: "no",
        darkMode: "auto",
        showReleaseNotes: "yes",
        customGlossaries: []
    }

    twpConfig.onReady = function (callback) {
        if (config) {
            callback()
        } else {
            onReadyObservers.push(callback)
        }
    }

    twpConfig.get = function (name) {
        if (typeof config[name] !== "undefined") {
            return config[name]
        }
    }

    twpConfig.set = function (name, value) {
        config[name] = value
        const obj = {}
        obj[name] = value
        chrome.storage.local.set(obj)
    }

    twpConfig.onChanged = function(callback) {
        observers.push(callback)
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local") {
            for (const name in changes) {
                const newValue = changes[name].newValue
                if (config[name] !== newValue) {
                    config[name] = newValue
                    observers.forEach(callback => callback(name, newValue))
                }
            }
        }
    })

    chrome.i18n.getAcceptLanguages(acceptedLanguages => {
        chrome.storage.local.get(null, onGot => {
            config = {}

            for (const name in defaultConfig) {
                config[name] = defaultConfig[name]
            }

            for (let lang of acceptedLanguages) {
                lang = twpLang.checkLanguageCode(lang)
                if (lang && config.targetLanguages.indexOf(lang) === -1) {
                    config.targetLanguages.push(lang)
                }
                if (config.targetLanguages.length >= 3) {
                    break
                }
            }

            const defaultTargetLanguages = ["en", "es", "de"]
            for (const idx in defaultTargetLanguages) {
                if (config.targetLanguages.length >= 3) break;
                if (config.targetLanguages.indexOf(defaultTargetLanguages[idx]) === -1) {
                    config.targetLanguages.push(defaultTargetLanguages[idx])
                }
            }

            for (const name in onGot) {
                config[name] = onGot[name]
            }

            onReadyObservers.forEach(callback => callback())
            onReadyObservers = []
        })
    })

    function addInArray(configName, value) {
        const array = twpConfig.get(configName)
        if (array.indexOf(value) === -1) {
            array.push(value)
            twpConfig.set(configName, array)
        }
    }

    function removeFromArray(configName, value) {
        const array = twpConfig.get(configName)
        const index = array.indexOf(value)
        if (index > -1) {
            array.splice(index, 1)
            twpConfig.set(configName, array)
        }
    }

    twpConfig.initialize = function () {
        chrome.storage.local.get(null, obj => {
            const keys = Object.keys(obj)
            if (keys.length === 0) {
                Object.assign(config, defaultConfig)
                chrome.storage.local.set(defaultConfig)
            }
        })
    }

    twpConfig.updateCustomGlossaries = function (glossaries) {
        twpConfig.set('customGlossaries', glossaries)
    }
    twpConfig.addSiteToAlwaysTranslate = function (hostname) {
        addInArray("alwaysTranslateSites", hostname)
        removeFromArray("neverTranslateSites", hostname)
    }
    twpConfig.removeSiteFromAlwaysTranslate = function (hostname) {
        removeFromArray("alwaysTranslateSites", hostname)
    }
    twpConfig.addSiteToNeverTranslate = function (hostname) {
        addInArray("neverTranslateSites", hostname)
        removeFromArray("alwaysTranslateSites", hostname)
    }
    twpConfig.removeSiteFromNeverTranslate = function (hostname) {
        removeFromArray("neverTranslateSites", hostname)
    }
    twpConfig.addLangToAlwaysTranslate = function (lang, hostname) {
        addInArray("alwaysTranslateLangs", lang)
        removeFromArray("neverTranslateLangs", lang)

        if (hostname) {
            removeFromArray("neverTranslateSites", hostname)
        }
    }
    twpConfig.removeLangFromAlwaysTranslate = function (lang) {
        removeFromArray("alwaysTranslateLangs", lang)
    }
    twpConfig.addLangToNeverTranslate = function (lang, hostname) {
        addInArray("neverTranslateLangs", lang)
        removeFromArray("alwaysTranslateLangs", lang)

        if (hostname) {
            removeFromArray("alwaysTranslateSites", hostname)
        }
    }
    twpConfig.removeLangFromNeverTranslate = function (lang) {
        removeFromArray("neverTranslateLangs", lang)
    }

    twpConfig.setTargetLanguage = function (lang) {
        const targetLanguages = twpConfig.get("targetLanguages")
        lang = twpLang.checkLanguageCode(lang)
        if (lang && targetLanguages.indexOf(lang) === -1) {
            targetLanguages.unshift(lang)
            targetLanguages.pop()
            twpConfig.set("targetLanguages", targetLanguages)
        }
    }
}
