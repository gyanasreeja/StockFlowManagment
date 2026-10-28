"""Low-stock logic. This is the single source of truth used by every endpoint."""
from typing import Optional


def effective_threshold(product_threshold: Optional[int], org_default: int) -> int:
    """Product-level threshold wins; NULL means 'use the organization default'."""
    return product_threshold if product_threshold is not None else org_default


def is_low_stock(quantity_on_hand: int, product_threshold: Optional[int], org_default: int) -> bool:
    return quantity_on_hand <= effective_threshold(product_threshold, org_default)

