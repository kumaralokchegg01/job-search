const mongoose = require('mongoose');

async function checkAdmin() {
  try {
    const uri = "mongodb+srv://alok85820018_db_user:ObtNJAnlYgQ3GDzq@cluster0.jmhgvfj.mongodb.net/jobintel_db";
    await mongoose.connect(uri);
    
    const admin = await mongoose.connection.collection('users').findOne({email: 'admin@jobintel.local'});
    
    if (admin) {
      console.log("✅ Admin user found:");
      console.log(JSON.stringify(admin, null, 2));
    } else {
      console.log("❌ Admin user NOT found in database");
      console.log("\n📋 All users in database:");
      const users = await mongoose.connection.collection('users').find().toArray();
      console.log(JSON.stringify(users, null, 2));
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkAdmin();
