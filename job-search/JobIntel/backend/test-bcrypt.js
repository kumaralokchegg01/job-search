const bcrypt = require('bcryptjs');

async function test() {
  const testPassword = "admin123";
  // This is the hash we just created
  const hash = "$2a$10$064/CfOj4djN01ATcJWCdu5P.llDM0rPAtSpt4rD1UTAHUMEZxpR6";
  
  console.log("Testing bcrypt comparison...");
  console.log("Password:", testPassword);
  console.log("Hash:", hash);
  
  try {
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log("Result:", isValid);
    
    if (isValid) {
      console.log("✅ Password matches!");
    } else {
      console.log("❌ Password does not match!");
      
      // Try creating a new hash
      console.log("\n🔄 Creating new hash...");
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log("New hash:", newHash);
      
      const isValidNew = await bcrypt.compare(testPassword, newHash);
      console.log("New hash matches:", isValidNew);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
