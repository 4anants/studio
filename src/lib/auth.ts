import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";

const providers: any[] = [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                return null;
            }

            try {
                // Verify against database
                const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [credentials.email]);

                if (rows.length === 0) {
                    return null;
                }

                const user = rows[0];

                // Check password
                // Note: In a production app with seeded mock data that might not be hashed, handle fallback
                // But for this 'studio' app, we assume specific setup.
                // If using the mocked 'admin@example.com' with 'admin' from a seed script, ensure it's hashed.
                // If the user manually created a user via POST /api/users, it is hashed.

                const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    role: user.is_admin ? 'admin' : 'employee',
                    image: user.avatar && user.avatar.length < 200 ? user.avatar : null // Prevent large cookies (HTTP 431) if avatar is base64
                };
            } catch (error) {
                console.error("Auth error:", error);
                return null;
            }
        }
    })
];

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push(
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID || "common", // Use "common" for multi-tenant
            authorization: {
                params: {
                    scope: "openid profile email User.Read",
                    prompt: "select_account", // Allow account selection
                }
            },
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email || profile.preferred_username,
                    image: profile.picture,
                };
            },
        })
    );
}

export const authOptions: NextAuthOptions = {
    providers: providers,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/login', // Custom login page
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'azure-ad' && user.email) {
                try {
                    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [user.email]);
                    if (rows.length === 0) {
                        // Generate sequential ID (e.g., A-101)
                        let newId = 'A-101';
                        try {
                            const [idRows] = await pool.query<RowDataPacket[]>(
                                "SELECT id FROM users WHERE id REGEXP '^A-[0-9]+$' ORDER BY CAST(SUBSTRING(id, 3) AS UNSIGNED) DESC LIMIT 1"
                            );
                            if (idRows.length > 0) {
                                const lastId = idRows[0].id;
                                const numberPart = parseInt(lastId.substring(2), 10);
                                if (!isNaN(numberPart)) {
                                    newId = `A-${numberPart + 1}`;
                                }
                            }
                        } catch (idErr) {
                            console.error("Error generating sequential ID, falling back to UUID", idErr);
                            const { randomUUID } = await import('crypto');
                            newId = randomUUID();
                        }
                        const nameParts = (user.name || '').split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        const username = user.email.split('@')[0];

                        await pool.execute(
                            `INSERT INTO users (id, email, username, first_name, last_name, display_name, status, is_admin, created_at, updated_at, avatar) 
                             VALUES (?, ?, ?, ?, ?, ?, 'active', 0, NOW(), NOW(), ?)`,
                            [newId, user.email, username, firstName, lastName, user.name, user.image || null]
                        );
                    }
                } catch (e) {
                    console.error("SSO Auto-registration failed:", e);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (account && user) {
                let dbId = user.id;
                let dbRole = (user as any).role;

                // Sync with DB for Azure AD to get real ID and Role
                if (account.provider === 'azure-ad' && user.email) {
                    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, is_admin FROM users WHERE email = ?', [user.email]);
                    if (rows.length > 0) {
                        dbId = rows[0].id;
                        dbRole = rows[0].is_admin ? 'admin' : 'employee';
                    }
                }

                return {
                    ...token,
                    userId: dbId,
                    userRole: dbRole,
                    loginTime: Date.now(), // Track when user logged in
                };
            }

            // Check if session has expired based on role
            if (token.loginTime && token.userRole) {
                const now = Date.now();
                const loginTime = token.loginTime as number;
                const role = token.userRole as string;

                // Session timeout: 15 min (900000ms) for employees, 180 min (10800000ms) for admins
                const timeout = role === 'admin' ? 10800000 : 900000;

                if (now - loginTime > timeout) {
                    // Session expired - clear user data to force re-login
                    return {
                        ...token,
                        userId: null,
                        userRole: null,
                        loginTime: null,
                    };
                }
            }

            return token;
        },
        async session({ session, token }) {
            // If userId is null, session has expired
            if (!token.userId) {
                return {
                    ...session,
                    user: {
                        ...session.user,
                        id: '',
                        role: '',
                    },
                    expires: new Date(0).toISOString(), // Force immediate expiration
                };
            }

            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.userId as string,
                    role: token.userRole as string,
                },
            };
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
