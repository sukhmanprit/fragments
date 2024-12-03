# tests/integration/lab-9-dynamodb.hurl

# 1: POST a new JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"service": "DynamoDB"}`

# 2: Expect HTTP 201 Created and capture Location and id
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.fragment.id" exists
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{32}$"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 23
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 3.1: GET the metadata for the first fragment
GET http://localhost:8080/v1/fragments/{{fragment1_id}}/info
[BasicAuth]
user1@email.com:password1

# 3.2: Expect HTTP 200 and validate metadata
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 23
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# 4: POST a new Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# 5: Expect HTTP 201 Created and capture Location and id
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{32}$"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6.1: GET the metadata for the second fragment
GET http://localhost:8080/v1/fragments/{{fragment2_id}}/info
[BasicAuth]
user1@email.com:password1

# 6.2: Expect HTTP 200 and validate metadata
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# 7.1: GET all fragments for the user without expanding
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# 7.2: Expect HTTP 200 and confirm both IDs are present
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
body matches "{{fragment1_id}}"
body matches "{{fragment2_id}}"

# 8: DELETE the first fragment we created above
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 9: Expect HTTP 200 from server
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 10: Try to GET the deleted fragment
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 11: Expect HTTP 404 Not Found
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" matches "^Fragment with ID [A-Za-z0-9_-]+ not found: Fragment not found for id: [A-Za-z0-9_-]+$"

# 12.1: GET all fragments for the user without expanding
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# 12.2: Expect HTTP 200 and confirm only the second ID is present
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
body not matches "{{fragment1_id}}"
body matches "{{fragment2_id}}"
