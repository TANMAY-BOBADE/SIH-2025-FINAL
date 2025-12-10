// --- LANGUAGE DATABASE ---
const translations = {
    en: {
        welcome: "Welcome Farmer",
        login_title: "Smart Agriculture System",
        login_btn: "Login",
        email_ph: "Enter your email",
        pass_ph: "Enter your password",
        dashboard_title: "Farmer Dashboard",
        rover_btn: "Rover Control",
        irrigation_btn: "Drip Irrigation",
        data_btn: "Data Monitoring",
        logout: "Logout",
        // Rover Page
        start_planting: "START PLANTING",
        start_watering: "START WATERING",
        rover_control: "Rover Control",
        setup_crop: "1. Select Crop & Stage",
        auto_plant: "Automated Planting",
        smart_water: "Smart Irrigation",
        // Sensors
        temp: "Temperature",
        hum: "Humidity",
        moist: "Moisture",
        // Seasonal Alert
        alert_title: "🌱 Seasonal Planting Advice",
        alert_close: "Close"
    },
    hi: {
        welcome: "स्वागत है किसान",
        login_title: "स्मार्ट कृषि प्रणाली",
        login_btn: "लॉगिन करें",
        email_ph: "अपना ईमेल दर्ज करें",
        pass_ph: "अपना पासवर्ड दर्ज करें",
        dashboard_title: "किसान डैशबोर्ड",
        rover_btn: "रोवर नियंत्रण",
        irrigation_btn: "ड्रिप सिंचाई",
        data_btn: "डेटा निगरानी",
        logout: "लॉगआउट",
        // Rover Page
        start_planting: "वृक्षारोपण शुरू करें",
        start_watering: "सिंचाई शुरू करें",
        rover_control: "रोवर नियंत्रण",
        setup_crop: "1. फसल और चरण चुनें",
        auto_plant: "स्वचालित वृक्षारोपण",
        smart_water: "स्मार्ट सिंचाई",
        // Sensors
        temp: "तापमान",
        hum: "नमी",
        moist: "मिट्टी",
        // Seasonal Alert
        alert_title: "🌱 मौसमी बुवाई सलाह",
        alert_close: "बंद करें"
    },
    ne: {
        welcome: "स्वागत छ किसान",
        login_title: "स्मार्ट कृषि प्रणाली",
        login_btn: "लग-इन गर्नुहोस्",
        email_ph: "तपाईंको ईमेल प्रविष्ट गर्नुहोस्",
        pass_ph: "तपाईंको पासवर्ड प्रविष्ट गर्नुहोस्",
        dashboard_title: "किसान ड्यासबोर्ड",
        rover_btn: "रोवर नियन्त्रण",
        irrigation_btn: "थोपा सिँचाइ",
        data_btn: "डाटा अनुगमन",
        logout: "लगआउट",
        // Rover Page
        start_planting: "रोपण सुरु गर्नुहोस्",
        start_watering: "सिँचाइ सुरु गर्नुहोस्",
        rover_control: "रोवर नियन्त्रण",
        setup_crop: "1. बाली र चरण छान्नुहोस्",
        auto_plant: "स्वचालित रोपण",
        smart_water: "स्मार्ट सिँचाइ",
        // Sensors
        temp: "तापक्रम",
        hum: "आर्द्रता",
        moist: "माटो",
        // Seasonal Alert
        alert_title: "🌱 मौसमी रोपण सल्लाह",
        alert_close: "बन्द गर्नुहोस्"
    }
};

// --- 1. LANGUAGE LOGIC ---
function setLanguage(lang) {
    localStorage.setItem('appLang', lang); // Save preference
    updateText(lang);
}

function updateText(lang) {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Check if it's an input placeholder or text content
            if (el.tagName === 'INPUT') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });
    // Update Dropdown Value
    const selector = document.getElementById('langSelector');
    if(selector) selector.value = lang;
}

// Auto-load saved language on page start
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('appLang') || 'hi'; // Default Hindi
    updateText(savedLang);
    
    // Check Seasonal Crop (Only on Dashboard)
    if (window.location.pathname.includes('dashboard.html')) {
        checkSeason(savedLang);
    }
});

// --- 2. SEASONAL CROP RECOMMENDATION (Jorethang Context) ---
function checkSeason(lang) {
    const date = new Date();
    const month = date.getMonth() + 1; // 1 = Jan, 2 = Feb
    
    let recommendation = "";
    
    // Data based on ICAR-NOFRI Sikkim Calendar
    if (month >= 2 && month <= 3) {
        recommendation = {
            en: "It's February-March! Best time to plant **Maize (Makka)** and **Ginger (Adrak)** in Jorethang.",
            hi: "यह फरवरी-मार्च है! जोरेथांग में **मक्का** और **अदरक** लगाने का सबसे अच्छा समय है।",
            ne: "यो फेब्रुअरी-मार्च हो! जोरेथांगमा **मकै** र **अदुवा** रोप्ने उत्तम समय हो।"
        };
    } else if (month === 4) {
        recommendation = {
            en: "It's April! Ideal time for **Turmeric (Haldi)** sowing.",
            hi: "यह अप्रैल है! **हल्दी** की बुवाई के लिए आदर्श समय।",
            ne: "यो अप्रिल हो! **हल्दी** रोप्ने उत्तम समय।"
        };
    } else if (month >= 9 && month <= 10) {
        recommendation = {
            en: "It's Autumn! Good time for planting winter **Potato**.",
            hi: "यह शरद ऋतु है! सर्दियों के **आलू** लगाने का अच्छा समय है।",
            ne: "यो शरद ऋतु हो! जाडोको **आलु** रोप्ने राम्रो समय हो।"
        };
    }

    if (recommendation) {
        // Show Alert (Simple native alert for reliability, or custom modal below)
        // Using a slight delay to ensure page load
        setTimeout(() => {
            const msg = recommendation[lang] || recommendation['en'];
            // Create a custom modal dynamically
            showModal(translations[lang].alert_title, msg, translations[lang].alert_close);
        }, 1000);
    }
}

function showModal(title, body, closeText) {
    // Simple Modal Injection
    const modalHtml = `
    <div id="seasonModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;">
        <div style="background:white;padding:30px;border-radius:15px;max-width:400px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.3);">
            <div style="font-size:40px;margin-bottom:10px;">📅</div>
            <h3 style="color:#2E7D32;margin-bottom:10px;">${title}</h3>
            <p style="color:#555;font-size:16px;line-height:1.5;">${body}</p>
            <button onclick="document.getElementById('seasonModal').remove()" style="margin-top:20px;padding:10px 30px;background:#2E7D32;color:white;border:none;border-radius:50px;cursor:pointer;font-size:16px;">${closeText}</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}