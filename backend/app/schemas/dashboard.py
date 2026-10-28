from pydantic import BaseModel, Field


class LowStockItem(BaseModel):
    name: str
    sku: str
    quantity_on_hand: int
    low_stock_threshold: int


class DashboardOut(BaseModel):
    total_products: int
    total_quantity_on_hand: int
    low_stock_items: list[LowStockItem]


class SettingsOut(BaseModel):
    default_low_stock_threshold: int


class SettingsUpdate(BaseModel):
    default_low_stock_threshold: int = Field(ge=0)

