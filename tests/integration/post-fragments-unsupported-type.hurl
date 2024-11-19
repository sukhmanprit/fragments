# tests/integration/post-fragments-unsupported-type.hurl

# POST with unsupported Content-Type
POST http://localhost:8080/v1/fragments
Content-Type: application/xml
[BasicAuth]
user1@email.com:password1
`<fragment>Fragment is unsupported type</fragment>`

# Expect HTTP 415
HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" == "Unsupported Media Type"
