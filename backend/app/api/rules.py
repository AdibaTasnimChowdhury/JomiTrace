"""Rules API router providing the public rule catalog, defaults, and limitations."""
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.rule_catalog import RuleCatalogItem, RuleCatalogResponse
from app.services.case_service import RULES_CATALOG

router = APIRouter()

@router.get("/rules", response_model=RuleCatalogResponse)
def get_rule_catalog() -> RuleCatalogResponse:
    """Returns the rule catalog, configuration defaults, and explainability limitations."""
    rule_items = [
        RuleCatalogItem(
            code=r["code"],
            name=r["name"],
            category=r["category"],
            logic=r["logic"],
            conflict_condition=r["conflict_condition"],
            review_required_condition=r["review_required_condition"],
            insufficient_condition=r["insufficient_condition"],
            limitations=r["limitations"],
        )
        for r in RULES_CATALOG
    ]

    area_factors = {
        "decimal": 435.6,
        "shotok": 435.6,
        "acre": 43560.0,
        "sq_meter": 10.7639,
        "hectare": 107639.1,
        "sq_ft": 1.0,
        "regional_units": ["katha", "bigha", "kani", "gonda"],
        "regional_policy": "Reviewer must specify local conversion basis per case; unconfigured regional units produce insufficient_information.",
    }

    vocabulary_rules = {
        "status_labels": [
            "conflict_detected",
            "review_required",
            "insufficient_information",
            "no_inconsistency_found",
        ],
        "screening_policy": (
            "Deterministic screening prototype. Expresses evidence-backed discrepancy warnings only; "
            "does not determine bad faith, criminal wrongdoing, or legal title ownership."
        ),
    }

    return RuleCatalogResponse(
        rule_version=settings.RULE_VERSION,
        config_defaults=settings.DEFAULT_CASE_CONFIG,
        rules=rule_items,
        area_factors=area_factors,
        vocabulary_rules=vocabulary_rules,
    )
