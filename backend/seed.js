'use strict';

require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');
const Form = require('./server/Project/Form/models/form.model');
const Response = require('./server/Project/Response/model/response.model');
const Role = require('./server/Project/Role/models/role.model');
const User = require('./server/Project/User/models/user.model');
const { Questions, TextQuestion, RatingQuestion, CheckboxQuestion, ChoicesQuestion } = require('./server/Project/Questions/models/questions.model');

// MongoDB connection
const mongoURI = process.env.MONGODB;

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        await Form.deleteMany({});
        await Response.deleteMany({});
        await Questions.deleteMany({});
        await Role.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // ============================================
        // 0. CREATE ROLES
        // ============================================
        
        const roles = await Role.create([
            {
                name: 'ADMIN',
                description: 'Full access to everything'
            },
            {
                name: 'STAFF',
                description: 'Create and manage forms, questions, and responses (no user management)'
            },
            {
                name: 'USER',
                description: 'Student — view forms and submit responses'
            }
        ]);

        console.log(`✅ Created ${roles.length} roles`);

        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seed function
seedDatabase();