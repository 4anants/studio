import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const [rows] = await pool.execute<RowDataPacket[]>(
                        'SELECT * FROM users WHERE email = ?',
                        [credentials.email]
                    );
                    const user = rows[0];

                    if (user && await bcrypt.compare(credentials.password, user.password_hash)) {
                        return {
                            id: user.id,
                            name: `${user.first_name} ${user.last_name}`,
                            email: user.email,
                            image: user.avatar,
                            role: user.is_admin ? 'admin' : 'employee'
                        };
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
