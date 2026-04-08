const { db, admin } = require('../services/firebase.service');

const UID = 'abohrandy'; // Mock UID for verification, or use a real one if known

async function simulateActivity() {
  console.log('--- Simulating Dashboard Activity ---');

  // 1. Update Stats
  const statsRef = db.collection('tenants').doc(UID).collection('stats').doc('overview');
  console.log('Updating stats...');
  await statsRef.set({
    totalMessages: admin.firestore.FieldValue.increment(5),
    automatedReplies: admin.firestore.FieldValue.increment(3),
    avgResponseTime: 4.2,
    accuracy: 99.1,
    lastActive: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. Add Activity Logs
  const activityRef = db.collection('tenants').doc(UID).collection('activity');
  
  console.log('Adding "reply" activity...');
  await activityRef.add({
    type: 'reply',
    action: 'Simulated: Replied to price inquiry automatically.',
    status: 'success',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    user: 'antigravity_bot'
  });

  console.log('Adding "review" activity...');
  await activityRef.add({
    type: 'review',
    action: 'Simulated: Manual review triggered for complex query.',
    status: 'warning',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    user: 'antigravity_bot'
  });

  console.log('Dashboard should now reflect these changes in real-time if a listener is active.');
}

simulateActivity().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
