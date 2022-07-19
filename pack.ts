import * as coda from "@codahq/packs-sdk";

export const pack = coda.newPack();

pack.setUserAuthentication({
	type: coda.AuthenticationType.QueryParamToken,
	paramName: "api_key",
});

pack.addNetworkDomain("api.hunter.io");

pack.addFormula({
	name: "Article",
	description: "Finds author from article url",

	parameters: [
		coda.makeParameter({
			type: coda.ParameterType.String,
			name: "url",
			description: "Web address of the article",
		}),
	],

	resultType: coda.ValueType.String,

	execute: async function ([url], context) {
		let response = await context.fetcher.fetch({
			method: "GET",
			url: `https://api.hunter.io/v2/author-finder?url=${url}`
		})
		let data = response.body;
		console.log(data);
		return `Author: ${data.data.first_name} ${data.data.last_name}
Email: ${data.data.email}
Twitter: @${data.data.twitter}
Linkedin: ${data.data.linkedin_url}
Verified: ${data.data.verification.status} ${data.data.verification.date}
		`;
	}
});

type Source = {
	domain: string,
	uri: string,
	extracted_on: string,
	last_seen_on: string,
	still_on_page: boolean
}

type Verification = {
	date: string,
	status: string
}

type Email = {
	value: string,
	type: string,
	confidence: number,
	sources: Source[],
	first_name: string,
	last_name: string,
	position: string,
	seniority: string,
	department: string,
	linkedin: string,
	twitter: string,
	phone_numer: string,
	verification: Verification
}

pack.addFormula({
	name: "Domain",
	description: "Find emails from a domain",

	parameters: [
		coda.makeParameter({
			type: coda.ParameterType.String,
			name: "domain",
			description: "Web address of the domain",
		}),
		coda.makeParameter({
			type: coda.ParameterType.Number,
			name: "limit",
			description: "Number of emails to get",
			optional: true,
		}),

	],

	resultType: coda.ValueType.String,
	execute: async function ([domain, limit], context) {
		let count = limit ? limit : 10;
		let response = await context.fetcher.fetch({
			method: "GET",
			url: `https://api.hunter.io/v2/domain-search?domain=${domain}&limit=${count}`
		})
		let data = response.body;
		let emails: Email[] = data.data.emails;
		let emailString = "Emails found: \n";
		emails.forEach((x) => {
			emailString = emailString.concat(x.first_name," ", x.last_name, ": ",x.value, "\n"); 
		});
		return emailString;
	}
});

const emailSchema = coda.makeObjectSchema({
	properties: {
		email: {type: coda.ValueType.String},
		firstName: {type: coda.ValueType.String},
		lastName: {type: coda.ValueType.String},
	}
});

pack.addFormula({
	name: "Email",
	description: "Find a specific person's email from a domain",

	parameters: [
		coda.makeParameter({
			type: coda.ParameterType.String,
			name: "domain",
			description: "Web address of the domain",
		}),
		coda.makeParameter({
			type: coda.ParameterType.String,
			name: "firstName",
			description: "First name of the person",
		}),
		coda.makeParameter({
			type: coda.ParameterType.String,
			name: "lastName",
			description: "Last name of the person",
		}),

	],

	resultType: coda.ValueType.Object,
	schema: emailSchema,
	execute: async function ([domain, firstName, lastName], context) {
		let response = await context.fetcher.fetch({
			method: "GET",
			url: `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}`
		})
		let data = response.body;
		return {
			email: data.data.email,
			firstName: data.data.first_name,
			lastName: data.data.last_name,
		};
	}

});


pack.addFormula({
	name: "Verifier",
	description: "Verify that an email is valid",

	parameters: [
		coda.makeParameter({
			type: coda.ParameterType.String,
			name: "email",
			description: "Email to verify",
		}),

	],

	resultType: coda.ValueType.String,
	execute: async function ([email], context) {
		let response = await context.fetcher.fetch({
			method: "GET",
			url: `https://api.hunter.io/v2/email-verifier?email=${email}`
		})
		let data = response.body;
		console.log(data);
		return data.data.status;
	}

})
