import type { PageProps } from "@/app/pageProps";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  FileCheck,
  Milk,
  Receipt,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Warehouse,
  X,
} from "lucide-react";
import { money } from "@/lib/format";
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().trim().min(3, "Enter a dairy enterprise name (at least 3 characters)").max(140),
  organizationName: z.string().trim().min(2, "Enter the entity/business name").max(160),
  applicantContact: z.string().trim().min(3, "Enter contact person name").max(120),
  district: z.string().min(1, "Select a Tamil Nadu district"),
  location: z.string().trim().min(2, "Enter location/town/village").max(180),
  activityType: z.enum([
    "milk_parlour",
    "bmc_collection",
    "chilling_centre",
    "processing_unit",
    "aavin_franchise",
  ]),
  brandAffiliation: z.enum(["independent", "aavin", "private_partner"]),
  capacityLpd: z.coerce.number().min(0, "Capacity cannot be negative"),
  annualTurnoverLakhs: z.coerce.number().min(0, "Turnover cannot be negative"),
  investmentInrLakhs: z.coerce.number().min(0, "Investment cannot be negative"),
  employmentCount: z.coerce.number().int().min(0, "Personnel count cannot be negative").max(100000),
  coldStorageSqFt: z.coerce.number().min(0),
  cleanWaterSource: z.string().min(1, "Select water supply source"),
  hasFoodSafetySupervisor: z.boolean(),
  fostacCertified: z.boolean(),
  confirmed: z.boolean().refine(Boolean, "Please confirm the particulars before creating project"),
});

type DairyWizardValues = z.infer<typeof schema>;

const tnDistricts = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
  "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar"
];

const defaults: DairyWizardValues = {
  name: "",
  organizationName: "",
  applicantContact: "",
  district: "Coimbatore",
  location: "",
  activityType: "milk_parlour",
  brandAffiliation: "aavin",
  capacityLpd: 350,
  annualTurnoverLakhs: 8,
  investmentInrLakhs: 5,
  employmentCount: 3,
  coldStorageSqFt: 150,
  cleanWaterSource: "Piped Municipal / Tested Borewell",
  hasFoodSafetySupervisor: true,
  fostacCertified: true,
  confirmed: false,
};

import { STATUTORY_TEMPLATES, type StatutoryTemplate } from "@/data/statutoryTemplates";
import { TemplateModal } from "@/components/ui/TemplateModal";

export interface RequiredDocItem {
  name: string;
  category: string;
  description: string;
  templateKey?: string;
}

