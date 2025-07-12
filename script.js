const key = "fca_live_fz909msWNrMsGsvsigdAL8S7C4MAE4bnofYIix6T"

const state = {
    openedDrawer: null,
    currencies: [],
    filteredCurrencies: [],
    base: 'BRL',
    target: 'EUR',
    rates: {},
    baseValue: 1
};

/* SELECTORS */

const ui = {
    controls: document.getElementById('controls'),
    drawer: document.getElementById('drawer'),
    dismissButton: document.getElementById('dismiss-button'),
    currencyList: document.getElementById('currency-list'),
    searchInput: document.getElementById('search'),
    baseButton: document.getElementById('base'),
    targetButton: document.getElementById('target'),
    exchangeRate: document.getElementById('exchange-rate'),
    baseInput: document.getElementById('base-input'),
    targetInput: document.getElementById('target-input'),
    swapButton: document.getElementById('swap-button')
};

/* EVENT LISTENERS */

const setupEventListeners = () => {
    document.addEventListener('DOMContentLoaded', initApp);
    ui.controls.addEventListener('click', showDrawer);
    ui.dismissButton.addEventListener('click', hideDrawer);
    ui.searchInput.addEventListener('input', filterCurrency);
    ui.currencyList.addEventListener('click', selectPair);
    ui.baseInput.addEventListener('change', convertInput);
    ui.swapButton.addEventListener('click', switchPair);
};

/* EVENT HANDLERS */

const initApp = () => {
    fetchCurrencies();
    fetchExchangeRate();
};

const showDrawer = (e) => {
    // Adds the attribute 'show' to drawer
    if(e.target.hasAttribute('data-drawer')) {
        state.openedDrawer = e.target.id;
        ui.drawer.classList.add('show');
    }
};

const hideDrawer = () => {
    // Removes attribute 'show' from drawer
    state.openedDrawer = null;
    ui.drawer.classList.remove('show');
    clearSearchInput();
};

const filterCurrency = () => {
    const keyword = ui.searchInput.value.trim().toLowerCase();
    
    state.filteredCurrencies = getAvailableCurrencies().filter(({code, name}) => {
        return (
            code.toLowerCase().includes(keyword) || 
            name.toLowerCase().includes(keyword)
        );
    });

    displayCurrencies();
};

const selectPair = (e) => {
    const {openedDrawer} = state;

    if(e.target.hasAttribute('data-code')) {
        // Atualiza a base ou target no State
        state[openedDrawer] = e.target.dataset.code;

        // Carrega as taxas de câmbio e atualiza os botões
        loadExhangeRate();

        //Fecha o menu de moedas
        hideDrawer();
    }
};

const convertInput = () => {
    state.baseValue = parseFloat(ui.baseInput.value) || 1;
    loadExhangeRate();
}

const switchPair = () => {
    const {base, target} = state;
    state.base = target;
    state.target = base;
    state.baseValue = parseFloat(ui.targetInput.value) || 1;
    loadExhangeRate();
}

/* RENDER FUNCTIONS */

const displayCurrencies = () => {
    ui.currencyList.innerHTML = state.filteredCurrencies.map(({code, name}) => {
        return `
            <li data-code="${code}">
                <img src="${getImageURL(code)}" alt="${name}">
                <div>
                    <h4>${code}</h4>
                    <p>${name}</p>
                </div>
            </li>
        `;
    }).join('')
};

const displayConversion = () => {
    updateButtons();
    updateInputs();
    updateExchangeRate();
}

const showLoading = () => {
    ui.controls.classList.add('skeleton');
    ui.exchangeRate.classList.add('skeleton');
}

const hideLoading = () => {
    ui.controls.classList.remove('skeleton');
    ui.exchangeRate.classList.remove('skeleton');
}

/* HELPER FUNCTIONS */

const updateButtons = () => {
    [ui.baseButton, ui.targetButton].forEach((button) => {
            const code = state[button.id];

            button.textContent = code;
            button.style.setProperty('--image', `url(${getImageURL(code)})`)
        });
}

const updateInputs = () => {
    const {base, baseValue, target, rates} = state;

    const result = baseValue * rates[base][target];

    ui.targetInput.value = result.toFixed(4);
    ui.baseInput.value = baseValue;
}

const updateExchangeRate = () => {
    const {base, target, rates} = state;

    const rate = rates[base][target].toFixed(4);

    ui.exchangeRate.textContent = `1 ${base} = ${rate} ${target}`;
}

const getAvailableCurrencies = () => {
    return state.currencies.filter(({code}) => {
        return state.base !== code && state.target !== code;
    })
};

const clearSearchInput = () => {
    ui.searchInput.value = "";
    ui.searchInput.dispatchEvent(new Event('input'));
};

const getImageURL = (code) => {
    const flag = "https://wise.com/public-resources/assets/flags/rectangle/{code}.png"

    return flag.replace('{code}', code.toLowerCase())
};

const loadExhangeRate = () => {
    const {base, rates} = state;
    if(typeof rates[base] !== 'undefined') {
        // Se a taxa de câmbio já está no state, mostre-a
        displayConversion();
    } else {
        // Se não, atualize a taxa de câmbio primeiro
        fetchExchangeRate();
    }
}
 
/* API FUNCTIONS */

const fetchCurrencies = () => {
    fetch(`https://api.freecurrencyapi.com/v1/currencies?apikey=${key}`)
        .then(response => response.json())
        .then(({data}) => {
            state.currencies = Object.values(data);
            state.filteredCurrencies = getAvailableCurrencies();
            displayCurrencies();
        })
        .catch(console.error)
};

const fetchExchangeRate = () => {
    const {base} = state;

    showLoading();

    fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${key}&currencies=&base_currency=${base}`)
        .then(response => response.json())
        .then(({data}) => {
            state.rates[base] = data;
            displayConversion();
        })
        .catch(console.error)
        .finally(hideLoading)
}

/* INITIALIZATION */

setupEventListeners();