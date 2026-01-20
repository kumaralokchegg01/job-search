const mongoose = require('mongoose');

async function checkJobs() {
  try {
    const uri = "mongodb+srv://alok85820018_db_user:ObtNJAnlYgQ3GDzq@cluster0.jmhgvfj.mongodb.net/jobintel_db";
    console.log("🔍 Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("✅ Connected!\n");
    
    // Check all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("📋 Collections in database:");
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    console.log("\n📊 Document counts:");
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }
    
    // Get sample jobs
    console.log("\n📝 Sample jobs:");
    const jobs = await db.collection('jobs').find().limit(2).toArray();
    if (jobs.length > 0) {
      console.log(JSON.stringify(jobs[0], null, 2));
    } else {
      console.log("  No jobs found");
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkJobs();
