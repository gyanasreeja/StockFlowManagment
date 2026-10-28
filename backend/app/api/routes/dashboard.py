from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Product, User
from app.schemas.dashboard import DashboardOut, LowStockItem
from app.services.stock import effective_threshold, is_low_stock

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = user.organization_id
    default = user.organization.default_low_stock_threshold
    total_products, total_qty = db.execute(
        select(func.count(Product.id), func.coalesce(func.sum(Product.quantity_on_hand), 0)).where(
            Product.organization_id == org_id
        )
    ).one()
    products = db.scalars(select(Product).where(Product.organization_id == org_id).order_by(Product.name)).all()
    low = [
        LowStockItem(
            name=p.name,
            sku=p.sku,
            quantity_on_hand=p.quantity_on_hand,
            low_stock_threshold=effective_threshold(p.low_stock_threshold, default),
        )
        for p in products
        if is_low_stock(p.quantity_on_hand, p.low_stock_threshold, default)
    ]
    return DashboardOut(total_products=total_products, total_quantity_on_hand=int(total_qty), low_stock_items=low)

