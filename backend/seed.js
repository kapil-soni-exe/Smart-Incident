import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from './src/model/user.model.js';
import ProjectModel from './src/model/project.model.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    // Clear existing
    await UserModel.deleteMany({ email: 'admin@opusguard.com' });
    
    const apiKey = "sirp_demo_key_123456789";
    
    // Create Admin User
    const user = await UserModel.create({
      name: 'Admin User',
      email: 'admin@opusguard.com',
      password: 'password123', // Will be hashed by pre-save hook
      apiKey: apiKey
    });

    // Create Demo Project
    await ProjectModel.create({
      name: 'Main Website',
      owner: user._id,
      apiKey: apiKey,
      platform: 'web'
    });

    console.log('✅ Seed Complete!');
    console.log('User: admin@opusguard.com / Password: password123');
    console.log('API Key:', apiKey);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
