from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models import User
from app.schemas.dashboard import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings(user: User = Depends(get_current_user)):
    return SettingsOut(default_low_stock_threshold=user.organization.default_low_stock_threshold)


@router.put("", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdate, user: User = Depends(require_role("owner")), db: Session = Depends(get_db)
):
    org = user.organization
    org.default_low_stock_threshold = payload.default_low_stock_threshold
    db.commit()
    return SettingsOut(default_low_stock_threshold=org.default_low_stock_threshold)

