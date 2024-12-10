# tests/integration/get-fragment-by-id.hurl

# Create a new fragment to test retrieval by ID
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Fragment`

# Expect HTTP 201 Created and capture the Location header
HTTP/1.1 201
[Captures]
url: header "Location"

# GET the fragment by its ID as an authenticated user
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Expect HTTP 200 OK with correct content type and body
HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain"
body == "Fragment"

# GET the fragment by its ID as an unauthenticated user
GET {{url}}

# Expect HTTP 401 Unauthorized
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"

# Attempt to GET a non-existent fragment
GET http://localhost:8080/v1/fragments/non-existent-id
[BasicAuth]
user1@email.com:password1

# Expect HTTP 404 Not Found
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" matches "Fragment with ID non-existent-id not found.*"
