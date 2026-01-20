const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {
    const uri = "mongodb+srv://alok85820018_db_user:ObtNJAnlYgQ3GDzq@cluster0.jmhgvfj.mongodb.net/jobintel_db";
    console.log("🔍 Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("✅ Connected!\n");
    
    // Check current users
    const usersCollection = mongoose.connection.collection('users');
    const count = await usersCollection.countDocuments();
    console.log(`📊 Current users in database: ${count}\n`);
    
    // Create admin user
    const adminData = {
      email: "admin@jobintel.local",
      passwordHash: await bcrypt.hash("admin123", 10),
      roles: ["admin"],
      name: "Admin",
      createdAt: new Date()
    };
    
    console.log("📝 Creating admin user...");
    const result = await usersCollection.insertOne(adminData);
    console.log("✅ Admin user created!");
    console.log("ID:", result.insertedId);
    console.log("\nAdmin details:");
    console.log(JSON.stringify(adminData, null, 2));
    
    // Verify
    const admin = await usersCollection.findOne({email: 'admin@jobintel.local'});
    console.log("\n✅ Verification - Admin found:");
    console.log(JSON.stringify(admin, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seedAdmin();
