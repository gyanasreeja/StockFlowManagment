from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProductCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    quantity_on_hand: int = Field(default=0, ge=0)
    cost_price: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    selling_price: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)


class ProductUpdate(BaseModel):
    """PUT body: any field may be omitted; omitted fields are left unchanged."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    quantity_on_hand: Optional[int] = Field(default=None, ge=0)
    cost_price: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    selling_price: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def required_fields_not_null(self):
        for f in ("name", "sku", "quantity_on_hand"):
            if f in self.model_fields_set and getattr(self, f) is None:
                raise ValueError(f"{f} cannot be null")
        return self


class StockAdjust(BaseModel):
    delta: int
    note: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def non_zero(self):
        if self.delta == 0:
            raise ValueError("delta must not be zero")
        return self


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    description: Optional[str]
    quantity_on_hand: int
    cost_price: Optional[float]
    selling_price: Optional[float]
    low_stock_threshold: Optional[int]
    effective_low_stock_threshold: int
    is_low_stock: bool
    last_updated_by: Optional[int]
    created_at: datetime
    updated_at: datetime

