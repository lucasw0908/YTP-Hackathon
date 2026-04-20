from fastapi import APIRouter, Response, Depends

from .main import router as main_router


async def resp_headers(response: Response):
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "deny"
    return response


def get_api_router() -> APIRouter:
    """
    Returns
    -------
    api_router: :class:`APIRouter`
        The API router.
    """
    api_router = APIRouter(
        prefix="/api",
        tags=["API"],
        dependencies=[Depends(resp_headers)]
    )
    api_router.include_router(main_router)
    return api_router
