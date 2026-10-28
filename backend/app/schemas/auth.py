from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    confirm_password: str
    organization_name: str = Field(min_length=1, max_length=255)

    @field_validator("organization_name")
    @classmethod
    def strip_org_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Organization name is required")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    default_low_stock_threshold: int


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    role: str
    organization: OrganizationOut


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

