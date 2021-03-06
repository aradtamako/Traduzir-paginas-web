"use strict";

var $ = document.querySelector.bind(document)

twpConfig.onReady(function () {
    let originalPageLanguage = "und"
    let currentPageLanguageState = "original"
    let currentPageTranslatorService = "google"

    const twpButtons =  document.querySelectorAll("button")

    twpButtons.forEach(button => {
        button.addEventListener("click", event => {
            twpButtons.forEach(button => {
                button.classList.remove("w3-buttonSelected")
            })
            event.target.classList.add("w3-buttonSelected")

            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {action: "translatePage", targetLanguage: event.target.value})
            })
        })
    })

    let targetLanguages = twpConfig.get("targetLanguages")
    for (let i = 1; i < 4; i++) {
        const button = twpButtons[i]
        button.value = targetLanguages[i-1]
        button.textContent = twpLang.codeToLanguage(targetLanguages[i-1])
    }

    twpButtons[0].textContent = twpLang.codeToLanguage("und")

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getOriginalPageLanguage"}, {frameId: 0}, pageLanguage => {
            if (pageLanguage && (pageLanguage = twpLang.checkLanguageCode(pageLanguage))) {
                originalPageLanguage = pageLanguage
                twpButtons[0].textContent = twpLang.codeToLanguage(originalPageLanguage)
            }
        })

        chrome.tabs.sendMessage(tabs[0].id, {action: "getCurrentPageLanguageState"}, {frameId: 0}, pageLanguageState => {
            if (pageLanguageState) {
                currentPageLanguageState = pageLanguageState
                updateInterface()
            }
        })

        chrome.tabs.sendMessage(tabs[0].id, {action: "getCurrentPageTranslatorService"}, {frameId: 0}, pageTranslatorService => {
            if (pageTranslatorService) {
                currentPageTranslatorService = pageTranslatorService
                updateInterface()
            }
        })
    })
    
    function updateInterface() {
        if (currentPageTranslatorService == "yandex") {
            $("#btnOptions option[value='translateInExternalSite']").textContent = chrome.i18n.getMessage("msgOpenOnYandexTranslator")
            $("#iconTranslate").setAttribute("src", "/icons/yandex-translate-32.png")
        } else { // google
            $("#btnOptions option[value='translateInExternalSite']").textContent = chrome.i18n.getMessage("btnOpenOnGoogleTranslate")
            $("#iconTranslate").setAttribute("src", "/icons/google-translate-32.png")
        }

        twpButtons.forEach(button => {
            button.classList.remove("w3-buttonSelected")
            if (button.value === currentPageLanguageState) {
                button.classList.add("w3-buttonSelected")
            }
        })
    }
    updateInterface()
    
    function enableDarkMode() {
        if (!$("#darkModeElement")) {
            var el = document.createElement("style")
            el.setAttribute("id", "darkModeElement")
            el.setAttribute("rel", "stylesheet")
            el.textContent = `
            * {
                scrollbar-color: #202324 #454a4d;
            }
            
            body {
                color: #e8e6e3 !important;
                background-color: #181a1b !important;
                border: 1px solid #454a4d;
            }
            
            #btnClose:hover {
                background-color: #454a4d !important;
            }
            
            #selectTargetLanguage, select, option, #btnReset, #btnRestore, #btnTryAgain, #btnOptionB {
                color: #55a9ed !important;
                background-color: #181a1b !important;
                border: 1px solid #454a4d !important;
            }
            `
            document.head.appendChild(el)
        }
    }
    
    function disableDarkMode() {
        if ($("#darkModeElement")) {
            $("#darkModeElement").remove()
        }
    }
    
    switch(twpConfig.get("darkMode")) {
        case "auto":
            if (matchMedia("(prefers-color-scheme: dark)").matches) {
                enableDarkMode()
            } else {
                disableDarkMode()
            }
            break
        case "yes":
            enableDarkMode()
            break
        case "no":
            disableDarkMode()
            break
        default:
            break
    }
    
    $("#btnClose").addEventListener("click", () => {
        window.close()
    })
    
    $("#divIconTranslate").addEventListener("click", () => {
        if (currentPageTranslatorService === "google") {
            currentPageTranslatorService = "yandex"
        } else {
            currentPageTranslatorService = "google"
        }
        updateInterface()
    })    
    
    $("#btnOptions").addEventListener("change", event => {
        const btnOptions = event.target

        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            const hostname = new URL(tabs[0].url).hostname
            switch (btnOptions.value) {
                case "changeLanguage":
                    location = chrome.runtime.getURL("popup/popup-change-language.html")
                    break
                case "alwaysTranslateThisSite":
                    twpConfig.addSiteToAlwaysTranslate(hostname)
                    break
                case "neverTranslateThisSite":
                    twpConfig.addSiteToNeverTranslate(hostname)
                    window.close()
                    break
                case "alwaysTranslateThisLanguage":
                    twpConfig.addLangToAlwaysTranslate(originalPageLanguage, hostname)
                    break
                case "neverTranslateThisLanguage":
                    twpConfig.addLangToNeverTranslate(originalPageLanguage, hostname)
                    window.close()
                    break
                case "translateInExternalSite":
                    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                        if (currentPageTranslatorService === "yandex") {
                            chrome.tabs.create({url: "https://translate.yandex.com/translate?url=" + encodeURIComponent(tabs[0].url)})
                        } else { // google
                            chrome.tabs.create({url: `https://translate.google.${
                                "zh-cn" == navigator.language.toLowerCase() ? "cn" : "com"
                            }/translate?u=` + encodeURIComponent(tabs[0].url)})
                        }
                    })
                    break
                case "moreOptions":
                    chrome.tabs.create({url: chrome.runtime.getURL("/options/options.html")})
                    break
                case "donate":
                    chrome.tabs.create({url: "https://www.patreon.com/filipeps"})
                    break
                default:
                    break
            }
            btnOptions.value = "options"
        })
    })  
})