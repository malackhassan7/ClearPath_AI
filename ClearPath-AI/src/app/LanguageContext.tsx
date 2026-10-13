import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ta";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    platform_name: "DairySetu-TN",
    platform_tagline: "TAMIL NADU DAIRY PLATFORM",
    official_data_badge: "Official Sourced Data",
    official_data_sub: "data.gov.in & FoSCoS",
    lang_toggle: "தமிழ்",

    // Navigation
    nav_workspace: "WORKSPACE",
    nav_regulatory_desk: "REGULATORY DESK",
    nav_preferences: "PREFERENCES",
    nav_overview: "Overview",
    nav_projects: "Dairy projects",
    nav_clearances: "FSSAI tracker",
    nav_documents: "Document vault",
    nav_brands: "Brand comparison",
    nav_districts: "District finder",
    nav_schemes: "Govt schemes",
    nav_chatbot: "AI compliance bot",
    nav_grievances: "Grievances",
    nav_notifications: "Notifications",
    nav_review_queue: "Review queue",
    nav_rules: "Rules & sources",
    nav_users: "User management",
    nav_audit: "Audit trail",
    nav_profile: "My profile",
    nav_help: "Help & guidance",

    // Common Actions
    action_upload: "Upload document",
    action_submit: "Submit application",
    action_download_template: "Download template",
    action_view_template: "View format",
    action_verify: "Verify document",
    action_back: "Back",
    action_continue: "Continue",
    action_create_project: "New dairy project",
    action_save: "Save particulars",
    action_cancel: "Cancel",
    action_remove: "Remove",
    action_search: "Search...",
    action_filter: "Filter",

    // Banner
    banner_title: "Official Data Grounding:",
    banner_text: "Statutory FSSAI rules, district milk production records (2009–2019), and Aavin franchise norms loaded from official publications. Final regulatory decisions are performed by authorized FSSAI officers.",
    banner_citations: "View Citations",

    // Project Wizard
    wizard_title: "Create Dairy Enterprise Project",
    wizard_step1: "Basics & Location",
    wizard_step2: "Activity & Capacity",
    wizard_step3: "Facility & Quality",
    wizard_step4: "Statutory Checklist",
    wizard_step5: "Review & Confirmation",
    field_enterprise_name: "Dairy Enterprise Name",
    field_entity_name: "Entity / Business Name",
    field_contact_person: "Contact Person / Proprietor",
    field_district: "Tamil Nadu District",
    field_town: "Town / Taluk / Village",
    field_activity_type: "Dairy Business Activity",
    field_brand_affiliation: "Brand Affiliation",
    field_capacity_lpd: "Daily Handling Capacity (Litres / Day)",
    field_annual_turnover: "Estimated Annual Turnover (₹ Lakhs)",
    field_investment: "Total Proposed Investment (₹ Lakhs)",
    field_employment: "Estimated Direct Employees",
    field_water_source: "Water Potability Source",

    // Document Vault
    doc_vault_title: "Document Vault & Statutory Verification",
    doc_vault_subtitle: "Download official FSSAI templates, upload certificates, and get automated compliance feedback.",
    doc_required_checklist: "Mandatory Statutory Checklist",
    doc_status_validated: "Validated & Ready",
    doc_status_correction: "Needs Correction",
    doc_status_pending: "Awaiting Officer Review",
    doc_changes_needed: "What changes are necessary:",
    doc_verified_ok: "Verified parameters (OK):",
    doc_compliance_score: "Compliance match:",

    // District Intelligence
    district_title: "District Market Opportunity Finder",
    district_subtitle: "Official Tamil Nadu district-wise milk production (38 districts) and processing opportunity ranking sourced from data.gov.in.",
    district_top_shed: "Top Milk Production Hubs",
    district_production_tonnes: "Annual Production (Thousand Tonnes)",
    district_growth_rate: "10-Year Growth Momentum",
    district_opportunity_tier: "Opportunity Tier",
  },
  ta: {
    // Brand & Header
    platform_name: "டெயிரிசேது-TN",
    platform_tagline: "தமிழ்நாடு பால் பண்ணை தளம்",
    official_data_badge: "அதிகாரப்பூர்வ அரசு தரவு",
    official_data_sub: "data.gov.in & FoSCoS",
    lang_toggle: "English",

    // Navigation
    nav_workspace: "பணிமனை",
    nav_regulatory_desk: "ஒழுங்குமுறை பிரிவு",
    nav_preferences: "விருப்பத்தேர்வுகள்",
    nav_overview: "கண்ணோட்டம்",
    nav_projects: "பால் பண்ணை திட்டங்கள்",
    nav_clearances: "FSSAI உரிம கண்காணிப்பு",
    nav_documents: "ஆவண பெட்டகம்",
    nav_brands: "பிராண்ட் ஒப்பீடு",
    nav_districts: "மாவட்ட சந்தை வாய்ப்பு",
    nav_schemes: "அரசு மானிய திட்டங்கள்",
    nav_chatbot: "AI விதிமுறை உதவியாளர்",
    nav_grievances: "புகார்கள் & மனுக்கள்",
    nav_notifications: "அறிவிப்புகள்",
    nav_review_queue: "ஆய்வு வரிசை",
    nav_rules: "விதிகள் & சான்றுகள்",
    nav_users: "பயனர் மேலாண்மை",
    nav_audit: "தணிக்கை பதிவு",
    nav_profile: "எனது சுயவிவரம்",
    nav_help: "உதவி & வழிகாட்டுதல்",

    // Common Actions
    action_upload: "ஆவணம் பதிவேற்றுக",
    action_submit: "விண்ணப்பம் சமர்ப்பிக்கவும்",
    action_download_template: "மாதிரி படிவம் பதிவிறக்குக",
    action_view_template: "மாதிரி வடிவம் காண்க",
    action_verify: "ஆவணம் சரிபார்க்கவும்",
    action_back: "முந்தைய பக்கம்",
    action_continue: "தொடரவும்",
    action_create_project: "புதிய பால் பண்ணை திட்டம்",
    action_save: "விவரங்களை சேமிக்கவும்",
    action_cancel: "ரத்து செய்",
    action_remove: "நீக்கு",
    action_search: "தேடுக...",
    action_filter: "வடிகட்டு",

    // Banner
    banner_title: "அரசாங்கத் தரவு ஆதாரம்:",
    banner_text: "FSSAI சட்டரீதியான விதிமுறைகள், மாவட்ட பால் உற்பத்தி பதிவுகள் (2009–2019) மற்றும் ஆவின் உரிம விதிமுறைகள் அரசு பிரசுரங்களிலிருந்து பெறப்பட்டுள்ளன. இறுதி முடிவுகள் தகுதிவாய்ந்த அதிகாரிகளால் எடுக்கப்படும்.",
    banner_citations: "ஆதாரங்களை காண்க",

    // Project Wizard
    wizard_title: "பால் பண்ணை திட்டம் உருவாக்குதல்",
    wizard_step1: "அடிப்படை & இருப்பிடம்",
    wizard_step2: "தொழில் வகை & திறன்",
    wizard_step3: "வசதிகள் & தரம்",
    wizard_step4: "சட்டரீதியான ஆவண பட்டியல்",
    wizard_step5: "சரிபார்த்து உறுதி செய்தல்",
    field_enterprise_name: "நிறுவனத்தின் பெயர்",
    field_entity_name: "வணிக பதிவு பெயர்",
    field_contact_person: "உரிமையாளர் / தொடர்பு நபர்",
    field_district: "தமிழ்நாடு மாவட்டம்",
    field_town: "ஊர் / தாலுகா / கிராமம்",
    field_activity_type: "பால் பண்ணை தொழில் வகை",
    field_brand_affiliation: "பிராண்ட் இணைப்பு (ஆவின் / சுயேச்சை)",
    field_capacity_lpd: "தினசரி பால் கையாளும் திறன் (லிட்டர்/நாள்)",
    field_annual_turnover: "மதிப்பிடப்பட்ட ஆண்டு வருவாய் (₹ லட்சம்)",
    field_investment: "திட்ட முதலீடு (₹ லட்சம்)",
    field_employment: "பணியாளர்கள் எண்ணிக்கை",
    field_water_source: "குடிநீர் ஆதாரம்",

    // Document Vault
    doc_vault_title: "ஆவண பெட்டகம் & தானியங்கி சரிபார்ப்பு",
    doc_vault_subtitle: "அதிகாரப்பூர்வ FSSAI மாதிரி படிவங்களை பதிவிறக்கி, உங்கள் ஆவணங்களை பதிவேற்றி உடனடி சரிபார்ப்பு முடிவுகளைப் பெறுங்கள்.",
    doc_required_checklist: "கட்டாய சட்ட ஆவணங்கள் பட்டியல்",
    doc_status_validated: "சரிபார்க்கப்பட்டது (ஏற்றுக்கொள்ளத்தக்கது)",
    doc_status_correction: "மாற்றங்கள் தேவை",
    doc_status_pending: "அதிகாரி ஆய்வுக்கு காத்திருக்கிறது",
    doc_changes_needed: "செய்ய வேண்டிய அவசியமான மாற்றங்கள்:",
    doc_verified_ok: "சரிபார்க்கப்பட்டவை (சரியாக உள்ளது):",
    doc_compliance_score: "பொருத்த மதிப்பெண்:",

    // District Intelligence
    district_title: "மாவட்ட சந்தை & வாய்ப்பு கண்டறிதல்",
    district_subtitle: "தமிழ்நாட்டின் 38 மாவட்டங்களுக்கான அதிகாரப்பூர்வ பால் உற்பத்தி (data.gov.in) மற்றும் பதப்படுத்தும் வாய்ப்பு தரவரிசை.",
    district_top_shed: "முன்னணி பால் உற்பத்தி மாவட்டங்கள்",
    district_production_tonnes: "ஆண்டு பால் உற்பத்தி (ஆயிரம் டன்கள்)",
    district_growth_rate: "10 ஆண்டு வளர்ச்சி வேகம்",
    district_opportunity_tier: "வாய்ப்பு நிலை",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem("dairysetu_lang");
      return stored === "ta" ? "ta" : "en";
    } catch {
      return "en";
    }
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("dairysetu_lang", newLang);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "ta" : "en");
  };

  const t = (key: string, fallback?: string): string => {
    return translations[lang][key] || fallback || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
