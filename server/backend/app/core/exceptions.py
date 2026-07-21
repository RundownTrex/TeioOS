"""
Domain-level exceptions for the backend layer.

These exceptions decouple services from HTTP transport. Services raise these;
global exception handlers catch them and translate into appropriate HTTP responses.
"""


class AuthenticationException(Exception):
    """Raised when credentials are invalid (wrong username, password, etc.)."""
    def __init__(self, detail: str = "Incorrect credentials"):
        self.detail = detail
        super().__init__(self.detail)


class AuthorizationException(Exception):
    """Raised when a user lacks permission for the requested action."""
    def __init__(self, detail: str = "Not enough permissions"):
        self.detail = detail
        super().__init__(self.detail)


class NotFoundException(Exception):
    """Raised when a requested resource is not found."""
    def __init__(self, resource_name: str = "Resource"):
        self.detail = f"{resource_name} not found"
        super().__init__(self.detail)


class ConflictException(Exception):
    """Raised when attempting to create a resource that already exists or conflicts."""
    def __init__(self, detail: str = "Resource conflict"):
        self.detail = detail
        super().__init__(self.detail)


class ValidationException(Exception):
    """Raised when user-provided input fails validation at the service layer."""
    def __init__(self, detail: str = "Invalid input"):
        self.detail = detail
        super().__init__(self.detail)


class BusinessRuleException(Exception):
    """Raised when a specific domain/business rule is violated (e.g. Exam not available)."""
    def __init__(self, detail: str = "Business rule violation"):
        self.detail = detail
        super().__init__(self.detail)