function computeFssaiTier(capacityLpd: number, turnoverLakhs: number) {
  if (capacityLpd > 10000 || turnoverLakhs > 2000) {
    return {
      tier: "Central FSSAI License (Form B)",
      form: "FSSAI Form B (Central License)",
      feePerYear: 7500,
      feeTotalText: "₹7,500 / year",
      source: "FoSCoS Schedule 2, Fee Structure for Central Licensing (>10,000 LPD or >₹20 Cr)",
      docs: [
        { name: "Form B Application for License", category: "Statutory Form", description: "Duly filled and signed Form B application", templateKey: "template_form_b" },
        { name: "NABL Water Testing Report (IS 10500:2012)", category: "Quality & Safety", description: "Comprehensive chemical and microbiological water analysis report", templateKey: "template_nabl_water_test" },
        { name: "Machinery & Equipment Declaration Schedule", category: "Engineering", description: "Inventory of pasteurizer, BMC, and pumps with HP ratings", templateKey: "template_equipment_schedule" },
        { name: "Blueprint & Dimensioned Facility Layout Plan", category: "Infrastructure", description: "Facility architectural floor plan with hygienic material flow", templateKey: "template_blueprint_layout" },
        { name: "FSMS Plan & Food Safety Supervisor Certificate", category: "Quality & Safety", description: "Documented HACCP/FSMS plan and FoSTaC supervisor appointment", templateKey: "template_fsms_plan" },
        { name: "Raw Milk Procurement & Sourcing Undertaking", category: "Supply Chain", description: "Traceability declaration of village collection routes", templateKey: "template_milk_sourcing" },
        { name: "Proof of Premises Possession", category: "Legal", description: "Registered lease deed or sale deed with commercial electricity bill" },
        { name: "TNPCB Consent to Operate (CTO)", category: "Environmental", description: "Environmental consent order from Tamil Nadu Pollution Control Board" },
        { name: "List of Directors / Key Management Personnel", category: "Legal", description: "Photo ID and address proof of all directors / partners" },
      ],
    };
  }

  if (capacityLpd > 500 || turnoverLakhs > 12) {
    const fee = capacityLpd > 5000 ? 5000 : capacityLpd > 2000 ? 3000 : 2000;
    return {
      tier: "State FSSAI License (Form B)",
      form: "FSSAI Form B (State License)",
      feePerYear: fee,
      feeTotalText: `₹${fee.toLocaleString()} / year`,
      source: "FoSCoS Schedule 2, Fee Structure for State Licensing (501 to 10,000 LPD or ₹12L to ₹20Cr)",
      docs: [
        { name: "Form B Application for License", category: "Statutory Form", description: "Duly filled and signed Form B application", templateKey: "template_form_b" },
        { name: "NABL Water Testing Report (IS 10500:2012)", category: "Quality & Safety", description: "Chemical and bacteriological water analysis report from NABL lab", templateKey: "template_nabl_water_test" },
        { name: "Machinery & Equipment Declaration Schedule", category: "Engineering", description: "Inventory of chilling tanks, pasteurizer, and motor HP ratings", templateKey: "template_equipment_schedule" },
        { name: "Blueprint & Dimensioned Facility Layout Plan", category: "Infrastructure", description: "Plant layout blueprint showing raw dock, clean room, cold store", templateKey: "template_blueprint_layout" },
        { name: "FSMS Plan & Food Safety Supervisor Certificate", category: "Quality & Safety", description: "Food Safety Management System plan and FoSTaC certified supervisor", templateKey: "template_fsms_plan" },
        { name: "Raw Milk Procurement & Sourcing Undertaking", category: "Supply Chain", description: "Undertaking detailing village farmer sourcing and rapid chilling", templateKey: "template_milk_sourcing" },
        { name: "Proof of Premises Possession", category: "Legal", description: "Registered rental / lease agreement or ownership deed" },
        { name: "Local Body / Panchayat Trade NOC", category: "Local Clearance", description: "Trade license or NOC from local Panchayat or Municipality" },
      ],
    };
  }

  return {
    tier: "Basic FSSAI Registration (Form A)",
    form: "FSSAI Form A (Registration)",
    feePerYear: 100,
    feeTotalText: "₹100 / year",
    source: "FoSCoS Schedule 2, Basic Registration Fee (<=500 LPD or <=₹12 Lakhs annual turnover)",
    docs: [
      { name: "Photo ID & Address Proof of Proprietor", category: "Identity", description: "Government issued Aadhaar, Voter ID or Passport" },
      { name: "Proof of Premises Possession", category: "Legal", description: "Rental agreement, property tax receipt or electricity bill" },
      { name: "Dairy Layout & Equipment Setup Sketch", category: "Setup", description: "Sketch of milk receiving, testing, and storage area", templateKey: "template_blueprint_layout" },
      { name: "Raw Milk Procurement & Sourcing Undertaking", category: "Supply Chain", description: "Declaration of milk collection from local farmers / societies", templateKey: "template_milk_sourcing" },
      { name: "Potable Water Testing Self-Declaration", category: "Quality & Safety", description: "Declaration confirming potable water supply per IS 10500 standards", templateKey: "template_nabl_water_test" },
    ],
  };
}

