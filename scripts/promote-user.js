/**
 * Script to promote a user to admin role
 * 
 * Usage:
 * 1. Make sure your Firebase config is set up in .env
 * 2. Run: node scripts/promote-user.js <email>
 * 
 * Example:
 * node scripts/promote-user.js admin@test.com
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');
require('dotenv').config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function promoteUserToAdmin(email) {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}...`);
    
    // Query users collection by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      console.log('\n💡 Make sure the user has signed up in the app first.');
      process.exit(1);
    }
    
    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`\n✅ Found user:`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Current Role: ${userData.role}`);
    
    if (userData.role === 'admin') {
      console.log('\n⚠️  User is already an admin!');
      process.exit(0);
    }
    
    // Update user role to admin
    console.log(`\n🔄 Promoting user to admin...`);
    await updateDoc(doc(db, 'users', userDoc.id), {
      role: 'admin',
      updatedAt: new Date(),
    });
    
    console.log(`\n✅ Successfully promoted ${email} to admin!`);
    console.log('\n📱 Next steps:');
    console.log('   1. Close the app completely');
    console.log('   2. Reopen the app');
    console.log('   3. Login with the admin account');
    console.log('   4. You should now see the Admin Dashboard\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error promoting user:', error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Email address is required');
  console.log('\nUsage: node scripts/promote-user.js <email>');
  console.log('Example: node scripts/promote-user.js admin@test.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('\n❌ Error: Invalid email format');
  process.exit(1);
}

// Run the promotion
promoteUserToAdmin(email);
