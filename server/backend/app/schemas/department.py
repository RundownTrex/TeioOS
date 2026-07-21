from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class DepartmentBase(BaseModel):
    name: str = Field(..., max_length=255, description="Name of the department")

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, max_length=255, description="Name of the department")

class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
