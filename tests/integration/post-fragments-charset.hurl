# tests/integration/post-fragments-charset.hurl

# POST with Content-Type including charset
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`This is a fragment with charset!`

# Expect HTTP 201 response
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"

# Capture Location URL
[Captures]
url: header "Location"

# GET same fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "This is a fragment with charset!"
