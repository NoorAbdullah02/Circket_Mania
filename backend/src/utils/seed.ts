import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export async function seedAdmins() {
    try {
        const admins = [
            {
                name: 'Admin One',
                email: 'admin1@noor.com',
                password: 'NoorAbdullah',
                role: 'admin' as const,
            },
            {
                name: 'Admin Two',
                email: 'admin2@noor.com',
                password: 'NoorAbdullah1',
                role: 'admin' as const,
            }
        ];

        for (const admin of admins) {
            const existing = await db.select().from(users).where(eq(users.email, admin.email)).limit(1);
            const hashedPassword = await bcrypt.hash(admin.password, 10);

            if (existing.length === 0) {
                await db.insert(users).values({
                    name: admin.name,
                    email: admin.email,
                    password: hashedPassword,
                    role: admin.role,
                    isActive: true,
                });
                console.log(`✅ Default admin created: ${admin.email}`);
            } else {
                // Update existing record to match requested credentials
                await db.update(users).set({
                    password: hashedPassword,
                    role: admin.role
                }).where(eq(users.email, admin.email));
                console.log(`✅ Default admin updated: ${admin.email}`);
            }
        }
    } catch (error) {
        console.error('❌ Error seeding admins:', error);
    }
}
