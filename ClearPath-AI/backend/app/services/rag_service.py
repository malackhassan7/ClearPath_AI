"""
DairySetu-TN RAG Service
========================
High-Quality Retrieval-Augmented Generation for Tamil Nadu Dairy Ecosystem.

Pipeline:
1. Ingest official PDFs (FSSAI FoSCoS, Aavin FRO, Tamil Nadu Dairy Policy Note).
2. Chunk into 300-500 word segments with metadata.
3. Hybrid search: Cosine similarity + BM25 keyword search combined with Reciprocal Rank Fusion (RRF).
4. Strict Grounding: LLM (Groq Llama-3 or Google Gemini) answers ONLY from retrieved context.
5. Guardrails: Low confidence triggers standard FoSCoS referral disclaimer.
6. Bilingual: Tamil & English detection and localized generation.
"""
from __future__ import annotations

import math
import os
import re
import uuid
from typing import Any

try:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.config import settings
    from app.models.chatbot import ChatbotChunk, ChatbotConversation, ChatbotDocument
except ImportError:
    select = None
    AsyncSession = Any
    settings = None
    ChatbotChunk = ChatbotConversation = ChatbotDocument = None

# Curated, verified knowledge segments extracted from official source documents
OFFICIAL_KNOWLEDGE_BASE = [
    {
        "doc_title": "FSSAI FoSCoS Kind of Business Eligibility Regulations",
        "doc_type": "regulation",
        "page_number": 4,
        "source_org": "Food Safety and Standards Authority of India (FSSAI)",
        "source_url": "https://foscos.fssai.gov.in/assets/docs/KindofBusinessEligibility.pdf",
        "text": (
            "FSSAI Dairy Licensing Tiers and Capacity Criteria: "
            "1. Registration Certificate (Form A): Dairy units, milk collection centers, and small retail parlours "
            "handling up to 500 liters of milk per day (LPD) or having an annual turnover up to Rs. 12 Lakhs. Annual fee is Rs. 100. "
            "2. State License (Form B): Dairy processing units handling between 501 to 50,000 liters of milk per day, "
            "or handling milk solids from 2.5 to 2,500 Metric Tonnes per annum, or annual turnover between Rs. 12 Lakhs to Rs. 20 Crores. "
            "Annual fee is Rs. 2,000 to Rs. 3,000 depending on installed capacity. "
            "3. Central License (Form B): Large processing units handling more than 50,000 liters of milk per day, "
            "or over 2,500 Metric Tonnes of milk solids per annum, or annual turnover exceeding Rs. 20 Crores. Annual fee is Rs. 7,500."
        ),
    },
    {
        "doc_title": "FoSCoS KoB-wise Documents Required for Dairy License",
        "doc_type": "checklist",
        "page_number": 2,
        "source_org": "FSSAI FoSCoS Portal",
        "source_url": "https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf",
        "text": (
            "Mandatory documents required for dairy business license application: "
            "1. Form B signed by authorized signatory/proprietor. "
            "2. Blueprint/layout plan of processing unit showing manufacturing machinery dimensions and cold storage area. "
            "3. List of Directors/Partners/Proprietor with complete address and government photo ID proof (Aadhaar, Voter ID, PAN). "
            "4. Name and list of equipment and machinery along with their number, installed capacity, and horsepower used. "
            "5. Proof of possession of premises (Registered rental agreement, lease deed, or latest electricity bill). "
            "6. Food Safety Management System (FSMS) plan or accredited certificate. "
            "7. Water test analysis report (chemical and bacteriological) from an authorized public health laboratory confirming potability. "
            "8. Source of raw milk procurement (cooperative union agreement or farmer collection route details)."
        ),
    },
    {
        "doc_title": "Aavin Franchise Retailer Outlet (FRO) Guidelines",
        "doc_type": "franchise_guideline",
        "page_number": 1,
        "source_org": "Tamil Nadu Co-operative Milk Producers' Federation (AAVIN)",
        "source_url": "https://aavin.tn.gov.in/documents/20142/59228/Applcation+for+AAVIN+FRO.pdf",
        "text": (
            "Aavin Franchisee Retail Outlet (FRO) Application Procedure and Requirements: "
            "1. Eligibility: Any individual, partnership, or cooperative society in Tamil Nadu can apply. "
            "2. Premises: Required shop carpet area is minimum 100 to 150 square feet in a prime commercial location or residential hub. "
            "Must have proper electrical power connection (minimum 2 KW) for continuous deep freezer and visi-cooler operation. "
            "3. Security Deposit: Refundable interest-free security deposit is Rs. 25,000 for FRO and Rs. 10,000 for standard Aavin Parlour, "
            "payable via Demand Draft in favor of the respective District Co-operative Milk Producers' Union. "
            "4. Required Documents: Completed Aavin FRO Application Form, passport size photograph, Proof of Identity (Aadhaar/PAN), "
            "Rental Agreement (minimum 3 years validity) or Property Tax receipt, FSSAI Registration Certificate, and Bank statement. "
            "5. Agreement: Franchise agreement on Rs. 100 non-judicial stamp paper."
        ),
    },
    {
        "doc_title": "Tamil Nadu Dairy Development Policy Note 2025-26",
        "doc_type": "policy_note",
        "page_number": 12,
        "source_org": "Government of Tamil Nadu - Animal Husbandry, Dairying and Fisheries Dept",
        "source_url": "https://cms.tn.gov.in/cms_migrated/document/docfiles/dairy_e_pn_2025_26.pdf",
        "text": (
            "Tamil Nadu Dairy Cooperative Structure and Milk Production: "
            "The dairy cooperative network functions as a three-tier system: "
            "1. Primary Milk Producers Cooperative Societies at village level (over 9,300 societies). "
            "2. District Co-operative Milk Producers' Unions at district level (27 District Unions). "
            "3. Apex Federation: The Tamil Nadu Co-operative Milk Producers' Federation Limited (TCMPF - Aavin). "
            "Tamil Nadu is one of the leading milk producing states in India. Major dairy producing districts "
            "include Coimbatore, Namakkal, Erode, Dindigul, Krishnagiri, and Salem. "
            "Aavin guarantees procurement prices to dairy farmers and provides veterinary healthcare, cattle insurance, and subsidized cattle feed."
        ),
    },
    {
        "doc_title": "District Milk Production Statistics in Tamil Nadu",
        "doc_type": "statistical_report",
        "page_number": 1,
        "source_org": "data.gov.in - Open Government Data Platform India",
        "source_url": "https://data.gov.in/resource/time-series-data-details-milk-production-districts-tamil-nadu",
        "text": (
            "District-wise Milk Production Official Figures in Tamil Nadu (2018-19): "
            "Coimbatore district ranks highest in milk production in Tamil Nadu with 621 thousand tonnes in 2018-19. "
            "Namakkal ranks second with 477 thousand tonnes. "
            "Erode produces 330 thousand tonnes, followed by Dindigul (266 thousand tonnes), Krishnagiri (259 thousand tonnes), "
            "Dharmapuri (246 thousand tonnes), Tiruppur (225 thousand tonnes), and Salem (211 thousand tonnes). "
            "The Western agro-climatic zone (Coimbatore-Namakkal-Erode belt) constitutes the primary milk corridor of Tamil Nadu."
        ),
    },
    {
        "doc_title": "Government Schemes for Dairy Farmers in Tamil Nadu",
        "doc_type": "schemes_guide",
        "page_number": 3,
        "source_org": "National Dairy Development Board & Govt of Tamil Nadu",
        "source_url": "https://dahd.nic.in/schemes/programmes/national-programme-dairy-development-npdd",
        "text": (
            "Key government financial schemes for dairy stakeholders in Tamil Nadu: "
            "1. NPDD (National Programme for Dairy Development): Provides 50-75% capital subsidy for setting up village BMCs, "
            "chilling plants, and electronic milk testers. "
            "2. Kisan Credit Card (KCC) for Animal Husbandry: Working capital loan up to Rs. 2.0 Lakhs at 4% effective interest rate. "
            "3. DIDF (Dairy Processing & Infrastructure Development Fund): Soft loans via NABARD for processing plant modernizations. "
            "4. Free Milch Cows Scheme: Tamil Nadu state scheme providing free crossbred milch cows to rural women-headed households."
        ),
    },
]


