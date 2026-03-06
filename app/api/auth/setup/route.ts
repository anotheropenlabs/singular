import { NextResponse } from 'next/server';
import { db, admin, settings } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { DEFAULT_SINGBOX_SETTINGS } from '@/lib/settings-defaults';

export async function POST() {
  // Check if admin already exists
  const existingAdmin = await db.select({ id: admin.id }).from(admin).limit(1).get();

  if (existingAdmin) {
    return NextResponse.json(
      { success: false, error: 'Setup already completed' },
      { status: 400 }
    );
  }

  // Create default admin
  const defaultPassword = 'admin';
  const passwordHash = await hashPassword(defaultPassword);

  await db.insert(admin).values({
    username: 'admin',
    password_hash: passwordHash
  });

  // Initialize default settings
  // We rely on "Convention over Configuration". 
  // Low-level paths (binary, config, log) are NOT inserted here. 
  // They are handled by process-manager.ts falling back to SINGBOX_DEFAULTS.

  const defaultSettingsList = Object.entries(DEFAULT_SINGBOX_SETTINGS);

  db.transaction((tx) => {
    for (const [key, value] of defaultSettingsList) {
      tx.insert(settings)
        .values({ key, value })
        .onConflictDoNothing()
        .run();
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      username: 'admin',
      password: defaultPassword,
      message: 'Please change the default password after login',
    },
  });
}
