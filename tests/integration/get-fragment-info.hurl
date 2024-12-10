# tests/integration/get-fragment-info.hurl

# POST a fragment to test info retrieval
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Fragment info`

HTTP/1.1 201
[Captures]
url: header "Location"

# GET the fragment info by its ID
GET {{url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{32}$"
jsonpath "$.fragment.type" == "text/plain"

# GET the fragment info as an unauthenticated user
GET {{url}}/info

HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"

# Attempt to GET info for a non-existent fragment
GET http://localhost:8080/v1/fragments/non-existent-id/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment not found"
