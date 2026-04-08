const { db, admin } = require('../services/firebase.service');
const logger = require('../utils/logger');

const ADMIN_UID = '1YwaKAau4rU4f5LDYjTX3UPXL3U2';

async function seedData() {
  logger.info('🚀 Starting Firestore Seed Process...');

  const tenants = [
    {
      id: ADMIN_UID,
      data: {
        role: 'admin',
        businessName: 'Forge Alpha Admin',
        tone: 'Professional and Precise',
        createdAt: new Date().toISOString(),
        botConfig: {
          enabled: true,
          igUsername: 'admin_forge',
          igPassword: '••••••••'
        }
      }
    },
    {
      id: 'demo_tenant_1',
      data: {
        role: 'user',
        businessName: 'Lagos Fashion Hub',
        tone: 'Friendly and Trendy',
        createdAt: new Date().toISOString(),
        botConfig: {
          enabled: true,
          igUsername: 'lagos_fashion',
          igPassword: '••••••••'
        }
      }
    },
    {
      id: 'demo_tenant_2',
      data: {
        role: 'user',
        businessName: 'Abuja Tech Supplies',
        tone: 'Technical and Direct',
        createdAt: new Date().toISOString(),
        botConfig: {
          enabled: false,
          igUsername: 'abuja_tech',
          igPassword: '••••••••'
        }
      }
    }
  ];

  for (const tenant of tenants) {
    logger.info(`Setting up tenant: ${tenant.data.businessName} (${tenant.id})`);
    
    // Set Tenant Document
    await db.collection('tenants').doc(tenant.id).set(tenant.data);

    // Seed Stats
    await db.collection('tenants').doc(tenant.id).collection('stats').doc('overview').set({
      totalMessages: Math.floor(Math.random() * 500) + 100,
      autoPilotReplies: Math.floor(Math.random() * 200) + 50,
      errors: Math.floor(Math.random() * 5),
      lastActive: new Date().toISOString()
    });

    // Seed Activity
    const activityRef = db.collection('tenants').doc(tenant.id).collection('activity');
    const activities = [
      { type: 'REPLY', message: 'Responded to inquiry about pricing', timestamp: admin.firestore.FieldValue.serverTimestamp() },
      { type: 'AUTH', message: 'Instagram session refreshed', timestamp: admin.firestore.FieldValue.serverTimestamp() },
      { type: 'SYSTEM', message: 'Bot started successfully', timestamp: admin.firestore.FieldValue.serverTimestamp() }
    ];

    for (const act of activities) {
      await activityRef.add(act);
    }
  }

  logger.info('✅ Database seeded successfully!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
