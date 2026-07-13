# API Documentation

The full OpenAPI/Swagger documentation is hosted live at:
`/api-docs`

It covers all request schemas, required query parameters, authentication instructions, and expected response payloads (including Error formats and Pagination schemas).

## Frontend Integration

For a comprehensive guide on how the frontend team should utilize these endpoints to power the LoraFilm Admin movie-import workflow (specifically the `bundle` endpoint), please refer to:
[docs/FRONTEND_INTEGRATION.md](./docs/FRONTEND_INTEGRATION.md)

## Error Codes
The API surfaces standard internal error codes:
- `VALIDATION_ERROR`
- `INVALID_API_KEY`
- `TMDB_MOVIE_NOT_FOUND`
- `TMDB_RESOURCE_NOT_FOUND`
- `TMDB_UNAUTHORIZED`
- `TMDB_FORBIDDEN`
- `TMDB_RATE_LIMITED`
- `TMDB_UNAVAILABLE`
- `TMDB_TIMEOUT`
- `TMDB_BAD_RESPONSE`
- `INTERNAL_SERVER_ERROR`
