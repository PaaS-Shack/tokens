"use strict";
const DbService = require("db-mixin");
const crypto = require('crypto');
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: "secrets",
	version: 1,

	mixins: [
		DbService({
			createActions: false
		})
	],

	/**
	 * Settings
	 */
	settings: {
		rest: false,

		algorithm: 'aes256',
		key: 'password',


		fields: {
			id: {
				type: "string",
				primaryKey: true,
				secure: true,
				columnName: "_id"
			},
			username: {
				type: "string",
			},
			email: {
				type: "string",
			},
			password: {
				type: "string",
			},
			owner: {
				type: "string",
			},
		},
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		create: {
			params: {
				username: {
					type: "string",
				},
				email: {
					type: "string",
				},
				password: {
					type: "string",
				},
				owner: {
					type: "string",
				},
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);
				const username = this.encrypt(params.username)
				const email = this.encrypt(params.email)
				const password = this.encrypt(params.password)
				const owner = this.encrypt(params.owner)

				const secret = await this.createEntity(null, {
					owner,
					username,
					email,
					password
				})

				return secret
			}
		},
		test: {
			params: {

			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				console.log(params)
			}
		},
		request: {
			params: {
				id: { type: "string" },
				callback: { type: "string" },
			},
			async handler(ctx) {
				const params = Object.assign({}, ctx.params);

				const secret = await this.resolveEntities(null, {
					id: params.id
				})

				console.log('secret', secret)
				const owner = this.decrypt(secret.owner)
				const username = this.decrypt(secret.username)
				const email = this.decrypt(secret.email)
				const password = this.decrypt(secret.password)

				return ctx.call(params.callback, {
					...params,
					owner,
					username,
					email,
					password
				})

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
		encrypt(text) {
			const cipher = crypto.createCipher(this.settings.algorithm, this.settings.key);
			return cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
		},
		decrypt(encrypted) {
			var decipher = crypto.createDecipher(this.settings.algorithm, this.settings.key);
			return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
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
