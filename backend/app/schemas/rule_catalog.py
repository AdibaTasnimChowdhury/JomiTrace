"""Pydantic schemas for Rule Catalog and Limitations."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RuleCatalogItem(BaseModel):
    code: str
    name: str
    category: str
    logic: str
    conflict_condition: str
    review_required_condition: str
    insufficient_condition: str
    limitations: str

class RuleCatalogResponse(BaseModel):
    rule_version: str
    config_defaults: Dict[str, Any]
    rules: List[RuleCatalogItem]
    area_factors: Dict[str, Any]
    vocabulary_rules: Dict[str, Any]
