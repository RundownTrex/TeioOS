from pydantic import BaseModel

class BaseFilterParams(BaseModel):
    """
    Base class for endpoint-specific filter parameters.
    Endpoints should subclass this and add their specific fields.
    """
    
    def to_dict(self) -> dict:
        """
        Converts the filter parameters to a dictionary, excluding None values
        and unset fields, perfectly formatted for the Repository layer.
        """
        return self.model_dump(exclude_unset=True, exclude_none=True)
