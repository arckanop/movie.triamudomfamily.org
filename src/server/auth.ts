import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import {username} from "better-auth/plugins/username";
import {prisma} from "./prisma";

const STUDENT_DOMAIN =
	process.env.STUDENT_EMAIL_DOMAIN ?? "@student.triamudom.ac.th";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: prismaAdapter(prisma, {provider: "postgresql"}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 6,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			hd: STUDENT_DOMAIN.replace(/^@/, ""),
			mapProfileToUser: (profile) => {
				if (!profile.email || !profile.email.endsWith(STUDENT_DOMAIN)) {
					throw new Error(
						`Sign-in restricted to ${STUDENT_DOMAIN} accounts.`,
					);
				}
				return {
					email: profile.email,
					name: profile.name,
					image: profile.picture,
					emailVerified: profile.email_verified,
				};
			},
		},
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "STUDENT",
				input: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const email = user.email as string | undefined;
					const role =
						(user as { role?: string }).role ??
						(email && email.endsWith(STUDENT_DOMAIN) ? "STUDENT" : "STAFF");
					return {data: {...user, role}};
				},
			},
		},
	},
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 32,
		}),
	],
});

export type Session = typeof auth.$Infer.Session;
