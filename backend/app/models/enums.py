"""Domain enums for JomiTrace data models."""
from enum import Enum

class CaseStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    REVIEW_REQUIRED = "review_required"
    REPORT_READY = "report_ready"
    ARCHIVED = "archived"

class Provenance(str, Enum):
    SYNTHETIC = "synthetic"
    ORGANIZER = "organizer"
    PUBLIC = "public"

class RecordType(str, Enum):
    DEED = "deed"
    KHATIAN = "khatian"
    MUTATION = "mutation"
    DCR = "dcr"
    SURVEY_REFERENCE = "survey_reference"
    OTHER = "other"

class SurveySeries(str, Enum):
    CS = "CS"
    SA = "SA"
    RS = "RS"
    BS = "BS"
    OTHER = "other"

class TransferType(str, Enum):
    SALE = "sale"
    GIFT = "gift"
    INHERITANCE = "inheritance"
    PARTITION = "partition"
    EXCHANGE = "exchange"
    COURT_DECREE = "court_decree"
    POWER_OF_ATTORNEY = "power_of_attorney"
    MUTATION = "mutation"
    OTHER = "other"

class FindingStatus(str, Enum):
    CONFLICT_DETECTED = "conflict_detected"
    REVIEW_REQUIRED = "review_required"
    INSUFFICIENT_INFORMATION = "insufficient_information"
    NO_INCONSISTENCY_FOUND = "no_inconsistency_found"

class FindingCategory(str, Enum):
    PLOT_MISMATCH = "plot_mismatch"
    AREA_MISMATCH = "area_mismatch"
    CHAIN_GAP = "chain_gap"
    POSSIBLE_DUPLICATE_TRANSFER = "possible_duplicate_transfer"
    OVER_CONVEYANCE = "over_conveyance"
    DATE_CONFLICT = "date_conflict"
    REG_MUTATION_MISMATCH = "reg_mutation_mismatch"
    RAPID_TRANSFER = "rapid_transfer"
    DOCUMENT_REUSE = "document_reuse"
    MISSING_DATA = "missing_data"

class ChecklistStatus(str, Enum):
    PENDING = "pending"
    REVIEWER_COMPLETED = "reviewer_completed"
    NOT_APPLICABLE = "not_applicable"
