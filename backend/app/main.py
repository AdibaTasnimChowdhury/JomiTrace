from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db

from app.api.health import router as health_router
from app.api.cases import router as cases_router
from app.api.records import router as records_router
from app.api.parties import router as parties_router
from app.api.crosswalk import router as crosswalk_router
from app.api.analysis import router as analysis_router
from app.api.checklist import router as checklist_router
from app.api.rules import router as rules_router
from app.api.scenarios import router as scenarios_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for local frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under settings.API_PREFIX (/api)
app.include_router(health_router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(cases_router, prefix=settings.API_PREFIX, tags=["Cases"])
app.include_router(records_router, prefix=settings.API_PREFIX, tags=["Records"])
app.include_router(parties_router, prefix=settings.API_PREFIX, tags=["Parties"])
app.include_router(crosswalk_router, prefix=settings.API_PREFIX, tags=["Crosswalk"])
app.include_router(analysis_router, prefix=settings.API_PREFIX, tags=["Analysis"])
app.include_router(checklist_router, prefix=settings.API_PREFIX, tags=["Checklist"])
app.include_router(rules_router, prefix=settings.API_PREFIX, tags=["Rules"])
app.include_router(scenarios_router, prefix=settings.API_PREFIX, tags=["Scenarios"])

@app.get("/")
def read_root():
    return {
        "service": settings.PROJECT_NAME,
        "description": settings.PROJECT_DESCRIPTION,
        "health_check": f"{settings.API_PREFIX}/health",
        "docs": "/docs",
    }
