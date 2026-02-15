import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import type { Admin } from '@/types';

export async function POST() {
  // Check if admin already exists
  const existingAdmin = get<Admin>('SELECT id FROM admin LIMIT 1');

  if (existingAdmin) {
    return NextResponse.json(
      { success: false, error: 'Setup already completed' },
      { status: 400 }
    );
  }

  // Create default admin
  const defaultPassword = 'admin';
  const passwordHash = await hashPassword(defaultPassword);

  run(
    'INSERT INTO admin (username, password_hash) VALUES (?, ?)',
    ['admin', passwordHash]
  );

  // Initialize default settings
  const defaultSettings = [
    ['server_host', ''],
    ['subscription_host', ''],
    ['subscription_port', '80'],
    ['singbox_binary_path', '/usr/local/bin/sing-box'],
    ['singbox_config_path', '/etc/sing-box/config.json'],
    ['clash_api_port', '9090'],
    ['clash_api_secret', ''],
    ['traffic_reset_mode', 'monthly'],
    ['traffic_reset_day', '1'],
  ];

  for (const [key, value] of defaultSettings) {
    run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }

  return NextResponse.json({
    success: true,
    data: {
      username: 'admin',
      password: defaultPassword,
      message: 'Please change the default password after login',
    },
  });
}