def detect_language(text: str) -> str:
    """Detects whether user query is in Tamil or English."""
    # Tamil Unicode block: U+0B80 to U+0BFF
    tamil_chars = len(re.findall(r"[\u0b80-\u0bff]", text))
    if tamil_chars > 2:
        return "ta"
    return "en"


def compute_bm25_score(query: str, text: str) -> float:
    """Computes basic BM25 keyword score."""
    q_tokens = re.findall(r"\w+", query.lower())
    t_tokens = re.findall(r"\w+", text.lower())
    if not q_tokens or not t_tokens:
        return 0.0

    score = 0.0
    for token in q_tokens:
        if token in t_tokens:
            count = t_tokens.count(token)
            score += (count * 2.2) / (count + 1.2 * (0.25 + 0.75 * (len(t_tokens) / 80.0)))
    return score


def hybrid_search(query: str, top_k: int = 4) -> list[dict]:
    """Legacy static passages are not approved registry evidence. Retrieval is Phase 6."""
    return []


def format_grounded_answer(question: str, chunks: list[dict], language: str) -> tuple[str, list[dict]]:
    """Do not turn static or caller-supplied passages into regulatory answers."""
    return (
        "Reviewed source retrieval is not connected. No eligibility, fee or approval has been determined."
        if language != "ta" else
        "மதிப்பாய்வு செய்யப்பட்ட ஆதாரங்கள் இணைக்கப்படவில்லை. தகுதி, கட்டணம் அல்லது ஒப்புதல் தீர்மானிக்கப்படவில்லை.",
        [],
    )


async def chat_service(
    question: str,
    user_id: uuid.UUID | None = None,
    language_override: str | None = None,
    db: AsyncSession | None = None,
) -> dict:
    """
    Main RAG Chat entrypoint.
    Executes hybrid retrieval, strict grounding, citation generation, and audit saving.
    """
    lang = language_override or detect_language(question)
    chunks = hybrid_search(question, top_k=3)

    if not chunks:
        disclaimer = (
            "This information is not available in the official documents I have access to. "
            "Please refer to FoSCoS (foscos.fssai.gov.in) or contact FSSAI directly."
            if lang == "en"
            else "இந்த தகவல் நான் அணுகக்கூடிய அதிகாரப்பூர்வ ஆவணங்களில் இல்லை. தயவுசெய்து FoSCoS (foscos.fssai.gov.in) வலைத்தளத்தைப் பார்க்கவும் அல்லது FSSAI-ஐ நேரடியாகத் தொடர்பு கொள்ளவும்."
        )
        return {
            "answer": disclaimer,
            "sources": [],
            "language": lang,
            "conversation_id": str(uuid.uuid4()),
        }

    answer, citations = format_grounded_answer(question, chunks, lang)
    conv_id = uuid.uuid4()

    if db and user_id:
        conv = ChatbotConversation(
            conversation_id=conv_id,
            user_id=user_id,
            question=question,
            answer=answer,
        )
        db.add(conv)
        await db.commit()

    return {
        "answer": answer,
        "sources": citations,
        "language": lang,
        "conversation_id": str(conv_id),
    }
