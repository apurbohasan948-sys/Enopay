# Security Specification - SMS Transaction Organizer

## Data Invariants
1. A message must belong to a user (`users/{userId}/messages/{messageId}`).
2. A user can only read and write their own messages.
3. The `category` must be one of: "bKash", "Nagad", "Others".
4. `timestamp` must be the server time of the request.
5. All IDs must be valid alphanumeric strings.

## The Dirty Dozen Payloads (Red Team Test Cases)

### 1. Identity Spoofing
Try to write a message to another user's subcollection.
```json
// Path: users/victim_uid/messages/msg_id
{
  "sender": "123",
  "body": "bKash Cash In",
  "category": "bKash",
  "timestamp": "request.time"
}
```
**Expected Outcome:** PERMISSION_DENIED (Auth UID mismatch)

### 2. Invalid Category
Attempt to inject a fake category.
```json
{
  "sender": "123",
  "body": "bKash Cash In",
  "category": "FakeBank",
  "timestamp": "request.time"
}
```
**Expected Outcome:** PERMISSION_DENIED (Enum validation failed)

### 3. PII Leak (Unauthorized Read)
Try to read another user's messages.
```json
// Path: users/victim_uid/messages
```
**Expected Outcome:** PERMISSION_DENIED (Auth UID mismatch)

### 4. Timestamp Tampering
Try to set a message long in the past.
```json
{
  "sender": "123",
  "body": "bKash",
  "category": "bKash",
  "timestamp": 123456789
}
```
**Expected Outcome:** PERMISSION_DENIED (Must match request.time)

### 5. Massive Payload (Denial of Wallet)
Inject a message with a 1MB body or sender.
```json
{
  "sender": "A".repeat(10000),
  "body": "B".repeat(100000),
  "category": "Others",
  "timestamp": "request.time"
}
```
**Expected Outcome:** PERMISSION_DENIED (Size constraints)

### 6. Shadow Update (Ghost Field)
Update a message with an undocumented field.
```json
{
  "isVerified": true
}
```
**Expected Outcome:** PERMISSION_DENIED (affectedKeys().hasOnly() violation)

### 7. TrxID Format Poisoning
Inject a TrxID with malicious script characters.
```json
{
  "trxId": "<script>alert(1)</script>"
}
```
**Expected Outcome:** PERMISSION_DENIED (isValidId / Regex constraint)

### 8. Immutable Fields
Try to change the `sender` of an existing message.
```json
{
  "sender": "999"
}
```
**Expected Outcome:** PERMISSION_DENIED (Must match existing data)

### 9. Resource Exhaustion (ID Poisoning)
Write a document with a 2KB long ID.
```json
// Path: users/userId/messages/X.repeat(2048)
```
**Expected Outcome:** PERMISSION_DENIED (isValidId size constraint)

### 10. Blanket List Query
Attempt to list all messages in the `messages` collection group (if enabled) without filtering.
```json
// Query: collectionGroup('messages')
```
**Expected Outcome:** PERMISSION_DENIED (No global blanket read)

### 11. Orphaned Write
Attempt to write a message where the parent user profile doesn't exist (if I had a user collection).
**Note:** In this case, I'll just check for user auth existence.

### 12. Self-Role Escalation
Attempt to set `isAdmin: true` on an object that doesn't expect it.
**Expected Outcome:** PERMISSION_DENIED (Keys validation)
