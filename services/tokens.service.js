"use strict";

const _ = require("lodash");
const crypto = require("crypto");

const DbService = require("db-mixin");
const Cron = require("cron-mixin");

const TOKEN_TYPES = ["verification", "passwordless", "password-reset", "api-key"]

const TOKEN_LENGTH = 50;

const TESTING = process.env.NODE_ENV === "test";

/**
 * Token service
 */
module.exports = {
	name: "tokens",
	version: 1,

	mixins: [
		DbService({
			createActions: false,
			collection: 'tokens'
		}),
		Cron
	],

	/**
	 * Service dependencies
	 */
	dependencies: [],

	/**
	 * Service settings
	 */
	settings: {
		fields: {
			type: {
				type: "enum",
				values: TOKEN_TYPES,
				required: true
			},
			name: { type: "string", max: 255 }, // for user API keys
			token: { type: "string", required: true },
			expiry: { type: "number", integer: true },
			owner: { type: "string", required: true }, // TODO: validate via accounts.resolve

			lastUsedAt: { type: "number", readonly: true, hidden: "byDefault" }, // for API keys
			
            ...DbService.FIELDS,// inject dbservice fields
        },

        // default database populates
        defaultPopulates: [],

        // database scopes
        scopes: {
            ...DbService.SCOPE,// inject dbservice scope
        },

        // default database scope
        defaultScopes: [...DbService.DSCOPE],// inject dbservice dscope

		// Indexes
		indexes: [
			{ fields: "token", unique: true },
			{ fields: ["type", "token"] },
			{ fields: ["type", "owner"] },
			{ fields: "expiry" }
		]
	},

	crons: [
		{
			name: "ClearExpiredTokens",
			cronTime: "0 0 * * * *",
			onTick: {
				action: "v1.tokens.clearExpired"
			}
		}
	],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Generate a new token.
		 * Return with the token entity.
		 * 
		 * @param {Enum} type - Token type	
		 * @param {Number} expiry - Expiry time in milliseconds
		 * @param {String} owner - Owner ID
		 * 
		 * @returns {Object} Token entity
		 */
		generate: {
			params: {
				type: {
					type: "enum",
					values: TOKEN_TYPES
				},
				expiry: { type: "number", integer: true, optional: true },
				owner: { type: "string" }
			},
			async handler(ctx) {
				const { token, secureToken } = this.generateToken(TOKEN_LENGTH);


				const res = await this.createEntity(ctx, {
					...ctx.params,
					token: secureToken
				});

				return { ...res, token };
			}
		},

		/**
		 * Check a token exist & not expired.
		 * If `isUsed` is `true`, it will update the `lastUsedAt` field.
		 * Return with the token entity.
		 * 
		 * @param {Enum} type - Token type
		 * @param {String} token - Token value	
		 * @param {String} owner - Owner ID
		 * @param {Boolean} isUsed - Update the `lastUsedAt` field
		 */
		check: {
			params: {
				type: {
					type: "enum",
					values: TOKEN_TYPES
				},
				token: { type: "string" },
				owner: { type: "string", optional: true },
				isUsed: { type: "boolean", default: false }
			},
			async handler(ctx) {
				// Check token
				let entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: this.secureToken(ctx.params.token)
					}
				});
				if (entity) {
					// Check owner
					if (!ctx.params.owner || entity.owner == ctx.params.owner) {
						if (entity.expiry && entity.expiry < Date.now()) return false;

						if (ctx.params.isUsed) {
							entity = await this.updateEntity(
								ctx,
								{ id: entity.id, lastUsedAt: Date.now() },
								{ permissive: true }
							);
						}
						return entity;
					}
				}
				return null;
			}
		},

		/**
		 * Remove an invalidated token
		 * 
		 * @param {Enum} type - Token type
		 * @param {String} token - Token value
		 * 
		 * @returns {Object} Removed token entity
		 */
		remove: {
			params: {
				type: {
					type: "enum",
					values: TOKEN_TYPES
				},
				token: { type: "string" }
			},
			async handler(ctx) {
				// Check token
				const entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: this.secureToken(ctx.params.token)
					}
				});
				if (entity) {
					// Remove token
					await this.removeEntity(ctx, entity);
				}
				return null;
			}
		},

		/**
		 * Clear expired tokens.
		 * This action is called by a cron job.
		 * 
		 * 
		 * 
		 * @returns {Number} Count of removed tokens
		 */
		clearExpired: {
			visibility: "protected",
			async handler(ctx) {
				const adapter = await this.getAdapter(ctx);
				const count = await adapter.removeMany({ expiry: { $lt: Date.now() } });
				this.logger.info(`Removed ${count} expired token(s).`);
			}
		}
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate a token
		 *
		 * @param {Number} len Token length
		 * @returns {Object}
		 */
		generateToken(len = 50) {
			const token = crypto.randomBytes(len / 2).toString("hex");
			return { token, secureToken: this.secureToken(token) };
		},

		/**
		 * Secure a token with HMAC.
		 * @param {String} token
		 * @returns {String}
		 */
		secureToken(token) {
			const hmac = crypto.createHmac("sha256", process.env.TOKEN_SALT || "K4nTa3");
			hmac.update(token);
			return hmac.digest("hex");
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		if (!process.env.TOKEN_SALT) {
//
			this.broker.fatal("Environment variable 'TOKEN_SALT' must be configured!");

		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() { },

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() { }
};