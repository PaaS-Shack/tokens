[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)
## Tokens Service

### Service Configuration

- Name: tokens
- Version: 1

### Dependencies

- None

### Service Settings

- Fields:
  - type:
    - Type: enum
    - Values: C.TOKEN_TYPES
    - Required: true
  - name:
    - Type: string
    - Max length: 255
  - token:
    - Type: string
    - Required: true
  - expiry:
    - Type: number
    - Integer: true
  - owner:
    - Type: string
    - Required: true
  - createdAt:
    - Type: number
    - Readonly: true
    - onCreate: () => Date.now()
  - lastUsedAt:
    - Type: number
    - Readonly: true
    - Hidden: byDefault

- Indexes:
  - token (unique)
  - type, token
  - type, owner
  - expiry

### Crons

- ClearExpiredTokens:
  - Name: "ClearExpiredTokens"
  - CronTime: "0 0 * * * *"
  - OnTick:
    - Action: "v1.tokens.clearExpired"

### Actions

#### generate

- Params:
  - type:
    - Type: enum
    - Values: C.TOKEN_TYPES
  - expiry:
    - Type: number
    - Integer: true
    - Optional: true
  - owner:
    - Type: string

- Handler:
  - Generates a new token using `generateToken` method.
  - Creates a new entity with the generated token and other parameters.
  - Returns the response with the generated token.

#### check

- Params:
  - type:
    - Type: enum
    - Values: C.TOKEN_TYPES
  - token:
    - Type: string
  - owner:
    - Type: string
    - Optional: true
  - isUsed:
    - Type: boolean
    - Default: false

- Handler:
  - Finds an entity with the specified type and secure token.
  - Validates the owner if provided.
  - Checks the expiry of the token.
  - Updates the `lastUsedAt` field if `isUsed` is true.
  - Returns the entity if valid, otherwise null.

#### remove

- Params:
  - type:
    - Type: enum
    - Values: C.TOKEN_TYPES
  - token:
    - Type: string

- Handler:
  - Finds an entity with the specified type and secure token.
  - Removes the entity if found.
  - Returns null.

#### clearExpired

- Visibility: protected

- Handler:
  - Removes expired tokens from the database.
  - Logs the count of removed tokens.

### Events

- None

### Methods

#### generateToken

- Parameters: len (number)
- Returns an object containing the generated token and its secure version.

#### secureToken

- Parameters: token (string)
- Returns the secure version of the token using HMAC with a salt.

### Lifecycle Hooks

- created: Checks if the environment variable 'TOKEN_SALT' is configured.
- started: No implementation.
- stopped: No implementation.
