const mongoose = require('mongoose');

async function verifyDB() {
  try {
    console.log('📊 BEFORE SCRAPING - DATABASE STATUS\n');
    console.log('─'.repeat(70));
    
    // Connect to MongoDB Atlas
    await mongoose.connect('mongodb+srv://pritamkumarjob:PritamKumar%402024@jobintel.3eqzr.mongodb.net/jobintel-prod?retryWrites=true&w=majority');
    
    const db = mongoose.connection.db;
    
    // Get collections stats
    const collections = await db.listCollections().toArray();
    console.log('\n✅ Collections in Database:');
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    
    // Count jobs BEFORE
    const jobsCollection = db.collection('jobs');
    const jobsCountBefore = await jobsCollection.countDocuments();
    console.log(`\n📋 Jobs Collection Count (BEFORE): ${jobsCountBefore}`);
    
    // Count scrape sessions
    const sessionsCollection = db.collection('scrapesessions');
    const sessionsCount = await sessionsCollection.countDocuments();
    console.log(`📋 ScrapeSession Collection Count: ${sessionsCount}`);
    
    // Get latest scrape session
    const latestSession = await sessionsCollection.findOne({}, { sort: { createdAt: -1 } });
    if (latestSession) {
      console.log(`\n📌 Latest Scrape Session:`);
      console.log(`   • ID: ${latestSession._id}`);
      console.log(`   • Query: ${latestSession.query}`);
      console.log(`   • Location: ${latestSession.location}`);
      console.log(`   • Total Found: ${latestSession.totalFound}`);
      console.log(`   • New Added: ${latestSession.newAdded}`);
      console.log(`   • Status: ${latestSession.status}`);
      console.log(`   • Created: ${latestSession.createdAt}`);
    }
    
    // Sample recent jobs
    const recentJobs = await jobsCollection.find().sort({ createdAt: -1 }).limit(3).toArray();
    console.log(`\n🔍 Recent 3 Jobs in Database:`);
    recentJobs.forEach((job, idx) => {
      console.log(`   ${idx + 1}. ${job.title} at ${job.company} (${job.createdAt})`);
    });
    
    console.log('\n' + '─'.repeat(70));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDB();
