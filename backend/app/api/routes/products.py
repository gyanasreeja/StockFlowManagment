from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models import Product, User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, StockAdjust
from app.services.stock import effective_threshold, is_low_stock

router = APIRouter(prefix="/products", tags=["products"])


def to_out(p: Product, org_default: int) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        sku=p.sku,
        description=p.description,
        quantity_on_hand=p.quantity_on_hand,
        cost_price=float(p.cost_price) if p.cost_price is not None else None,
        selling_price=float(p.selling_price) if p.selling_price is not None else None,
        low_stock_threshold=p.low_stock_threshold,
        effective_low_stock_threshold=effective_threshold(p.low_stock_threshold, org_default),
        is_low_stock=is_low_stock(p.quantity_on_hand, p.low_stock_threshold, org_default),
        last_updated_by=p.last_updated_by,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


def get_org_product(db: Session, user: User, product_id: int) -> Product:
    """Tenant-scoped lookup: another org's product is indistinguishable from a missing one (404)."""
    product = db.scalar(
        select(Product).where(Product.id == product_id, Product.organization_id == user.organization_id)
    )
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


def ensure_sku_free(db: Session, org_id: int, sku: str) -> None:
    exists = db.scalar(select(Product.id).where(Product.organization_id == org_id, Product.sku == sku))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, f"SKU '{sku}' already exists in your organization")


def commit_or_409(db: Session, sku: str) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f"SKU '{sku}' already exists in your organization")


@router.get("", response_model=list[ProductOut])
def list_products(
    search: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Product).where(Product.organization_id == user.organization_id)
    if search and search.strip():
        term = search.strip()
        stmt = stmt.where(
            or_(Product.name.icontains(term, autoescape=True), Product.sku.icontains(term, autoescape=True))
        )
    products = db.scalars(stmt.order_by(Product.name, Product.id)).all()
    default = user.organization.default_low_stock_threshold
    return [to_out(p, default) for p in products]


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate, user: User = Depends(require_role("owner")), db: Session = Depends(get_db)
):
    ensure_sku_free(db, user.organization_id, payload.sku)
    product = Product(**payload.model_dump(), organization_id=user.organization_id, last_updated_by=user.id)
    db.add(product)
    commit_or_409(db, payload.sku)
    db.refresh(product)
    return to_out(product, user.organization.default_low_stock_threshold)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = get_org_product(db, user, product_id)
    return to_out(product, user.organization.default_low_stock_threshold)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    product = get_org_product(db, user, product_id)
    data = payload.model_dump(exclude_unset=True)
    if "sku" in data and data["sku"] != product.sku:
        ensure_sku_free(db, user.organization_id, data["sku"])
    for field, value in data.items():
        setattr(product, field, value)
    product.last_updated_by = user.id
    product.updated_at = datetime.now(timezone.utc)
    commit_or_409(db, data.get("sku", product.sku))
    db.refresh(product)
    return to_out(product, user.organization.default_low_stock_threshold)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, user: User = Depends(require_role("owner")), db: Session = Depends(get_db)
):
    product = get_org_product(db, user, product_id)
    db.delete(product)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{product_id}/adjust-stock", response_model=ProductOut)
def adjust_stock(
    product_id: int,
    payload: StockAdjust,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    product = get_org_product(db, user, product_id)
    new_qty = product.quantity_on_hand + payload.delta
    if new_qty < 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cannot remove {abs(payload.delta)}: only {product.quantity_on_hand} on hand",
        )
    # `note` is accepted for the client's convenience but not persisted (stock history is out of scope).
    product.quantity_on_hand = new_qty
    product.last_updated_by = user.id
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return to_out(product, user.organization.default_low_stock_threshold)

