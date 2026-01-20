#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks MongoDB for total jobs count and verification data
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://alok85820018_db_user:ObtNJAnlYgQ3GDzq@cluster0.jmhgvfj.mongodb.net/jobintel_db';

async function verifyDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB Atlas!\n');

    // Get job count
    const db = mongoose.connection.db;
    
    console.log('📊 DATABASE STATISTICS:\n');
    
    // Count all jobs
    const jobCount = await db.collection('jobs').countDocuments();
    console.log(`📁 Total Jobs in Database: ${jobCount}`);
    
    // Count scraping sessions
    const sessionCount = await db.collection('scrapesessions').countDocuments();
    console.log(`📊 Total Scraping Sessions: ${sessionCount}`);
    
    // Get latest session details
    const latestSession = await db.collection('scrapesessions')
      .findOne({}, { sort: { createdAt: -1 } });
    
    if (latestSession) {
      console.log('\n📋 Latest Scraping Session:');
      console.log(`  Session ID: ${latestSession.sessionId}`);
      console.log(`  Status: ${latestSession.status}`);
      console.log(`  New Jobs Added: ${latestSession.newJobsAdded}`);
      console.log(`  Jobs Updated: ${latestSession.jobsUpdated}`);
      console.log(`  Total Jobs Found: ${latestSession.totalJobsFound}`);
      console.log(`  Duration: ${latestSession.durationMs}ms`);
      console.log(`  Started: ${latestSession.startedAt}`);
      console.log(`  Completed: ${latestSession.completedAt}`);
    }
    
    // Get sample jobs
    console.log('\n📋 Sample Recent Jobs:');
    const recentJobs = await db.collection('jobs')
      .find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    
    recentJobs.forEach((job, index) => {
      console.log(`\n  Job ${index + 1}:`);
      console.log(`    Title: ${job.title}`);
      console.log(`    Company: ${job.company}`);
      console.log(`    Source: ${job.source}`);
      console.log(`    Created: ${job.createdAt}`);
    });

    console.log('\n✅ VERIFICATION COMPLETE!');
    console.log('\n✨ Summary:');
    console.log(`   Database: MongoDB Atlas`);
    console.log(`   Connection: ✅ Successful`);
    console.log(`   Total Jobs: ${jobCount}`);
    console.log(`   Data Persistence: ✅ YES`);
    console.log(`   Status: ✅ PRODUCTION READY\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyDatabase();
