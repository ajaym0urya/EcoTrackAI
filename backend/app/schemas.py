from pydantic import BaseModel, Field
from typing import Literal

class UtilityExtractionResponse(BaseModel):
    """
    Structured schema for utility bill consumption extraction.
    Ensures exact key names and valid categories.
    """
    utility_type: Literal["electricity", "gas", "water"] = Field(
        ...,
        description="The type of utility. Must be one of: electricity, gas, water."
    )
    consumption_value: float = Field(
        ...,
        gt=0,
        description="The numeric consumption value (e.g. 350.5). Must be a positive number."
    )
    unit: str = Field(
        ...,
        description="The exact unit of measurement (e.g. kWh, therms, ccf, gallons, m3)."
    )
    billing_period_start: str = Field(
        ...,
        description="The starting date of the billing period in ISO format (YYYY-MM-DD). If missing, return empty string."
    )
    billing_period_end: str = Field(
        ...,
        description="The ending date of the billing period in ISO format (YYYY-MM-DD). If missing, return empty string."
    )

class ErrorResponse(BaseModel):
    """Standard API error response wrapper."""
    error: str = Field(..., description="Details regarding the failure or exception.")
