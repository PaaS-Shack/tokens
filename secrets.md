# Using the Moleculer.js Secrets Service

## Introduction

The Moleculer.js Secrets Service is a powerful microservice designed for managing and encrypting sensitive information such as passwords, tokens, keys, certificates, and other secrets in a secure and organized manner. This service is part of the Moleculer microservices framework and offers a range of actions and functionalities to facilitate secret management.

In this guide, we'll walk you through the process of using the Moleculer.js Secrets Service, covering key concepts, actions, and practical examples. Whether you are building a microservices-based application or need a secure way to manage secrets in your projects, this guide will help you get started with the Secrets Service.

**Table of Contents**

1. [Installation](#installation)
2. [Service Configuration](#service-configuration)
3. [Basic Usage](#basic-usage)
   - [Encrypting a Secret](#encrypting-a-secret)
   - [Decrypting a Secret](#decrypting-a-secret)
4. [Advanced Usage](#advanced-usage)
   - [Updating a Secret](#updating-a-secret)
   - [Rotating a Secret](#rotating-a-secret)
   - [Listing and Deleting Secrets](#listing-and-deleting-secrets)
5. [Integration with Tokens and Configuration](#integration-with-tokens-and-configuration)
6. [Conclusion](#conclusion)

Let's get started by installing and configuring the Moleculer.js Secrets Service.

## 1. Installation <a name="installation"></a>

To begin using the Moleculer.js Secrets Service, you need to have Node.js and the Moleculer CLI installed on your development environment. If you haven't already installed them, you can do so as follows:

```bash
# Install Node.js (if not already installed)
# You can download Node.js from https://nodejs.org/
# Install the Moleculer CLI globally
npm install -g moleculer-cli
```

Next, you can create a new Moleculer.js project or add the Secrets Service to an existing project. Let's create a new Moleculer.js project as an example:

```bash
# Create a new Moleculer.js project
moleculer init project-name
```

Now, let's move on to configuring the Secrets Service.

## 2. Service Configuration <a name="service-configuration"></a>

The Moleculer.js Secrets Service comes with default configuration settings, but you can customize these settings based on your application's requirements. Configuration options such as encryption algorithms, default key values, and more can be adjusted to fit your needs.

You can find the service configuration in the `secrets.service.js` file within your Moleculer.js project. Modify the configuration settings as necessary to align with your application's security and secret management policies.

Now that you have configured the Secrets Service, let's explore basic usage.

## 3. Basic Usage <a name="basic-usage"></a>

### Encrypting a Secret <a name="encrypting-a-secret"></a>

To encrypt a secret using the Moleculer.js Secrets Service, you can use the `encrypt` action. This action takes several parameters to specify the secret's details, including its name, value, type, and encryption algorithm.

#### Parameters

| Field       | Type    | Options                                                                                                 |
|-------------|---------|---------------------------------------------------------------------------------------------------------|
| name        | string  | min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i                                                             |
| value       | string  | min: 3, max: 1024                                                                                       |
| description | string  | min: 3, max: 1024, optional: true                                                                     |
| type        | string  | enum: ["password", "token", "key", "certificate", "other"], default: "other", optional: true        |
| algorithm   | string  | enum: ["aes256", "aes192", "aes128", "des3", "rc4"], default: "aes256", optional: true             |
| key         | string  | default: "password", optional: true                                                                  |
| iv          | string  | default: "", optional: true                                                                           |
| salt        | string  | default: "", optional: true                                                                           |
| iterations  | number  | default: 10000, optional: true                                                                        |
| length      | number  | default: 32, optional: true                                                                           |
| digest      | string  | enum: ["sha256", "sha512", "sha1", "md5"], default: "sha256", optional: true                       |
| encoding    | string  | enum: ["hex", "base64", "utf8"], default: "hex", optional: true                                       |
| format      | string  | enum: ["raw", "hex", "base64", "utf8"], default: "raw", optional: true                               |
| expiration  | date    | optional: true                                                                                         |


Here's an example of how to use the `encrypt` action to encrypt a password:

```javascript
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

broker.start().then(async () => {
  try {
    const encryptedSecret = await broker.call("v1.secrets.encrypt", {
      name: "my-secret",
      value: "my-password",
      type: "password",
      algorithm: "aes256",
      key: "my-secret-key",
    });

    console.log("Encrypted Secret:", encryptedSecret);
  } catch (error) {
    console.error("Error encrypting secret:", error.message);
  }
});
```

### Decrypting a Secret <a name="decrypting-a-secret"></a>

Once you have encrypted a secret, you can decrypt it using the `decrypt` action. This action requires the name of the secret and the key used for encryption.

#### Parameters


| Field       | Type    | Options                                                                                                 |
|-------------|---------|---------------------------------------------------------------------------------------------------------|
| name        | string  | min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i                                                             |
| value       | string  | min: 3, max: 1024                                                                                       |


Here's how you can decrypt a previously encrypted secret:

```javascript
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker();

broker.start().then(async () => {
  try {
    const decryptedSecret = await broker.call("v1.secrets.decrypt", {
      name: "my-secret",
      key: "my-secret-key",
    });

    console.log("Decrypted Secret:", decryptedSecret);
  } catch (error) {
    console.error("Error decrypting secret:", error.message);
  }
});
```

With these basic usage examples, you can encrypt and decrypt secrets securely. In the next section, we'll explore more advanced functionalities of the Moleculer.js Secrets Service.

## 4. Advanced Usage <a name="advanced-usage"></a>

### Updating a Secret <a name="updating-a-secret"></a>

To update a secret's value, description, or expiration date, you can use the `update` action. This action allows you to modify existing secrets while preserving their unique names and other attributes.

#### Parameters

| Field       | Type    | Options                                                                                                 |
|-------------|---------|---------------------------------------------------------------------------------------------------------|
| name        | string  | min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i                                                           |
| value       | string  | min: 3, max: 1024, optional: true                                                                     |
| description | string  | min: 3, max: 1024, optional: true                                                                     |
| key         | string  | default: "password", optional: true                                                                  |
| expiration  | date    | optional: true                                                                                         |


Here's an example of updating a secret:

```javascript
// Update the "my-secret" with a new value and description
const updatedSecret = await broker.call("v1.secrets.update", {
  name: "my-secret",
  value: "new-password",
  description: "Updated password for my service",
});
```

### Rotating a Secret <a name="rotating-a-secret"></a>

Secret rotation is a crucial security practice. You can rotate a secret by decrypting it with the existing key and then re-encrypting it with a new key. The `rotate` action simplifies this process:

#### Parameters

| Field       | Type    | Options                                                                                                 |
|-------------|---------|---------------------------------------------------------------------------------------------------------|
| name        | string  | min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i                                                           |
| key         | string  | default: "password", optional: true                                                                  |
| newKey      | string  | default: "password", optional: true                                                                  |
| expiration  | date    | optional: true                                                                                         |

Here's an example of rotating a secret:

```javascript
// Rotate the "my-secret" by changing the encryption key
const rotatedSecret = await broker.call("v1.secrets.rotate", {
  name: "my-secret",
  key: "old-secret-key",
  newKey: "new-secret-key",
});
```

### Listing and Deleting Secrets <a name="listing-and-deleting-secrets"></a>

The Moleculer.js Secrets Service provides actions for listing and deleting secrets. You can list secrets based on various filters such as type, algorithm, format, and encoding using the `list` action:

#### Parameters

| Field       | Type    | Options                                                                                                 |
|-------------|---------|---------------------------------------------------------------------------------------------------------|
| type        | string  | enum: ["password", "token", "key", "certificate", "other"], default: "other", optional: true        |
| algorithm   | string  | enum: ["aes256", "aes192", "aes128", "des3", "rc4"], default: "aes256", optional: true             |
| format      | string  | enum: ["raw", "hex", "base64", "utf8"], default: "raw", optional: true                               |
| encoding    | string  | enum: ["hex", "base64", "utf8"], default: "hex", optional: true                                       |

Here's an example of listing secrets:

```javascript
// List all secrets of type "password" with AES encryption
const secretsList = await broker.call("v1.secrets.list", {
  type: "password",
  algorithm: "aes256",
});
```

To delete a secret by its name, you can use the `delete` action:

#### Parameters

| Field       | Type    | Options                                                                                                 |
|-------------|---------|---------------------------------------------------------------------------------------------------------|
| name        | string  | min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i                                                           |

Here's an example of deleting a secret:

```javascript
// Delete the "my-secret" by name
const deletedSecret = await broker.call("v1.secrets.delete

", {
  name: "my-secret",
});
```

These advanced usage examples demonstrate how to update, rotate, list, and delete secrets as needed in your application.

## 5. Integration with Tokens and Configuration <a name="integration-with-tokens-and-configuration"></a>

The Moleculer.js Secrets Service can integrate with other services like "tokens" and "config" to enhance secret management capabilities. By combining these services, you can securely manage secrets, access tokens, and configuration values in a comprehensive manner.

To integrate with these services, follow the documentation and guides for setting up the "tokens" and "config" services, and configure them accordingly.

## 6. Conclusion <a name="conclusion"></a>

The Moleculer.js Secrets Service is a valuable tool for managing and securing sensitive information within your microservices-based applications. By following this guide, you've learned how to install, configure, and use this service to encrypt, decrypt, update, and rotate secrets as well as integrate it with other services like "tokens" and "config."

Remember to follow security best practices when working with secrets and encryption keys to ensure the confidentiality and integrity of your application's sensitive data.