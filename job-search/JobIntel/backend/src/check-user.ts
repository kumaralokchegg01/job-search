import mongoose from 'mongoose';
import { User } from './models/User';

const uri = "mongodb+srv://alok85820018_db_user:ObtNJAnlYgQ3GDzq@cluster0.jmhgvfj.mongodb.net/jobintel_db";

async function check() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
    
    const user = await User.findOne({email: 'admin@jobintel.local'});
    
    if (user) {
      console.log("✅ Admin user found!");
      console.log("Email:", user.email);
      console.log("Roles:", user.roles);
      console.log("Hash:", user.passwordHash);
    } else {
      console.log("❌ Admin user not found");
      
      const allUsers = await User.find();
      console.log("All users:", allUsers);
    }
    
    await mongoose.disconnect();
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

check();
