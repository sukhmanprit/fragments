# tests/integration/lab-9-s3.hurl

# 1: POST a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

# 2: Expect HTTP 201 Created and capture location Header
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{32}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 9 # "Hello S3!" is 8 characters
[Captures]
url: header "Location"

# 3: GET the fragment just created using url as an authorized user
GET {{url}}
[BasicAuth]
user1@email.com:password1

# 4: Expect HTTP 200 OK with correct content
HTTP/1.1 200
Content-Type: text/plain
Content-Length: 9
[Asserts]
body == "Hello S3!"

# 5: DELETE the fragment using the url as an authorized user
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# 6: Expect HTTP 200 OK
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 7: Try to GET the deleted fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

# 8: Expect HTTP 404 Not Found
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" matches "^Fragment with ID [A-Za-z0-9_-]+ not found: Fragment not found for id: [A-Za-z0-9_-]+$"
