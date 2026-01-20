const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobintel-prod';

const JobSchema = new mongoose.Schema({}, { strict: false });
const Job = mongoose.model('Job', JobSchema, 'jobs');

const ScrapeSessionSchema = new mongoose.Schema({}, { strict: false });
const ScrapeSession = mongoose.model('ScrapeSession', ScrapeSessionSchema, 'scrapeSessions');

async function verifyJobs() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get total jobs count
    const totalJobs = await Job.countDocuments();
    console.log(`📊 Total Jobs in Database: ${totalJobs}\n`);

    // Get latest session
    const latestSession = await ScrapeSession.findOne().sort({ createdAt: -1 });
    
    if (latestSession) {
      console.log('📋 Latest Scrape Session:');
      console.log(`  Session ID: ${latestSession._id}`);
      console.log(`  Status: ${latestSession.status}`);
      console.log(`  Total Found: ${latestSession.totalJobsFound || 0}`);
      console.log(`  Indian Found: ${latestSession.indianJobsFound || 0}`);
      console.log(`  Indian Added: ${latestSession.indianJobsAdded || 0}`);
      console.log(`  New Jobs Added: ${latestSession.newJobsAdded || 0}`);
      console.log(`  Duration: ${latestSession.durationMs}ms`);
      console.log(`  Created: ${latestSession.createdAt}\n`);

      // Get the jobs from this session
      const sessionJobs = await Job.find({ sessionId: latestSession._id });
      console.log(`🔍 Jobs from Latest Session: ${sessionJobs.length}\n`);

      if (sessionJobs.length > 0) {
        console.log('📝 Sample Jobs Details:');
        sessionJobs.slice(0, 5).forEach((job, index) => {
          console.log(`\n  Job ${index + 1}:`);
          console.log(`    Title: ${job.title || 'N/A'}`);
          console.log(`    Company: ${job.company || 'N/A'}`);
          console.log(`    Location: ${job.location || 'N/A'}`);
          console.log(`    Salary: ${job.salary || 'N/A'}`);
          console.log(`    Bucket: ${job.bucket || 'N/A'}`);
          console.log(`    Experience: ${job.experienceLevel || 'N/A'}`);
          console.log(`    Added: ${job.createdAt}`);
        });

        console.log(`\n\n... and ${sessionJobs.length - 5} more jobs\n`);
      }

      // Check for Indian jobs
      const indianJobs = sessionJobs.filter(job => {
        const location = (job.location || '').toLowerCase();
        const company = (job.company || '').toLowerCase();
        return location.includes('india') || company.includes('india') || location === '';
      });

      console.log(`🇮🇳 Indian Jobs Detected: ${indianJobs.length}/${sessionJobs.length}`);

      // Verify buckets
      console.log('\n📦 Jobs by Bucket:');
      const buckets = {};
      sessionJobs.forEach(job => {
        const bucket = job.bucket || 'unknown';
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      });
      Object.entries(buckets).forEach(([bucket, count]) => {
        console.log(`  ${bucket}: ${count} jobs`);
      });

    } else {
      console.log('❌ No scrape sessions found');
    }

    // Show overall stats
    console.log('\n' + '='.repeat(60));
    console.log('📈 Overall Database Statistics:');
    console.log(`  Total Jobs: ${totalJobs}`);
    
    const allSessions = await ScrapeSession.countDocuments();
    console.log(`  Total Sessions: ${allSessions}`);

    await mongoose.disconnect();
    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyJobs();
