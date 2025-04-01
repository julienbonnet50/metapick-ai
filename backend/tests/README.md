# Testing Framework for Brawl Stars App

This directory contains tests for the Brawl Stars application, ensuring the API endpoints work as expected.

## Test Structure

The tests are organized as follows:

- `test_app.py`: Unit tests for individual API endpoints
- `test_integration.py`: Integration tests that verify multiple endpoints working together
- `conftest.py`: Pytest fixtures and configuration

## Running the Tests

### Locally

To run the tests locally:

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest

# Run with coverage report
pytest --cov=.

# Run specific test file
pytest tests/test_app.py -v
```

### Via GitHub Actions

Tests run automatically on:
- Push to main/master/dev branches
- Pull requests to main/master branches

## Test Coverage

The test suite covers:

1. **API Endpoint Validation**
   - All endpoints return expected status codes
   - JSON responses have the correct structure

2. **Core Functionality**
   - Brawler recommendations
   - Win rate predictions
   - Tier list information
   - Player account data

3. **Error Handling**
   - Tests for proper error responses
   - Validates error messages

## Adding New Tests

When adding new features to the application:

1. Add unit tests in `test_app.py` for individual functionality
2. Add integration tests in `test_integration.py` for workflows that span multiple endpoints
3. Update the fixtures in `conftest.py` if needed

## Mocking

The tests use mocking to avoid dependencies on:
- Neural network model
- External APIs
- Database connections

This ensures tests run quickly and don't require external resources.