export function ProjectWizard({ projects, onCreate, editId, onToast }: PageProps) {
  const existing = projects.find((p: Project) => p.id === editId);
  const [step, setStep] = useState(1);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<StatutoryTemplate | null>(null);

  const form = useForm<DairyWizardValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: existing
      ? {
          ...defaults,
          name: existing.name || "",
          organizationName: existing.organizationName || "",
          district: existing.district || "Coimbatore",
          capacityLpd: Number(existing.capacity_lpd || 350),
          annualTurnoverLakhs: Number((Number(existing.annual_turnover || 800000) / 100000).toFixed(1)),
          investmentInrLakhs: Number(existing.investmentInrLakhs || 5),
          employmentCount: Number(existing.employmentCount || 3),
          confirmed: false,
        }
      : defaults,
  });

  const errors = form.formState.errors;
  const v = form.watch();

  const fssaiEstimate = computeFssaiTier(Number(v.capacityLpd || 0), Number(v.annualTurnoverLakhs || 0));

  const next = async () => {
    let fieldsToValidate: (keyof DairyWizardValues)[] = [];
    if (step === 1) fieldsToValidate = ["name", "organizationName", "applicantContact", "district", "location"];
    if (step === 2) fieldsToValidate = ["activityType", "brandAffiliation", "capacityLpd", "annualTurnoverLakhs"];
    if (step === 3) fieldsToValidate = ["investmentInrLakhs", "employmentCount", "coldStorageSqFt", "cleanWaterSource"];

    const valid = await form.trigger(fieldsToValidate);
    if (!valid) {
      onToast("Please complete the required highlighted fields.");
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const submit = form.handleSubmit((values) => {
    setConfirmSubmit(true);
    const newProject: Project = {
      id: existing?.id || `dairy-prj-${Date.now()}`,
      code: existing?.code || `TN-DAIRY-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, "0")}`,
      name: values.name,
      organizationName: values.organizationName,
      district: values.district,
      industryCategory: "White",
      enterpriseCategory: values.annualTurnoverLakhs <= 500 ? "Micro" : values.annualTurnoverLakhs <= 5000 ? "Small" : "Medium",
      investmentInrLakhs: Number(values.investmentInrLakhs),
      employmentCount: Number(values.employmentCount),
      capacity_lpd: Number(values.capacityLpd),
      annual_turnover: Number(values.annualTurnoverLakhs) * 100000,
      brand_id: values.brandAffiliation,
      stage: "Planning",
      readinessScore: 68,
      status: "In Preparation",
      updatedAt: new Date().toISOString().slice(0, 10),
      sourceFlag: "Official Reference Data",
      demo: true,
      activityType: values.activityType,
    };
    onCreate(newProject);
  });

  const stepTitles = [
    "Enterprise Basics",
    "Dairy Activity & Brand",
    "Scale & Facility",
    "Statutory Rules & Fees",
    "Confirmation",
  ];

  return (
    <>
      <PageHeader
        eyebrow="DAIRY ENTERPRISE SETUP"
        title={editId ? "Edit Dairy Enterprise Particulars" : "Register a Dairy Enterprise"}
        subtitle="Automated FSSAI FoSCoS tier calculation, document checklists, and official Aavin franchise rules."
        actions={
          <Link className="btn secondary" to={editId ? `/projects/${editId}` : "/projects"}>
            <X size={16} /> Cancel
          </Link>
        }
      />

      <div className="wizard-layout">
        <div className="wizard-main panel">
          {/* Progress Indicator */}
          <div className="wizard-steps">
            {stepTitles.map((title, i) => (
              <button
                type="button"
                key={title}
                className={`wizard-step ${step === i + 1 ? "current" : ""} ${step > i + 1 ? "complete" : ""}`}
                onClick={() => i + 1 < step && setStep(i + 1)}
              >
                <span>{step > i + 1 ? <Check size={15} /> : i + 1}</span>
                <b>{title}</b>
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate>
            <div className="wizard-content">
              <div className="eyebrow">STEP {step} OF 5</div>
              <h2>{stepTitles[step - 1]}</h2>

              {/* STEP 1: Basics */}
              {step === 1 && (
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label htmlFor="name">Dairy Enterprise Name *</label>
                    <input
                      id="name"
                      placeholder="e.g. Namakkal Aavin Parlour & Chilling Point"
                      className="form-control"
                      {...form.register("name")}
                    />
                    {errors.name && <small className="field-error">{errors.name.message}</small>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="organizationName">Entity / Business Name *</label>
                    <input
                      id="organizationName"
                      placeholder="e.g. Sri Krishna Dairy Enterprises"
                      className="form-control"
                      {...form.register("organizationName")}
                    />
                    {errors.organizationName && <small className="field-error">{errors.organizationName.message}</small>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="applicantContact">Contact Person / Proprietor *</label>
                    <input
                      id="applicantContact"
                      placeholder="e.g. S. Murugesan"
                      className="form-control"
                      {...form.register("applicantContact")}
                    />
                    {errors.applicantContact && <small className="field-error">{errors.applicantContact.message}</small>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="district">Tamil Nadu District *</label>
                    <select id="district" className="form-control" {...form.register("district")}>
                      {tnDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Town / Taluk / Village *</label>
                    <input
                      id="location"
                      placeholder="e.g. Mohanur Road, Namakkal"
                      className="form-control"
                      {...form.register("location")}
                    />
                    {errors.location && <small className="field-error">{errors.location.message}</small>}
                  </div>
                </div>
              )}

              {/* STEP 2: Activity & Brand */}
              {step === 2 && (
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Dairy Business Activity *</label>
                    <div className="role-choices" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                      {[
                        { id: "milk_parlour", label: "Milk Parlour / Booth", icon: Store, desc: "Retail sales of pouch milk, ghee, paneer" },
                        { id: "bmc_collection", label: "BMC / Collection Centre", icon: Milk, desc: "Bulk milk collection from farmers" },
                        { id: "chilling_centre", label: "Chilling Centre", icon: Warehouse, desc: "Milk cooling to 4°C with chilling tanks" },
                        { id: "processing_unit", label: "Dairy Processing Plant", icon: Building2, desc: "Pasteurization, curd, butter production" },
                        { id: "aavin_franchise", label: "Aavin Franchise (FRO)", icon: Store, desc: "Official Aavin franchise retail outlet" },
                      ].map((act) => {
                        const Icon = act.icon;
                        const isChosen = v.activityType === act.id;
                        return (
                          <button
                            type="button"
                            key={act.id}
                            className={isChosen ? "chosen" : ""}
                            onClick={() => form.setValue("activityType", act.id as any)}
                            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px", textAlign: "left" }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                              <Icon size={16} /> {act.label}
                            </span>
                            <small style={{ marginTop: "4px", opacity: 0.8 }}>{act.desc}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="brandAffiliation">Brand Affiliation *</label>
                    <select id="brandAffiliation" className="form-control" {...form.register("brandAffiliation")}>
                      <option value="aavin">Aavin (Tamil Nadu Cooperative Milk Producers' Federation)</option>
                      <option value="independent">Independent Dairy Enterprise</option>
                      <option value="private_partner">Private Brand Partner (Hatsun / Dodla / Heritage)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="capacityLpd">Daily Handling Capacity (Litres / Day) *</label>
                    <input
                      id="capacityLpd"
                      type="number"
                      className="form-control"
                      {...form.register("capacityLpd")}
                    />
                    <small>FSSAI registration cutoff: 500 LPD. Above 500 LPD requires State License.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="annualTurnoverLakhs">Estimated Annual Turnover (₹ Lakhs) *</label>
                    <input
                      id="annualTurnoverLakhs"
                      type="number"
                      className="form-control"
                      {...form.register("annualTurnoverLakhs")}
                    />
                    <small>License category and fee will be shown only after the current FoSCoS rule is loaded and reviewed.</small>
                  </div>
                </div>
              )}

              {/* STEP 3: Scale & Facility */}
              {step === 3 && (
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="investmentInrLakhs">Total Proposed Investment (₹ Lakhs) *</label>
                    <input
                      id="investmentInrLakhs"
                      type="number"
                      className="form-control"
                      {...form.register("investmentInrLakhs")}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="employmentCount">Estimated Direct Employees *</label>
                    <input
                      id="employmentCount"
                      type="number"
                      className="form-control"
                      {...form.register("employmentCount")}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="coldStorageSqFt">Cold Storage / Chilling Space (sq ft) *</label>
                    <input
                      id="coldStorageSqFt"
                      type="number"
                      className="form-control"
                      {...form.register("coldStorageSqFt")}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cleanWaterSource">Water Potability Source *</label>
                    <select id="cleanWaterSource" className="form-control" {...form.register("cleanWaterSource")}>
                      <option value="Piped Municipal / Tested Borewell">Piped Municipal / Tested Borewell</option>
                      <option value="Dedicated RO Plant on Premises">Dedicated RO Plant on Premises</option>
                      <option value="Industrial Estate Water Supply (SIPCOT/SIDCO)">Industrial Estate Water Supply</option>
                    </select>
                  </div>
                  <div className="form-group span-2">
                    <label className="check-line">
                      <input type="checkbox" {...form.register("hasFoodSafetySupervisor")} />
                      A designated Food Safety Supervisor is nominated for the premises
                    </label>
                    <label className="check-line" style={{ marginTop: "8px" }}>
                      <input type="checkbox" {...form.register("fostacCertified")} />
                      Staff has completed / scheduled FoSTaC Dairy Training
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: Rule Engine Assessment */}
              {step === 4 && (
                <div className="review-summary">
                  <div style={{ background: "rgba(27,108,92,0.06)", padding: "16px", borderRadius: "10px", gridColumn: "span 2", border: "1px solid rgba(27,108,92,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--teal-primary)", fontWeight: 700, fontSize: "17px", marginBottom: "6px" }}>
                      <ShieldCheck size={20} /> Computed Compliance Tier: {fssaiEstimate.tier}
                    </div>
                    <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "var(--slate-text)" }}>
                      Based on capacity of <b>{v.capacityLpd} LPD</b> and annual turnover of <b>₹{v.annualTurnoverLakhs} Lakhs</b>, the rule engine classifies this business under <b>{fssaiEstimate.form}</b>.
                    </p>
                    <div style={{ fontSize: "13px", color: "var(--slate-muted)" }}>
                      <b>Data status:</b> {fssaiEstimate.source}
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e8e4da", gridColumn: "span 2" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "16px" }}>
                      <Receipt size={18} /> Statutory Fee & Deposit Breakdown
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", fontSize: "14px" }}>
                      <span>FSSAI License / Registration Statutory Fee:</span>
                      <b>{fssaiEstimate.feeTotalText}</b>
                      {v.brandAffiliation !== "independent" && (
                        <>
                          <span>Brand-specific deposit:</span>
                          <b>Unavailable — written terms not yet verified</b>
                        </>
                      )}
                      <div style={{ borderTop: "1px solid #e8e4da", gridColumn: "span 2", margin: "4px 0" }} />
                      <span style={{ fontWeight: 700, fontSize: "15px" }}>Estimated First-Year Capital Outlay:</span>
                      <b style={{ fontWeight: 700, fontSize: "15px", color: "var(--teal-primary)" }}>Not calculated</b>
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e8e4da", gridColumn: "span 2" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "16px" }}>
                      <FileCheck size={18} /> Mandatory Statutory Documents Required ({fssaiEstimate.docs.length} items)
                    </h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {fssaiEstimate.docs.map((d) => {
                        const template = d.templateKey
                          ? STATUTORY_TEMPLATES.find((t) => t.templateKey === d.templateKey)
                          : null;
                        return (
                          <div
                            key={d.name}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#fdfcf9",
                              padding: "10px 14px",
                              borderRadius: "6px",
                              border: "1px solid #eeebe2",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <b style={{ fontSize: "14px", color: "var(--slate-heading)" }}>{d.name}</b>
                                <span className="doc-category-tag" style={{ fontSize: "11px", background: "rgba(27,108,92,0.1)", color: "var(--teal-primary)", padding: "2px 6px", borderRadius: "4px" }}>
                                  {d.category}
                                </span>
                              </div>
                              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--slate-muted)" }}>
                                {d.description}
                              </p>
                            </div>
                            {template && (
                              <button
                                type="button"
                                className="btn secondary"
                                style={{ padding: "5px 10px", fontSize: "12px", whiteSpace: "nowrap" }}
                                onClick={() => setActiveTemplate(template)}
                              >
                                View Format
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirmation */}
              {step === 5 && (
                <div className="review-summary">
                  {[
                    ["Enterprise Name", v.name],
                    ["Organization", v.organizationName],
                    ["District", `${v.district}, Tamil Nadu`],
                    ["Location", v.location],
                    ["Activity Type", v.activityType.replace("_", " ").toUpperCase()],
                    ["Brand Affiliation", v.brandAffiliation.toUpperCase()],
                    ["Capacity", `${v.capacityLpd} Litres / Day`],
                    ["Turnover", `₹${v.annualTurnoverLakhs} Lakhs / Year`],
                    ["FSSAI Requirement", fssaiEstimate.tier],
                    ["Annual Statutory Fee", fssaiEstimate.feeTotalText],
                    ["Planned Investment", money(Number(v.investmentInrLakhs))],
                    ["Employees", `${v.employmentCount} personnel`],
                  ].map(([k, val]) => (
                    <div key={String(k)}>
                      <span>{k}</span>
                      <b>{val || "—"}</b>
                    </div>
                  ))}

                  <div className="privacy-banner span-2" style={{ marginTop: "12px" }}>
                    <AlertCircle size={18} />
                    <div>
                      <b>Academic & Decision Support Notice</b>
                      <p>
                        This will generate a tracked project in your DairySetu-TN workspace. All rules, fees, and checklists are grounded in official FoSCoS and Aavin guidelines. Official clearances require submission via FoSCoS portal.
                      </p>
                    </div>
                  </div>

                  <div className="form-group span-2" style={{ marginTop: "8px" }}>
                    <label className="check-line">
                      <input type="checkbox" {...form.register("confirmed")} />
                      I confirm that the entered scale and facility parameters reflect our proposed dairy enterprise.
                    </label>
                    {errors.confirmed && <small className="field-error">{errors.confirmed.message}</small>}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="wizard-footer">
              <span>Step {step} of 5</span>
              <div>
                {step > 1 && (
                  <button type="button" className="btn secondary" onClick={() => setStep((s) => s - 1)}>
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                {step < 5 ? (
                  <button type="button" className="btn primary" onClick={next}>
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="btn primary" type="submit">
                    <Check size={16} /> {editId ? "Update Dairy Enterprise" : "Create Dairy Enterprise"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Guidance */}
        <aside className="wizard-aside">
          <div className="panel">
            <span className="aside-icon">
              <Sparkles size={19} />
            </span>
            <h3>Dairy Regulatory Guide</h3>
            <p>
              Under Tamil Nadu food safety regulations, all milk distribution and processing businesses must hold a valid FSSAI license or registration prior to commercial operations.
            </p>
            <div className="aside-check">
              <CheckCircle2 size={16} /> FoSCoS Statutory Fee Calculator
            </div>
            <div className="aside-check">
              <CheckCircle2 size={16} /> Official Form A / Form B Checklists
            </div>
            <div className="aside-check">
              <CheckCircle2 size={16} /> Aavin Franchise Security Deposit
            </div>
            <div className="aside-check">
              <CheckCircle2 size={16} /> District Milk Opportunity Alignment
            </div>
          </div>
          <div className="privacy-banner">
            <ShieldCheck size={17} />
            <div>
              <b>Official Sourced Norms</b>
              <p>Grounded in FSSAI FoSCoS regulations and Aavin TCMPF guidelines.</p>
            </div>
          </div>
        </aside>
      </div>

      {confirmSubmit && (
        <div className="inline-success" role="status">
          Dairy enterprise project saved successfully to your workspace.
        </div>
      )}

      {activeTemplate && (
        <TemplateModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </>
  );
}
