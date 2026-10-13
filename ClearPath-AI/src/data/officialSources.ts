/**
 * Public-source registry for ClearPath-TN.
 * These are source links, not a claim of live API access or legal verification.
 * Re-check the linked content and effective dates before turning any item into a rule.
 */
export type SourceKind =
  "government_portal" | "government_document" | "research" | "policy_review";
export interface OfficialSource {
  id: string;
  title: string;
  publisher: string;
  kind: SourceKind;
  url: string;
  purpose: string;
  accessibleUse: string;
  limitations: string;
  status: "public_reference" | "document_reference" | "research_reference";
}

export const officialSources: OfficialSource[] = [
  {
    id: "tnswp-public-metrics",
    title: "TNSWP public portal statistics snapshot",
    publisher: "Tamil Nadu Single Window Portal / Government of Tamil Nadu",
    kind: "government_portal",
    url: "https://tnswp.com/DIGIGOV/swp-tnswp.jsp",
    purpose:
      "Public portal page reported 29,203 applications received and 25,140 approved, with its own page timestamp of 2 October 2026. These are portal-reported aggregate counts, not an independently downloaded dataset.",
    accessibleUse:
      "Open the portal and re-check the displayed numbers and timestamp before quoting them. If retained, store as a dated snapshot with retrieval time and screenshot or archived evidence.",
    limitations:
      "Time-sensitive snapshot; not live in ClearPath-TN, not an export/API, and not evidence of per-department processing times or current application status.",
    status: "public_reference",
  },
  {
    id: "tnpcb-public-consent-records",
    title: "TNPCB public consent orders and meeting records",
    publisher: "Tamil Nadu Pollution Control Board",
    kind: "government_portal",
    url: "https://tnpcb.gov.in/dlccc.php",
    purpose:
      "Public district committee meeting records can help researchers locate official consent-related decisions and orders by district/year/month where published.",
    accessibleUse:
      "Follow each public record to the original order; extract only fields permitted for research and retain direct order URL, date, and page/record identifier.",
    limitations:
      "Not a bulk open-data API. Public decision records are not a representative dataset of all applications or processing durations; avoid deriving delay predictions from selected published orders.",
    status: "public_reference",
  },
  {
    id: "ocmms-public-status",
    title: "OCMMS public application status / consent orders",
    publisher: "Pollution Control Board online consent management system",
    kind: "government_portal",
    url: "https://ocmms.nic.in/",
    purpose:
      "The public-facing system exposes some consent/application-status and granted-order pages depending on state, query and portal availability.",
    accessibleUse:
      "Use only pages intended for public access; retain source URL and observed timestamp. Do not automate around login, CAPTCHA, access controls or terms.",
    limitations:
      "Availability and fields vary; this is not a guaranteed bulk dataset or authorised API. Records from other states must not be treated as Tamil Nadu records. Public records may contain company-identifying information.",
    status: "public_reference",
  },
  {
    id: "tnswp",
    title: "Tamil Nadu Single Window Portal",
    publisher: "Government of Tamil Nadu",
    kind: "government_portal",
    url: "https://tnswp.com/DIGIGOV/swp-tnswp.jsp",
    purpose:
      "Discover state business approvals, departments, portal guidance, notifications and public-facing service information.",
    accessibleUse:
      "Manually verify approval catalogue entries and capture source URLs and checked dates. Use only public information.",
    limitations:
      "No public API or permission to access private application status has been established for this project. Public dashboard counts are time-sensitive and must be re-checked at source.",
    status: "public_reference",
  },
  {
    id: "nsws",
    title: "National Single Window System",
    publisher: "Government of India",
    kind: "government_portal",
    url: "https://www.nsws.gov.in/",
    purpose:
      "Cross-check approval discovery and central/state approval guidance.",
    accessibleUse:
      "Use the public approval discovery flow to identify potentially applicable approvals, then confirm with the competent department.",
    limitations:
      "An approval catalogue entry is not a complete legal applicability decision and does not grant ClearPath access to a user’s private application.",
    status: "public_reference",
  },
  {
    id: "tnpcb-industrial-forms",
    title: "TNPCB applications for industries",
    publisher: "Tamil Nadu Pollution Control Board",
    kind: "government_portal",
    url: "https://tnpcb.gov.in/tamil/applicationforindustry.php",
    purpose:
      "Reference official industrial consent and authorisation forms published by TNPCB.",
    accessibleUse:
      "Manually extract the exact form/checklist title, authority, source URL, and visible revision/effective date when available.",
    limitations:
      "Applicability varies by activity and current law. Do not generalize one form to every industrial project.",
    status: "public_reference",
  },
  {
    id: "tnpcb-air-form",
    title: "TNPCB Air Act application instructions (PDF)",
    publisher: "Tamil Nadu Pollution Control Board",
    kind: "government_document",
    url: "https://tnpcb.gov.in/PDF/Consent_Mngt/App_For_Indst/Air_appln.pdf",
    purpose:
      "Example of a primary-source document that explains application completion and enclosure requirements.",
    accessibleUse:
      "Parse the PDF into candidate checklist items, retain page references, and require a human reviewer before publishing rules.",
    limitations:
      "The PDF’s currentness must be verified. A checklist excerpt is not a complete statement of all current legal obligations.",
    status: "document_reference",
  },
  {
    id: "india-services-tnpcb",
    title: "Apply for consent to establish a factory in Tamil Nadu",
    publisher: "National Government Services Portal / NIC",
    kind: "government_portal",
    url: "https://services.india.gov.in/service/detail/apply-for-obtaining-consent-for-establishing-factory-in-tamil-nadu",
    purpose:
      "Secondary official directory entry pointing to the relevant government service.",
    accessibleUse:
      "Use as a discovery aid; follow the service link and verify detailed requirements with TNPCB.",
    limitations:
      "Directory descriptions may not include every document, condition, fee or exception.",
    status: "public_reference",
  },
  {
    id: "tnpcb-consent-orders",
    title: "TNPCB consent and authorization resources",
    publisher: "Tamil Nadu Pollution Control Board",
    kind: "government_portal",
    url: "https://tnpcb.gov.in/sitemap.php",
    purpose:
      "Discover official consent orders, annual reports, laws, sector categorisation and related resources.",
    accessibleUse:
      "Identify specific source documents and store their direct URLs rather than citing only the sitemap.",
    limitations:
      "The sitemap is a discovery index, not itself proof that a particular requirement applies.",
    status: "public_reference",
  },
  {
    id: "adb-tn-single-window",
    title:
      "Investment Climate Improvement in East Coast Economic Corridor of India: Governance and Institutional Reforms Support to the MSME Department, Government of Tamil Nadu",
    publisher: "Asian Development Bank",
    kind: "research",
    url: "https://www.adb.org/publications/investment-climate-governance-msmes-tamil-nadu",
    purpose:
      "Tamil Nadu-specific research on policy, institutional and process reforms for the single-window clearance mechanism for MSMEs.",
    accessibleUse:
      "Use as a research case study to motivate and validate problem framing; cite the publication and distinguish its findings from current operational facts.",
    limitations:
      "Published in 2018; findings may not describe the current portal or current service performance.",
    status: "research_reference",
  },
  {
    id: "pmi-kpmg-infrastructure",
    title:
      "Infrastructure Assessment: single-window clearance impact assessment",
    publisher: "Project Management Institute / KPMG in India",
    kind: "research",
    url: "https://static.investindia.gov.in/s3fs-public/2019-09/Infrastructure%20Assessment.pdf",
    purpose:
      "Published stakeholder evidence discussing benefits and challenges of single-window mechanisms, multi-agency coordination and sector-specific approvals.",
    accessibleUse:
      "Extract the study period, sample/population, exact finding and page number before citing a statistic in a presentation.",
    limitations:
      "Historical and survey-specific; do not present the reported percentages as current Tamil Nadu-wide measurements.",
    status: "research_reference",
  },
  {
    id: "prs-doing-business",
    title:
      "Doing Business in India: The Way Forward — committee report summary",
    publisher: "PRS Legislative Research",
    kind: "policy_review",
    url: "https://prsindia.org/policy/report-summaries/doing-business-in-india-the-way-forward",
    purpose:
      "Policy discussion of fragmented approvals, multiple levels of government and incomplete rollout of single-window processes.",
    accessibleUse:
      "Use to formulate research questions and feature hypotheses; follow the summary’s cited committee report for primary evidence.",
    limitations:
      "A report summary is not the underlying government record and may omit qualifications; verify the full report before relying on details.",
    status: "research_reference",
  },
  {
    id: "approval-risks",
    title: "Approval Risks in Transportation Infrastructure Projects in India",
    publisher: "American Society of Civil Engineers conference paper",
    kind: "research",
    url: "https://www.researchgate.net/publication/267801199_Approval_Risks_in_Transportation_Infrastructure_Projects_in_India",
    purpose:
      "Research on approval-related project risks such as interdepartmental communication, sequential reviews, planning and adherence to timelines.",
    accessibleUse:
      "Use as a hypothesis source for dependency graphs, hand-off tracking and delay attribution; verify bibliographic details and full text before formal citation.",
    limitations:
      "Transportation infrastructure context is not automatically generalizable to every Tamil Nadu industrial project.",
    status: "research_reference",
  },
];
