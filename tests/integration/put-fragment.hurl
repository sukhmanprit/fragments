# tests/integration/put-fragment.hurl

# POST a fragment to update
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Original fragment`

HTTP/1.1 201
[Captures]
url: header "Location"

# PUT to update the fragment content
PUT {{url}}
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Updated fragment`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{32}$"
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.size" == 16 # Corrected to match "Updated fragment" length

# PUT with mismatched Content-Type
PUT {{url}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"data": "Invalid type update"}`

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400
jsonpath "$.error.message" matches "Content-Type mismatch.*"

# PUT as an unauthenticated user
PUT {{url}}
Content-Type: text/plain

HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"