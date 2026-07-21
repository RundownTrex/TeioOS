from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class ClassBase(BaseModel):
    name: str = Field(..., max_length=255, description="Name of the class")
    semester: int = Field(..., ge=1, description="Semester number")
    section: str = Field(..., max_length=50, description="Section identifier")
    department_id: UUID = Field(..., description="ID of the associated department")

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: str | None = Field(None, max_length=255, description="Name of the class")
    semester: int | None = Field(None, ge=1, description="Semester number")
    section: str | None = Field(None, max_length=50, description="Section identifier")
    department_id: UUID | None = Field(None, description="ID of the associated department")

class ClassResponse(ClassBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
