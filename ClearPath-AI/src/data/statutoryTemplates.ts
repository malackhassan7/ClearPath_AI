export interface StatutoryTemplate {
  templateKey: string;
  title: string;
  category: string;
  authority: string;
  citation: string;
  description: string;
  mandatoryFields: string[];
  sampleText: string;
}

export const STATUTORY_TEMPLATES: StatutoryTemplate[] = [
  {
    templateKey: "template_form_b",
    title: "FSSAI Form B – Application for License",
    category: "Statutory Form",
    authority: "Food Safety and Standards Authority of India (FSSAI)",
    citation: "Schedule 2, Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011",
    description: "Standard application form for obtaining State or Central FSSAI License for dairy manufacturing, chilling, and processing establishments.",
    mandatoryFields: [
      "Applicant / Enterprise Legal Name",
      "Kind of Business (Dairy Processing / Chilling Centre / Packaging)",
      "Plant Location Address with Survey / Plot Number & Taluk",
      "Installed Capacity (Litres of Milk per Day - LPD)",
      "Proposed Capital Outlay and Annual Turnover",
      "Authorized Signatory Details & Official Stamp",
    ],
    sampleText: `FORM B
[See Regulation 2.1.2 / 2.1.3]
APPLICATION FOR LICENSE UNDER FOOD SAFETY AND STANDARDS ACT, 2006

1. Name of the Food Business Operator: [ENTERPRISE_NAME]
2. Kind of Business: Dairy Processing & Manufacturing / Bulk Milk Chilling Centre
3. Address of Premises: [PREMISES_ADDRESS], Taluk: [TALUK], District: [DISTRICT], Tamil Nadu - [PINCODE]
4. Correspondence Address: [SAME AS ABOVE]
5. Installed Capacity: [CAPACITY_LPD] Litres of Milk per Day (LPD)
6. Electricity Consumer No: [EB_CONSUMER_NUMBER]
7. Nominated Food Safety Supervisor: [SUPERVISOR_NAME] (FoSTaC Cert No: [FOSTAC_CERT_NO])
8. Water Source: Piped Municipal / Tested Borewell with RO System

DECLARATION:
I/We hereby declare that all particulars stated above are true and complete. We undertake to abide by all provisions of the Food Safety and Standards Act, 2006 and the rules and regulations made thereunder.

Date: [DATE]
Place: [DISTRICT]
Signature & Seal of Authorized Signatory: _________________________`,
  },
  {
    templateKey: "template_nabl_water_test",
    title: "NABL Accredited Laboratory Water Testing Report Format",
    category: "Quality & Safety",
    authority: "FSSAI / Bureau of Indian Standards (BIS)",
    citation: "IS 10500:2012 Drinking Water Specification (Mandatory per FSSAI FoSCoS Dairy Checklist)",
    description: "Official test report structure for chemical, physical, and microbiological analysis of potable water used in dairy washing, CIP, and processing.",
    mandatoryFields: [
      "NABL Accreditation Certificate Number and Validity",
      "Sample Collection Date and Testing Date (within 6 months)",
      "Physical Parameters: Color, Odor, Turbidity (max 1 NTU), pH (6.5 to 8.5)",
      "Chemical Parameters: Total Dissolved Solids (max 500 mg/L), Total Hardness (max 200 mg/L), Chlorides, Fluorides",
      "Microbiological Parameters: Total Coliform Count (Absent/100ml), E. Coli (Absent/100ml)",
      "Authorized Lab Analyst & Quality Manager Signatures with Lab Seal",
    ],
    sampleText: `CERTIFICATE OF WATER ANALYSIS (IS 10500:2012)
LABORATORY ACCREDITATION: NABL CERTIFICATE NO. TC-[XXXXX]

Sample Particulars:
- Sample Description: Raw / Treated Water from Dairy Plant
- Sample Source: Borewell / Municipal Supply at [DAIRY_NAME], [DISTRICT]
- Sample Collected On: [COLLECTION_DATE]
- Testing Completed On: [TEST_DATE]

TEST RESULTS:
1. Physical & Chemical Parameters:
   - pH Value: 7.2 (Acceptable limit: 6.5 - 8.5) -> PASS
   - Turbidity: 0.4 NTU (Max: 1.0 NTU) -> PASS
   - Total Dissolved Solids (TDS): 280 mg/L (Max: 500 mg/L) -> PASS
   - Total Hardness (as CaCO3): 120 mg/L (Max: 200 mg/L) -> PASS
   - Chlorides (as Cl): 65 mg/L (Max: 250 mg/L) -> PASS

2. Microbiological Parameters:
   - Total Coliform Bacteria: Absent per 100 ml (Limit: Absent) -> PASS
   - Escherichia Coli (E. Coli): Absent per 100 ml (Limit: Absent) -> PASS

CONCLUSION:
The submitted water sample complies with the requirements of IS 10500:2012 for potable water and is suitable for dairy food manufacturing and cleaning operations.

Authorized Signatory / Quality Manager: _________________________ [SEAL]`,
  },
  {
    templateKey: "template_equipment_schedule",
    title: "Machinery & Equipment Declaration Schedule",
    category: "Engineering & Technical",
    authority: "FSSAI FoSCoS Licensing Division",
    citation: "FSSAI FoSCoS Standard KoB Checklist - Dairy Processing Plants",
    description: "Inventory schedule specifying all milk receiving, chilling, processing, homogenization, packaging equipment, power ratings, and stainless steel sanitary grades.",
    mandatoryFields: [
      "Equipment Name & Type (Chilling Tank, Pasteurizer, Homogenizer, Pouch Packing)",
      "Installed Processing Capacity (Litres / Hour)",
      "Contact Surface Material (SS-304 / SS-316 Food Grade Stainless Steel)",
      "Electric Motor Rating (Horsepower / kW)",
      "Serial Number, Make, and Year of Installation",
    ],
    sampleText: `SCHEDULE OF MACHINERY AND EQUIPMENT
Name of Dairy Enterprise: [ENTERPRISE_NAME]
Plant Address: [PLANT_ADDRESS]

ITEMIZED EQUIPMENT LIST:
1. Bulk Milk Chiller (BMC):
   - Capacity: 5,000 Litres (DX System) | Motor: 5.5 HP | Material: SS-304
2. Plate Heat Exchanger (Pasteurizer):
   - Capacity: 2,000 LPH | HTST 72°C/15s | SS-316 Plates with Auto Divert Valve
3. Milk Homogenizer:
   - Capacity: 1,000 LPH | Two Stage High Pressure (200 Bar) | Motor: 15 HP
4. Milk Storage Silos / Insulated Tanks:
   - 2 Nos x 10,000 Litres | Double Wall Polyurethane Insulated | SS-304
5. Clean-in-Place (CIP) Unit:
   - Three Tank System (Acid, Alkali, Hot Water) | 500 Litres each
6. Automatic Milk Pouch Packing Machine:
   - Form-Fill-Seal (FFS) | 2,400 Pouches/Hr (500ml/1000ml) | UV Sterilization

Undertaking: All food-contact surfaces are constructed from non-toxic, corrosion-resistant SS-304/SS-316 certified food-grade alloy.

Proprietor / Managing Partner: _________________________`,
  },
  {
    templateKey: "template_fsms_plan",
    title: "Food Safety Management System (FSMS) Plan & Supervisor Nomination",
    category: "Food Safety & Quality",
    authority: "FSSAI Food Safety Division",
    citation: "Schedule 4, General Hygienic and Sanitary Practices, FSS Regulations, 2011",
    description: "Documented FSMS plan detailing Hazard Analysis, Critical Control Points (CCP), temperature records, CIP sanitation protocols, and FoSTaC supervisor appointment.",
    mandatoryFields: [
      "Name of Nominated Food Safety Supervisor (FSS) & FoSTaC Training Certificate ID",
      "Critical Control Point (CCP-1): Raw Milk Reception Chilling (<4°C)",
      "Critical Control Point (CCP-2): Pasteurization (72°C for 15 sec with continuous temp chart)",
      "Daily CIP Sanitation Routine (Caustic wash at 75°C, Nitric acid wash, hot water rinse)",
      "Pest Management Program & Medical Fitness Records of Milk Handlers",
    ],
    sampleText: `FOOD SAFETY MANAGEMENT SYSTEM (FSMS) PLAN & NOMINATION UNDERTAKING

1. Food Business Operator: [ENTERPRISE_NAME]
2. Nominated Food Safety Supervisor (FSS):
   - Name: [SUPERVISOR_NAME] | Contact: [PHONE]
   - FoSTaC Dairy Sector Certificate No: [FOSTAC_CERT_NUMBER]

3. CRITICAL CONTROL POINTS (CCP) SUMMARY:
   - CCP-1: Raw Milk Receiving Dock: Rejection of milk if temperature > 10°C, Alcohol test positive, or MBRT < 30 mins.
   - CCP-2: Chilling & Storage: Instant chilling to 4°C in insulated BMC tanks.
   - CCP-3: Pasteurization: Minimum 72.5°C held for 15 seconds. Continuous thermograph recorder logged daily.
   - CCP-4: Cold Chain Maintenance: Finished milk pouches dispatched under refrigerated vans (<4°C).

4. HYGIENE & MEDICAL FITNESS:
   - All dairy handlers undergo annual medical screening for communicable diseases (Form 16).
   - Daily personal hygiene, clean uniforms, and sanitization stations enforced at plant entry.

Authorized Signatory: _________________________`,
  },
  {
    templateKey: "template_blueprint_layout",
    title: "Dairy Processing Plant Layout Blueprint & Flow Diagram Guide",
    category: "Infrastructure",
    authority: "FSSAI / Directorate of Industrial Safety and Health (DISH)",
    citation: "Schedule 4 Part II, Location and Surroundings / Layout and Design of Food Establishment Premises",
    description: "Architectural floor plan blueprint specifications showing uni-directional material flow, sanitation barriers, pest-proofing, and clean vs dirty zone demarcation.",
    mandatoryFields: [
      "Uni-directional product flow from Raw Milk Reception Dock (RMRD) to Cold Storage",
      "Physical separation between raw milk intake and finished packaged milk dispatch",
      "Personnel entry airlocks with hand sanitizers and boot wash stations",
      "Fly-catcher / air-curtain locations at all exterior doors",
      "Effluent treatment plant (ETP) connection and drainage gradient slopes (1:60 slope)",
    ],
    sampleText: `DAIRY PLANT BLUEPRINT & MATERIAL FLOW SPECIFICATION

Key Zonal Divisions:
- Zone A (Receiving / RMRD): Tanker unloading dock, milk dump tank, can scrubber, testing lab.
- Zone B (Processing Hall): Pasteurizer, homogenizer, cream separator, balance tanks (Strictly Clean Zone).
- Zone C (Packaging Room): FFS pouch packing machines with positive air pressure and UV lamps.
- Zone D (Cold Storage): Insulated cold room maintained at 2°C to 4°C with digital datalogger.
- Zone E (Services & Utilities): Boiler, refrigeration compressor, electrical panel, CIP chemical store.

Design Rules Checked:
1. Floors: Heavy-duty non-slip acid-resistant epoxy / Kota stone with coved corners (no 90° right angles).
2. Walls: Glazed ceramic tiles up to 7 feet height for easy washdown.
3. Windows: Sealed wire-mesh insect screens on all exterior openings.

Architect / Certified Engineer Seal & Signature: _________________________`,
  },
  {
    templateKey: "template_milk_sourcing",
    title: "Raw Milk Procurement & Traceability Undertaking",
    category: "Supply Chain & Sourcing",
    authority: "FSSAI / Tamil Nadu Dairy Development Department",
    citation: "FSSAI Guidance Note on Sourcing of Milk & Milk Products, 2020",
    description: "Formal undertaking documenting village farmer procurement networks, BMC chilling locations, transit times, and testing for chemical adulterants.",
    mandatoryFields: [
      "List of primary milk collection points / Village Dairy Cooperative Societies",
      "Total daily procurement volume (Litres / Day)",
      "Adulteration screening protocol (Urea, Starch, Detergent, Maltodextrin, Neutralizers)",
      "Transit time from milking to chilling tank (strictly under 3 hours)",
      "Cold chain insulated tanker registration numbers",
    ],
    sampleText: `RAW MILK SOURCING & QUALITY ASSURANCE UNDERTAKING

To: The Designated Officer, Food Safety and Standards Authority of India (FSSAI), [DISTRICT], Tamil Nadu.

We, [ENTERPRISE_NAME], located at [PLANT_ADDRESS], hereby solemnly declare:
1. Milk Procurement Base: We procure raw cow and buffalo milk directly from [NUMBER] registered dairy farmers across [TALUK] taluk in [DISTRICT] district.
2. Sourcing Schedule: Morning collection: 05:30 to 07:30 hrs | Evening collection: 16:30 to 18:30 hrs.
3. Rapid Chilling: All collected milk reaches our chilling unit within 2.5 hours of milking and is chilled to <4°C.
4. Adulteration Screening: Every batch is tested at the platform for Fat%, SNF%, Neutralizers, Starch, and Added Water using ultrasonic milk analyzers before intake.
5. Record Keeping: Daily procurement and farmer payment registers are maintained and available for inspection.

Authorized Signatory: _________________________ [DATE]`,
  },
];
