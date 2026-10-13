"""
Models package – imports all ORM models so SQLAlchemy metadata is populated
and Alembic can detect all tables.
"""
from app.models.chatbot import ChatbotChunk, ChatbotConversation, ChatbotDocument
from app.models.dairy import (
    Brand,
    BrandRequirement,
    BusinessType,
    DistrictMilkProduction,
    Farmer,
    FSSAIRequiredDocument,
    FSSAIRule,
    GovernmentScheme,
    MilkCollection,
    ProductBatch,
)
from app.models.grievance import Grievance
from app.models.notification import AuditLog, Notification
from app.models.project import (
    Application,
    ApplicationDocument,
    ApplicationReview,
    ApplicationStatusHistory,
    DocumentFlag,
    Project,
)
from app.models.user import Organization, User, UserOrganization

__all__ = [
    "User",
    "Organization",
    "UserOrganization",
    "Brand",
    "BrandRequirement",
    "BusinessType",
    "FSSAIRule",
    "FSSAIRequiredDocument",
    "DistrictMilkProduction",
    "Farmer",
    "MilkCollection",
    "ProductBatch",
    "GovernmentScheme",
    "Project",
    "Application",
    "ApplicationDocument",
    "DocumentFlag",
    "ApplicationReview",
    "ApplicationStatusHistory",
    "Grievance",
    "ChatbotDocument",
    "ChatbotChunk",
    "ChatbotConversation",
    "Notification",
    "AuditLog",
]

from app.models.registry import SourceVersion, RegistryRule
