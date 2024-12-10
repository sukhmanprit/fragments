# tests/integration/get-fragments.hurl

# Authenticated GET request to fetch all fragments
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Expect HTTP 200 OK with a JSON array of fragments
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" exists
jsonpath "$.fragments[*]" exists # Ensure the array exists and may contain elements

# Unauthenticated GET request to fetch fragments
GET http://localhost:8080/v1/fragments

# Expect HTTP 401 Unauthorized
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"

