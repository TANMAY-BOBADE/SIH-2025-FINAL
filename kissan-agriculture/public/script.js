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
        rover_control: "Rover Control",
        setup_crop: "1. Select Crop & Stage",
        // 7-STEP WORKFLOW
        step1: "Step 1: Drop Seed",
        step2: "Step 2: Rack DOWN (Hold)",
        step3: "Step 3: Open Flap",
        step4: "Step 4: Sense & Calc",
        step5: "Step 5: Close Flap",
        step6: "Step 6: Rack UP (Hold)",
        step7: "Step 7: Start Water",
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
        rover_control: "रोवर नियंत्रण",
        setup_crop: "1. फसल और चरण चुनें",
        // 7-STEP WORKFLOW
        step1: "चरण 1: बीज डालें",
        step2: "चरण 2: रैक नीचे (दबाए रखें)",
        step3: "चरण 3: फ्लैप खोलें",
        step4: "चरण 4: सेंस और गणना",
        step5: "चरण 5: फ्लैप बंद करें",
        step6: "चरण 6: रैक ऊपर (दबाए रखें)",
        step7: "चरण 7: पानी दें",
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
        rover_control: "रोवर नियन्त्रण",
        setup_crop: "1. बाली र चरण छान्नुहोस्",
        // 7-STEP WORKFLOW
        step1: "चरण 1: बीउ खसाल्नुहोस्",
        step2: "चरण 2: रैक तल (होल्ड)",
        step3: "चरण 3: फ्ल्याप खोल्नुहोस्",
        step4: "चरण 4: सेन्स र गणना",
        step5: "चरण 5: फ्ल्याप बन्द गर्नुहोस्",
        step6: "चरण 6: रैक माथि (होल्ड)",
        step7: "चरण 7: पानी सुरु",
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
    localStorage.setItem('appLang', lang); 
    updateText(lang);
}

function updateText(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName === 'INPUT') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });
    const selector = document.getElementById('langSelector');
    if(selector) selector.value = lang;
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('appLang') || 'hi'; 
    updateText(savedLang);
    if (window.location.pathname.includes('dashboard.html')) {
        checkSeason(savedLang);
    }
});

// --- 2. SEASONAL CROP RECOMMENDATION ---
function checkSeason(lang) {
    const date = new Date();
    const month = date.getMonth() + 1; 
    let recommendation = "";
    
    if (month >= 2 && month <= 3) {
        recommendation = {
            en: "It's Feb-Mar! Best time for **Maize** and **Ginger**.",
            hi: "यह फरवरी-मार्च है! **मक्का** और **अदरक** के लिए सबसे अच्छा समय।",
            ne: "यो फेब्रुअरी-मार्च हो! **मकै** र **अदुवा** को लागी उत्तम समय।"
        };
    } else if (month === 4) {
        recommendation = {
            en: "It's April! Ideal time for **Turmeric**.",
            hi: "यह अप्रैल है! **हल्दी** के लिए आदर्श समय।",
            ne: "यो अप्रिल हो! **हल्दी** को लागी उत्तम समय।"
        };
    } else if (month >= 9 && month <= 10) {
        recommendation = {
            en: "It's Autumn! Good time for **Potato**.",
            hi: "यह शरद ऋतु है! **आलू** के लिए अच्छा समय।",
            ne: "यो शरद ऋतु हो! **आलु** को लागी राम्रो समय।"
        };
    }

    if (recommendation) {
        setTimeout(() => {
            const msg = recommendation[lang] || recommendation['en'];
            showModal(translations[lang].alert_title, msg, translations[lang].alert_close);
        }, 1000);
    }
}

function showModal(title, body, closeText) {
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