# Using the Moleculer.js "tokens" Service

## Introduction

Moleculer.js is a modern, fast, and powerful microservices framework for Node.js. It simplifies building efficient and scalable microservices by providing a set of features and tools out of the box. One of the key features of Moleculer.js is the ability to create and manage microservices with ease.

The "tokens" service is a commonly used component in many microservices architectures. It is responsible for generating, validating, and managing various types of tokens, such as verification tokens, passwordless tokens, password reset tokens, and API keys. Tokens play a crucial role in securing APIs, implementing authentication and authorization mechanisms, and enabling secure communication between microservices.

This guide will walk you through the usage of the "tokens" service in Moleculer.js, explaining its key functionalities, actions, and how to integrate it into your microservices application.

## Prerequisites

Before you can use the "tokens" service, make sure you have the following prerequisites in place:

1. **Node.js**: Ensure you have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

2. **Moleculer.js**: You should have a Moleculer.js project set up. If you haven't already, you can create a new Moleculer.js project using the Moleculer CLI:

   ```bash
   npm install -g moleculer-cli
   moleculer create my-project
   ```

3. **Environment Variable**: The "tokens" service relies on an environment variable called `TOKEN_SALT` for securing tokens. Make sure you have this environment variable defined with a strong, secret value.

## Getting Started with the "tokens" Service

### 1. Service Configuration

The "tokens" service should already be included in your Moleculer.js project as a part of your microservices architecture. You can typically find its configuration in your `services` folder.


### 2. Generating Tokens

You can use the "generate" action of the "tokens" service to generate new tokens. The action allows you to specify the token type, expiry time, and owner ID. Here's an example of how to generate a new token:

### Parameters

| Field  | Type   | Options                                                |
|--------|--------|--------------------------------------------------------|
| type   | enum   | values: ["verification", "passwordless", "password-reset", "api-key"] |
| expiry | number | integer: true, optional: true                        |
| owner  | string |                                                        |

Here's an example of how to generate a new token:

```javascript
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

// Call the "generate" action
broker.call("tokens.generate", {
	type: "verification", // Specify the token type
	expiry: 3600, // Specify the expiry time in seconds
	owner: "user123" // Specify the owner ID
}).then(token => {
	console.log("Generated token:", token);
});
```

### 3. Checking Tokens

You can use the "check" action of the "tokens" service to check if a token is valid and not expired. Additionally, you can choose to update the "lastUsedAt" field when checking a token. Here's an example of how to check a token:

### Parameters

| Field  | Type   | Options                                                |
|--------|--------|--------------------------------------------------------|
| type   | enum   | values: ["verification", "passwordless", "password-reset", "api-key"] |
| expiry | number | integer: true, optional: true                        |
| owner  | string |                                                        |
| isUsed | boolean | default: false, optional: true |

Here's an example of how to check a token:

```javascript
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

// Call the "check" action
broker.call("tokens.check", {
	type: "verification", // Specify the token type
	token: "your-token-value", // Replace with the actual token value
	owner: "user123", // Specify the owner ID
	isUsed: true // Update the "lastUsedAt" field
}).then(token => {
	if (token) {
		console.log("Token is valid:", token);
	} else {
		console.log("Token is invalid or expired.");
	}
});
```

### 4. Removing Tokens

To remove an invalidated token, you can use the "remove" action of the "tokens" service. Provide the token type and the token value you want to remove. Here's an example:

### Parameters

| Field  | Type   | Options                                                |
|--------|--------|--------------------------------------------------------|
| type   | enum   | values: ["verification", "passwordless", "password-reset", "api-key"] |
| token  | string |                                                        |

Here's an example of how to remove a token:

```javascript
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

// Call the "remove" action
broker.call("tokens.remove", {
	type: "verification", // Specify the token type
	token: "your-token-value" // Replace with the actual token value to remove
}).then(removedToken => {
	if (removedToken) {
		console.log("Removed token:", removedToken);
	} else {
		console.log("Token not found or could not be removed.");
	}
});
```

### 5. Automatically Clearing Expired Tokens

The "tokens" service includes a built-in cron job that automatically clears expired tokens from the database. You don't need to manually trigger this action. It runs at midnight every day by default.

## Conclusion

The "tokens" service in Moleculer.js provides essential token management functionalities for securing your microservices and applications. You can use it to generate, validate, and manage various types of tokens, making it a valuable component of your microservices architecture.

By following the steps outlined in this guide, you can easily integrate and use the "tokens" service within your Moleculer.js project, enhancing the security and functionality of your microservices applications.