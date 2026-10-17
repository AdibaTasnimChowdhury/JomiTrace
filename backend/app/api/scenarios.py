"""Scenarios API router for loading and inspecting fictional demonstration cases."""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.case import CaseResponse
from app.schemas.scenario import ScenarioInfo, ScenarioListResponse
from app.services.case_service import ScenarioCaseCollisionError, SCENARIOS_CATALOG, load_scenario_from_fixture

router = APIRouter()

@router.get("/scenarios", response_model=ScenarioListResponse)
def list_demo_scenarios() -> ScenarioListResponse:
    """Lists the 8 fictional demonstration scenarios (S1-S8) with their expected discrepancy patterns."""
    items = [
        ScenarioInfo(
            id=s["id"],
            case_code=s["case_code"],
            title=s["title"],
            description=s["description"],
            expected_outcome=s["expected_outcome"],
            district=s["district"],
            upazila=s["upazila"],
            mouza=s["mouza"],
        )
        for s in SCENARIOS_CATALOG
    ]
    return ScenarioListResponse(
        scenarios=items,
        provenance="synthetic",
        notice="Fictional sample data for demonstration • LandTech 2026 track P3 & P5",
    )

@router.post("/scenarios/{scenario_id}/load", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def load_scenario(
    scenario_id: str,
    replace: bool = Query(True, description="Replace existing case with same case_code if present"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Loads a fictional scenario into the database, seeds its records, parties, crosswalks,
    and checklist, and executes an initial deterministic analysis run.
    """
    valid_ids = [s["id"].upper() for s in SCENARIOS_CATALOG]
    norm_id = scenario_id.upper().strip()

    if norm_id not in valid_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found. Available scenarios: {', '.join(valid_ids)}",
        )

    try:
        case, run, summary = load_scenario_from_fixture(db, norm_id, replace_existing=replace)
        return case
    except ScenarioCaseCollisionError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except FileNotFoundError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load scenario '{scenario_id}': {str(e)}",
        )
