"use strict";
const DbService = require("db-mixin");
const ConfigLoader = require("config-mixin");
const crypto = require('crypto');

/**
 * Secrets service for storing encrypted secrets
 * 
 */
module.exports = {
	name: "secrets",
	version: 1,

	mixins: [
		DbService({
			createActions: false
		}),
		ConfigLoader(['secrets.**']),
	],

	/**
	 * Settings
	 */
	settings: {
		rest: false,

		fields: {

			// the secret name
			name: {
				type: "string",
				unique: true,
				trim: true,
				lowercase: true,
				required: true,
				min: 3,
				max: 64,
				pattern: /^[a-z0-9\-_]+$/i,
				index: true
			},

			// the secret value
			value: {
				type: "string",
				required: true,
				min: 3,
				max: 1024,
				trim: true,
				index: true
			},

			// the secret description
			description: {
				type: "string",
				trim: true,
				max: 1024,
				index: true
			},

			// the secret tags
			tags: {
				type: "array",
				items: "string",
				index: true
			},

			// the secret type
			type: {
				type: "string",
				enum: ["password", "token", "key", "certificate", "other"],
				default: "other",
				index: true
			},

			// the secret algorithm
			algorithm: {
				type: "string",
				enum: ["aes256", "aes192", "aes128", "des3", "rc4"],
				default: "aes256",
				index: true
			},

			// the secret key
			key: {
				type: "string",
				default: "password",
				index: true
			},

			// the secret iv
			iv: {
				type: "string",
				default: "",
				index: true
			},

			// the secret salt
			salt: {
				type: "string",
				default: "",
				index: true
			},

			// the secret iterations
			iterations: {
				type: "number",
				default: 10000,
				index: true
			},

			// the secret length
			length: {
				type: "number",
				default: 32,
				index: true
			},

			// the secret digest
			digest: {
				type: "string",
				enum: ["sha256", "sha512", "sha1", "md5"],
				default: "sha256",
				index: true
			},

			// the secret encoding
			encoding: {
				type: "string",
				enum: ["hex", "base64", "utf8"],
				default: "hex",
				index: true
			},

			// the secret format
			format: {
				type: "string",
				enum: ["raw", "hex", "base64", "utf8"],
				default: "raw",
				index: true
			},

			//the secret expiration date
			expiration: {
				type: "date",
				index: true
			},



			...DbService.FIELDS
		},

		defaultPopulates: [],

		scopes: {
			...DbService.SCOPE
		},

		defaultScopes: [...DbService.DSCOPE],


		// default config values
		config: {
			"secrets.algorithm": "aes256",// or any other algorithm supported by OpenSSL
			"secrets.key": "password",//please change this v1.config.set --key=secrets.key --value=yourpassword
		}
	},

	/**
	 * Dependencies
	 */
	dependencies: [{
		name: "tokens",
		vertion: 1
	}],

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Encrypt a secret
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * @param {String} value - the secret value
		 * @param {String} description - the secret description
		 * @param {String} type - the secret type
		 * @param {String} algorithm - the secret algorithm
		 * @param {String} key - the secret key
		 * @param {String} iv - the secret iv
		 * @param {String} salt - the secret salt
		 * @param {Number} iterations - the secret iterations
		 * @param {Number} length - the secret length
		 * @param {String} digest - the secret digest
		 * @param {String} encoding - the secret encoding
		 * @param {String} format - the secret format
		 * @param {Date} expiration - the secret expiration date
		 * 
		 * @returns {Object} - the encrypted secret
		 */
		encrypt: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
				value: { type: "string", min: 3, max: 1024 },
				description: { type: "string", min: 3, max: 1024, optional: true },
				type: { type: "string", enum: ["password", "token", "key", "certificate", "other"], default: "other", optional: true },
				algorithm: { type: "string", enum: ["aes256", "aes192", "aes128", "des3", "rc4"], default: "aes256", optional: true },
				key: { type: "string", default: "password", optional: true },
				iv: { type: "string", default: "", optional: true },
				salt: { type: "string", default: "", optional: true },
				iterations: { type: "number", default: 10000, optional: true },
				length: { type: "number", default: 32, optional: true },
				digest: { type: "string", enum: ["sha256", "sha512", "sha1", "md5"], default: "sha256", optional: true },
				encoding: { type: "string", enum: ["hex", "base64", "utf8"], default: "hex", optional: true },
				format: { type: "string", enum: ["raw", "hex", "base64", "utf8"], default: "raw", optional: true },
				expiration: { type: "date", optional: true },

			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret already exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (found)
					throw new MoleculerClientError("Secret already exists!", 422, "", [{ field: "name", message: "already exists" }]);

				// encrypt the secret
				const encrypted = this.encryptSecret(params);

				//check if the secret is a token or config value and return the value
				const key = await this.checkKey(ctx, params.key);

				// create expression date
				if (params.expiration) {
					params.expiration = new Date(params.expiration);
				} else {
					params.expiration = null;
				}

				// create the secret
				const secret = await this.createEntity(null, {
					name: params.name,
					value: encrypted,
					description: params.description,
					type: params.type,
					algorithm: params.algorithm,
					iv: params.iv,
					salt: params.salt,
					key: key,
					iterations: params.iterations,
					length: params.length,
					digest: params.digest,
					encoding: params.encoding,
					format: params.format,
					expiration: params.expiration,
				});

				// return the secret
				return secret;
			}
		},

		/**
		 * Decrypt a secret
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * @param {String} key - the secret key
		 * 
		 * @returns {Object} - the decrypted secret
		 */
		decrypt: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
				key: { type: "string", default: "password", optional: true },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (!found)
					throw new MoleculerClientError("Secret not found!", 422, "", [{ field: "name", message: "not found" }]);


				//check if the secret is a token or config value and return the value
				const key = await this.checkKey(ctx, params.key);


				// decrypt the secret
				const decrypted = this.decryptSecret({
					encryptedValue: found.value,
					algorithm: found.algorithm,
					key: key,
					iv: found.iv,
					salt: found.salt,
					iterations: found.iterations,
					encoding: found.encoding,
					format: found.format,

				});

				// return the secret
				return decrypted;
			}
		},

		/**
		 * Get a secret
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * 
		 * @returns {Object} - the secret
		 */
		get: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (!found)
					throw new MoleculerClientError("Secret not found!", 422, "", [{ field: "name", message: "not found" }]);

				// return the secret
				return found;
			}
		},

		/**
		 * List secrets
		 * 
		 * @actions
		 * @param {String} type - the secret type
		 * @param {String} algorithm - the secret algorithm
		 * @param {String} format - the secret format
		 * @param {String} encoding - the secret encoding
		 *
		 * @returns {Array} - the secrets
		 */
		list: {
			params: {
				type: { type: "string", enum: ["password", "token", "key", "certificate", "other"], default: "other", optional: true },
				algorithm: { type: "string", enum: ["aes256", "aes192", "aes128", "des3", "rc4"], default: "aes256", optional: true },
				format: { type: "string", enum: ["raw", "hex", "base64", "utf8"], default: "raw", optional: true },
				encoding: { type: "string", enum: ["hex", "base64", "utf8"], default: "hex", optional: true },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// list secrets
				const secrets = await this.findEntities({
					query: {
						type: params.type,
						algorithm: params.algorithm,
						format: params.format,
						encoding: params.encoding,
					},
				});

				// return the secrets
				return secrets;
			}
		},

		/**
		 * Update a secret
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * @param {String} value - the secret value
		 * @param {String} description - the secret description
		 * @param {String} key - the secret key	
		 * @param {Date} expiration - the secret expiration date
		 * 
		 * @returns {Object} - the updated secret
		 */
		update: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
				value: { type: "string", min: 3, max: 1024, optional: true },
				description: { type: "string", min: 3, max: 1024, optional: true },
				key: { type: "string", default: "password", optional: true },
				expiration: { type: "date", optional: true },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (!found)
					throw new MoleculerClientError("Secret not found!", 422, "", [{ field: "name", message: "not found" }]);

				//check if the secret is a token or config value and return the value
				const key = await this.checkKey(ctx, params.key);

				if (params.expiration) {
					params.expiration = new Date(params.expiration);
				} else {
					params.expiration = null;
				}

				// encrypt the secret
				const encrypted = this.encryptSecret({
					value: params.value,
					algorithm: found.algorithm,
					key: key,
					iv: found.iv,
					salt: found.salt,
					iterations: found.iterations,
					length: found.length,
					digest: found.digest,
					encoding: found.encoding,
					format: found.format,

				});

				//remove old secret
				await this.removeEntity(null, {
					id: found.id,
				});

				// create the secret
				const secret = await this.createEntity(null, {
					name: params.name,
					value: encrypted,
					description: params.description,
					type: found.type,
					algorithm: found.algorithm,
					iv: found.iv,
					salt: found.salt,
					key: key,
					iterations: found.iterations,
					length: found.length,
					digest: found.digest,
					encoding: found.encoding,
					format: found.format,
					expiration: found.expiration,
				});

				// return the secret
				return secret;
			}
		},

		/**
		 * Delete a secret
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * 
		 * @returns {Object} - the deleted secret
		 */
		delete: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (!found)
					throw new MoleculerClientError("Secret not found!", 422, "", [{ field: "name", message: "not found" }]);

				// remove the secret
				const secret = await this.removeEntity(null, {
					id: found.id,
				});

				// return the secret
				return secret;
			}
		},

		/**
		 * Delete all secrets
		 * 
		 * @actions
		 * 
		 * @returns {Object} - the deleted secrets
		 */
		deleteAll: {
			async handler(ctx) {
				// remove all secrets
				const secrets = await this.removeEntities();

				// return the secrets
				return secrets;
			}
		},

		/**
		 * Get a secret value
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * 
		 * @returns {Object} - the secret value
		 */
		getValue: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (!found)
					throw new MoleculerClientError("Secret not found!", 422, "", [{ field: "name", message: "not found" }]);

				//check if the secret is a token or config value and return the value
				const key = await this.checkKey(ctx, found.key);

				// decrypt the secret
				const decrypted = this.decryptSecret({
					encryptedValue: found.value,
					algorithm: found.algorithm,
					key: key,
					iv: found.iv,
					salt: found.salt,
					iterations: found.iterations,
					encoding: found.encoding,
					format: found.format,

				});

				// return the secret value
				return decrypted;
			}
		},

		/**
		 * List secret values
		 * 
		 * @actions
		 * @param {String} type - the secret type
		 * @param {String} algorithm - the secret algorithm
		 * @param {String} format - the secret format
		 * @param {String} encoding - the secret encoding
		 * 
		 * @returns {Array} - the secret values
		 */
		listValues: {
			params: {
				type: { type: "string", enum: ["password", "token", "key", "certificate", "other"], default: "other", optional: true },
				algorithm: { type: "string", enum: ["aes256", "aes192", "aes128", "des3", "rc4"], default: "aes256", optional: true },
				format: { type: "string", enum: ["raw", "hex", "base64", "utf8"], default: "raw", optional: true },
				encoding: { type: "string", enum: ["hex", "base64", "utf8"], default: "hex", optional: true },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// list secrets
				const secrets = await this.findEntities({
					query: {
						type: params.type,
						algorithm: params.algorithm,
						format: params.format,
						encoding: params.encoding,
					},
				});

				// decrypt the secrets
				const decrypted = secrets.map(secret => {
					return this.decryptSecret({
						encryptedValue: secret.value,
						algorithm: secret.algorithm,
						key: secret.key,
						iv: secret.iv,
						salt: secret.salt,
						iterations: secret.iterations,
						encoding: secret.encoding,
						format: secret.format,

					});
				});

				// return the secrets values
				return decrypted;
			}
		},

		/**
		 * Rotate a secret
		 * 
		 * @actions
		 * @param {String} name - the secret name
		 * @param {String} key - the secret key
		 * @param {String} newKey - the new secret key
		 * 
		 * @returns {Object} - the rotated secret	
		 */
		rotate: {
			params: {
				name: { type: "string", min: 3, max: 64, pattern: /^[a-z0-9\-_]+$/i },
				key: { type: "string", default: "password", optional: true },
				newKey: { type: "string", default: "password", optional: true },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// check if the secret exists
				const found = await this.findEntity({
					query: { name: params.name },
				});
				if (!found)
					throw new MoleculerClientError("Secret not found!", 422, "", [{ field: "name", message: "not found" }]);

				//check if the secret is a token or config value and return the value
				const key = await this.checkKey(ctx, params.key);

				//check if the new secret is a token or config value and return the value
				const newKey = await this.checkKey(ctx, params.newKey);

				// decrypt the secret
				const decrypted = this.decryptSecret({
					encryptedValue: found.value,
					algorithm: found.algorithm,
					key: key,
					iv: found.iv,
					salt: found.salt,
					iterations: found.iterations,
					encoding: found.encoding,
					format: found.format,

				});

				// encrypt the secret
				const encrypted = this.encryptSecret({
					value: decrypted,
					algorithm: found.algorithm,
					key: newKey,
					iv: found.iv,
					salt: found.salt,
					iterations: found.iterations,
					length: found.length,
					digest: found.digest,
					encoding: found.encoding,
					format: found.format,

				});

				// create the secret
				const secret = await this.createEntity(null, {
					name: params.name,
					value: encrypted,
					description: found.description,
					type: found.type,
					algorithm: found.algorithm,
					iv: found.iv,
					salt: found.salt,
					key: newKey,
					iterations: found.iterations,
					length: found.length,
					digest: found.digest,
					encoding: found.encoding,
					format: found.format,
					expiration: found.expiration,
				});

				// return the secret
				return secret;
			}
		},

		/**
		 * Rotate all secrets using the rotate action
		 * 
		 * @actions
		 * @param {String} key - the secret key
		 * @param {String} newKey - the new secret key
		 * 
		 * @returns {Array} - the rotated secrets
		 */
		rotateAll: {
			params: {
				key: { type: "string", default: "password", optional: true },
				newKey: { type: "string", default: "password", optional: true },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				// list secrets
				const secrets = await this.findEntities();

				// rotate secrets
				const rotated = secrets.map(secret => {
					return this.rotate({
						name: secret.name,
						key: params.key,
						newKey: params.newKey,
					}, { parentCtx: ctx });
				});

				// return the rotated secrets
				return Promise.all(rotated);
			}
		},
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

		/**
		 * Encrypt a secret
		 * 
		 * @param {Object} params - the secret parameters
		 */
		async encryptSecret(params) {
			// Extract parameters
			const {
				value,
				algorithm,
				key,
				iv,
				salt,
				iterations,
				length,
				digest,
				encoding,
				format,
			} = params;



			// Create a Cipher object
			const cipher = crypto.createCipheriv(algorithm, key, iv);

			// If salt is provided, set it
			if (salt) {
				cipher.setSalt(salt);
			}

			// If iterations are provided, set it
			if (iterations) {
				cipher.setIterations(iterations);
			}

			// Encrypt the value
			let encryptedValue = cipher.update(value, 'utf8', encoding);
			encryptedValue += cipher.final(encoding);

			// Format the result based on the specified format
			switch (format) {
				case 'raw':
					return encryptedValue;
				case 'hex':
					return encryptedValue.toString('hex');
				case 'base64':
					return encryptedValue.toString('base64');
				case 'utf8':
					return encryptedValue.toString('utf8');
				default:
					throw new Error('Invalid format');
			}
		},
		/**
		 * Decrypt a secret
		 * 
		 * @param {Object} params - Parameters for decryption
		 * 
		 * @returns {Object} - The decrypted secret
		 */
		async decryptSecret(params) {
			// Extract parameters
			const {
				encryptedValue,
				algorithm,
				key,
				iv,
				salt,
				iterations,
				encoding,
				format,
			} = params;

			// Create a Decipher object
			const decipher = crypto.createDecipheriv(algorithm, key, iv);

			// If salt is provided, set it
			if (salt) {
				decipher.setSalt(salt);
			}

			// If iterations are provided, set it
			if (iterations) {
				decipher.setIterations(iterations);
			}

			try {
				// Decrypt the encrypted value
				let decryptedValue = decipher.update(encryptedValue, encoding, 'utf8');
				decryptedValue += decipher.final('utf8');

				// Return the decrypted value
				return decryptedValue;
			} catch (error) {
				// Handle decryption error (e.g., invalid key or IV)
				throw new Error('Decryption error: ' + error.message);
			}
		},



		/**
		 * check if key is a token or config value and return the value
		 * 
		 * @param {Object} ctx - the context
		 * @param {String} key - the key
		 * 
		 * @returns {String} - the key
		 */
		async checkKey(ctx, key) {
			// check if key is a token or config value and return the value

			// check if the key is a token
			if (key.startsWith("token:")) {
				// get the token
				const token = await ctx.call("v1.tokens.get", { token: key.substr(6) });
				if (token == null)
					throw new MoleculerClientError("Invalid token!", 422, "", [{ field: "key", message: "invalid token" }]);
				// return the token value
				return token.value;
			}

			// check if the key is a config value
			if (key.startsWith("config:")) {
				// get the config value
				const config = await ctx.call("v1.config.get", { key: key.substr(7) });
				if (config == null)
					throw new MoleculerClientError("Invalid config key!", 422, "", [{ field: "key", message: "invalid config key" }]);
				// return the config value
				return config.value;
			}

			// return the key
			return key;
		},


		/**
		 * seed the config sore with default config values
		 * 
		 * @returns {Promise} - Promise
		 */
		async seedDB() {
			for (const [key, value] of Object.entries(this.settings.config || {})) {
				const found = await this.broker.call('v1.config.get', { key });
				if (found == null) {
					await this.broker.call('v1.config.set', { key, value });
				}
			}
		}

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
