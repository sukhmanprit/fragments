# POST to /v1/fragments with JSON Content-Type
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"message": "This is a JSON fragment"}`

# Expect HTTP 201 response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"

# Capture Location URL
[Captures]
url: header "Location"

# GET same fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json
[Asserts]
body == "{\"message\": \"This is a JSON fragment\"}"
